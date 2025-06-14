// Generate dynamic, contextual questions based on user's specific topic
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateDynamicQuestions(initialTopic) {
  try {
    console.log('Generating contextual questions for:', initialTopic);
    
    const questionPrompt = `
You are an expert educator having a conversation with someone who wants to learn. They just told you:

"${initialTopic}"

Your job is to ask 5 specific, contextual questions that will help you create the perfect learning story for them. These questions should be:

1. **Directly related to their specific topic** - not generic learning questions
2. **Conversational and engaging** - like you're having a real discussion
3. **Help you understand what angle/depth/focus they want**
4. **Reveal any specific curiosities or misconceptions they might have**
5. **Allow you to tailor the story to their interests**

Think about:
- What are the key dimensions/perspectives of this topic?
- What choices need to be made about scope, depth, and angle?
- What specific aspects might they be most curious about?
- What context or background might be needed?
- What level of complexity are they ready for?

Write your response as if you're ChatGPT having a natural conversation. Start with a brief acknowledgment of their topic, then ask your 5 questions in a conversational way.

Example style:
"Absolutely! This is a fascinating and complex topic. Before I dive into creating your story, let me ask a few questions to make sure I give you exactly what you're looking for:

1. [Specific question about their topic]
2. [Another contextual question]
..." 

Be natural, engaging, and specific to their exact topic.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: questionPrompt
      }],
      max_tokens: 800,
      temperature: 0.8, // Higher creativity for natural conversation
    });

    const questions = response.choices[0].message.content;
    console.log('Dynamic questions generated, length:', questions.length);
    
    return {
      success: true,
      questions: questions,
      word_count: questions.split(' ').length
    };
    
  } catch (error) {
    console.error('Question generation error:', error);
    return {
      success: false,
      error: error.message,
      questions: null
    };
  }
}

// Main API handler
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

  const { topic } = req.body;

  if (!topic || topic.trim().length < 20) {
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide a more detailed topic (at least 20 characters)' 
    });
  }

  try {
    console.log('Processing question generation for:', topic);
    
    const questionResult = await generateDynamicQuestions(topic);
    
    if (!questionResult.success) {
      throw new Error(`Question generation failed: ${questionResult.error}`);
    }

    return res.status(200).json({
      success: true,
      questions: questionResult.questions,
      message: 'Clarifying questions generated successfully!'
    });

  } catch (error) {
    console.error('Question generation error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate questions. Please try again.'
    });
  }
}

// Export for Vercel
export default function handler(req, res) {
  return handleRequest(req, res);
}