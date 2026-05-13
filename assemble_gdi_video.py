import os
import re
import csv
import zipfile
import shutil
import subprocess
from pathlib import Path

ROOT = Path(r"C:\aol-check-visual")
ASSET_DIR = ROOT / "video" / "public" / "assets"
WORK_DIR = ROOT / "video" / "public" / "gdi_build"
OUT_DIR = ROOT / "video" / "public" / "outputs"

OUT_DIR.mkdir(parents=True, exist_ok=True)
WORK_DIR.mkdir(parents=True, exist_ok=True)

SCENES = [
    ("01", "16.1", "13.3", "hook"),
    ("02", "64.1", "17.1", "decision_map"),
    ("03", "65.3", "18.1", "market_problem"),
    ("04", "59.1", "19.1", "corridor"),
    ("05", "60.1", "20.1", "system_response"),
    ("06", "15.1", "21.2", "refusal_gate"),
    ("07", "61.3", "22.2", "user_journey"),
    ("08", "62.1", "23.1", "compounding_record"),
    ("09", "63.1", "24.1", "evidence_detail"),
    ("10", "34.1", "25.1", "operator_pilot"),
    ("11", "35.1", "26.2", "standard"),
    ("12", "36.1", "27.1", "closing"),
]

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
AUDIO_EXTS = {".mp3", ".wav", ".m4a", ".aac"}

def run(cmd):
    print(" ".join(str(c) for c in cmd))
    subprocess.run(cmd, check=True)

def unzip_all():
    extract_dir = WORK_DIR / "extracted"
    if extract_dir.exists():
        shutil.rmtree(extract_dir)
    extract_dir.mkdir(parents=True, exist_ok=True)

    zips = sorted(ASSET_DIR.glob("sequences-*.zip"))
    if not zips:
        raise FileNotFoundError("No sequences-*.zip files found in video/public/assets")

    for z in zips:
        target = extract_dir / z.stem
        target.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(z, "r") as zip_ref:
            zip_ref.extractall(target)

    return extract_dir

def id_variants(seq_id):
    return {
        seq_id.lower(),
        seq_id.replace(".", "_").lower(),
        seq_id.replace(".", "-").lower(),
        seq_id.replace(".", "").lower(),
    }

def score_match(path, seq_id):
    name = path.name.lower()
    stem = path.stem.lower()
    variants = id_variants(seq_id)

    score = 0
    for v in variants:
        if stem == v:
            score += 100
        if stem.startswith(v):
            score += 60
        if v in stem:
            score += 40
        if v in name:
            score += 20

    # Prefer cleaner exported still/audio assets over thumbnails/previews when possible
    bad_tokens = ["thumb", "thumbnail", "preview", "waveform", "transcript"]
    if any(t in name for t in bad_tokens):
        score -= 30

    return score

def find_asset(extract_dir, seq_id, exts):
    candidates = [p for p in extract_dir.rglob("*") if p.is_file() and p.suffix.lower() in exts]
    scored = [(score_match(p, seq_id), p) for p in candidates]
    scored = [(s, p) for s, p in scored if s > 0]
    if not scored:
        raise FileNotFoundError(f"No asset found for sequence {seq_id} with extensions {exts}")

    scored.sort(key=lambda x: (x[0], x[1].stat().st_size), reverse=True)
    return scored[0][1]

def ffprobe_duration(audio_path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(audio_path)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(result.stdout.strip())

def make_scene(scene_no, image_path, audio_path, slug):
    scene_dir = WORK_DIR / "scenes"
    scene_dir.mkdir(parents=True, exist_ok=True)

    duration = ffprobe_duration(audio_path)
    duration = max(duration + 1.2, 8.0)

    out = scene_dir / f"S{scene_no}_{slug}.mp4"

    # Slow institutional push-in. No flashy motion.
    fade_out_start = max(duration - 0.75, 0)

    vf = (
        "scale=3000:-1,"
        "zoompan=z='min(1.0+0.00018*on,1.045)':"
        "x='iw/2-(iw/zoom/2)':"
        "y='ih/2-(ih/zoom/2)':"
        "d=1:s=2560x1440:fps=30,"
        "fade=t=in:st=0:d=0.45,"
        f"fade=t=out:st={fade_out_start}:d=0.65,"
        "format=yuv420p"
    )

    af = f"afade=t=in:st=0:d=0.25,afade=t=out:st={fade_out_start}:d=0.45"

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-framerate", "30", "-i", str(image_path),
        "-i", str(audio_path),
        "-t", f"{duration:.2f}",
        "-vf", vf,
        "-af", af,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        str(out)
    ]
    run(cmd)
    return out, duration

def concat_scenes(scene_files):
    concat_file = WORK_DIR / "concat.txt"
    with concat_file.open("w", encoding="utf-8") as f:
        for sf in scene_files:
            f.write(f"file '{sf.as_posix()}'\n")

    output = OUT_DIR / "abraham_of_london_gdi_brand_film_draft.mp4"

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_file),
        "-c", "copy",
        str(output)
    ]
    run(cmd)
    return output

def main():
    extract_dir = unzip_all()

    mapped_dir = WORK_DIR / "mapped_assets"
    if mapped_dir.exists():
        shutil.rmtree(mapped_dir)
    mapped_dir.mkdir(parents=True, exist_ok=True)

    manifest_rows = []
    scene_files = []

    for scene_no, still_id, voice_id, slug in SCENES:
        image = find_asset(extract_dir, still_id, IMAGE_EXTS)
        audio = find_asset(extract_dir, voice_id, AUDIO_EXTS)

        image_target = mapped_dir / f"S{scene_no}_{slug}_still{image.suffix.lower()}"
        audio_target = mapped_dir / f"S{scene_no}_voice{audio.suffix.lower()}"

        shutil.copy2(image, image_target)
        shutil.copy2(audio, audio_target)

        scene_video, duration = make_scene(scene_no, image_target, audio_target, slug)
        scene_files.append(scene_video)

        manifest_rows.append({
            "scene": scene_no,
            "slug": slug,
            "still_sequence": still_id,
            "voice_sequence": voice_id,
            "still_source": str(image),
            "voice_source": str(audio),
            "still_mapped": str(image_target),
            "voice_mapped": str(audio_target),
            "scene_video": str(scene_video),
            "duration_seconds": f"{duration:.2f}",
        })

    manifest_path = OUT_DIR / "gdi_brand_film_manifest.csv"
    with manifest_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(manifest_rows[0].keys()))
        writer.writeheader()
        writer.writerows(manifest_rows)

    output = concat_scenes(scene_files)

    print("\nDONE")
    print(f"Video: {output}")
    print(f"Manifest: {manifest_path}")

if __name__ == "__main__":
    main()
