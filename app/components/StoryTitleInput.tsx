"use client";

import { Edit2 } from "lucide-react";

interface StoryTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function StoryTitleInput({ value, onChange, disabled }: StoryTitleInputProps) {
  return (
    <div className="mb-6 p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20">
      <div className="flex items-center gap-2 mb-2">
        <Edit2 className="w-4 h-4 text-purple-400" />
        <label className="text-sm text-purple-400 font-semibold uppercase tracking-wider">
          Story Title
        </label>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Give your story a title..."
        disabled={disabled}
        maxLength={100}
        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <p className="text-xs text-gray-500 mt-2">
        {value.length}/100 characters
      </p>
    </div>
  );
}
