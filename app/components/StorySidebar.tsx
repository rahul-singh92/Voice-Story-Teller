"use client";

import { useState, useEffect } from "react";
import { X, Star, Trash2, BookOpen, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { getSavedStories, deleteStory, toggleFavorite, SavedStory } from "../utils/localStorage";

interface StorySidebarProps {
  onLoadStory: (story: SavedStory) => void;
  currentStoryId?: string;
}

export default function StorySidebar({ onLoadStory, currentStoryId }: StorySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [filter, setFilter] = useState<"all" | "favorites">("all");

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = () => {
    const allStories = getSavedStories();
    setStories(allStories);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this story?")) {
      deleteStory(id);
      loadStories();
    }
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id);
    loadStories();
  };

  const filteredStories = filter === "favorites" 
    ? stories.filter(s => s.favorite)
    : stories;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-24 z-40 p-3 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg transition-all duration-300 group"
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5 text-white" />
        ) : (
          <ChevronRight className="w-5 h-5 text-white" />
        )}
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Story History
        </span>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-lg border-r border-purple-500/30 z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">Story History</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                All ({stories.length})
              </button>
              <button
                onClick={() => setFilter("favorites")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "favorites"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Favorites ({stories.filter(s => s.favorite).length})
              </button>
            </div>
          </div>

          {/* Story List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {filteredStories.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {filter === "favorites" ? "No favorite stories yet" : "No stories yet"}
                </p>
              </div>
            ) : (
              filteredStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => {
                    onLoadStory(story);
                    setIsOpen(false);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer group ${
                    currentStoryId === story.id
                      ? "bg-purple-600/20 border-purple-500"
                      : "bg-gray-800/50 border-gray-700 hover:border-purple-500/50 hover:bg-gray-800"
                  }`}
                >
                  {/* Title and Favorite */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm line-clamp-2 flex-1">
                      {story.title}
                    </h3>
                    <button
                      onClick={(e) => handleToggleFavorite(story.id, e)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          story.favorite
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-500"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Preview */}
                  <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                    {story.text.substring(0, 100)}...
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(story.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                        {story.mode}
                      </span>
                      <button
                        onClick={(e) => handleDelete(story.id, e)}
                        className="p-1 hover:bg-red-600/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #9333ea 0%, #ec4899 100%);
          border-radius: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #a855f7 0%, #f472b6 100%);
        }
      `}</style>
    </>
  );
}
