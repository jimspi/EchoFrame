export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { transcript } = req.body;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
          content: "You are an expert meeting analyst AI that turns raw meeting transcripts into structured, actionable briefings.\n\nYour job is to:\n1. Extract the **main objective** of the meeting (1 sentence max).\n2. List **key decisions made** in bullet points.\n3. List **specific action items**, each with: a short description, the assigned person (if any), and a deadline (if mentioned or implied).\n4. Highlight any **open questions** that were not resolved.\n5. Generate a **next steps chec...
        },
        {
          role: "user",
          content: transcript
        }
      ]
    })
  });

  const data = await response.json();
  const summary = data.choices[0].message.content;

  res.status(200).json({ summary });
}
