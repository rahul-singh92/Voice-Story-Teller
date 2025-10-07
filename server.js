require('dotenv').config({ path: '.env.local' });

const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Story mode configurations with different lengths
const storyModes = {
  full: {
    normal: "You are a masterful storyteller. Generate a COMPLETE story from beginning to end with vivid descriptions, compelling characters, and a satisfying conclusion. The story should cover the full narrative arc.",
    twist: "You are an unpredictable storyteller. Generate a COMPLETE story with surprising plot twists and unexpected revelations. Include a shocking ending.",
    emotional: "You are a heartfelt storyteller. Generate a COMPLETE emotional story focused on deep feelings, relationships, and personal growth with a touching resolution.",
    scary: "You are a horror storyteller. Generate a COMPLETE horror story with building tension, eerie descriptions, and a terrifying climax."
  },
  parts: {
    normal: "You are a masterful storyteller. Generate engaging, detailed narratives with vivid descriptions. Each response should advance the story, leaving room for continuation.",
    twist: "You are an unpredictable storyteller. Add unexpected elements and surprises with intriguing cliffhangers.",
    emotional: "You are a heartfelt storyteller. Focus on deep emotions and character development with emotional depth.",
    scary: "You are a horror storyteller. Build tension and create suspense with eerie atmosphere."
  },
  interactive: {
    normal: "You are an interactive storyteller. Generate story segments that invite reader participation ending with questions or choices for the reader.",
    twist: "You are an interactive storyteller with surprises. Create story segments with unexpected turns and reader choices.",
    emotional: "You are an interactive emotional storyteller. Create touching moments that invite reader reflection with emotional prompts.",
    scary: "You are an interactive horror storyteller. Build suspense with choices that affect the outcome with tense decision points."
  }
};

// Age-appropriate vocabulary and complexity
const AGE_INSTRUCTIONS = {
  kids: "Use simple vocabulary appropriate for 5-10 year olds. Use short, clear sentences. Keep themes fun and lighthearted. Avoid complex concepts.",
  teens: "Use vocabulary appropriate for 11-17 year olds. Include relatable themes and moderate complexity. Balance entertainment with some depth.",
  adults: "Use sophisticated vocabulary and complex sentence structures. Include mature themes and deeper concepts as appropriate."
};

// Length instructions based on slider value (1-5)
const LENGTH_INSTRUCTIONS = {
  1: "Generate a very short story of 3-5 sentences.",
  2: "Generate a short story of 5-8 sentences.",
  3: "Generate a medium-length story of 8-12 sentences.",
  4: "Generate a long story of 12-16 sentences.",
  5: "Generate a very long story of 16-20 sentences."
};

// Language to voice mapping for Murf API
const LANGUAGE_VOICES = {
  'en-US': { voiceId: 'en-US-ryan', name: 'English' },
  'hi-IN': { voiceId: 'hi-IN-karan', name: 'Hindi' },
  'es-ES': { voiceId: 'es-ES-antonio', name: 'Spanish' },
  'fr-FR': { voiceId: 'fr-FR-antoine', name: 'French' },
  'de-DE': { voiceId: 'de-DE-gisela', name: 'German' },
  'ja-JP': { voiceId: 'ja-JP-kenji', name: 'Japanese' },
  'zh-CN': { voiceId: 'zh-CN-xiaoxiao', name: 'Chinese' },
  'pt-BR': { voiceId: 'pt-BR-giovanna', name: 'Portuguese' },
  'ru-RU': { voiceId: 'ru-RU-pavel', name: 'Russian' },
  'ar-SA': { voiceId: 'ar-SA-hamza', name: 'Arabic' },
};

// Preview texts for different languages
const PREVIEW_TEXTS = {
  'en-US': "Hey there! I'm your story teller and I will narrate different stories with your customization. Let's create something amazing together!",
  'hi-IN': "नमस्ते! मैं आपका कहानीकार हूं और मैं आपकी पसंद के अनुसार अलग-अलग कहानियाँ सुनाऊंगा। आइए कुछ अद्भुत बनाएं!",
  'es-ES': "¡Hola! Soy tu narrador de historias y narraré diferentes historias con tu personalización. ¡Creemos algo increíble juntos!",
  'fr-FR': "Bonjour! Je suis votre conteur et je raconterai différentes histoires selon vos préférences. Créons quelque chose d'incroyable ensemble!",
  'de-DE': "Hallo! Ich bin dein Geschichtenerzähler und erzähle verschiedene Geschichten nach deinen Wünschen. Lass uns etwas Erstaunliches erschaffen!",
  'ja-JP': "こんにちは！私はあなたのストーリーテラーで、カスタマイズされたさまざまな物語をお届けします。一緒に素晴らしいものを作りましょう！",
  'zh-CN': "你好！我是你的故事讲述者，我会根据你的定制讲述不同的故事。让我们一起创造惊人的东西吧！",
  'pt-BR': "Olá! Sou seu contador de histórias e vou narrar diferentes histórias com sua personalização. Vamos criar algo incrível juntos!",
  'ru-RU': "Привет! Я ваш рассказчик и буду рассказывать различные истории с вашей персонализацией. Давайте создадим что-то удивительное вместе!",
  'ar-SA': "مرحباً! أنا راوي قصصك وسأروي قصصاً مختلفة حسب تخصيصك. دعنا نخلق شيئاً مذهلاً معاً!"
};

// Get language name from code
function getLanguageName(code) {
  return LANGUAGE_VOICES[code]?.name || 'English';
}

// Store chat sessions
const chatSessions = new Map();

// Available models to try
const MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-pro'
];

// Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastRetry = i === maxRetries - 1;
      const isOverloaded = error.message?.includes('overloaded') || error.message?.includes('503');
      
      if (isLastRetry || !isOverloaded) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`⏳ Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Try multiple models with fallback
async function generateWithFallback(chatOrModel, message) {
  let lastError;
  
  for (const modelName of MODELS) {
    try {
      console.log(`🔄 Trying model: ${modelName}`);
      
      if (chatOrModel.sendMessage) {
        return await retryWithBackoff(async () => {
          const result = await chatOrModel.sendMessage(message);
          return await result.response;
        });
      } else {
        const model = genAI.getGenerativeModel({ model: modelName });
        return await retryWithBackoff(async () => {
          const result = await model.generateContent(message);
          return await result.response;
        });
      }
    } catch (error) {
      console.log(`❌ Model ${modelName} failed:`, error.message);
      lastError = error;
      continue;
    }
  }
  
  throw lastError || new Error('All models failed');
}

// Murf API function
async function generateMurfVoice(text, voiceSettings) {
  try {
    const response = await fetch('https://api.murf.ai/v1/speech/generate', {
      method: 'POST',
      headers: {
        'api-key': process.env.MURF_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        voiceId: voiceSettings.voiceId,
        format: 'MP3',
        sampleRate: 24000,
        channelType: 'STEREO',
        pitch: voiceSettings.pitch,
        speed: voiceSettings.speed,
        model: 'GEN2'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Murf API Error Response:', errorData);
      throw new Error(`Murf API error: ${response.status}`);
    }

    const data = await response.json();
    return data.audioFile;
  } catch (error) {
    console.error('Murf API Error:', error);
    throw error;
  }
}

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);
    
    chatSessions.set(socket.id, null);

    socket.on("start-story", async (data) => {
      try {
        const { transcript, mode, generationMode, language, ageGroup, storyLength, voiceSettings } = data;
        
        const languageName = getLanguageName(language || 'en-US');
        
        console.log(`\n📝 Received: "${transcript}"`);
        console.log(`📖 Mode: ${mode} | Generation: ${generationMode} | Language: ${languageName}`);
        console.log(`👥 Age: ${ageGroup} | Length: ${storyLength}`);
        console.log(`🎤 Voice: ${voiceSettings.voiceId} | Speed: ${voiceSettings.speed} | Pitch: ${voiceSettings.pitch}`);
        
        // Get or create chat session
        let chat = chatSessions.get(socket.id);
        
        if (!chat) {
          console.log("🆕 Creating new chat session...");
          
          // Build comprehensive system instruction
          const baseInstruction = storyModes[generationMode][mode];
          const ageInstruction = AGE_INSTRUCTIONS[ageGroup || 'adults'];
          const lengthInstruction = LENGTH_INSTRUCTIONS[storyLength || 3];
          
          const systemInstruction = `${baseInstruction} ${ageInstruction} ${lengthInstruction} IMPORTANT: Generate the story in ${languageName} language.`;
          
          let model;
          for (const modelName of MODELS) {
            try {
              model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: {
                  role: "system",
                  parts: [{ text: systemInstruction }]
                }
              });
              
              // Adjust token limit based on length
              const maxTokens = storyLength === 5 ? 1200 : 
                               storyLength === 4 ? 900 : 
                               storyLength === 3 ? 600 : 
                               storyLength === 2 ? 400 : 300;
              
              chat = model.startChat({
                history: [],
                generationConfig: {
                  maxOutputTokens: maxTokens,
                  temperature: 0.8,
                }
              });
              
              console.log(`✅ Using model: ${modelName}`);
              break;
            } catch (error) {
              console.log(`❌ Model ${modelName} unavailable, trying next...`);
              continue;
            }
          }
          
          if (!chat) {
            throw new Error('Unable to initialize any Gemini model');
          }
          
          chatSessions.set(socket.id, chat);
        }

        // Generate story
        console.log("🤖 Generating story...");
        const response = await generateWithFallback(chat, transcript);
        const storyText = response.text();
        
        console.log("✅ Story generated:", storyText.substring(0, 80) + "...");

        // Send to client
        socket.emit("story-text", { text: storyText });

        // Use language-specific voice if custom voice not selected
        const defaultVoice = LANGUAGE_VOICES[language || 'en-US']?.voiceId || 'en-US-ryan';
        const finalVoiceSettings = {
          voiceId: voiceSettings.voiceId || defaultVoice,
          speed: voiceSettings.speed,
          pitch: voiceSettings.pitch
        };

        // Generate voice
        console.log("🎤 Generating voice...");
        const audioUrl = await generateMurfVoice(storyText, finalVoiceSettings);
        console.log("✅ Audio ready");
        socket.emit("audio-ready", { audioUrl });

      } catch (error) {
        console.error("❌ Error:", error);
        
        let errorMessage = "An error occurred while generating your story.";
        
        if (error.message?.includes('overloaded') || error.message?.includes('503')) {
          errorMessage = "The AI service is currently busy. Please try again in a moment.";
        } else if (error.message?.includes('API key')) {
          errorMessage = "API configuration error. Please check your settings.";
        } else if (error.message?.includes('quota')) {
          errorMessage = "API quota exceeded. Please try again later.";
        }
        
        socket.emit("error", { message: errorMessage });
      }
    });

    // Continue story handler (for parts/interactive mode)
    socket.on("continue-story", async (data) => {
      try {
        const { mode, language, ageGroup, storyLength, voiceSettings } = data;
        const chat = chatSessions.get(socket.id);
        
        if (!chat) {
          socket.emit("error", { message: "No active story session" });
          return;
        }

        const languageName = getLanguageName(language || 'en-US');
        console.log(`\n➡️ Continuing story in ${languageName}...`);
        
        const response = await generateWithFallback(chat, "Continue the story from where you left off.");
        const storyText = response.text();
        
        console.log("✅ Story continued");
        
        socket.emit("story-text", { text: storyText });
        
        const defaultVoice = LANGUAGE_VOICES[language || 'en-US']?.voiceId || 'en-US-ryan';
        const finalVoiceSettings = {
          voiceId: voiceSettings.voiceId || defaultVoice,
          speed: voiceSettings.speed,
          pitch: voiceSettings.pitch
        };
        
        const audioUrl = await generateMurfVoice(storyText, finalVoiceSettings);
        socket.emit("audio-ready", { audioUrl });
        
      } catch (error) {
        console.error("❌ Error:", error);
        socket.emit("error", { message: "Could not continue story" });
      }
    });

    // Preview voice handler
    socket.on("preview-voice", async (data) => {
      try {
        const { language, voiceSettings } = data;
        const languageCode = language || 'en-US';
        const languageName = getLanguageName(languageCode);
        
        console.log(`\n🎤 Preview request: ${voiceSettings.voiceId} (${languageName})`);
        
        // Get preview text for the selected language
        const previewText = PREVIEW_TEXTS[languageCode] || PREVIEW_TEXTS['en-US'];
        
        const audioUrl = await generateMurfVoice(previewText, voiceSettings);
        console.log("✅ Preview audio ready");
        
        socket.emit("preview-ready", { audioUrl });
        
      } catch (error) {
        console.error("❌ Preview error:", error);
        socket.emit("error", { message: "Could not generate voice preview" });
      }
    });

    socket.on("reset-story", () => {
      chatSessions.set(socket.id, null);
      console.log("🔄 Story reset");
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      chatSessions.delete(socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error("❌ Server error:", err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`\n🚀 Server ready on http://${hostname}:${port}`);
      console.log(`📡 Socket.IO ready`);
      console.log(`🤖 Gemini AI with fallback models enabled`);
      console.log(`🌍 Multi-language support enabled\n`);
    });
});
