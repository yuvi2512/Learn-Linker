import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, topic } = req.body;

  if (!subject || !topic) {
    return res.status(400).json({ error: 'Subject and topic are required' });
  }

  try {
    const response = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        model: 'command', // Cohere's text generation model
        prompt: `Generate structured NCERT-based notes for ${subject} on ${topic}. Format them with proper headings and bullet points.`,
        max_tokens: 5000, // Limit the response length
        temperature: 0.7, // Control creativity
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`, // Add your Cohere API key
          'Content-Type': 'application/json',
        },
      }
    );

    const generatedNotes = response.data.generations[0].text;
    return res.status(200).json({ notes: generatedNotes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to generate notes. Please try again.' });
  }
}