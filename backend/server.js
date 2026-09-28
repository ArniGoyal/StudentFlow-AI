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

// IN-MEMORY DATABASE
let appointmentRequests = [];
let nextRequestId = 1043;

app.post('/api/analyze', async (req, res) => {
  try {
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.status(500).json({ error: "Missing Gemini API Key. Please add it to backend/.env" });
    }
    const { text } = req.body;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
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

// STUDENT ENDPOINTS
app.post('/api/requests', (req, res) => {
  const { student, departments, priorities } = req.body;
  const newRequest = {
    id: `SF-${nextRequestId++}`,
    student,
    departments,
    priorities, // { deptName: [ {slotId, slotData, counsellorName, status: 'pending'|'rejected'|'accepted'} ] }
    status: 'pending' // 'pending' | 'matched' | 'fixed'
  };
  
  // Initialize slot statuses
  for (const dept in newRequest.priorities) {
    newRequest.priorities[dept] = newRequest.priorities[dept].map(p => ({...p, status: 'pending'}));
  }
  
  appointmentRequests.push(newRequest);
  res.json(newRequest);
});

app.get('/api/requests/:id', (req, res) => {
  const request = appointmentRequests.find(r => r.id === req.params.id);
  if (request) {
    res.json(request);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// COUNSELLOR ENDPOINTS
app.get('/api/counsellor/requests', (req, res) => {
  res.json(appointmentRequests);
});

app.post('/api/counsellor/requests/:id/decide', (req, res) => {
  const { dept, slotId, decision } = req.body; // decision: 'accepted' | 'rejected'
  const request = appointmentRequests.find(r => r.id === req.params.id);
  
  if (!request) return res.status(404).json({ error: "Not found" });

  const deptPriorities = request.priorities[dept];
  const slotIndex = deptPriorities.findIndex(s => s.slotId === slotId);
  
  if (slotIndex > -1) {
    deptPriorities[slotIndex].status = decision;
    
    // Check if any slot in any dept is accepted, or if all are rejected
    // For simplicity, we assume if a counsellor accepts a slot, the dept is fixed.
    // If all selected depts have at least 1 accepted slot, the whole request is 'fixed'.
    const deptsStatus = request.departments.map(d => {
      const slots = request.priorities[d] || [];
      return slots.some(s => s.status === 'accepted') ? 'fixed' : 'pending';
    });
    
    if (deptsStatus.every(s => s === 'fixed')) {
      request.status = 'fixed';
    } else {
      request.status = 'matched'; // partially handled
    }
    
    res.json(request);
  } else {
    res.status(400).json({ error: "Slot not found" });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
