# Voice Story Teller

**Live Demo:** [https://voice-story-teller.onrender.com/](https://voice-story-teller.onrender.com/)

An AI-powered web application that transforms text prompts into fully narrated stories with voice synthesis. Users can customize story modes, age groups, languages, and voice settings to create personalized storytelling experiences.

---

## Features

### Story Generation
- **AI-Powered Stories**: Uses Google Gemini AI to generate creative narratives
- **Multiple Story Modes**: Normal, Twist, Emotional, and Scary modes
- **Generation Types**: Full stories, segmented parts, or interactive choose-your-own-adventure
- **Age-Appropriate Content**: Stories tailored for Kids (5-10), Teens (11-17), or Adults (18+)
- **Adjustable Length**: Control story length from very short (3-5 sentences) to very long (16-20 sentences)

### Voice & Language
- **Text-to-Speech**: High-quality voice narration using Murf AI API
- **Multi-Language Support**: Generate and narrate stories in 10 languages including English, Hindi, Spanish, French, German, Japanese, Chinese, Portuguese, Russian, and Arabic
- **Voice Customization**: Adjust voice speed and pitch
- **Voice Preview**: Test voice settings before generating stories
- **Speech Recognition**: Voice input support for hands-free story prompts

### Story Management
- **Local Storage**: Save stories automatically to browser storage
- **Story History**: Access previously generated stories from sidebar
- **Favorite System**: Mark and filter favorite stories
- **Export Options**: Download stories as PDF, TXT, or MP3 audio files
- **Continue Stories**: Resume and extend stories in parts or interactive modes

### User Interface
- **Dark Theme**: Modern glassmorphism design with purple accents
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Status**: Socket.IO connection status indicator
- **Loading States**: Clear feedback during story generation and audio synthesis

---

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Socket.IO Client** - Real-time communication
- **Lucide React** - Icon library
- **jsPDF** - PDF generation
- **File Saver** - File download utilities

### Backend
- **Node.js** - Runtime environment
- **Socket.IO** - WebSocket server for real-time communication
- **Google Generative AI** - Story generation with Gemini models
- **Murf AI API** - Text-to-speech synthesis
- **Express** - HTTP server (integrated with Next.js)

---

## Installation

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- Gemini API key (from Google AI Studio)
- Murf API key (from Murf.ai)

### Setup

1. **Clone the repository**
```
git clone https://github.com/rahul-singh92/Voice-Story-Teller.git
cd Voice-Story-Teller
```
2. **Install dependencies**
```
npm install
```
3. **Configure environment variables**
```
Create `.env.local` file in the root directory:

GEMINI_API_KEY=your_gemini_api_key_here
MURF_API_KEY=your_murf_api_key_here
NODE_ENV=development
```
4. **Run development server**
```
npm run dev
```

5. **Open browser**
Navigate to `http://localhost:3000`

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for story generation | Yes |
| `MURF_API_KEY` | Murf AI API key for text-to-speech | Yes |
| `NODE_ENV` | Environment mode (development/production) | No |
| `PORT` | Server port (default: 3000) | No |

### Getting API Keys

**Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Create new API key
4. Copy and add to `.env.local`

**Murf API Key:**
1. Visit [Murf.ai](https://murf.ai)
2. Sign up for an account
3. Navigate to API settings
4. Generate API key
5. Copy and add to `.env.local`

---

## Usage

### Creating a Story

1. **Choose Story Mode**: Select from Normal, Twist, Emotional, or Scary
2. **Set Age Group**: Choose Kids, Teens, or Adults for appropriate content
3. **Adjust Length**: Use slider to set desired story length
4. **Select Language**: Choose from 10 supported languages
5. **Customize Voice**: Pick voice and adjust speed/pitch (optional)
6. **Enter Prompt**: Type or speak your story idea
7. **Select Generation Type**: Choose Full Story, Some Parts, or Interactive
8. **Generate**: Click Send to create your story

### Managing Stories

- **Save**: Stories auto-save to local storage
- **View History**: Click sidebar button to see all saved stories
- **Load Story**: Click any saved story to load and continue it
- **Favorite**: Star icon to mark favorites
- **Delete**: Trash icon to remove stories
- **Export**: Download as PDF, TXT, or audio file

### Voice Input

1. Click microphone icon
2. Speak your story prompt
3. Transcript appears automatically
4. Click Send to generate

---
## API References

### Socket.IO Events

**Client to Server:**
- `start-story` - Generate new story
- `continue-story` - Continue existing story
- `preview-voice` - Test voice settings
- `reset-story` - Clear current session

**Server to Client:**
- `story-text` - Story content chunk
- `audio-ready` - Audio URL when synthesis complete
- `preview-ready` - Preview audio URL
- `error` - Error messages

### Gemini Models

Fallback chain for reliability:
1. `gemini-2.0-flash-exp`
2. `gemini-1.5-flash`
3. `gemini-1.5-flash-latest`
4. `gemini-pro`

### Supported Languages

| Language | Code | Voice ID |
|----------|------|----------|
| English | en-US | en-US-ryan |
| Hindi | hi-IN | hi-IN-karan |
| Spanish | es-ES | es-ES-antonio |
| French | fr-FR | fr-FR-antoine |
| German | de-DE | de-DE-gisela |
| Japanese | ja-JP | ja-JP-kenji |
| Chinese | zh-CN | zh-CN-xiaoxiao |
| Portuguese | pt-BR | pt-BR-giovanna |
| Russian | ru-RU | ru-RU-pavel |
| Arabic | ar-SA | ar-SA-hamza |

---

## Troubleshooting

### Common Issues

**Socket.IO Connection Failed**
- Check server is running
- Verify CORS configuration in `server.js`
- Ensure correct port in `socket.ts`

**Story Generation Fails**
- Verify `GEMINI_API_KEY` is valid
- Check API quota limits
- Review server logs for errors

**Audio Not Playing**
- Verify `MURF_API_KEY` is valid
- Check browser audio permissions
- Ensure HTTPS for production

**Build Errors**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version compatibility

---

## Performance Optimization

- Stories cached in local storage
- Socket.IO connection reused across requests
- Retry logic with exponential backoff for API calls
- Model fallback chain for reliability
- Efficient token usage based on story length

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add YourFeature'`)
4. Push to branch (`git push origin feature/YourFeature`)
5. Open Pull Request

---

## Author

**Rahul Singh Jadoun**
- GitHub: [@rahul-singh92](https://github.com/rahul-singh92)
- Email: rahulsinghjadoun09@gmail.com

---
