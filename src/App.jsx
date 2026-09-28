import React, { useState, useEffect, useRef } from 'react';
import { 
  History, Bell, Send, Mic, MicOff,
  ChevronRight, Activity, Calendar, Clock, CheckCircle2, 
  AlertCircle, BookOpen, Wind, Coffee,
  X, Check
} from 'lucide-react';
import { CURRENT_STUDENT, PAST_SESSIONS, DEPARTMENTS, SELF_HELP_RESOURCES, getCounsellorsForDept, generateAvailability } from './data';

const getIcon = (iconName) => {
  const icons = { Wind, AlertCircle, Coffee, Activity: Activity };
  const IconCmp = icons[iconName] || BookOpen;
  return <IconCmp className="w-5 h-5" />;
};

export default function App() {
  const [chatState, setChatState] = useState('initial'); 
  // 'initial' | 'processing' | 'approval' | 'scheduling' | 'scheduled'
  
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hi ${CURRENT_STUDENT.name.split(' ')[0]} 👋 I'm here to help you find the right university support. Describe what's bothering you or use the microphone to speak.`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [scheduleData, setScheduleData] = useState({}); 
  const [priorities, setPriorities] = useState({}); // { deptName: [slot1, slot2, slot3] }
  const [showHistoryModal, setShowHistoryModal] = useState(null);
  
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatState, aiAnalysis, selectedDepts]);

  const handleVoiceNote = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setInputValue("I have been feeling very overwhelmed lately because of my studies. I am unable to concentrate, my attendance is dropping, and I don't know who I should talk to.");
    }, 3000);
  };

  const fetchAnalysis = async (text) => {
    try {
      const res = await fetch('http://localhost:5001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if(!res.ok) throw new Error("API Error");
      const data = await res.json();
      setAiAnalysis(data);
      setSelectedDepts(data.departments || []);
      setChatState('approval');
    } catch (err) {
      console.error(err);
      // Fallback if backend fails
      setAiAnalysis({
        departments: ["Counselling & Wellbeing", "Academic Support"],
        summary: "Student is experiencing academic stress and needs wellbeing support.",
        urgency: "Moderate",
        explanation: "Fallback due to backend error."
      });
      setSelectedDepts(["Counselling & Wellbeing", "Academic Support"]);
      setChatState('approval');
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userText = inputValue;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputValue('');
    
    setChatState('processing');
    fetchAnalysis(userText);
  };

  const toggleDept = (dept) => {
    if(selectedDepts.includes(dept)) {
      setSelectedDepts(selectedDepts.filter(d => d !== dept));
    } else {
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  const handleApproveDepts = () => {
    if(selectedDepts.length === 0) return;
    
    // Prepare calendar data
    const schedule = {};
    selectedDepts.forEach(dept => {
      const counsellors = getCounsellorsForDept(dept);
      schedule[dept] = counsellors.map(c => ({
        ...c,
        slots: generateAvailability(c)
      }));
    });
    setScheduleData(schedule);
    
    setChatState('scheduling');
    setMessages(prev => [...prev, 
      { sender: 'ai', text: `Got it. I've found available counsellors for ${selectedDepts.join(' and ')}. Please select up to 3 preferred time slots per department so we can confirm the earliest match.` }
    ]);
  };

  const togglePrioritySlot = (dept, slotData, counsellorName) => {
    const current = priorities[dept] || [];
    const slotId = slotData.id;
    const exists = current.find(s => s.slotId === slotId);
    
    if(exists) {
      setPriorities({ ...priorities, [dept]: current.filter(s => s.slotId !== slotId) });
    } else {
      if(current.length >= 3) return; // Max 3
      setPriorities({ ...priorities, [dept]: [...current, { slotId, slotData, counsellorName }] });
    }
  };

  const submitFinalRequest = () => {
    // Validate if at least one slot selected for each dept
    const isValid = selectedDepts.every(dept => priorities[dept] && priorities[dept].length > 0);
    if(!isValid) {
      alert("Please select at least 1 time slot for each requested department.");
      return;
    }
    
    setChatState('scheduled');
    setMessages(prev => [...prev, 
      { sender: 'ai', text: "Your request (Case #SF-1043) has been officially submitted and an appointment has been fixed. I've gathered some targeted self-help resources for you in the right panel." }
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-navy-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-brand-600 p-1.5 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-navy-900 tracking-tight">StudentFlow <span className="text-brand-600">AI</span></span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-navy-400 hover:text-navy-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-brand-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-navy-100">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-navy-900">{CURRENT_STUDENT.name}</div>
                <div className="text-xs text-navy-500">{CURRENT_STUDENT.id}</div>
              </div>
              <img src={CURRENT_STUDENT.avatar} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-white shadow-sm" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-navy-900 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">One conversation. The right support.</h1>
        </div>
      </div>

      <main className="flex-grow p-4 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 -mt-4">
        
        {/* Left Column: AI Support & Progress */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-navy-100 overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-4 border-b border-navy-50 bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-navy-900">Support Assistant</h2>
                  <p className="text-xs text-navy-500">AI-powered triage and routing</p>
                </div>
              </div>
            </div>

            <div className="flex-grow p-4 overflow-y-auto bg-slate-50 space-y-4 relative">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm animate-slide-up ${msg.sender === 'user' ? 'bg-navy-900 text-white rounded-br-none' : 'bg-white border border-navy-100 text-navy-800 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {chatState === 'processing' && (
                <div className="flex justify-start animate-slide-up">
                  <div className="bg-white border border-navy-100 text-navy-800 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-3">
                    <span className="text-sm font-medium text-navy-600 animate-pulse-subtle">Analyzing context...</span>
                  </div>
                </div>
              )}

              {/* State: Approval & Edit Departments */}
              {chatState === 'approval' && aiAnalysis && (
                <div className="flex justify-start animate-slide-up">
                  <div className="bg-white border border-brand-200 rounded-2xl rounded-bl-none shadow-sm w-full max-w-lg overflow-hidden">
                    <div className="p-4 border-b border-brand-100 bg-brand-50">
                      <h3 className="font-semibold text-brand-900">I have analyzed your request</h3>
                      <p className="text-xs text-brand-700 mt-1">Summary: {aiAnalysis.summary}</p>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-navy-800 mb-2">We recommend routing this to the following departments:</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {DEPARTMENTS.map(dept => {
                            const isSelected = selectedDepts.includes(dept);
                            const isRecommended = aiAnalysis.departments.includes(dept);
                            return (
                              <button 
                                key={dept} 
                                onClick={() => toggleDept(dept)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${isSelected ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-white text-navy-600 border-navy-200 hover:border-brand-300'}`}
                              >
                                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                                {dept}
                                {isRecommended && !isSelected && ' (Recommended)'}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-navy-500 bg-blue-50 p-2 rounded flex items-start gap-2">
                          <Activity className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span><b>AI Note:</b> {aiAnalysis.explanation} (Urgency: <span className="font-semibold">{aiAnalysis.urgency}</span>)</span>
                        </p>
                      </div>

                      <button onClick={handleApproveDepts} disabled={selectedDepts.length === 0} className="w-full bg-navy-900 text-white font-medium py-2.5 rounded-lg hover:bg-navy-800 transition disabled:opacity-50">
                        Confirm Departments
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* State: Multi-Department Calendar Scheduling */}
              {chatState === 'scheduling' && (
                <div className="flex justify-start animate-slide-up">
                  <div className="bg-white border border-navy-200 rounded-2xl rounded-bl-none shadow-sm w-full max-w-lg overflow-hidden">
                    <div className="p-4 border-b border-navy-50 flex items-center gap-2 bg-navy-50">
                      <Calendar className="w-4 h-4 text-navy-600" />
                      <span className="font-semibold text-navy-900">Select Availability (Up to 3 priorities)</span>
                    </div>
                    <div className="p-4 space-y-6">
                      
                      {selectedDepts.map(dept => (
                        <div key={dept} className="border border-navy-100 rounded-xl overflow-hidden">
                          <div className="bg-brand-50 px-3 py-2 border-b border-brand-100">
                            <h4 className="font-semibold text-brand-900 text-sm">{dept}</h4>
                            <p className="text-xs text-brand-700">{priorities[dept]?.length || 0}/3 slots selected</p>
                          </div>
                          
                          <div className="p-3 space-y-4">
                            {scheduleData[dept]?.map(counsellor => (
                              <div key={counsellor.id}>
                                <h5 className="text-xs font-medium text-navy-800 mb-2">{counsellor.name} ({counsellor.role})</h5>
                                <div className="flex flex-wrap gap-2">
                                  {counsellor.slots.map(slot => {
                                    const isSelected = priorities[dept]?.find(s => s.slotId === slot.id);
                                    let priorityIndex = -1;
                                    if(isSelected) priorityIndex = priorities[dept].findIndex(s => s.slotId === slot.id) + 1;
                                    
                                    return (
                                      <button 
                                        key={slot.id} 
                                        onClick={() => togglePrioritySlot(dept, slot, counsellor.name)}
                                        className={`text-xs px-2 py-1 rounded border transition-all ${isSelected ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-navy-600 border-navy-200 hover:border-brand-400'}`}
                                      >
                                        {isSelected && <span className="bg-white text-brand-600 w-3 h-3 inline-flex items-center justify-center rounded-full text-[8px] font-bold mr-1">{priorityIndex}</span>}
                                        {slot.day}, {slot.time}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button onClick={submitFinalRequest} className="w-full bg-brand-600 text-white font-medium py-3 rounded-lg shadow hover:bg-brand-700 transition">
                        Submit Official Request
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-navy-100">
              <div className="relative flex items-center">
                <button 
                  onClick={handleVoiceNote}
                  className={`absolute left-3 w-8 h-8 flex items-center justify-center rounded-full transition ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-navy-50 text-navy-500 hover:bg-navy-100'}`}
                >
                  {isRecording ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <input 
                  type="text" 
                  className="w-full pl-14 pr-12 py-3 bg-navy-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-navy-900 placeholder-navy-400"
                  placeholder={isRecording ? "Listening..." : "Type here or click the mic..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={chatState !== 'initial' && chatState !== 'scheduled'}
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className={`absolute right-3 w-8 h-8 flex items-center justify-center rounded-full transition ${inputValue.trim() ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-navy-100 text-navy-300'}`}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Progress Tracker (Hardcoded to Fixed state) */}
          {chatState === 'scheduled' && (
            <div className="bg-white rounded-xl shadow-sm border border-navy-100 p-5 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-navy-900">Application Tracker</h3>
                <span className="text-xs font-medium bg-navy-100 text-navy-700 px-2 py-1 rounded">Case #SF-1043</span>
              </div>
              
              <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-brand-500 -translate-y-1/2 rounded z-0 hidden md:block"></div>
                
                <div className="flex flex-col md:flex-row justify-between relative z-10 gap-4 md:gap-0">
                  <div className="flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                    <div><p className="text-sm font-semibold text-navy-900">Application Submitted</p></div>
                  </div>
                  <div className="flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                    <div><p className="text-sm font-semibold text-navy-900">AI Triage Complete</p></div>
                  </div>
                  <div className="flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                    <div><p className="text-sm font-semibold text-navy-900">Matched</p></div>
                  </div>
                  <div className="flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                    <div><p className="text-sm font-semibold text-navy-900">Appointment Fixed</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Previous Sessions (History) */}
          <div className="bg-white rounded-xl shadow-sm border border-navy-100 overflow-hidden">
            <div className="p-5 border-b border-navy-50 flex items-center gap-2">
              <History className="w-5 h-5 text-navy-500" />
              <h3 className="font-bold text-navy-900">Previous Sessions</h3>
            </div>
            <div className="divide-y divide-navy-50">
              {PAST_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setShowHistoryModal(session)} className="p-4 hover:bg-navy-50 transition cursor-pointer flex justify-between items-center group">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-navy-900">{session.department}</span>
                      <span className="text-[10px] font-medium bg-navy-100 text-navy-600 px-1.5 py-0.5 rounded">{session.outcome}</span>
                    </div>
                    <p className="text-xs text-navy-500 mb-1">{session.date} • with {session.counsellor}</p>
                    <p className="text-sm text-navy-700 truncate max-w-sm">{session.summary}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-navy-300 group-hover:text-brand-600 transition" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Self Help & Upcoming Appointments */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-navy-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-navy-900 to-navy-800 text-white">
              <h3 className="font-bold text-lg mb-1">Self-Help Resources</h3>
              <p className="text-navy-200 text-xs">Resources to help you right now.</p>
            </div>
            <div className="p-4 space-y-3">
              {SELF_HELP_RESOURCES.map(resource => (
                <div key={resource.id} className="border border-navy-100 rounded-xl p-3 hover:border-brand-300 hover:shadow-md transition cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center text-brand-600 group-hover:bg-brand-50 transition flex-shrink-0">
                      {getIcon(resource.icon)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy-900 text-sm mb-0.5 group-hover:text-brand-600 transition">{resource.title}</h4>
                      <p className="text-xs font-medium text-navy-400 mb-1">{resource.type}</p>
                      <p className="text-xs text-navy-600 line-clamp-2">{resource.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 bg-navy-50 rounded-lg border border-navy-100 text-[10px] text-navy-500 flex items-start gap-2">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <p>Not a substitute for professional/medical advice.</p>
              </div>
            </div>
          </div>

          {/* Upcoming Calendar Widget */}
          {chatState === 'scheduled' && (
            <div className="bg-white rounded-xl shadow-sm border border-navy-100 overflow-hidden animate-slide-up sticky top-24">
              <div className="p-5 border-b border-navy-50 flex items-center gap-2 bg-navy-50">
                <Calendar className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-navy-900">Upcoming Appointments</h3>
              </div>
              <div className="p-4 space-y-4">
                {selectedDepts.map((dept, index) => {
                  const selectedPriority = priorities[dept]?.[0];
                  if (!selectedPriority) return null;
                  return (
                    <div key={dept} className="flex gap-3 items-start border-l-2 border-brand-500 pl-3">
                      <div className="flex-grow">
                        <p className="text-xs font-semibold text-brand-700 uppercase">{selectedPriority.slotData.day}</p>
                        <p className="text-sm font-bold text-navy-900 mb-1">{selectedPriority.slotData.time}</p>
                        <p className="text-sm font-medium text-navy-800">{selectedPriority.counsellorName}</p>
                        <p className="text-xs text-navy-500">{dept}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* History Detail Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[100] bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-navy-100 flex justify-between items-center bg-navy-50">
              <h2 className="text-lg font-bold text-navy-900">Session Details</h2>
              <button onClick={() => setShowHistoryModal(null)} className="text-navy-400 hover:text-navy-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-navy-900">{showHistoryModal.department}</h3>
                  <p className="text-sm text-navy-600">{showHistoryModal.date} • {showHistoryModal.counsellor}</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold uppercase">{showHistoryModal.outcome}</span>
              </div>
              <div className="bg-navy-50 p-4 rounded-lg border border-navy-100 text-sm text-navy-800">
                <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider block mb-1">Issue Summary</span>
                {showHistoryModal.summary}
              </div>
              <div className="bg-brand-50 p-4 rounded-lg border border-brand-100 text-sm text-brand-900">
                <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider block mb-1">Counsellor Feedback & Notes</span>
                {showHistoryModal.feedback}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
