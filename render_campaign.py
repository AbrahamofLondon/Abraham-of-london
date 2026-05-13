import subprocess, os, sys

BASE = r"C:\aol-check-visual\video\public\assets\extracted"
OUTPUT = r"C:\aol-check-visual\video\public\assets\governed_decision_intelligence.mp4"

SCENES = [
    ("67.1-invideo-seedance_2_0.mp4", "79.1-invideo-elevenlabs_text_to_speech.mp3", 12.56),
    ("91.2-invideo-seedance_2_0.mp4", "80.1-invideo-elevenlabs_text_to_speech.mp3", 23.36),
    ("69.1-invideo-seedance_2_0.mp4", "81.1-invideo-elevenlabs_text_to_speech.mp3", 21.76),
    ("92.1-invideo-seedance_2_0.mp4", "82.2-invideo-elevenlabs_text_to_speech.mp3", 30.00),
    ("71.1-invideo-seedance_2_0.mp4", "83.2-invideo-elevenlabs_text_to_speech.mp3", 27.36),
    ("93.1-invideo-seedance_2_0.mp4", "84.1-invideo-elevenlabs_text_to_speech.mp3", 22.40),
    ("73.1-invideo-seedance_2_0.mp4", "85.1-invideo-elevenlabs_text_to_speech.mp3", 46.08),
    ("74.1-invideo-seedance_2_0.mp4", "86.2-invideo-elevenlabs_text_to_speech.mp3", 25.68),
    ("75.1-invideo-seedance_2_0.mp4", "87.3-invideo-elevenlabs_text_to_speech.mp3", 26.64),
    ("76.1-invideo-seedance_2_0.mp4", "88.1-invideo-elevenlabs_text_to_speech.mp3", 29.60),
    ("77.1-invideo-seedance_2_0.mp4", "89.1-invideo-elevenlabs_text_to_speech.mp3", 24.16),
    ("78.1-invideo-seedance_2_0.mp4", None, 10.05),
    ("67.1-invideo-seedance_2_0.mp4", "90.3-invideo-elevenlabs_text_to_speech.mp3", 38.96),
]

MUSIC = "66.1-invideo-lyria_3_pro.mp3"

def main():
    os.chdir(BASE)
    
    print("=" * 50)
    print("ASSEMBLING CAMPAIGN VIDEO")
    print("=" * 50)
    
    total_voice = sum(d for _, _, d in SCENES)
    print(f"Scenes: {len(SCENES)}")
    print(f"Total duration: {total_voice:.0f}s ({total_voice/60:.1f} min)")
    print(f"Output: {OUTPUT}")
    print()
    
    # Build concat file list
    concat_file = "concat_list.txt"
    with open(concat_file, "w") as f:
        for vid, voice, dur in SCENES:
            # Use tpad to extend video to voice duration by holding last frame
            vid_dur = 10.05  # all videos are ~10s
            if voice:
                target_dur = dur
            else:
                target_dur = dur
            # Write the video with tpad
            temp_vid = f"temp_scene_{SCENES.index((vid,voice,dur))}.mp4"
            pad_dur = target_dur - vid_dur
            if pad_dur > 0:
                cmd = [
                    "ffmpeg", "-y",
                    "-i", vid,
                    "-vf", f"tpad=stop_mode=clone:stop_duration={pad_dur},fade=t=in:st=0:d=0.5,fade=t=out:st={target_dur-0.5}:d=0.5",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "18",
                    "-pix_fmt", "yuv420p",
                    "-r", "24",
                    "-an",
                    "-t", str(target_dur),
                    temp_vid
                ]
                subprocess.run(cmd, capture_output=True)
            else:
                cmd = [
                    "ffmpeg", "-y",
                    "-i", vid,
                    "-vf", f"fade=t=in:st=0:d=0.5,fade=t=out:st={target_dur-0.5}:d=0.5",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "18",
                    "-pix_fmt", "yuv420p",
                    "-r", "24",
                    "-an",
                    "-t", str(target_dur),
                    temp_vid
                ]
                subprocess.run(cmd, capture_output=True)
            
            f.write(f"file '{temp_vid}'\n")
    
    # Concat all video segments
    print("Concatenating video segments...")
    raw_video = "temp_raw_video.mp4"
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", concat_file,
        "-c", "copy",
        raw_video
    ], capture_output=True)
    
    # Build audio mix
    print("Mixing audio tracks...")
    
    # First, create individual audio files trimmed to scene duration
    audio_files = []
    for i, (vid, voice, dur) in enumerate(SCENES):
        if voice:
            temp_audio = f"temp_audio_{i}.m4a"
            subprocess.run([
                "ffmpeg", "-y",
                "-i", voice,
                "-t", str(dur),
                "-c:a", "aac", "-b:a", "192k",
                "-af", "volume=1.0",
                temp_audio
            ], capture_output=True)
            audio_files.append(temp_audio)
    
    # Mix all audio with music
    mix_inputs = []
    for af in audio_files:
        mix_inputs.extend(["-i", af])
    mix_inputs.extend(["-i", MUSIC])
    
    # Build amix filter
    n_audio = len(audio_files)
    filter_parts = []
    for i in range(n_audio):
        filter_parts.append(f"[{i}:a]volume=1.0[a{i}]")
    filter_parts.append(f"[{n_audio}:a]volume=0.18[music]")
    all_labels = "".join([f"[a{i}]" for i in range(n_audio)]) + "[music]"
    filter_parts.append(f"{all_labels}amix=inputs={n_audio+1}:duration=first:dropout_transition=2[final_a]")
    
    mixed_audio = "temp_mixed_audio.m4a"
    subprocess.run([
        "ffmpeg", "-y",
        *mix_inputs,
        "-filter_complex", ";".join(filter_parts),
        "-map", "[final_a]",
        "-c:a", "aac", "-b:a", "192k",
        mixed_audio
    ], capture_output=True)
    
    # Final assembly
    print("Final assembly...")
    result = subprocess.run([
        "ffmpeg", "-y",
        "-i", raw_video,
        "-i", mixed_audio,
        "-c:v", "copy",
        "-c:a", "copy",
        "-shortest",
        OUTPUT
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        size = os.path.getsize(OUTPUT)
        print(f"\n[OK] RENDER COMPLETE")
        print(f"  File: {OUTPUT}")
        print(f"  Size: {size / 1024 / 1024:.1f} MB")
        
        dur_result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", OUTPUT],
            capture_output=True, text=True
        )
        if dur_result.returncode == 0:
            actual_dur = float(dur_result.stdout.strip())
            print(f"  Duration: {actual_dur:.0f}s ({actual_dur/60:.1f} min)")
        
        # Cleanup temp files
        for f in audio_files:
            try: os.remove(f)
            except: pass
        try: os.remove(raw_video)
        except: pass
        try: os.remove(mixed_audio)
        except: pass
        try: os.remove(concat_file)
        except: pass
        for i in range(len(SCENES)):
            try: os.remove(f"temp_scene_{i}.mp4")
            except: pass
    else:
        print(f"\n[FAIL] RENDER FAILED")
        if result.stderr:
            with open("ffmpeg_error.log", "w") as f:
                f.write(result.stderr[:5000])
            print("  Error log saved to ffmpeg_error.log")

if __name__ == "__main__":
    main()
