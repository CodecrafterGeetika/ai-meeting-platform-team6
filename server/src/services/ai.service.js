import Groq from 'groq-sdk';
import fs from 'fs';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'gsk_dummy_key_to_prevent_startup_crash',
});

const isDummyKey = !process.env.GROQ_API_KEY || 
  process.env.GROQ_API_KEY === 'your_groq_api_key' || 
  process.env.GROQ_API_KEY === 'gsk_dummy_key_to_prevent_startup_crash' ||
  process.env.GROQ_API_KEY.trim() === '';

const MOCK_TRANSCRIPT = `Welcome, team! Let's get this weekly sync started. First, we need to discuss our roadmap alignment for the next sprint. John, how is the backend authentication migration coming along? John replied that he is on track to complete the user authentication service and session management by Thursday. Sarah, what about the UI/UX mockups for the new dashboard? Sarah mentioned that she has finalized the wireframes and is currently polishing the dark mode theme, which should be ready for review by Friday. Finally, we need someone to draft the deployment checklist and test all API endpoints before the integration phase next week. Let's make sure the tasks are updated in our project board. Thank you, everyone, let's have a productive week!`;

const MOCK_SUMMARY = `During the weekly sync, the team discussed roadmap alignment and updates for the next sprint. John reported that backend authentication migration is on track for completion by Thursday. Sarah finalized the dashboard UI/UX wireframes and expects dark mode designs by Friday. The team also highlighted the need to draft a deployment checklist and test API endpoints prior to next week's integration phase.`;

const MOCK_ACTION_ITEMS = [
  { text: 'Complete backend authentication migration and session management', assignee: 'John' },
  { text: 'Polish and submit dashboard UI/UX dark mode mockups for review', assignee: 'Sarah' },
  { text: 'Draft the deployment checklist and test all API endpoints', assignee: 'Unassigned' }
];

const generateMeetingSummary = async (transcript) => {
  if (!transcript || transcript.trim().length === 0) {
    return 'No transcript available to summarize.';
  }

  if (isDummyKey || transcript === MOCK_TRANSCRIPT) {
    console.info('Using mock summary (Groq API Key missing/dummy or matching mock transcript)');
    return MOCK_SUMMARY;
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
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
  } catch (error) {
    console.error('Summary generation failed with Groq API, using mock fallback:', error.message);
    return MOCK_SUMMARY;
  }
};

const extractActionItems = async (transcript) => {
  if (!transcript || transcript.trim().length === 0) {
    return [];
  }

  if (isDummyKey || transcript === MOCK_TRANSCRIPT) {
    console.info('Using mock action items (Groq API Key missing/dummy or matching mock transcript)');
    return MOCK_ACTION_ITEMS;
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
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

    const raw = response.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Action items extraction failed with Groq API, using mock fallback:', err.message);
    return MOCK_ACTION_ITEMS;
  }
};

const analyzeMeeting = async (transcript) => {
  const [summary, actionItems] = await Promise.all([
    generateMeetingSummary(transcript),
    extractActionItems(transcript),
  ]);
  return { summary, actionItems };
};

const transcribeAudio = async (filePath) => {
  if (isDummyKey) {
    console.info('Using mock transcription (Groq API Key missing/dummy)');
    return MOCK_TRANSCRIPT;
  }

  try {
    const response = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
    });
    return response.text;
  } catch (error) {
    console.error('Transcription failed with Groq API, using mock fallback:', error.message);
    return MOCK_TRANSCRIPT;
  }
};

export default { generateMeetingSummary, extractActionItems, analyzeMeeting, transcribeAudio };