"use client";

import { Volume2, Settings2, Play } from "lucide-react";
import { useState } from "react";

interface VoiceSettingsProps {
  voice: string;
  setVoice: (voice: string) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  onPreviewVoice: (voiceId: string, speed: number, pitch: number) => void;
}

const VOICES = [
  { id: 'en-US-ryan', name: 'Ryan', gender: 'Male', accent: 'US' },
  { id: 'en-US-terrell', name: 'Terrell', gender: 'Male', accent: 'US' },
  { id: 'en-US-natalie', name: 'Natalie', gender: 'Female', accent: 'US' },
  { id: 'en-US-ken', name: 'Ken', gender: 'Male', accent: 'US' },
  { id: 'en-UK-hazel', name: 'Hazel', gender: 'Female', accent: 'UK' },
  { id: 'en-UK-gabriel', name: 'Gabriel', gender: 'Male', accent: 'UK' },
];

export default function VoiceSettings({ 
  voice, 
  setVoice, 
  speed, 
  setSpeed, 
  pitch, 
  setPitch,
  onPreviewVoice 
}: VoiceSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  const handlePreview = (voiceId: string) => {
    setPreviewingVoice(voiceId);
    onPreviewVoice(voiceId, speed, pitch);
    setTimeout(() => setPreviewingVoice(null), 3000);
  };

  return (
    <div className="mb-8">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all"
      >
        <div className="flex items-center gap-3">
          <Settings2 className="w-5 h-5 text-purple-400" />
          <span className="text-white font-semibold">Voice Settings</span>
        </div>
        <span className="text-gray-400 text-sm">
          {isOpen ? "Hide" : "Customize"}
        </span>
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="mt-4 p-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 space-y-6 animate-fade-in">
          {/* Voice Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm text-purple-400 mb-3 font-semibold uppercase tracking-wider">
              <Volume2 className="w-4 h-4" />
              Select Voice
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {VOICES.map((v) => (
                <div
                  key={v.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    voice === v.id
                      ? "border-purple-500 bg-purple-600/20"
                      : "border-gray-700 bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setVoice(v.id)}
                      className="flex-1 text-left"
                    >
                      <p className={`font-semibold ${voice === v.id ? "text-white" : "text-gray-300"}`}>
                        {v.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {v.accent} • {v.gender}
                      </p>
                    </button>
                    {voice === v.id && (
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    )}
                  </div>
                  
                  {/* Preview Button */}
                  <button
                    onClick={() => handlePreview(v.id)}
                    disabled={previewingVoice === v.id}
                    className="w-full mt-2 py-2 px-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {previewingVoice === v.id ? (
                      <>
                        <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Playing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Preview</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Speed Control */}
          <div>
            <label className="flex items-center justify-between text-sm text-purple-400 mb-3 font-semibold uppercase tracking-wider">
              <span>Speed</span>
              <span className="text-white font-mono">{speed > 0 ? '+' : ''}{speed}%</span>
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>

          {/* Pitch Control */}
          <div>
            <label className="flex items-center justify-between text-sm text-purple-400 mb-3 font-semibold uppercase tracking-wider">
              <span>Pitch</span>
              <span className="text-white font-mono">{pitch > 0 ? '+' : ''}{pitch}</span>
            </label>
            <input
              type="range"
              min="-20"
              max="20"
              step="5"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Lower</span>
              <span>Normal</span>
              <span>Higher</span>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setVoice('en-US-ryan');
              setSpeed(0);
              setPitch(0);
            }}
            className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 text-sm transition-all"
          >
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
}
