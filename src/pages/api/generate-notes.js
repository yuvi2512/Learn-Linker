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
    let generatedNotes = "";
    let continuationPrompt = ""; // Used to extend the response in subsequent calls

    for (let i = 0; i < 2; i++) { // Loop to generate multiple sections
      const response = await axios.post(
        'https://api.cohere.ai/v1/generate',
        {
          model: 'command',
          prompt: `Generate structured NCERT-based detailed notes for ${subject} on ${topic}, with proper headings and bullet points. ${
            continuationPrompt ? `Continue from where the previous content left off: ${continuationPrompt}` : ""
          }`,
          max_tokens: 1024, // Reasonable token limit per request
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(response?.data?.generations)
      const newText = response.data.generations[0].text;
      generatedNotes += newText + "\n\n";
      continuationPrompt = newText.slice(-100); // Use the last part of the text to guide the next request
    }

    return res.status(200).json({ notes: generatedNotes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to generate notes. Please try again.' });
  }
}
