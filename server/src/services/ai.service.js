import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const generateMeetingSummary = async (transcript) => {
  if (!transcript || transcript.trim().length === 0) {
    return 'No transcript available to summarize.';
  }

  const response = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [
      {
        role: 'system',
        content: 'You are an expert meeting assistant. Summarize the meeting clearly in under 150 words.',
      },
      {
        role: 'user',
        content: `Summarize this meeting transcript:\n\n${transcript}`,
      },
    ],
    max_tokens: 300,
  });

  return response.choices[0].message.content.trim();
};

const extractActionItems = async (transcript) => {
  if (!transcript || transcript.trim().length === 0) {
    return [];
  }

  const response = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [
      {
        role: 'system',
        content: `Extract action items from meeting transcript. Return ONLY a JSON array like:
[{"text": "Send report", "assignee": "John"}, {"text": "Fix bug", "assignee": "Unassigned"}]
Return ONLY the JSON array, nothing else.`,
      },
      {
        role: 'user',
        content: `Extract action items:\n\n${transcript}`,
      },
    ],
    max_tokens: 500,
  });

  try {
    const raw = response.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Action items parse error:', err.message);
    return [];
  }
};

const analyzeMeeting = async (transcript) => {
  const [summary, actionItems] = await Promise.all([
    generateMeetingSummary(transcript),
    extractActionItems(transcript),
  ]);
  return { summary, actionItems };
};

export default { generateMeetingSummary, extractActionItems, analyzeMeeting };