"use client";

import { useState, useRef, useEffect } from "react";
import { BookOpen, FileText, MessageCircle, ChevronDown } from "lucide-react";

interface StoryModeDropdownProps {
  value: "full" | "parts" | "interactive";
  onChange: (value: "full" | "parts" | "interactive") => void;
  disabled?: boolean;
}

const MODES = [
  { 
    id: "full" as const, 
    label: "Full Story", 
    icon: BookOpen,
    description: "Complete story with ending"
  },
  { 
    id: "parts" as const, 
    label: "Some Parts", 
    icon: FileText,
    description: "Story in segments"
  },
  { 
    id: "interactive" as const, 
    label: "Interactive", 
    icon: MessageCircle,
    description: "Story with choices"
  },
];

export default function StoryModeDropdown({ value, onChange, disabled }: StoryModeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedMode = MODES.find(m => m.id === value) || MODES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative z-50">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 h-full px-4 py-3 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-800/70 border border-purple-500/20 hover:border-purple-500/40 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <selectedMode.icon className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
        <span className="text-white text-sm font-medium whitespace-nowrap hidden md:inline">
          {selectedMode.label}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-lg border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-900/50 z-[100] overflow-hidden animate-fade-in">
          <div className="p-2">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = mode.id === value;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    onChange(mode.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${
                    isSelected
                      ? "bg-purple-600/30 border border-purple-500/50"
                      : "hover:bg-gray-800/50 border border-transparent"
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${
                    isSelected ? "text-purple-400" : "text-gray-400"
                  }`} />
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-semibold ${
                      isSelected ? "text-white" : "text-gray-300"
                    }`}>
                      {mode.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {mode.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
