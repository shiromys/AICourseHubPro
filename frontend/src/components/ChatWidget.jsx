import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import API_BASE_URL from '../config';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      text: 'Hi! 👋 I am Nova. Ask me about courses, certificates, or refunds!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/chat`, { message: userMsg.text });
      const botMsg = { role: 'bot', text: res.data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: "I'm having trouble connecting right now. Please email info@aicoursehubpro.com.",
        isError: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Custom Animation Style */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="mb-4 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in-up">
          
          <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <span className="font-bold block text-sm">Nova AI Support</span>
                <span className="text-[10px] text-gray-400">Powered by OpenAI</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-red-500 transition">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-red-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}
                >
                  {/* Markdown Renderer for Professional Formatting */}
                  <ReactMarkdown 
                    components={{
                      ul: ({node, ...props}) => <ul style={{listStyleType: 'disc', paddingLeft: '20px', marginBottom: '10px'}} {...props} />,
                      ol: ({node, ...props}) => <ol style={{listStyleType: 'decimal', paddingLeft: '20px', marginBottom: '10px'}} {...props} />,
                      li: ({node, ...props}) => <li style={{marginBottom: '5px'}} {...props} />,
                      strong: ({node, ...props}) => <span style={{fontWeight: 'bold', color: msg.role === 'bot' ? '#dc2626' : 'inherit'}} {...props} />,
                      p: ({node, ...props}) => <p style={{marginBottom: '8px'}} {...props} />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-xl rounded-bl-none border border-gray-200 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-red-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
              className="flex-1 bg-gray-100 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition shadow-md"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* TOGGLE BUTTON WITH FLOATING ANIMATION */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xl flex items-center justify-center border-2 border-white animate-float"
        >
          <MessageSquare size={28} className="fill-current" />
        </button>
      )}
    </div>
  );
};

export default ChatWidget;