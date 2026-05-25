import React, { useState } from "react";
import { Bot, Send, Sparkles, User as UserIcon } from "lucide-react";

export default function AiAssistant() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "ai",
      text: "Halo! Saya adalah Asisten AI Gemini yang terintegrasi dengan sistem ERP ini. Saya bisa membantu Anda menganalisa data karyawan, merangkum cuti, atau mencari informasi dari arsip dokumen. Apa yang ingin Anda ketahui hari ini?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      text: inputValue,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: "Ini adalah jawaban dari Asisten AI menggunakan dummy data. Saat ini saya masih dalam pengembangan untuk dihubungkan penuh ke database. Terima kasih atas pertanyaan Anda!",
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#FAFAFA] border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200 text-blue-600 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg leading-tight">Gemini Assistant</h2>
            <p className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online &amp; Siap Membantu</span>
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-end space-x-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${msg.role === "user" ? "bg-white border-slate-200 text-slate-400" : "bg-gradient-to-br from-blue-500 to-indigo-600 border-indigo-700 text-white"}`}>
                {msg.role === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-br-sm" 
                  : "bg-white text-slate-700 border border-slate-200 rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2 max-w-[80%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 border-indigo-700 text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 rounded-bl-sm shadow-sm flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tanyakan sesuatu pada asisten AI..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-semibold uppercase tracking-wider">Asisten AI dapat membuat kesalahan. Harap periksa kembali informasi penting.</p>
      </div>
    </div>
  );
}
