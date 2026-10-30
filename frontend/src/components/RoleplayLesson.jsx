import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, MicOff, Send, Loader2, RefreshCcw, Award, User, Bot, ArrowRight, ArrowLeft } from 'lucide-react';
import API_BASE_URL from '../config';

const MIN_REPLIES = 3; // the server needs at least this many learner messages before it will grade

const RoleplayLesson = ({ lesson, courseId, moduleIdx, lessonIdx, onComplete, onNext, onPrevious }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // --- FIX FOR RETRY BUG ---
  // The server keeps the conversation and the character's script. We only ask it to open a session.
  const initializeChat = async () => {
    setFeedback(null);
    setInput('');
    setError('');
    setSessionId(null);
    setStarting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/roleplay/start`, {
        course_id: courseId, module_idx: moduleIdx, lesson_idx: lessonIdx
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSessionId(res.data.session_id);
      setMessages(res.data.initial_message ? [{ role: 'assistant', content: res.data.initial_message }] : []);
    } catch (e) {
      setMessages([]);
      setError(e.response?.data?.error || 'Could not start the simulation. Please check your connection and try again.');
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    initializeChat();
  }, [lesson, courseId, moduleIdx, lessonIdx]);

  const learnerReplies = messages.filter(m => m.role === 'user').length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Web Speech API for Voice
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + " " + transcript : transcript));
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleMic = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else { recognitionRef.current?.start(); setIsListening(true); }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    const text = input;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/roleplay/chat`, {
        session_id: sessionId, message: text
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => [...prev, res.data]);
    } catch (e) {
      // the server did not keep this message, so take it back out and let the learner resend it
      setMessages(prev => prev.slice(0, -1));
      setInput(text);
      setError(e.response?.data?.error || 'That message did not go through. Please try again.');
    }
    finally { setLoading(false); }
  };

  const handleFinish = async () => {
    if (!sessionId) return;
    setAnalyzing(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/roleplay/feedback`, {
        session_id: sessionId
      }, { headers: { Authorization: `Bearer ${token}` } });
      // The score is set by the server. Nothing here can raise or change it.
      const result = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      setFeedback(result);
      if (result.passed && onComplete) onComplete(result.score);
    } catch (e) {
      setError(e.response?.data?.error || 'Grading failed. Please check your connection and try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // --- RENDER RESULTS ---
  if (feedback) {
    const isPassed = !!feedback.passed;

    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm animate-fade-in max-w-3xl mx-auto mt-8">
        <div className="text-center mb-8">
          <div className={`inline-block p-4 rounded-full mb-4 ${isPassed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            <Award size={48} />
          </div>
          <h2 className="text-3xl font-black text-gray-900">Performance Report</h2>
          <div className={`text-6xl font-black mt-4 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
            {feedback.score}/100
          </div>
          <p className="text-gray-500 mt-2 font-bold uppercase tracking-wide">{isPassed ? "Passed" : "Needs Improvement"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-green-50 p-6 rounded-xl border border-green-100">
            <h3 className="font-bold text-green-800 mb-3">Strengths</h3>
            <ul className="list-disc pl-5 space-y-2 text-green-700 text-sm">
              {feedback.strengths?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
            <h3 className="font-bold text-orange-800 mb-3">Improvements</h3>
            <ul className="list-disc pl-5 space-y-2 text-orange-700 text-sm">
              {feedback.improvements?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>

        <p className="text-gray-600 italic border-l-4 border-gray-300 pl-4 mb-8">"{feedback.summary}"</p>

        {/* --- NAVIGATION BUTTONS --- */}
        <div className="flex flex-col md:flex-row gap-4 border-t border-gray-100 pt-6">
          
          {/* Previous Button */}
          <button 
            onClick={onPrevious} 
            className="px-6 py-3 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18}/> Previous
          </button>

          {/* Retry Button */}
          <button 
            onClick={initializeChat} 
            className="flex-1 py-3 border-2 border-gray-900 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18}/> Retry Simulation
          </button>
          
          {/* Next Button - ALWAYS VISIBLE & ENABLED */}
          <button 
            onClick={onNext}
            className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition flex items-center justify-center gap-2 shadow-lg"
          >
            Next Lesson <ArrowRight size={18}/>
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER CHAT ---
  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-4xl mx-auto">
      <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1"><Bot size={14}/> AI Roleplay</span>
          <h3 className="font-bold text-gray-900">Scenario: {lesson.scenario_title}</h3>
        </div>
        <button onClick={handleFinish} disabled={learnerReplies < MIN_REPLIES || analyzing || !sessionId} title={learnerReplies < MIN_REPLIES ? `Send at least ${MIN_REPLIES} replies first` : ''} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition disabled:opacity-50">
          {analyzing ? "Grading..." : "End & Evaluate"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
        {starting && <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-gray-400" /></div>}
        {!starting && !sessionId && error && (
          <div className="text-center py-10"><p className="text-sm text-red-600 mb-3">{error}</p>
            <button onClick={initializeChat} className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-black">Try again</button></div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-red-100 text-red-600'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><Bot size={14}/></div>
             <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none border border-gray-100">
                <Loader2 size={16} className="animate-spin text-gray-400" />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="relative flex items-center gap-3">
          <button onClick={toggleMic} className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-600 text-white animate-pulse shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder={isListening ? "Listening..." : "Type your response..."} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition" />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-50 shadow-md">
            <Send size={20} />
          </button>
        </div>
        {sessionId && error && <p className="text-center text-xs text-red-600 mt-2" role="alert">{error}</p>}
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Conversations are recorded for grading.{learnerReplies < MIN_REPLIES ? ` Send at least ${MIN_REPLIES} replies, then press End & Evaluate (${learnerReplies}/${MIN_REPLIES}).` : ''}
        </p>
      </div>
    </div>
  );
};

export default RoleplayLesson;