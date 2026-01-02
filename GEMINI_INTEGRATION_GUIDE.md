# How to Integrate Gemini AI into this Project

Currently, this project runs in a "Mockup Mode" which means it simulates AI responses. To connect it to real Google Gemini AI, you will need to add a backend integration.

## 1. Get a Gemini API Key
- Go to [Google AI Studio](https://aistudio.google.com/)
- Create a new API key

## 2. Update Backend (server/routes.ts)
Since this project uses Express on the backend, you would modify `server/routes.ts` to create an endpoint that calls Gemini.

**Prerequisites:**
`npm install @google/generative-ai`

**Example Code:**
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Add this route to your server
app.post("/api/chat", async (req, res) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});
  const chat = model.startChat({
    history: req.body.history, // Pass conversation history
  });

  const result = await chat.sendMessage(req.body.message);
  const response = await result.response;
  const text = response.text();
  
  res.json({ response: text });
});
```

## 3. Update Frontend (client/src/components/layout/AIChatbot.tsx)
Modify the `handleSend` function to call your new API instead of using the simulated timeout.

```typescript
const handleSend = async () => {
  // ... (keep input clearing logic)
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: input, history: messages })
  });
  
  const data = await response.json();
  // ... (update messages state with data.response)
}
```

## 4. Environment Variables
Add your API key to the secrets tool in Replit:
Key: `GEMINI_API_KEY`
Value: `your-api-key-here`

---
**Note:** This guide assumes you have permission to modify backend code. In the current prototype mode, these changes cannot be applied automatically.
