"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "./lib/socket";
import StoryDisplay from "./components/StoryDisplay";
import ModeSelector from "./components/ModeSelector";
import AudioPlayer from "./components/AudioPlayer";
import { Mic, MicOff, Send, RotateCcw, Wifi, WifiOff } from "lucide-react";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [storyText, setStoryText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [mode, setMode] = useState<"normal" | "twist" | "emotional" | "scary">("normal");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [textInput, setTextInput] = useState("");
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (socket.connected) {
      setIsConnected(true);
    }

    function onConnect() {
      setIsConnected(true);
      console.log("✅ Socket connected");
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log("❌ Socket disconnected");
    }

    function onStoryText(data: { text: string }) {
      setStoryText(prev => prev + "\n\n" + data.text);
      setIsLoading(false);
    }

    function onAudioReady(data: { audioUrl: string }) {
      setAudioUrl(data.audioUrl);
    }

    function onError(data: { message: string }) {
      setError(data.message);
      setIsLoading(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("story-text", onStoryText);
    socket.on("audio-ready", onAudioReady);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("story-text", onStoryText);
      socket.off("audio-ready", onAudioReady);
      socket.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcriptText = event.results[0][0].transcript;
          console.log("✅ Recognized:", transcriptText);
          setTranscript(transcriptText);
          setTextInput(transcriptText);
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          setError("Could not recognize speech. Please try again.");
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [mode]);

  const startListening = () => {
    if (recognitionRef.current) {
      setError("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isLoading) {
      sendStoryRequest(textInput.trim());
    }
  };

  const sendStoryRequest = (text: string) => {
    setTranscript(text);
    setIsLoading(true);
    socket.emit("start-story", {
      transcript: text,
      mode: mode,
    });
    setTextInput("");
  };

  const resetStory = () => {
    socket.emit("reset-story");
    setStoryText("");
    setAudioUrl("");
    setTranscript("");
    setError("");
    setTextInput("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                Voice Story Teller
              </h1>
              <p className="text-gray-400 text-base md:text-lg">
                Transform your imagination into narrated stories
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  isConnected ? "text-green-400" : "text-red-400"
                }`}
              >
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        </div>

        {/* Mode Selector */}
        <ModeSelector mode={mode} setMode={setMode} />

        {/* Input Section */}
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-stretch gap-3 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-3 shadow-2xl">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Describe your story idea..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-white text-base md:text-lg placeholder-gray-500 outline-none disabled:opacity-50 px-3 py-2"
              />
              
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                className={`p-3 md:p-4 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  isListening
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 md:w-6 md:h-6 text-white" />
                ) : (
                  <Mic className="w-5 h-5 md:w-6 md:h-6 text-white" />
                )}
              </button>

              <button
                type="submit"
                disabled={isLoading || !textInput.trim()}
                className="px-5 md:px-8 py-3 md:py-4 bg-purple-600 hover:bg-purple-700 rounded-xl transition-all duration-300 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-600/30"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden md:inline">Generating</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-gray-500 text-xs md:text-sm mt-3 text-center">
            Click the microphone to speak, or type and press Send
          </p>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="mb-6 p-5 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 animate-fade-in">
            <p className="text-xs text-purple-400 mb-2 font-semibold uppercase tracking-wider">Your Request</p>
            <p className="text-white text-base md:text-lg">{transcript}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-5 bg-red-950/30 backdrop-blur-sm rounded-xl border border-red-500/30 animate-fade-in">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && <AudioPlayer audioUrl={audioUrl} />}

        {/* Story Display */}
        <StoryDisplay storyText={storyText} isLoading={isLoading} />

        {/* Reset Button */}
        {storyText && (
          <div className="text-center mt-8">
            <button
              onClick={resetStory}
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all duration-300 text-white font-semibold shadow-lg inline-flex items-center gap-3"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Start New Story</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
