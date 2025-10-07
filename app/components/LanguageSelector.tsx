"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Search, Check } from "lucide-react";

interface LanguageSelectorProps {
  value: string;
  onChange: (languageCode: string) => void;
  disabled?: boolean;
}

const LANGUAGES = [
  { code: "en-US", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "es-ES", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr-FR", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de-DE", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ja-JP", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "zh-CN", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "pt-BR", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "ru-RU", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "ar-SA", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
];

export default function LanguageSelector({ value, onChange, disabled }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedLanguage = LANGUAGES.find(l => l.code === value) || LANGUAGES[0];

  // Filter languages based on search
  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative z-50">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-3 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-800/70 border border-purple-500/20 hover:border-purple-500/40 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <Globe className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
        <span className="text-2xl">{selectedLanguage.flag}</span>
        <span className="text-white text-sm font-medium hidden md:inline">
          {selectedLanguage.name}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-lg border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-900/50 z-[100] overflow-hidden animate-fade-in">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Language List */}
          <div className="max-h-80 overflow-y-auto p-2">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => {
                const isSelected = lang.code === value;
                
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onChange(lang.code);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? "bg-purple-600/30 border border-purple-500/50"
                        : "hover:bg-gray-800/50 border border-transparent"
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-semibold ${
                        isSelected ? "text-white" : "text-gray-300"
                      }`}>
                        {lang.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lang.nativeName}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
