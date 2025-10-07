"use client";

import { Sparkles, Zap, Heart, Ghost } from "lucide-react";

interface ModeSelectorProps {
  mode: "normal" | "twist" | "emotional" | "scary";
  setMode: (mode: "normal" | "twist" | "emotional" | "scary") => void;
}

const MODES = [
  { id: "normal" as const, label: "Normal", icon: Sparkles, color: "text-blue-400" },
  { id: "twist" as const, label: "Twist", icon: Zap, color: "text-yellow-400" },
  { id: "emotional" as const, label: "Emotional", icon: Heart, color: "text-pink-400" },
  { id: "scary" as const, label: "Scary", icon: Ghost, color: "text-red-400" },
];

export default function ModeSelector({ mode, setMode }: ModeSelectorProps) {
  return (
    <div className="mb-8">
      <p className="text-center text-gray-400 mb-4 text-xs md:text-sm uppercase tracking-wider font-semibold">
        Story Mode
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MODES.map((m) => {
          const IconComponent = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`p-5 md:p-6 rounded-xl border-2 transition-all duration-300 group ${
                mode === m.id
                  ? "border-purple-500 bg-purple-600/20 scale-105 shadow-lg shadow-purple-600/30"
                  : "border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900"
              }`}
            >
              <IconComponent 
                className={`w-8 h-8 md:w-10 md:h-10 mx-auto mb-3 transition-all ${
                  mode === m.id ? m.color : "text-gray-500"
                } ${mode === m.id ? "scale-110" : "group-hover:scale-105"}`}
              />
              <div className={`text-sm md:text-base font-semibold ${
                mode === m.id ? "text-white" : "text-gray-400 group-hover:text-gray-300"
              }`}>
                {m.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
