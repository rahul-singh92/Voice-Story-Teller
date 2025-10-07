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

// Story mode configurations
const storyModes = {
  normal: "You are a masterful storyteller. Generate engaging, detailed, family-friendly narratives with vivid descriptions and compelling characters. Each response should be 6-8 sentences that significantly advance the story.",
  twist: "You are an unpredictable storyteller. Add unexpected plot twists and surprise elements. Use energetic language and sudden revelations. Each response should be 6-8 sentences.",
  emotional: "You are a heartfelt storyteller. Focus on deep emotions, character development, and touching moments. Use poetic, moving language. Each response should be 6-8 sentences.",
  scary: "You are a horror storyteller. Build tension, create suspense, and use eerie descriptions. Keep readers on edge with dark imagery. Each response should be 6-8 sentences."
};

// Voice configurations for Murf
const voiceConfigs = {
  normal: { voiceId: 'en-US-ryan', pitch: 0, speed: 0 },
  twist: { voiceId: 'en-US-terrell', pitch: 10, speed: 10 },
  emotional: { voiceId: 'en-US-natalie', pitch: -10, speed: -10 },
  scary: { voiceId: 'en-US-clint', pitch: -15, speed: -15 }
};

// Store chat sessions
const chatSessions = new Map();

// Available models to try (in order of preference)
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
      
      // If chat exists, use it; otherwise create new model
      if (chatOrModel.sendMessage) {
        return await retryWithBackoff(async () => {
          const result = await chatOrModel.sendMessage(message);
          return await result.response;
        });
      } else {
        // Create new model and generate
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
async function generateMurfVoice(text, mode) {
  const config = voiceConfigs[mode];
  
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
        voiceId: config.voiceId,
        format: 'MP3',
        sampleRate: 24000,
        channelType: 'STEREO',
        pitch: config.pitch,
        speed: config.speed,
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
        const { transcript, mode } = data;
        
        console.log(`\n📝 Received: "${transcript}" | Mode: ${mode}`);
        
        // Get or create chat session
        let chat = chatSessions.get(socket.id);
        
        if (!chat) {
          console.log("🆕 Creating new chat session...");
          
          // Try to create chat with first available model
          let model;
          for (const modelName of MODELS) {
            try {
              model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: {
                  role: "system",
                  parts: [{ text: storyModes[mode] }]
                }
              });
              
              chat = model.startChat({
                history: [],
                generationConfig: {
                  maxOutputTokens: 500,
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

        // Generate story with retry and fallback
        console.log("🤖 Generating story...");
        const response = await generateWithFallback(chat, transcript);
        const storyText = response.text();
        
        console.log("✅ Story generated:", storyText.substring(0, 80) + "...");

        // Send to client
        socket.emit("story-text", { text: storyText });

        // Generate voice
        console.log("🎤 Generating voice...");
        const audioUrl = await generateMurfVoice(storyText, mode);
        console.log("✅ Audio ready");
        socket.emit("audio-ready", { audioUrl });

      } catch (error) {
        console.error("❌ Error:", error);
        
        // User-friendly error messages
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
