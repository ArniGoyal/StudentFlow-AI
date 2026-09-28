import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5001;
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");

const DEPARTMENTS = [
  "Counselling & Wellbeing",
  "Academic Support",
  "Student Finance",
  "Hostel & Accommodation",
  "Career Services",
  "Health Services",
  "IT & Digital Support",
  "Student Affairs",
  "International Student Support",
  "Disability Services",
  "Library Services",
  "Registrar's Office"
];

app.post('/api/analyze', async (req, res) => {
  try {
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.status(500).json({ error: "Missing Gemini API Key. Please add it to backend/.env" });
    }
    const { text } = req.body;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
    You are an intelligent triage system for a university. 
    A student has stated the following problem: "${text}"
    
    Analyze the problem and identify which of the following 12 departments are relevant to solving it.
    Departments: ${DEPARTMENTS.join(", ")}
    
    Also, summarize the core issue in one sentence, identify the urgency (Low, Moderate, High), and explain briefly why you selected those departments.
    
    Return ONLY a valid JSON object with the following schema:
    {
      "departments": ["Dept 1", "Dept 2"],
      "summary": "Short summary of the issue",
      "urgency": "Moderate",
      "explanation": "Brief explanation of why these departments were chosen"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonText = response.text().trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '');
    }
    
    const parsedData = JSON.parse(jsonText);
    res.json(parsedData);
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze concern" });
  }
});

app.post('/api/self-help', async (req, res) => {
  try {
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.status(500).json({ error: "Missing Gemini API Key. Please add it to backend/.env" });
    }
    const { issue, departments } = req.body;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
    A university student is experiencing the following issue: "${issue}".
    They are being routed to: ${departments.join(', ')}.
    
    Generate 3 highly specific, actionable, and safe self-help tips or resources they can use right now while they wait to speak to a counsellor or staff. Do NOT give medical advice.
    
    Return ONLY a valid JSON array of objects with the schema:
    [
      {
        "title": "Tip title",
        "type": "Resource category (e.g. Exercise, Tool, Article)",
        "description": "Short explanation of what to do"
      }
    ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonText = response.text().trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '');
    }
    
    const parsedData = JSON.parse(jsonText);
    res.json(parsedData);
  } catch (error) {
    console.error("Self Help Error:", error);
    res.status(500).json({ error: "Failed to fetch self help" });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
