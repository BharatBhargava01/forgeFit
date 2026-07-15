import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, Loader2, HelpCircle, X, Trash2, MessageSquare } from 'lucide-react';

export default function AiChatPopup({ user, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey there! I'm your ForgeFit AI Coach. I'm ready to answer any questions about workouts, technique, nutrition, or custom goal planning. What's on your mind today? 💪"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Load chat history on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wg_ai_chat_history');
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch (e) {
          console.warn('Failed to parse cached chat history', e);
        }
      }
    }
  }, []);

  // Auto-scroll to bottom of chat when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem('wg_ai_chat_history', JSON.stringify(messages));
  }, [messages]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const chatHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch('/api/workouts/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          userProfile: user?.profile || null
        })
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.content
        }
      ]);
    } catch (err) {
      console.error(err);
      showToast('Could not reach your AI Coach. Verify API configuration.', 'error');
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Sorry, I ran into an issue communicating with my servers. Please make sure your `GEMINI_API_KEY` is configured correctly in the backend environment! 🛠️"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Immediate send for quick suggestion chips
  const handleSendPrompt = async (promptText) => {
    if (loading) return;
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: promptText
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const chatHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch('/api/workouts/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          userProfile: user?.profile || null
        })
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.content
        }
      ]);
    } catch (err) {
      console.error(err);
      showToast('Could not reach your AI Coach. Verify API configuration.', 'error');
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Sorry, I ran into an issue communicating with my servers. Please make sure your `GEMINI_API_KEY` is configured correctly in the backend environment! 🛠️"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear your conversation history?")) {
      const welcomeMsg = [
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hey there! I'm your ForgeFit AI Coach. I'm ready to answer any questions about workouts, technique, nutrition, or custom goal planning. What's on your mind today? 💪"
        }
      ];
      setMessages(welcomeMsg);
      localStorage.setItem('wg_ai_chat_history', JSON.stringify(welcomeMsg));
      showToast('Chat history cleared', 'info');
    }
  };

  const suggestedPrompts = [
    "What splits are best for 4 training days?",
    "How to improve barbell bench form?",
    "Tell me high protein vegetarian ideas",
    "Is progressive overload needed for core?",
    "How to recover from hamstring soreness?"
  ];

  return (
    <>
      {/* Floating Action Button (FAB) Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-accent-indigo to-accent-purple text-white shadow-xl shadow-accent-purple/25 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-accent-purple/40"
          title="Open AI Fitness Coach"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-white" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-cyan"></span>
            </span>
          </div>
        </button>
      )}

      {/* Chat Popup Widget */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[550px] max-h-[calc(100vh-100px)] bg-bg-card rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col animate-slide-up">
          
          {/* Header Panel */}
          <div className="px-5 py-4 border-b border-white/10 bg-bg-card flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5 fill-white/20 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-heading font-black text-sm text-text-primary tracking-tight leading-none">
                  AI Fitness Coach
                </h3>
                <span className="text-[10px] text-text-secondary font-bold tracking-wide mt-1 block">
                  Active Assistant • Gemini
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* Clear History Button */}
              {messages.length > 1 && (
                <button
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-accent-rose hover:bg-accent-rose/10 transition-colors cursor-pointer"
                  title="Clear Chat History"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card-light transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          </div>

          {/* Scrollable messages container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-bg-dark/50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 max-w-[85%] ${
                    isUser ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      isUser
                        ? 'bg-accent-indigo bg-gradient-to-br from-accent-indigo to-accent-purple text-white font-extrabold text-xs'
                        : 'bg-bg-card border border-white/10 text-accent-indigo'
                    }`}
                  >
                    {isUser ? (
                      user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 fill-accent-indigo/10" />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-text-secondary px-1 uppercase tracking-wide block">
                      {isUser ? (user?.name ? user.name.split(' ')[0] : 'You') : 'AI Coach'}
                    </span>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap font-medium text-left ${
                        isUser
                          ? 'bg-accent-indigo bg-gradient-to-br from-accent-indigo to-accent-purple text-white rounded-tr-none shadow-sm'
                          : 'bg-bg-card border border-white/10 text-text-primary rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Generation Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-2.5 max-w-[80%] mr-auto text-left">
                <div className="w-8 h-8 rounded-full bg-bg-card border border-white/10 text-accent-indigo flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 fill-accent-indigo/10" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-text-secondary px-1 uppercase tracking-wide block">
                    AI Coach
                  </span>
                  <div className="px-4 py-2.5 rounded-2xl rounded-tl-none bg-bg-card border border-white/10 text-text-secondary text-xs flex items-center gap-1.5 shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-indigo" />
                    <span className="font-semibold text-xs">Coach is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom input area */}
          <div className="border-t border-white/10 bg-bg-card p-3 shrink-0">
            {/* Quick Suggestion Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 px-1 scrollbar-hide snap-x">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(prompt)}
                  disabled={loading}
                  className="snap-center shrink-0 px-3 py-1.5 rounded-full bg-bg-dark/50 hover:bg-accent-indigo/10 hover:text-accent-indigo border border-white/10 hover:border-accent-indigo/30 text-[10px] font-bold text-text-secondary transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message input form */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                placeholder="Ask coach: 'Suggest PPL split'..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
                className="flex-grow px-4 py-2.5 rounded-xl bg-bg-dark/50 border border-white/10 text-xs font-semibold outline-none text-text-primary focus:border-accent-purple focus:bg-bg-card transition-all disabled:opacity-75"
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="w-9 h-9 rounded-xl bg-accent-indigo bg-gradient-to-br from-accent-indigo to-accent-purple hover:opacity-90 text-white flex items-center justify-center transition-all shadow cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
