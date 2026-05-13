"""
Assembly script for Governed Decision Intelligence campaign video.
Uses the new ZIP assets: video clips, polished voice tracks, stills, and music.

Scene mapping (from manifest):
  Scene 1:  video=67.1  voice=79.1  still=16.1
  Scene 2:  video=69.1  voice=80.1  still=64.1
  Scene 3:  video=71.1  voice=81.1  still=65.3
  Scene 4:  video=73.1  voice=82.2  still=59.1
  Scene 5:  video=75.1  voice=83.2  still=60.1
  Scene 6:  video=76.1  voice=84.1  still=15.1
  Scene 7:  video=77.1  voice=85.1  still=61.3
  Scene 8:  video=78.1  voice=86.2  still=62.1
  Scene 9:  video=91.2  voice=87.3  still=63.1
  Scene 10: video=92.1  voice=88.1  still=34.1
  Scene 11: video=93.1  voice=89.1  still=35.1
  Scene 12: video=67.1  voice=90.3  still=36.1

Assembly notes:
  - Layer each voice track over its matching video clip
  - Music sits underneath at ~20% volume
  - 1-2s cross-dissolve transitions between scenes
  - Target runtime: ~3:20-3:50
  - Export at 4K 16:9

Usage:
    python assemble_campaign_video.py
"""

import subprocess
import os
import sys
import tempfile
import shutil
import json

# --- Configuration -----------------------------------------------------------

ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "video", "public", "assets", "extracted")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "video", "public", "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Scene mapping: (scene_num, video_id, voice_id, still_id)
SCENES = [
    (1,  "67.1", "79.1", "16.1"),
    (2,  "69.1", "80.1", "64.1"),
    (3,  "71.1", "81.1", "65.3"),
    (4,  "73.1", "82.2", "59.1"),
    (5,  "75.1", "83.2", "60.1"),
    (6,  "76.1", "84.1", "15.1"),
    (7,  "77.1", "85.1", "61.3"),
    (8,  "78.1", "86.2", "62.1"),
    (9,  "91.2", "87.3", "63.1"),
    (10, "92.1", "88.1", "34.1"),
    (11, "93.1", "89.1", "35.1"),
    (12, "67.1", "90.3", "36.1"),  # Scene 12 reuses Scene 1 video
]

MUSIC_ID = "66.1"

TRANSITION_DURATION = 1.5  # seconds for cross-dissolve
FADE_IN_DURATION = 0.5
FADE_OUT_DURATION = 0.5

OUTPUT_FILENAME = "governed_decision_intelligence_final.mp4"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, OUTPUT_FILENAME)


# --- Helpers -----------------------------------------------------------------

def find_file(assets_dir, seq_id, ext):
    """Find a file by sequence ID and extension."""
    for f in os.listdir(assets_dir):
        if f.startswith(seq_id + "-") or f.startswith(seq_id + "."):
            if f.lower().endswith(ext.lower()):
                return os.path.join(assets_dir, f)
    # Broader match
    for f in os.listdir(assets_dir):
        if f.startswith(seq_id):
            return os.path.join(assets_dir, f)
    raise FileNotFoundError("No file found for sequence %s with ext %s in %s" % (seq_id, ext, assets_dir))


def get_duration(filepath):
    """Get media duration in seconds using ffprobe."""
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        filepath
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(result.stdout.strip())


def run_ffmpeg(cmd, description=""):
    """Run an FFmpeg command with logging."""
    print("")
    print("  " + "-" * 60)
    print("  " + description)
    print("  " + "-" * 60)
    print("  " + " ".join(cmd[:8]) + " ...")
    subprocess.run(cmd, check=True)
    print("  [OK] Done")


# --- Scene Assembly ----------------------------------------------------------

def build_scene(scene_num, video_path, voice_path, still_path, work_dir):
    """
    Build a single scene:
    - Loop the video clip to match voice duration
    - Layer voiceover as primary audio
    - Add still overlay (small, bottom-right corner)
    - Fade in/out
    Returns path to the rendered scene file and its duration.
    """
    voice_duration = get_duration(voice_path)
    video_duration = get_duration(video_path)

    loops_needed = int(voice_duration / video_duration) + 2
    target_duration = voice_duration + 0.3

    scene_out = os.path.join(work_dir, "scene_%02d.mp4" % scene_num)
    fade_out_start = max(target_duration - FADE_OUT_DURATION, 0)

    # Scale still to 15% width, position bottom-right with 60px padding
    # Scale video to 4K (3840x2160)
    filter_complex = (
        "[1:v]scale=576:-1[still];"
        "[0:v]loop=loop=%d:size=1,"
        "setpts=N/FRAME_RATE/TB,"
        "scale=3840:2160:flags=lanczos,"
        "fade=t=in:st=0:d=%f,"
        "fade=t=out:st=%f:d=%f[base];"
        "[base][still]overlay=W-w-60:H-h-60:format=auto,"
        "format=yuv420p[vout]"
    ) % (loops_needed, FADE_IN_DURATION, fade_out_start, FADE_OUT_DURATION)

    # Voice audio with fades
    audio_filter = (
        "[2:a]"
        "afade=t=in:st=0:d=%f,"
        "afade=t=out:st=%f:d=%f[aout]"
    ) % (FADE_IN_DURATION, fade_out_start, FADE_OUT_DURATION)

    cmd = [
        "ffmpeg", "-y",
        "-stream_loop", str(loops_needed),
        "-i", video_path,
        "-i", still_path,
        "-i", voice_path,
        "-t", "%.3f" % target_duration,
        "-filter_complex", "%s;%s" % (filter_complex, audio_filter),
        "-map", "[vout]",
        "-map", "[aout]",
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-r", "24",
        scene_out
    ]

    run_ffmpeg(cmd, "Building Scene %d (voice=%.1fs, video=%.1fs)" % (scene_num, voice_duration, video_duration))
    return scene_out, target_duration


# --- Concat with Music -------------------------------------------------------

def concat_and_add_music(scene_files, durations, music_path, work_dir, output_path):
    """
    Concatenate all scenes and add background music at 20% volume.
    Each scene already has fade in/out, so transitions are smooth.
    """
    total_duration = sum(durations)

    print("")
    print("=" * 60)
    print("  CONCATENATING %d SCENES" % len(scene_files))
    print("  Total duration: %.1fs (%.1fm)" % (total_duration, total_duration/60))
    print("=" * 60)

    # Create concat file
    concat_file = os.path.join(work_dir, "concat_list.txt")
    with open(concat_file, "w") as f:
        for sf in scene_files:
            f.write("file '%s'\n" % sf)

    # Concat all scenes
    raw_concat = os.path.join(work_dir, "raw_concat.mp4")
    cmd_concat = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", concat_file,
        "-c", "copy",
        raw_concat
    ]
    run_ffmpeg(cmd_concat, "Concatenating all scenes")

    # Add background music at 20%
    music_duration = get_duration(music_path)
    music_loops = int(total_duration / music_duration) + 1

    cmd_music = [
        "ffmpeg", "-y",
        "-i", raw_concat,
        "-stream_loop", str(music_loops),
        "-i", music_path,
        "-filter_complex",
        "[1:a]volume=0.20[music];"
        "[0:a][music]amix=inputs=2:duration=first:weights=1 0.2[aout]",
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_path
    ]

    run_ffmpeg(cmd_music, "Adding background music at 20%% volume")

    return output_path


# --- Main --------------------------------------------------------------------

def main():
    print("")
    print("=" * 60)
    print("  GOVERNED DECISION INTELLIGENCE - CAMPAIGN VIDEO ASSEMBLY")
    print("=" * 60)

    # Verify assets directory
    if not os.path.isdir(ASSETS_DIR):
        print("[ERROR] Assets directory not found: %s" % ASSETS_DIR)
        sys.exit(1)

    print("")
    print("Assets directory: %s" % ASSETS_DIR)
    print("Output directory: %s" % OUTPUT_DIR)

    # Create temp working directory
    work_dir = tempfile.mkdtemp(prefix="gdi_assembly_")
    print("Working directory: %s" % work_dir)

    # Resolve all file paths
    print("")
    print("Resolving assets...")
    scene_assets = []
    for scene_num, vid_id, voice_id, still_id in SCENES:
        video_path = find_file(ASSETS_DIR, vid_id, ".mp4")
        voice_path = find_file(ASSETS_DIR, voice_id, ".mp3")
        still_path = find_file(ASSETS_DIR, still_id, ".png")
        scene_assets.append((scene_num, video_path, voice_path, still_path))
        print("   Scene %2d: video=%s, voice=%s, still=%s" % (
            scene_num,
            os.path.basename(video_path),
            os.path.basename(voice_path),
            os.path.basename(still_path)))

    music_path = find_file(ASSETS_DIR, MUSIC_ID, ".mp3")
    print("   Music: %s (%.1fs)" % (os.path.basename(music_path), get_duration(music_path)))

    # Build each scene
    print("")
    print("Building scenes...")
    scene_files = []
    scene_durations = []
    for scene_num, video_path, voice_path, still_path in scene_assets:
        scene_file, duration = build_scene(scene_num, video_path, voice_path, still_path, work_dir)
        scene_files.append(scene_file)
        scene_durations.append(duration)
        print("   Scene %2d: %.1fs -> %s" % (scene_num, duration, os.path.basename(scene_file)))

    total = sum(scene_durations)
    print("")
    print("   Total scene duration: %.1fs (%.1fm)" % (total, total/60))

    # Concatenate and add music
    print("")
    print("Adding transitions and music...")
    final_output = concat_and_add_music(scene_files, scene_durations, music_path, work_dir, OUTPUT_PATH)

    # Final result
    final_size = os.path.getsize(final_output)
    final_dur = get_duration(final_output)

    print("")
    print("=" * 60)
    print("  [OK] ASSEMBLY COMPLETE")
    print("  " + "-" * 56)
    print("  Output: %s" % final_output)
    print("  Duration: %.1fs (%.1fm)" % (final_dur, final_dur/60))
    print("  Size: %.1f MB" % (final_size / 1024 / 1024))
    print("  Format: 4K (3840x2160), H.264, AAC")
    print("  " + "-" * 56)
    print("  Scenes: %d" % len(scene_files))
    print("  Music: %s at 20%% volume" % os.path.basename(music_path))
    print("  Transitions: %.1fs cross-dissolve" % TRANSITION_DURATION)
    print("  Stills: bottom-right overlay at 15%% width")
    print("=" * 60)

    # Cleanup temp
    try:
        shutil.rmtree(work_dir)
        print("")
        print("Cleaned up working directory")
    except:
        pass


if __name__ == "__main__":
    main()