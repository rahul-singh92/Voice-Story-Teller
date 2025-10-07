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
    normal: "You are a masterful storyteller. Generate a COMPLETE story from beginning to end with vivid descriptions, compelling characters, and a satisfying conclusion. The story should be 15-20 sentences long, covering the full narrative arc.",
    twist: "You are an unpredictable storyteller. Generate a COMPLETE story with surprising plot twists and unexpected revelations. The story should be 15-20 sentences long with a shocking ending.",
    emotional: "You are a heartfelt storyteller. Generate a COMPLETE emotional story focused on deep feelings, relationships, and personal growth. The story should be 15-20 sentences long with a touching resolution.",
    scary: "You are a horror storyteller. Generate a COMPLETE horror story with building tension, eerie descriptions, and a terrifying climax. The story should be 15-20 sentences long."
  },
  parts: {
    normal: "You are a masterful storyteller. Generate engaging, detailed narratives with vivid descriptions. Each response should be 5-7 sentences that advance the story, leaving room for continuation.",
    twist: "You are an unpredictable storyteller. Add unexpected elements and surprises. Each response should be 5-7 sentences with intriguing cliffhangers.",
    emotional: "You are a heartfelt storyteller. Focus on deep emotions and character development. Each response should be 5-7 sentences with emotional depth.",
    scary: "You are a horror storyteller. Build tension and create suspense. Each response should be 5-7 sentences with eerie atmosphere."
  },
  interactive: {
    normal: "You are an interactive storyteller. Generate story segments that invite reader participation. Each response should be 5-7 sentences ending with questions or choices for the reader.",
    twist: "You are an interactive storyteller with surprises. Create story segments with unexpected turns and reader choices. Each response should be 5-7 sentences.",
    emotional: "You are an interactive emotional storyteller. Create touching moments that invite reader reflection. Each response should be 5-7 sentences with emotional prompts.",
    scary: "You are an interactive horror storyteller. Build suspense with choices that affect the outcome. Each response should be 5-7 sentences with tense decision points."
  }
};

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
        const { transcript, mode, generationMode, voiceSettings } = data;
        
        console.log(`\n📝 Received: "${transcript}"`);
        console.log(`📖 Mode: ${mode} | Generation: ${generationMode}`);
        console.log(`🎤 Voice: ${voiceSettings.voiceId} | Speed: ${voiceSettings.speed} | Pitch: ${voiceSettings.pitch}`);
        
        // Get or create chat session
        let chat = chatSessions.get(socket.id);
        
        if (!chat) {
          console.log("🆕 Creating new chat session...");
          
          // Select system instruction based on generation mode
          const systemInstruction = storyModes[generationMode][mode];
          
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
              
              chat = model.startChat({
                history: [],
                generationConfig: {
                  maxOutputTokens: generationMode === 'full' ? 1000 : 500,
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

        // Generate voice
        console.log("🎤 Generating voice...");
        const audioUrl = await generateMurfVoice(storyText, voiceSettings);
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
        const { mode, voiceSettings } = data;
        const chat = chatSessions.get(socket.id);
        
        if (!chat) {
          socket.emit("error", { message: "No active story session" });
          return;
        }

        console.log("➡️ Continuing story...");
        
        const response = await generateWithFallback(chat, "Continue the story from where you left off.");
        const storyText = response.text();
        
        console.log("✅ Story continued");
        
        socket.emit("story-text", { text: storyText });
        
        const audioUrl = await generateMurfVoice(storyText, voiceSettings);
        socket.emit("audio-ready", { audioUrl });
        
      } catch (error) {
        console.error("❌ Error:", error);
        socket.emit("error", { message: "Could not continue story" });
      }
    });

    // Preview voice handler
    socket.on("preview-voice", async (data) => {
      try {
        const { voiceSettings } = data;
        
        console.log(`\n🎤 Preview request: ${voiceSettings.voiceId}`);
        
        const previewText = "Hey there! I'm your story teller and I will narrate different stories with your customization. Let's create something amazing together!";
        
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
      console.log(`🤖 Gemini AI with fallback models enabled\n`);
    });
});
