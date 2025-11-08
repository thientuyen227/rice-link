'use client';

import { useEffect, useRef, useState } from 'react';

interface Message {
    id: number;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage: Message = {
                id: Date.now(),
                text: '🌾 Xin chào! Tôi là trợ lý ảo RiceLink - bạn cần hỗ trợ điều gì hôm nay?',
                isUser: false,
                timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen, messages.length]);

    const sendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            text: inputMessage,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: inputMessage,
                    sessionId: 'user-session-' + Math.random().toString(36).substr(2, 9),
                }),
            });

            const data = await response.json();

            const botMessage: Message = {
                id: Date.now() + 1,
                text: data.reply,
                isUser: false,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);

            const errorMessage: Message = {
                id: Date.now() + 1,
                text: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau 🌾',
                isUser: false,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-5 rounded-full shadow-xl hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center"
                aria-label="Mở trợ lý ảo RiceLink"
            >
                <svg
                    className="w-6 h-6 sm:w-7 sm:h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                </svg>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed inset-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[550px] bg-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-700 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                            <div>
                                <h3 className="font-semibold text-sm sm:text-base">RiceLink Chatbot</h3>
                                <p className="text-[10px] sm:text-xs text-green-100">Trực tuyến</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <button
                                onClick={clearChat}
                                className="text-green-100 hover:text-white transition-colors p-1"
                                title="Xóa đoạn chat"
                            >
                                <svg
                                    className="w-4 h-4 sm:w-5 sm:h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-green-100 hover:text-white transition-colors p-1"
                                title="Đóng"
                            >
                                <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-3 sm:p-5 overflow-y-auto bg-gray-900">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`mb-3 sm:mb-4 ${message.isUser ? 'text-right' : 'text-left'}`}
                            >
                                <div
                                    className={`inline-block px-3 py-2 sm:px-4 sm:py-3 rounded-2xl max-w-[90%] sm:max-w-[85%] text-sm sm:text-[15px] leading-relaxed ${
                                        message.isUser
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-br-none shadow'
                                            : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700 shadow'
                                    }`}
                                >
                                    {message.text}
                                </div>
                                <div
                                    className={`text-xs text-gray-400 mt-1 ${
                                        message.isUser ? 'text-right' : 'text-left'
                                    }`}
                                >
                                    {message.timestamp.toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="text-left mb-3 sm:mb-4">
                                <div className="inline-block px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-gray-800 border border-gray-700 shadow rounded-bl-none">
                                    <div className="flex space-x-1">
                                        <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce"></div>
                                        <div
                                            className="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce"
                                            style={{ animationDelay: '0.1s' }}
                                        ></div>
                                        <div
                                            className="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce"
                                            style={{ animationDelay: '0.2s' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 sm:p-4 border-t border-gray-700 bg-gray-800">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Nhập câu hỏi..."
                                className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !inputMessage.trim()}
                                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center space-x-1"
                            >
                                <span className="hidden sm:inline">Gửi</span>
                                <svg
                                    className="w-4 h-4 sm:w-4 sm:h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    />
                                </svg>
                            </button>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 text-center mt-1.5 sm:mt-2">
                            RiceLink Chatbot • Luôn sẵn sàng hỗ trợ bạn
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
