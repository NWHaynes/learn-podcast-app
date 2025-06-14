// Vercel-compatible API endpoint
import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Research function using Claude
async function conductResearch(query) {
  try {
    console.log('Starting research for:', query);
    
    const researchPrompt = `
You are a world-class research agent. Your job is to conduct thorough research on the following topic and prepare findings for an engaging podcast-style story.

TOPIC: "${query}"

Your research should include:
1. Key historical context and background
2. Important facts, statistics, and data points
3. Interesting stories, anecdotes, or case studies
4. Current developments or recent discoveries
5. Why this topic matters or is relevant today
6. Surprising or counterintuitive insights
7. Different perspectives or debates around the topic

Structure your response as a comprehensive research brief that will be used to create an engaging 10-15 minute story. Focus on finding the most interesting, surprising, and educational aspects of this topic.

Make sure to include specific examples, numbers, dates, and concrete details that will make the story vivid and memorable.
`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{
        role: "user",
        content: researchPrompt
      }]
    });

    const research = response.content[0].text;
    console.log('Research completed, length:', research.length);
    
    return {
      success: true,
      research: research,
      insights_count: (research.match(/\d+\./g) || []).length,
      word_count: research.split(' ').length
    };
    
  } catch (error) {
    console.error('Research agent error:', error);
    return {
      success: false,
      error: error.message,
      research: null
    };
  }
}

// Story generation function using ChatGPT
async function generateStory(research, originalQuery) {
  try {
    console.log('Generating story from research...');
    
    const storyPrompt = `
You are a master storyteller and podcast host. Transform the following research into an engaging, conversational story that teaches the listener about this topic.

ORIGINAL QUESTION: "${originalQuery}"

RESEARCH DATA:
${research}

Create a compelling 10-15 minute narrative (approximately 2,500-3,000 words) with these requirements:

STRUCTURE:
1. HOOK (First 30 seconds): Start with a surprising fact, intriguing question, or fascinating scenario that immediately grabs attention
2. SETUP: Provide necessary context and introduce the main concepts
3. JOURNEY: Take the listener through the most interesting aspects, using storytelling techniques
4. CLIMAX: Build to the most surprising or important revelation
5. CONCLUSION: Tie everything together with key takeaways

STYLE REQUIREMENTS:
- Conversational, podcast-style tone (like you're talking to a friend)
- Use "you" to address the listener directly
- Include vivid descriptions and paint mental pictures
- Use analogies and metaphors to explain complex concepts
- Create narrative tension and curiosity gaps
- Include specific examples, stories, and anecdotes
- Build emotional connection to the material
- Use varied sentence lengths for rhythm

STORYTELLING TECHNIQUES:
- Start scenes with "Imagine..." or "Picture this..."
- Use dialogue when appropriate
- Create character-driven moments
- Build suspense before revealing key information
- Use rhetorical questions to engage the listener
- Include "plot twists" or surprising revelations

LENGTH: Target 2,500-3,000 words (10-15 minutes when spoken)

Remember: This isn't a lecture or academic paper. It's an engaging story that happens to teach something fascinating. Make the listener excited to keep listening!
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: storyPrompt
      }],
      max_tokens: 4000,
      temperature: 0.8,
    });

    const story = response.choices[0].message.content;
    console.log('Story generated, length:', story.length);
    
    // Generate a catchy title
    const titlePrompt = `
Based on this story about "${originalQuery}", create a catchy, engaging title that would make someone want to listen. Make it curious and intriguing, like a good podcast episode title.

Story excerpt: ${story.substring(0, 500)}...

Provide just the title, nothing else.
`;

    const titleResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: titlePrompt
      }],
      max_tokens: 100,
      temperature: 0.9,
    });

    const title = titleResponse.choices[0].message.content.replace(/['"]/g, '');
    
    return {
      success: true,
      story: story,
      title: title,
      word_count: story.split(' ').length,
      estimated_duration: Math.round(story.split(' ').length / 200)
    };
    
  } catch (error) {
    console.error('Story agent error:', error);
    return {
      success: false,
      error: error.message,
      story: null
    };
  }
}

// Main handler function
async function handleRequest(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { query } = req.body;

  if (!query || query.trim().length < 10) {
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide a more detailed question (at least 10 characters)' 
    });
  }

  try {
    console.log('Processing request for:', query);
    
    // Step 1: Research Phase
    console.log('Phase 1: Starting research...');
    const researchResult = await conductResearch(query);
    
    if (!researchResult.success) {
      throw new Error(`Research failed: ${researchResult.error}`);
    }

    // Step 2: Story Generation Phase
    console.log('Phase 2: Generating story...');
    const storyResult = await generateStory(researchResult.research, query);
    
    if (!storyResult.success) {
      throw new Error(`Story generation failed: ${storyResult.error}`);
    }

    // Step 3: Prepare final response
    const finalStory = {
      id: Date.now().toString(),
      query: query,
      title: storyResult.title,
      story: storyResult.story,
      research: researchResult.research,
      created_at: new Date().toISOString(),
      word_count: storyResult.word_count,
      estimated_duration: storyResult.estimated_duration,
      audio_url: null
    };

    console.log('Story generation completed successfully');
    
    return res.status(200).json({
      success: true,
      story: finalStory,
      processing_time: 'Completed',
      message: 'Story generated successfully!'
    });

  } catch (error) {
    console.error('Story generation error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate story. Please try again.'
    });
  }
}

// Export for Vercel
export default function handler(req, res) {
  return handleRequest(req, res);
}