import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageCircleQuestion } from 'lucide-react';

const AnimalHealthChatbot = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInitialPopup, setShowInitialPopup] = useState(true);
  const chatEndRef = useRef(null);

  // Initialize Gemini AI
  const apikey2 = import.meta.env.VITE_API_KEY_GEMINI_2;
  const genAI = new GoogleGenerativeAI(apikey2);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Initial welcome message
  useEffect(() => {
    setChatMessages([
      { 
        role: 'assistant', 
        text: "Hi! I'm your Animal Health Assistant. Ask about animal care." 
      }
    ]);

    // Auto-hide initial popup after 5 seconds
    const popupTimer = setTimeout(() => {
      setShowInitialPopup(false);
    }, 5000);

    return () => clearTimeout(popupTimer);
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessages = [...chatMessages, { role: 'user', text: userInput }];
    setChatMessages(newMessages);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await model.generateContent(
        `Provide a very concise (max 3 lines) professional veterinary response to: ${userInput}`
      );
      const response = await result.response.text();
      
      setChatMessages(prev => [
        ...prev, 
        { role: 'assistant', text: response }
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setError("Sorry, I'm having trouble connecting right now. Please try again.");
      
      setChatMessages(prev => [
        ...prev, 
        { role: 'assistant', text: "Sorry, I'm having trouble connecting right now. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Initial Popup */}
      <AnimatePresence>
        {showInitialPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4"
          >
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-3xl">🩺</span>
              <h3 className="text-lg font-semibold text-[#5A4035]">Welcome to PawVaidya!</h3>
            </div>
            <p className="text-zinc-600 mb-4">
              I'm your AI veterinary assistant. I can help you with quick animal health queries and provide professional advice.
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowInitialPopup(false)}
                className="bg-[#5A4035] text-white px-4 py-2 rounded-full"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chatbot Launcher */}
      <motion.div 
        className="w-14 h-14 border-2 border-[#5A4032] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer"
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <img src="https://i.ibb.co/0jC6VMm0/PV-removebg-preview.png" alt="" />
        <div className="w-8 h-8" />
      </motion.div>

      <AnimatePresence>
        {isChatbotOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col"
          >
            {/* Chat Header */}
            <div className="bg-[#5A4035] text-white p-4 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-lg font-semibold">Animal Health Assistant(PawVaidya)</h2>
              <motion.button 
                onClick={() => setIsChatbotOpen(false)}
                whileHover={{ rotate: 90 }}
                className="focus:outline-none"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 max-h-[400px]">
              <AnimatePresence>
                {chatMessages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center ${
                      msg.role === 'user' 
                        ? 'justify-end' 
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl max-w-[80%] flex items-center space-x-2 ${
                        msg.role === 'user' 
                          ? 'bg-[#F2E4C6] text-[#5A4035] ml-auto' 
                          : 'bg-[#F2E4C6] text-zinc-600'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <span className="text-xl mr-2">🩺</span>
                      )}
                      <span>{msg.text}</span>
                      {msg.role === 'user' && (
                        <span className="text-xl ml-2">👤</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 p-3 rounded-2xl flex items-center">
                    <span className="text-xl mr-2">🩺</span>
                    Typing...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Areas */}
            <div className="p-4 border-t border-gray-200 flex items-center space-x-2">
              <input 
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about animal health..."
                className="flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5A4035]"
              />
              <motion.button 
                onClick={handleSendMessage}
                disabled={!userInput.trim()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-[#5A4035] text-white p-2 rounded-full disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimalHealthChatbot;