import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function conductResearch(query) {
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
      insights_count: (research.match(/\d+\./g) || []).length, // Count numbered points
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