"""
Assembly script for Governed Decision Intelligence campaign video.
Run from the directory where the ZIP contents are extracted.

Usage:
    python assemble_video.py --input <extracted_folder> --output final_cut.mp4

If all assets are in the current directory, just run:
    python assemble_video.py
"""

import subprocess
import os
import sys
import glob

def find_file(patterns, base="."):
    """Find first file matching any of the patterns."""
    for pattern in patterns:
        matches = glob.glob(os.path.join(base, pattern))
        if matches:
            return matches[0]
    return None

def build_filter_complex(scenes, voices, music, total_scenes=12):
    """
    Build the FFmpeg filter_complex string.
    
    For each scene:
      [video] fade in/out, setpts [v]
      [voice] volume, adelay to sync with scene start [a]
    
    Then concat all video, mix all audio, overlay music.
    """
    filters = []
    current_time = 0.0
    scene_durations = []
    
    # Estimate scene durations from video clips (will use actual durations at runtime)
    # For now, use standard durations from the script
    script_durations = [12, 18, 15, 18, 25, 12, 22, 15, 10, 15, 12, 10, 16]  # 13 scenes but we have 12 clips + closing
    
    # Map scenes to their video/voice files
    scene_map = [
        (1, "Scene 1", "Sc1"),
        (2, "Scene 2", "Sc2"),
        (3, "Scene 3", "Sc3"),
        (4, "Scene 4", "Sc4"),
        (5, "Scene 5", "Sc5"),
        (6, "Scene 6", "Sc6"),
        (7, "Scene 7", "Sc7"),
        (8, "Scene 8", "Sc8"),
        (9, "Scene 9", "Sc9"),
        (10, "Scene 10", "Sc10"),
        (11, "Scene 11", "Sc11"),
        (12, "Scene 12", "Sc12"),
    ]
    
    # Build concat inputs
    video_inputs = []
    audio_inputs = []
    
    for i, (num, scene_label, voice_label) in enumerate(scene_map):
        # Find video file
        vid = find_file([f"*{scene_label}*", f"*{num}.*", f"*{num:02d}*"], base)
        # Find voice file
        voi = find_file([f"*{voice_label}*", f"*Sc{num}*", f"*{num:02d}*"], base)
        
        if vid:
            video_inputs.append(vid)
        if voi:
            audio_inputs.append(voi)
    
    # Build the complex filter
    # This is a simplified version - for production, use a video editor
    # FFmpeg concat with audio mixing
    
    filter_parts = []
    
    # For each video: add fade in/out
    for i in range(len(video_inputs)):
        filter_parts.append(
            f"[{i}:v]fade=t=in:st=0:d=0.5,fade=t=out:st={script_durations[i]-0.5}:d=0.5[v{i}]"
        )
    
    # Concat all video
    v_concat = "".join([f"[v{i}]" for i in range(len(video_inputs))])
    filter_parts.append(f"{v_concat}concat=n={len(video_inputs)}:v=1:a=0[final_v]")
    
    # Handle audio: mix voice tracks with music
    voice_count = len(audio_inputs)
    music_idx = len(video_inputs)
    
    # Voice tracks
    for i in range(voice_count):
        filter_parts.append(f"[{i}:a]volume=1.0[a{i}]")
    
    # Music track
    music_input_idx = len(video_inputs) + len(audio_inputs)
    filter_parts.append(f"[{music_input_idx}:a]volume=0.2[music]")
    
    # Mix all audio
    if voice_count > 0:
        all_audio = "".join([f"[a{i}]" for i in range(voice_count)]) + "[music]"
        filter_parts.append(f"{all_audio}amix=inputs={voice_count + 1}:duration=first[final_a]")
    else:
        filter_parts.append("[music]anull[final_a]")
    
    return ";".join(filter_parts), video_inputs, audio_inputs


def assemble(input_dir, output_path):
    """Assemble the video using FFmpeg."""
    
    scenes_dir = input_dir
    
    # Find all files
    video_files = sorted(glob.glob(os.path.join(scenes_dir, "*Scene*")) + 
                         glob.glob(os.path.join(scenes_dir, "*.mp4")) +
                         glob.glob(os.path.join(scenes_dir, "*.mov")) +
                         glob.glob(os.path.join(scenes_dir, "*.webm")))
    
    voice_files = sorted(glob.glob(os.path.join(scenes_dir, "*Sc*")) +
                         glob.glob(os.path.join(scenes_dir, "*.mp3")) +
                         glob.glob(os.path.join(scenes_dir, "*.wav")) +
                         glob.glob(os.path.join(scenes_dir, "*.m4a")))
    
    music_file = find_file(["*66.1*", "*music*", "*score*"], scenes_dir)
    
    # Separate music from voice
    if music_file:
        voice_files = [f for f in voice_files if f != music_file]
    
    print(f"Found {len(video_files)} video files")
    print(f"Found {len(voice_files)} voice files")
    print(f"Music: {music_file}")
    
    # Build FFmpeg command
    cmd = ["ffmpeg"]
    
    # Add inputs
    for v in video_files:
        cmd.extend(["-i", v])
    for a in voice_files:
        cmd.extend(["-i", a])
    if music_file:
        cmd.extend(["-i", music_file])
    
    # Build filter
    filter_str, vids, auds = build_filter_complex(
        video_files, voice_files, music_file, len(video_files)
    )
    
    cmd.extend(["-filter_complex", filter_str])
    cmd.extend(["-map", "[final_v]"])
    cmd.extend(["-map", "[final_a]"])
    cmd.extend(["-c:v", "libx264"])
    cmd.extend(["-preset", "slow"])
    cmd.extend(["-crf", "18"])
    cmd.extend(["-c:a", "aac"])
    cmd.extend(["-b:a", "192k"])
    cmd.extend(["-pix_fmt", "yuv420p"])
    cmd.extend(["-r", "30"])
    cmd.extend(output_path)
    
    print(f"\nRunning FFmpeg assembly...")
    print(f"Output: {output_path}")
    print(f"Command: {' '.join(cmd[:10])}...")
    
    subprocess.run(cmd, check=True)
    print(f"\n✅ Assembly complete: {output_path}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Assemble campaign video")
    parser.add_argument("--input", default=".", help="Directory with extracted assets")
    parser.add_argument("--output", default="governed_decision_intelligence_final.mp4", help="Output file path")
    
    args = parser.parse_args()
    assemble(args.input, args.output)
