import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subject, topic } = req.body;

  if (!subject || !topic || !subject.trim() || !topic.trim()) {
    return res.status(400).json({ error: "Subject and topic are required" });
  }

  try {
    let generatedNotes = "";
    let continuationPrompt = "";

   
    for (let i = 0; i < 2; i++) {
      const continuationText = continuationPrompt.trim()
        ? ` Continue from where the previous content left off: ${continuationPrompt.trim()}`
        : "";

      const userMessage = `Generate structured NCERT-based detailed notes for "${subject}" on "${topic}"${continuationText}, with proper headings and bullet points.`;

      if (!userMessage.trim()) break;


      const response = await axios.post(
        "https://api.cohere.ai/v1/chat",
        {
          model: "command-a-03-2025",  
          message:userMessage,
          max_tokens: 1024,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

    const newText = response?.data?.text || "";
      if (!newText.trim()) break;

      generatedNotes += newText + "\n\n";

      
      continuationPrompt = newText.slice(-500);
    }

    if (!generatedNotes.trim()) {
      return res.status(500).json({ error: "Failed to generate notes. No content returned." });
    }

    return res.status(200).json({ notes: generatedNotes });
  } catch (error) {
    console.error("Error generating notes:", error?.response?.data || error.message || error);
    return res.status(500).json({ error: "Failed to generate notes. Please try again." });
  }
}
