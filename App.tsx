import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ImageAttachment } from './types';
import { generateCodeResponseStream } from './services/geminiService';
import ChatMessageItem from './components/ChatMessageItem';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('Português');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: '# SYSTEM ONLINE\n\nWelcome to **Rafael IAs Private Architect**. \n\nI am ready to generate high-performance, secure code modules. Upload architecture diagrams or screenshots (max 4) for visual reconstruction.',
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ImageAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (selectedImages.length + files.length > 4) {
        alert("Maximum 4 images allowed.");
        return;
      }

      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Extract base64 data without prefix
          const base64Data = base64String.split(',')[1];
          
          setSelectedImages(prev => [
            ...prev, 
            {
              name: file.name,
              mimeType: file.type,
              data: base64Data
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return;

    const currentInput = input;
    const currentImages = [...selectedImages];
    const currentLanguage = language;
    
    // Clear inputs immediately
    setInput('');
    setSelectedImages([]);

    const userMsgId = `user-${Date.now()}`;
    const newMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: currentInput,
      images: currentImages,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    // Create placeholder for AI response
    const responseId = `ai-${Date.now()}`;
    const placeholderMessage: ChatMessage = {
        id: responseId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
    };
    setMessages(prev => [...prev, placeholderMessage]);

    // Timeout protection
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out. Server is busy.")), 15000)
    );

    try {
      const streamPromise = (async () => {
          const stream = generateCodeResponseStream(currentInput, currentImages, currentLanguage);
          let fullContent = '';
          let hasStarted = false;

          for await (const chunk of stream) {
            hasStarted = true;
            fullContent += chunk;
            setMessages(prev => prev.map(msg => 
                msg.id === responseId 
                    ? { ...msg, content: fullContent } 
                    : msg
            ));
          }
          
          if (!fullContent && hasStarted) {
             throw new Error("Empty response received from model.");
          }
          return fullContent;
      })();

      // Race between the stream and a timeout
      await Promise.race([streamPromise, timeoutPromise]);

    } catch (error: any) {
      setMessages(prev => prev.map(msg => 
        msg.id === responseId 
            ? { ...msg, content: `**SYSTEM ERROR**: ${error.message || 'Connection failed'}`, isError: true } 
            : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-hacker-black text-hacker-text font-sans selection:bg-hacker-green selection:text-black overflow-hidden">
      
      {/* Header */}
      <header className="flex-none border-b border-hacker-green/20 bg-hacker-dark p-4 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded border border-hacker-green flex items-center justify-center glow-border">
             <i className="fas fa-terminal text-hacker-green text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white font-mono hidden md:block">
              RAFAEL<span className="text-hacker-green">_IAs</span>
            </h1>
             <h1 className="text-lg font-bold tracking-wider text-white font-mono md:hidden">
              R<span className="text-hacker-green">_IA</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] glow-text">
              Private Security Architect
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
            
            {/* X-ROBO Translator */}
            <div className="flex items-center gap-2 border border-hacker-green/30 bg-black px-2 py-1 rounded hover:border-hacker-green transition-colors">
                <i className="fas fa-language text-hacker-green text-xs animate-pulse"></i>
                <span className="hidden md:inline text-[10px] font-bold text-gray-500 mr-1">X-ROBO</span>
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-transparent text-xs text-hacker-text font-mono focus:outline-none uppercase cursor-pointer w-20 md:w-auto"
                >
                    <option value="Português">PT-BR</option>
                    <option value="English">EN-US</option>
                    <option value="Español">ES</option>
                    <option value="Français">FR</option>
                    <option value="Deutsch">DE</option>
                    <option value="Italiano">IT</option>
                    <option value="Русский">RU</option>
                    <option value="中文">ZH</option>
                    <option value="日本語">JA</option>
                    <option value="한국어">KO</option>
                </select>
            </div>

            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-black rounded border border-gray-800">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-hacker-green'} animate-pulse`}></div>
                <span className="text-xs font-mono text-hacker-green">{isLoading ? 'PROCESSING...' : 'ACTIVE'}</span>
            </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
            {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} />
            ))}
            
            {isLoading && (
                 <div className="flex w-full mb-6 justify-start">
                    <div className="rounded-lg p-4 border bg-black border-hacker-green/30">
                        <div className="flex items-center gap-2 text-hacker-green font-mono text-sm">
                            <i className="fas fa-bolt text-hacker-green animate-pulse"></i>
                            <span>X-ROBO: TRANSLATING_AND_GENERATING...</span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={chatEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 md:p-6 bg-hacker-dark border-t border-hacker-green/20">
        <div className="max-w-4xl mx-auto">
            
            {/* Image Preview Bar */}
            {selectedImages.length > 0 && (
                <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
                    {selectedImages.map((img, idx) => (
                        <div key={idx} className="relative group shrink-0">
                            <img 
                                src={`data:${img.mimeType};base64,${img.data}`} 
                                alt="preview" 
                                className="h-16 w-16 object-cover rounded border border-hacker-green/50" 
                            />
                            <button 
                                onClick={() => removeImage(idx)}
                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Controls */}
            <div className="relative flex items-end gap-3 bg-black border border-gray-700 rounded-xl p-3 shadow-lg focus-within:border-hacker-green focus-within:ring-1 focus-within:ring-hacker-green/50 transition-all">
                
                {/* File Upload */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-hacker-green transition-colors mb-1"
                    title="Upload Schema/Image (Max 4)"
                    disabled={isLoading}
                >
                    <i className="fas fa-image text-xl"></i>
                </button>
                <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />

                {/* Text Area */}
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Enter command (Target: ${language})...`}
                    className="w-full bg-transparent text-gray-200 placeholder-gray-600 focus:outline-none resize-none max-h-40 min-h-[50px] py-2 font-mono text-sm leading-relaxed"
                    rows={1}
                    disabled={isLoading}
                    style={{ height: 'auto', minHeight: '24px' }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                />

                {/* Send Button */}
                <button 
                    onClick={() => handleSubmit()}
                    disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
                    className="mb-1 p-2 bg-hacker-green text-black rounded-lg hover:bg-hacker-green-dim hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                    <i className="fas fa-paper-plane"></i>
                </button>
            </div>
            
            <div className="mt-2 text-center">
                <p className="text-[10px] text-gray-600 font-mono">
                    AIDE CMODS | PRIVATE BUILD | RAFAEL_IAS | X-ROBO v2.0
                </p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;