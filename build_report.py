"""Build report for GDI campaign video assembly.
Run this to verify all assets and generate the assembly plan.
Does NOT render - reports only."""

import subprocess
import os
import json

ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "video", "public", "assets", "extracted")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "video", "public", "outputs")

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
    (12, "67.1", "90.3", "36.1"),
]

def get_dur(filepath):
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration",
           "-of", "default=noprint_wrappers=1:nokey=1", filepath]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return float(r.stdout.strip())

def find_file(seq_id, ext):
    for f in os.listdir(ASSETS_DIR):
        if f.startswith(seq_id) and f.lower().endswith(ext.lower()):
            return os.path.join(ASSETS_DIR, f)
    for f in os.listdir(ASSETS_DIR):
        if f.startswith(seq_id):
            return os.path.join(ASSETS_DIR, f)
    return None

def main():
    print("=" * 70)
    print("  GOVERNED DECISION INTELLIGENCE - BUILD REPORT")
    print("=" * 70)
    print()

    # 1. Verify all assets exist
    print("[1] ASSET VERIFICATION")
    print("-" * 40)
    all_ok = True
    for s, vid, voic, still in SCENES:
        vf = find_file(vid, ".mp4")
        af = find_file(voic, ".mp3")
        sf = find_file(still, ".png")
        status = "OK" if all([vf, af, sf]) else "MISSING"
        if status != "OK":
            all_ok = False
        print("  Scene %2d: video=%s  voice=%s  still=%s  [%s]" % (
            s,
            os.path.basename(vf) if vf else "---",
            os.path.basename(af) if af else "---",
            os.path.basename(sf) if sf else "---",
            status))
    
    mf = find_file("66.1", ".mp3")
    if mf:
        print("  Music:   %s  [OK]" % os.path.basename(mf))
    else:
        print("  Music:   ---  [MISSING]")
        all_ok = False

    print()
    if not all_ok:
        print("  [ERROR] Some assets are missing!")
        return
    print("  All 37 assets verified. [OK]")
    print()

    # 2. Duration analysis
    print("[2] DURATION ANALYSIS")
    print("-" * 40)
    total_voice = 0
    for s, vid, voic, still in SCENES:
        vf = find_file(vid, ".mp4")
        af = find_file(voic, ".mp3")
        vd = get_dur(vf)
        ad = get_dur(af)
        total_voice += ad
        print("  Scene %2d: video=%5.1fs  voice=%5.1fs  (voice drives duration)" % (s, vd, ad))

    music_dur = get_dur(mf)
    print()
    print("  Total voice duration: %.1fs (%.1fm)" % (total_voice, total_voice/60))
    print("  Music duration:       %.1fs (%.1fm)" % (music_dur, music_dur/60))
    print("  Music loops needed:   %d" % (int(total_voice / music_dur) + 1))
    print()

    # 3. Target runtime analysis
    print("[3] RUNTIME TARGET ANALYSIS")
    print("-" * 40)
    target_min = 3*60 + 20  # 3:20
    target_max = 3*60 + 50  # 3:50
    current = total_voice + 12 * 0.3  # voice + padding per scene
    
    print("  Target:    3:20 - 3:50 (%d - %d seconds)" % (target_min, target_max))
    print("  Current:   %.1fs (%.1fm)" % (current, current/60))
    
    if current > target_max:
        excess = current - target_max
        print("  [WARNING] Over target by %.1fs" % excess)
        print("  To hit target, scenes need to be trimmed by ~%.1fs total" % excess)
    elif current < target_min:
        deficit = target_min - current
        print("  [WARNING] Under target by %.1fs" % deficit)
    else:
        print("  [OK] Within target range!")
    print()

    # 4. Assembly plan
    print("[4] ASSEMBLY PLAN (ready for render)")
    print("-" * 40)
    print("""
  METHOD:
    For each scene:
      1. Loop video clip to match voice duration
      2. Scale to 4K (3840x2160)
      3. Overlay still image (bottom-right, 15%% width)
      4. Layer voiceover as primary audio
      5. Fade in/out (0.5s each)

    Then:
      6. Concatenate all scenes
      7. Add background music at 20%% volume
      8. Export as H.264 4K at 24fps

  OUTPUT: %s
""" % os.path.join(OUTPUT_DIR, "governed_decision_intelligence_final.mp4"))

    # 5. Check existing outputs
    print("[5] EXISTING OUTPUTS")
    print("-" * 40)
    if os.path.isdir(OUTPUT_DIR):
        for f in sorted(os.listdir(OUTPUT_DIR)):
            fp = os.path.join(OUTPUT_DIR, f)
            size = os.path.getsize(fp)
            print("  %-50s %8.1f MB" % (f, size / 1024 / 1024))
    print()

    print("=" * 70)
    print("  BUILD REPORT COMPLETE - Ready for render approval")
    print("=" * 70)

if __name__ == "__main__":
    main()
