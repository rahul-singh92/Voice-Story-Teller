"use client";

import { Book, Drama, Heart, Ghost } from "lucide-react";

interface ModeSelectorProps {
  mode: "normal" | "twist" | "emotional" | "scary";
  setMode: (mode: "normal" | "twist" | "emotional" | "scary") => void;
}

const modes = [
  { id: "normal", label: "Normal", icon: Book, color: "blue" },
  { id: "twist", label: "Twist", icon: Drama, color: "yellow" },
  { id: "emotional", label: "Emotional", icon: Heart, color: "pink" },
  { id: "scary", label: "Scary", icon: Ghost, color: "red" },
];

export default function ModeSelector({ mode, setMode }: ModeSelectorProps) {
  return (
    <div className="mb-8">
      <p className="text-center text-gray-400 mb-4 text-xs md:text-sm uppercase tracking-wider font-semibold">
        Story Mode
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {modes.map((m) => {
          const IconComponent = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              className={`p-5 md:p-6 rounded-xl border-2 transition-all duration-300 group ${
                mode === m.id
                  ? "border-purple-500 bg-purple-600/20 scale-105 shadow-lg shadow-purple-600/30"
                  : "border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900"
              }`}
            >
              <IconComponent 
                className={`w-8 h-8 md:w-10 md:h-10 mx-auto mb-3 transition-transform ${
                  mode === m.id ? "text-purple-400 scale-110" : "text-gray-400 group-hover:scale-105"
                }`}
              />
              <div className={`text-sm md:text-base font-semibold ${
                mode === m.id ? "text-white" : "text-gray-400"
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
