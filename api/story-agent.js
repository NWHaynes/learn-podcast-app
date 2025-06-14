import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateStory(research, originalQuery) {
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
      temperature: 0.8, // Higher temperature for more creativity
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
      estimated_duration: Math.round(story.split(' ').length / 200) // ~200 words per minute
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