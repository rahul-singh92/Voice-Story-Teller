"use client";

interface MicrophoneButtonProps {
  isListening: boolean;
  isLoading: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export default function MicrophoneButton({
  isListening,
  isLoading,
  startListening,
  stopListening,
}: MicrophoneButtonProps) {
  return (
    <div className="flex justify-center mb-8">
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isLoading}
        className={`relative w-32 h-32 rounded-full transition-all duration-300 ${
          isListening
            ? "bg-red-500 animate-pulse-slow scale-110"
            : isLoading
            ? "bg-purple-500/50 cursor-wait"
            : "bg-purple-500 hover:bg-purple-600 hover:scale-110"
        } disabled:opacity-50 card-glow`}
      >
        <div className="flex flex-col items-center justify-center h-full">
          {isLoading ? (
            <>
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white text-sm mt-2">Thinking...</span>
            </>
          ) : (
            <>
              <span className="text-5xl mb-2">🎤</span>
              <span className="text-white text-sm font-medium">
                {isListening ? "Listening..." : "Speak"}
              </span>
            </>
          )}
        </div>
      </button>
    </div>
  );
}
