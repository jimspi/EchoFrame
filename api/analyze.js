export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ summary: 'Only POST requests are allowed.' });
  }

  const { transcript } = req.body;

  try {
    // 1. Get summary from OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert meeting analyst AI that turns raw meeting transcripts into structured, actionable briefings.\\n\\nYour job is to:\\n1. Extract the **main objective** of the meeting (1 sentence max).\\n2. List **key decisions made** in bullet points.\\n3. List **specific action items**, each with: a short description, the assigned person (if any), and a deadline (if mentioned or implied).\\n4. Highlight any **open questions** that were not resolved.\\n5. Generate a **next steps chec...
          },
          {
            role: "user",
            content: transcript
          }
        ]
      })
    });

    const data = await openaiResponse.json();
    const summary = data.choices?.[0]?.message?.content || "No summary generated.";

    // 2. Save to Airtable
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    const airtableToken = process.env.AIRTABLE_TOKEN;
    const tableName = "Transcripts";

    await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${tableName}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${airtableToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          Transcript: transcript,
          Summary: summary
        }
      })
    });

    // 3. Send back the summary
    res.status(200).json({ summary });

  } catch (error) {
    res.status(500).json({ summary: "Server error: " + error.message });
  }
}

