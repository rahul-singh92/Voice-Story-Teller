"use client";

import { BookOpen } from "lucide-react";

interface StoryLengthSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const LENGTH_LABELS: { [key: number]: string } = {
  1: "Very Short (3-5 sentences)",
  2: "Short (5-8 sentences)",
  3: "Medium (8-12 sentences)",
  4: "Long (12-16 sentences)",
  5: "Very Long (16-20 sentences)",
};

export default function StoryLengthSlider({ value, onChange }: StoryLengthSliderProps) {
  return (
    <div className="mb-6 p-5 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-purple-400" />
        <p className="text-sm text-purple-400 font-semibold uppercase tracking-wider">
          Story Length
        </p>
      </div>
      
      <div className="mb-3">
        <p className="text-white text-base font-medium text-center">
          {LENGTH_LABELS[value]}
        </p>
      </div>

      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
      />
      
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Short</span>
        <span>Medium</span>
        <span>Long</span>
      </div>
    </div>
  );
}
