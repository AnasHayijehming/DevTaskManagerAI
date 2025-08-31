

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { RequirementChatMessage } from '../types';
import Mermaid from './Mermaid';

interface ChatInterfaceProps {
  history: RequirementChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => Promise<void>;
  isChatActive: boolean;
}

const markdownComponents = {
  code({node, inline, className, children, ...props}: any) {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match && match[1] === 'mermaid') {
      return <Mermaid chart={String(children).replace(/\n$/, '')} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, isLoading, onSendMessage, isChatActive }) => {
    const [userResponse, setUserResponse] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userResponse.trim()) return;
        
        const messageToSend = userResponse;
        setUserResponse('');
        await onSendMessage(messageToSend);
    };

    // Auto-scroll to the bottom of the chat on new messages or loading state change
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    return (
        <div className="p-2 border border-slate-200 rounded-lg bg-white flex flex-col justify-between flex-grow min-h-0">
            <div ref={chatContainerRef} className="overflow-y-auto space-y-4 p-3 flex-grow flex flex-col">
                {history.length === 0 && !isLoading && (
                    <div className="flex h-full min-h-[100px] items-center justify-center text-center text-slate-500 px-4">
                        <p className="text-sm">Click 'Clarify &amp; Generate Spec'. The AI will ask questions to refine your requirement before generating a spec.</p>
                    </div>
                )}
                {history.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const isSpecGenerated = msg.text.includes('**Specification Generated**');

                    if (isSpecGenerated) {
                        return (
                            <div key={index} className="text-center text-xs text-slate-500 py-2 my-2 border-t border-b border-slate-200 bg-slate-50">
                                Specification has been generated. You can now edit it or move to the next steps.
                            </div>
                        )
                    }

                    const messageBubbleClasses = isUser
                        ? 'bg-sky-500 text-white'
                        : msg.isError
                            ? 'bg-red-100 text-red-900 border border-red-200'
                            : 'bg-slate-100 text-slate-800';
                    
                    const messageBorderRadius = isUser 
                        ? 'rounded-t-xl rounded-bl-xl'
                        : 'rounded-t-xl rounded-br-xl'

                    return (
                        <div key={index} className={`flex flex-col max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
                            <div className={`px-3 py-2 shadow-sm text-sm w-fit ${messageBubbleClasses} ${messageBorderRadius}`}>
                                <div className="prose prose-sm max-w-none prose-p:my-0" style={{color: 'inherit'}}>
                                    <ReactMarkdown components={markdownComponents}>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {isLoading && (
                     <div className="flex flex-col max-w-[90%] self-start items-start">
                         <div className="px-3 py-2 rounded-t-xl rounded-br-xl text-sm bg-slate-100 text-slate-800">
                              <div className="flex items-center justify-center gap-1.5 h-5">
                                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                              </div>
                         </div>
                     </div>
                )}
            </div>
            {isChatActive && !isLoading && (
                <form onSubmit={handleSubmit} className="flex gap-2 items-start pt-2 border-t border-slate-200 mt-2">
                    <textarea 
                        value={userResponse}
                        onChange={e => setUserResponse(e.target.value)}
                        className="flex-grow p-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 text-sm"
                        placeholder="Your answer..."
                        rows={2}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e) }}
                    />
                    <button type="submit" className="px-3 py-1.5 bg-white text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-sm hover:bg-slate-100 transition-colors text-sm">
                        Send
                    </button>
                </form>
            )}
        </div>
    );
};

export default ChatInterface;
