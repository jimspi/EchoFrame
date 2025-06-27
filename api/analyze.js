module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ summary: 'Only POST requests are allowed.' });
  }

  const { transcript } = req.body;

  try {
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
      content: `You are an expert meeting analyst AI that turns raw meeting transcripts into structured, actionable briefings.

Your job is to:
1. Extract the **main objective** of the meeting (1 sentence max).
2. List **key decisions made** in bullet points.
3. List **specific action items**, each with: a short description, the assigned person (if any), and a deadline (if mentioned or implied).
4. Highlight any **open questions** that were not resolved.
5. Generate a **next steps checklist** for the team to follow up on.

Be direct, efficient, and use bullet points. Do not include unnecessary commentary or summaries.`
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

    res.status(200).json({ summary });

  } catch (error) {
    res.status(500).json({ summary: "Server error: " + error.message });
  }
}


