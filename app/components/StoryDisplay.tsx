"use client";

import { BookOpen, Loader2 } from "lucide-react";

interface StoryDisplayProps {
  storyText: string;
  isLoading: boolean;
}

export default function StoryDisplay({ storyText, isLoading }: StoryDisplayProps) {
  if (!storyText && !isLoading) return null;

  return (
    <div className="mb-6 p-6 md:p-8 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 shadow-2xl animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-600/20 rounded-lg">
          <BookOpen className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-purple-400 mb-3 font-semibold uppercase tracking-wider">
            Your Story
          </p>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              <span className="text-gray-400">Crafting your story...</span>
            </div>
          ) : (
            <p className="text-white text-base md:text-lg leading-relaxed whitespace-pre-wrap">
              {storyText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
