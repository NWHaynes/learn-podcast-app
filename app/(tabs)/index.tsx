import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface Story {
  id: string;
  query: string;
  story: string;
  audio_url?: string;
  created_at: string;
  title: string;
}

export default function ChatScreen() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [processingStep, setProcessingStep] = useState('');

  const handleSubmit = async () => {
    if (!query.trim()) {
      Alert.alert('Please enter a topic', 'Tell me what you want to learn about!');
      return;
    }

    if (query.trim().length < 20) {
      Alert.alert('Please be more specific', 'Give me at least a few sentences about what you want to learn!');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Starting research...');

    try {
      await generateRealStory();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const generateRealStory = async () => {
    try {
      // Step 1: Research
      setProcessingStep('🔍 Researching your topic with Claude...');
      
      // Step 2: Story Generation
      setProcessingStep('✍️ Writing your personalized story with ChatGPT...');
      
      // Step 3: API Call
      setProcessingStep('🧠 AI agents working together...');
      
      const response = await fetch('https://learn-podcast.vercel.app/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate story');
      }

      setProcessingStep('🎉 Story complete!');
      
      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentStory(data.story);
      setQuery('');
      
    } catch (error) {
      console.error('API Error:', error);
      
      // Fall back to local testing
      if (__DEV__) {
        Alert.alert(
          'Development Mode', 
          'Using local testing since API is not deployed yet. Deploy to Vercel to use real AI!'
        );
        await simulateStoryGeneration();
      } else {
        throw error;
      }
    }
  };

  const simulateStoryGeneration = async () => {
    // Simulate research phase
    setProcessingStep('🔍 Researching your topic...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate story generation
    setProcessingStep('✍️ Writing your story...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate audio generation
    setProcessingStep('🎙️ Creating audio...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create mock story
    const mockStory: Story = {
      id: Date.now().toString(),
      query: query,
      story: `This is where your personalized story about "${query}" would appear. The AI would research this topic and create an engaging, podcast-style narrative that teaches you everything you wanted to know in an entertaining way.

Once you deploy the backend to Vercel, this will be replaced with real AI-generated content using Claude for research and ChatGPT for storytelling!`,
      title: `Learning: ${query}`,
      created_at: new Date().toISOString(),
    };
    
    setCurrentStory(mockStory);
    setQuery('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🎓 Learn Podcast</Text>
          <Text style={styles.subtitle}>What do you want to learn today?</Text>
        </View>

        {!currentStory && !isProcessing && (
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Tell me what you're curious about... (2-3 paragraphs work best)"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={[styles.button, isProcessing && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>
                Generate My Story 🚀
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingContainer}>
            <Text style={styles.processingTitle}>Creating your story...</Text>
            <Text style={styles.processingStep}>{processingStep}</Text>
            <View style={styles.loadingBar}>
              <View style={styles.loadingProgress} />
            </View>
            <Text style={styles.processingNote}>
              This usually takes 1-2 minutes. We're researching, writing, and creating audio just for you!
            </Text>
          </View>
        )}

        {currentStory && (
          <View style={styles.storyContainer}>
            <Text style={styles.storyTitle}>{currentStory.title}</Text>
            <Text style={styles.storyContent}>{currentStory.story}</Text>
            
            <View style={styles.storyActions}>
              <TouchableOpacity style={styles.playButton}>
                <Text style={styles.playButtonText}>🎵 Play Audio</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.favoriteButton}>
                <Text style={styles.favoriteButtonText}>⭐ Save to Favorites</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.newStoryButton}
              onPress={() => setCurrentStory(null)}
            >
              <Text style={styles.newStoryButtonText}>Create New Story</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#4a5568',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 150,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: '#4299e1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#a0aec0',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  processingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 12,
  },
  processingStep: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 20,
  },
  loadingBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 16,
  },
  loadingProgress: {
    width: '60%',
    height: '100%',
    backgroundColor: '#4299e1',
    borderRadius: 3,
  },
  processingNote: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  storyContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  storyContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4a5568',
    marginBottom: 24,
  },
  storyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  playButton: {
    backgroundColor: '#48bb78',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  favoriteButton: {
    backgroundColor: '#ed8936',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  favoriteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  newStoryButton: {
    backgroundColor: '#667eea',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  newStoryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});