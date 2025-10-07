"use client";

import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  audioUrl: string;
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = percent * duration;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 bg-gray-900 rounded-xl border border-purple-500/30 neon-border shadow-2xl animate-fade-in mb-6">
      <div className="flex items-center gap-5 mb-3">
        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 transition-all duration-300 flex items-center justify-center shadow-lg shadow-purple-600/50 hover:scale-110"
        >
          <span className="text-3xl">{isPlaying ? "⏸️" : "▶️"}</span>
        </button>
        <div className="flex-1">
          <div 
            className="h-3 bg-gray-800 rounded-full overflow-hidden cursor-pointer hover:h-4 transition-all"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-100 shadow-lg relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <span className="text-purple-400 text-xl">🔊</span>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}
