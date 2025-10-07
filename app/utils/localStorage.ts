    export interface SavedStory {
  id: string;
  title: string;
  text: string;
  audioUrl: string;
  mode: string;
  language: string;
  ageGroup: string;
  storyLength: number;
  generationMode: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
}

const STORAGE_KEY = 'voice_story_teller_stories';

// Get all saved stories
export const getSavedStories = (): SavedStory[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading stories:', error);
    return [];
  }
};

// Save a story
export const saveStory = (story: SavedStory): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const stories = getSavedStories();
    const existingIndex = stories.findIndex(s => s.id === story.id);
    
    if (existingIndex >= 0) {
      // Update existing story
      stories[existingIndex] = {
        ...story,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new story
      stories.unshift(story);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch (error) {
    console.error('Error saving story:', error);
  }
};

// Delete a story
export const deleteStory = (id: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const stories = getSavedStories();
    const filtered = stories.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting story:', error);
  }
};

// Toggle favorite
export const toggleFavorite = (id: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const stories = getSavedStories();
    const story = stories.find(s => s.id === id);
    if (story) {
      story.favorite = !story.favorite;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
};

// Get a single story by ID
export const getStoryById = (id: string): SavedStory | null => {
  const stories = getSavedStories();
  return stories.find(s => s.id === id) || null;
};
