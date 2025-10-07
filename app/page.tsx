"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "./lib/socket";
import StoryDisplay from "./components/StoryDisplay";
import ModeSelector from "./components/ModeSelector";
import AudioPlayer from "./components/AudioPlayer";
import VoiceSettings from "./components/VoiceSettings";
import StoryModeDropdown from "./components/StoryModeDropdown";
import LanguageSelector from "./components/LanguageSelector";
import ExportButtons from "./components/ExportButtons";
import AgeGroupSelector from "./components/AgeGroupSelector";
import StoryLengthSlider from "./components/StoryLengthSlider";
import StorySidebar from "./components/StorySidebar";
import StoryTitleInput from "./components/StoryTitleInput";
import { Mic, MicOff, Send, RotateCcw, Wifi, WifiOff, Save } from "lucide-react";
import { saveStory, SavedStory } from "./utils/localStorage";

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
  
  // Voice settings
  const [selectedVoice, setSelectedVoice] = useState("en-US-ryan");
  const [voiceSpeed, setVoiceSpeed] = useState(0);
  const [voicePitch, setVoicePitch] = useState(0);
  
  // Story generation mode
  const [storyGenerationMode, setStoryGenerationMode] = useState<"full" | "parts" | "interactive">("full");
  
  // Language
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  
  // Age group and length
  const [ageGroup, setAgeGroup] = useState<"kids" | "teens" | "adults">("adults");
  const [storyLength, setStoryLength] = useState(3); // 1-5 scale
  
  // Story title and ID
  const [storyTitle, setStoryTitle] = useState("");
  const [currentStoryId, setCurrentStoryId] = useState<string>("");
  
  // Preview audio
  const [previewAudioUrl, setPreviewAudioUrl] = useState("");
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  
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

    function onPreviewReady(data: { audioUrl: string }) {
      setPreviewAudioUrl(data.audioUrl);
    }

    function onError(data: { message: string }) {
      setError(data.message);
      setIsLoading(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("story-text", onStoryText);
    socket.on("audio-ready", onAudioReady);
    socket.on("preview-ready", onPreviewReady);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("story-text", onStoryText);
      socket.off("audio-ready", onAudioReady);
      socket.off("preview-ready", onPreviewReady);
      socket.off("error", onError);
    };
  }, []);

  // Auto-save story when text or audio changes
  useEffect(() => {
    if (storyText && currentStoryId) {
      const story: SavedStory = {
        id: currentStoryId,
        title: storyTitle || "Untitled Story",
        text: storyText,
        audioUrl: audioUrl,
        mode: mode,
        language: selectedLanguage,
        ageGroup: ageGroup,
        storyLength: storyLength,
        generationMode: storyGenerationMode,
        createdAt: currentStoryId, // Using ID as creation timestamp
        updatedAt: new Date().toISOString(),
        favorite: false
      };
      saveStory(story);
    }
  }, [storyText, audioUrl, storyTitle]);

  // Auto-play preview audio
  useEffect(() => {
    if (previewAudioUrl && previewAudioRef.current) {
      previewAudioRef.current.src = previewAudioUrl;
      previewAudioRef.current.play();
    }
  }, [previewAudioUrl]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        // Set recognition language based on selected language
        recognition.lang = selectedLanguage;

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
  }, [selectedLanguage]);

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
      // Generate new story ID if starting fresh
      if (!currentStoryId || !storyText) {
        setCurrentStoryId(new Date().toISOString());
      }
      sendStoryRequest(textInput.trim());
    }
  };

  const sendStoryRequest = (text: string) => {
    setTranscript(text);
    setIsLoading(true);
    socket.emit("start-story", {
      transcript: text,
      mode: mode,
      generationMode: storyGenerationMode,
      language: selectedLanguage,
      ageGroup: ageGroup,
      storyLength: storyLength,
      voiceSettings: {
        voiceId: selectedVoice,
        speed: voiceSpeed,
        pitch: voicePitch
      }
    });
    setTextInput("");
  };

  const handlePreviewVoice = (voiceId: string, speed: number, pitch: number) => {
    console.log("🎤 Previewing voice:", voiceId);
    socket.emit("preview-voice", {
      language: selectedLanguage,
      voiceSettings: {
        voiceId: voiceId,
        speed: speed,
        pitch: pitch
      }
    });
  };

  const continueStory = () => {
    setIsLoading(true);
    socket.emit("continue-story", {
      mode: mode,
      language: selectedLanguage,
      ageGroup: ageGroup,
      storyLength: storyLength,
      voiceSettings: {
        voiceId: selectedVoice,
        speed: voiceSpeed,
        pitch: voicePitch
      }
    });
  };

  const resetStory = () => {
    socket.emit("reset-story");
    setStoryText("");
    setAudioUrl("");
    setTranscript("");
    setError("");
    setTextInput("");
    setStoryTitle("");
    setCurrentStoryId("");
  };

  const handleLoadStory = (story: SavedStory) => {
    setStoryText(story.text);
    setAudioUrl(story.audioUrl);
    setStoryTitle(story.title);
    setMode(story.mode as any);
    setSelectedLanguage(story.language);
    setAgeGroup(story.ageGroup as any);
    setStoryLength(story.storyLength);
    setStoryGenerationMode(story.generationMode as any);
    setCurrentStoryId(story.id);
    setTranscript(`Continuing story: ${story.title}`);
  };

  const handleManualSave = () => {
    if (!storyText) {
      alert("No story to save!");
      return;
    }

    const id = currentStoryId || new Date().toISOString();
    setCurrentStoryId(id);

    const story: SavedStory = {
      id: id,
      title: storyTitle || "Untitled Story",
      text: storyText,
      audioUrl: audioUrl,
      mode: mode,
      language: selectedLanguage,
      ageGroup: ageGroup,
      storyLength: storyLength,
      generationMode: storyGenerationMode,
      createdAt: id,
      updatedAt: new Date().toISOString(),
      favorite: false
    };
    
    saveStory(story);
    alert("Story saved successfully!");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-6 md:p-8">
      {/* Story Sidebar */}
      <StorySidebar 
        onLoadStory={handleLoadStory}
        currentStoryId={currentStoryId}
      />

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
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <LanguageSelector
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                disabled={isLoading}
              />
              
              {/* Connection Status */}
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
          </div>
          
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        </div>

        {/* Story Title Input */}
        <StoryTitleInput 
          value={storyTitle}
          onChange={setStoryTitle}
          disabled={isLoading}
        />

        {/* Mode Selector */}
        <ModeSelector mode={mode} setMode={setMode} />

        {/* Age Group Selector */}
        <AgeGroupSelector value={ageGroup} onChange={setAgeGroup} />

        {/* Story Length Slider */}
        <StoryLengthSlider value={storyLength} onChange={setStoryLength} />

        {/* Voice Settings */}
        <VoiceSettings 
          voice={selectedVoice}
          setVoice={setSelectedVoice}
          speed={voiceSpeed}
          setSpeed={setVoiceSpeed}
          pitch={voicePitch}
          setPitch={setVoicePitch}
          onPreviewVoice={handlePreviewVoice}
        />

        {/* Hidden Preview Audio Player */}
        <audio ref={previewAudioRef} className="hidden" />

        {/* Input Section */}
        <div className="mb-8 relative z-10">
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

              {/* Story Generation Mode Dropdown */}
              <StoryModeDropdown
                value={storyGenerationMode}
                onChange={setStoryGenerationMode}
                disabled={isLoading}
              />

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
          <div className="mb-6 p-5 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 animate-fade-in relative z-0">
            <p className="text-xs text-purple-400 mb-2 font-semibold uppercase tracking-wider">Your Request</p>
            <p className="text-white text-base md:text-lg">{transcript}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-5 bg-red-950/30 backdrop-blur-sm rounded-xl border border-red-500/30 animate-fade-in relative z-0">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && <AudioPlayer audioUrl={audioUrl} />}

        {/* Story Display */}
        <StoryDisplay storyText={storyText} isLoading={isLoading} />

        {/* Export Buttons */}
        <ExportButtons 
          storyText={storyText} 
          audioUrl={audioUrl}
          storyTitle={storyTitle || "My Story"}
        />

        {/* Action Buttons */}
        {storyText && (
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {/* Manual Save Button */}
            <button
              onClick={handleManualSave}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl transition-all duration-300 text-white font-semibold shadow-lg inline-flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              <span>Save Story</span>
            </button>

            {/* Continue Button (for parts/interactive mode) */}
            {storyGenerationMode !== "full" && !isLoading && (
              <button
                onClick={continueStory}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl transition-all duration-300 text-white font-semibold shadow-lg shadow-purple-600/30 inline-flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>Continue Story</span>
              </button>
            )}

            {/* Reset Button */}
            <button
              onClick={resetStory}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all duration-300 text-white font-semibold shadow-lg inline-flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>New Story</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
