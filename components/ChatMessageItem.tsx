import React from 'react';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import TypewriterEffect from './TypewriterEffect';

interface ChatMessageItemProps {
  message: ChatMessage;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[90%] md:max-w-[80%] rounded-lg p-4 border ${
          isUser 
            ? 'bg-hacker-gray border-hacker-green-dim text-white' 
            : 'bg-black border border-hacker-green/30 text-hacker-text shadow-[0_0_15px_rgba(0,255,65,0.1)]'
        }`}
      >
        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
            <i className={`fa ${isUser ? 'fa-user-secret' : 'fa-robot'} ${isUser ? 'text-gray-400' : 'text-hacker-green'}`}></i>
            <span className="text-xs font-mono uppercase tracking-widest font-bold">
                {isUser ? 'Operator' : 'Rafael IAs Core'}
            </span>
            <span className="text-[10px] text-gray-500 ml-auto font-mono">
                {new Date(message.timestamp).toLocaleTimeString()}
            </span>
        </div>

        {/* Image Preview for User Messages */}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {message.images.map((img, idx) => (
              <img 
                key={idx} 
                src={`data:${img.mimeType};base64,${img.data}`} 
                alt={img.name} 
                className="h-20 w-auto object-cover rounded border border-gray-700 hover:border-hacker-green transition-colors"
              />
            ))}
          </div>
        )}

        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 max-w-none font-sans text-sm md:text-base">
          {isUser ? (
             <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            // Simple render for AI to handle code blocks correctly via markdown
            // Not using typewriter for long code blocks to preserve formatting instantly
             <ReactMarkdown 
                components={{
                    code({node, inline, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline ? (
                            <div className="relative group my-4">
                                <div className="absolute -top-3 left-2 px-2 py-0.5 bg-hacker-green text-black text-[10px] font-bold font-mono rounded uppercase">
                                    {match ? match[1] : 'code'}
                                </div>
                                <pre className="bg-[#050505] p-4 rounded border border-hacker-green/20 overflow-x-auto">
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                </pre>
                            </div>
                        ) : (
                            <code className="bg-gray-800 px-1 py-0.5 rounded text-hacker-green font-mono text-sm" {...props}>
                                {children}
                            </code>
                        )
                    }
                }}
             >
                {message.content}
             </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageItem;