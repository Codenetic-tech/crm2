import React, { useState, useEffect, useRef } from 'react';
import {
    Phone,
    Video,
    MoreVertical,
    Paperclip,
    Smile,
    Send,
    Check,
    CheckCheck,
    Image as ImageIcon,
    Clock,
    RefreshCw,
    MessageSquare,
    FileText,
    File,
    Download,
    ExternalLink
} from 'lucide-react';
import { type Lead } from '@/utils/crm';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface WhatsAppMessage {
    name: string;
    type: 'Incoming' | 'Outgoing';
    to: string | null;
    from: string | null;
    content_type: 'text' | 'image' | string;
    message_type: string;
    attach: string | null;
    creation: string;
    message: string;
    status: 'sent' | 'delivered' | 'read' | null;
    from_name: string;
}

interface WhatsAppTabProps {
    lead: Lead;
}

const WhatsAppTab: React.FC<WhatsAppTabProps> = ({ lead }) => {
    const { toast } = useToast();
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [windowTimeRemaining, setWindowTimeRemaining] = useState<string | null>(null);
    const [isWindowClosed, setIsWindowClosed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '40px';
            const scHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scHeight, 200)}px`;
        }
    }, [newMessage]);

    useEffect(() => {
        const updateWindowTimer = () => {
            const lastIncoming = [...messages]
                .reverse()
                .find(msg => msg.type === 'Incoming');

            if (!lastIncoming) {
                setIsWindowClosed(true);
                setWindowTimeRemaining(null);
                return;
            }

            const lastIncomingTime = new Date(lastIncoming.creation).getTime();
            const windowEndTime = lastIncomingTime + (24 * 60 * 60 * 1000);
            const now = new Date().getTime();
            const diff = windowEndTime - now;

            if (diff <= 0) {
                setIsWindowClosed(true);
                setWindowTimeRemaining('Expired');
            } else {
                setIsWindowClosed(false);
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setWindowTimeRemaining(`${hours}h ${minutes}m`);
            }
        };

        updateWindowTimer();
        const interval = setInterval(updateWindowTimer, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [messages]);

    const fetchMessages = async (showLoading = true) => {
        if (showLoading && messages.length === 0) {
            setIsLoading(true);
        } else {
            setIsRefreshing(true);
        }
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
            const apiUrl = `${API_BASE_URL}/api/method/crm.api.whatsapp.get_whatsapp_messages`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({
                    reference_doctype: "CRM Lead",
                    reference_name: lead.id,
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            if (data.message) {
                // Sort by creation date ascending
                const sortedMessages = [...data.message].sort((a, b) =>
                    new Date(a.creation).getTime() - new Date(b.creation).getTime()
                );
                setMessages(sortedMessages);
            }
        } catch (error: any) {
            console.error('WhatsApp Fetch Error:', error);
            toast({
                variant: 'destructive',
                title: 'WhatsApp Error',
                description: 'Failed to load messages. Please try again later.',
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
            const apiUrl = `${API_BASE_URL}/api/method/crm.api.whatsapp.create_whatsapp_message`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({
                    reference_doctype: "CRM Lead",
                    reference_name: lead.id,
                    message: newMessage.trim(),
                    to: lead.phone.startsWith('+') ? lead.phone.substring(1) : lead.phone,
                    attach: "",
                    reply_to: ""
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API Error: ${response.status}`);
            }

            setNewMessage('');
            await fetchMessages();
        } catch (error: any) {
            console.error('WhatsApp Send Error:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to send message',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        fetchMessages();

        // Polling every 10 seconds
        const pollInterval = setInterval(() => {
            fetchMessages(false);
        }, 10000);

        return () => clearInterval(pollInterval);
    }, [lead.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateStr;
        }
    };

    const formatDateHeader = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            if (compareDate.getTime() === today.getTime()) return 'Today';
            if (compareDate.getTime() === yesterday.getTime()) return 'Yesterday';

            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const renderMessageContent = (msg: WhatsAppMessage) => {
        const fileBaseUrl = 'https://crm.gopocket.in';
        const content = msg.message || '';
        const isFile = content.startsWith('/files/');

        if (isFile) {
            const fileUrl = `${fileBaseUrl}${content}`;
            const extension = content.split('.').pop()?.toLowerCase() || '';
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);

            if (isImage) {
                return (
                    <div className="mt-1 mb-1 max-w-[300px]">
                        <img
                            src={fileUrl}
                            alt="WhatsApp Attachment"
                            className="w-full h-auto max-h-[400px] object-cover rounded-lg shadow-sm cursor-pointer hover:opacity-95 transition-opacity border border-black/5"
                            onClick={() => window.open(fileUrl, '_blank')}
                        />
                    </div>
                );
            }

            return (
                <div className="mt-1 mb-1 min-w-[200px] max-w-full">
                    <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all hover:shadow-md cursor-pointer group bg-white border-gray-100`}
                        onClick={() => window.open(fileUrl, '_blank')}
                    >
                        <div className={`p-2 rounded-lg ${extension === 'pdf' ? 'bg-red-50 text-red-500' :
                            ['doc', 'docx'].includes(extension) ? 'bg-blue-50 text-blue-500' :
                                ['xls', 'xlsx', 'csv'].includes(extension) ? 'bg-green-50 text-green-500' :
                                    'bg-amber-50 text-amber-500'
                            }`}>
                            {extension === 'pdf' ? <FileText size={20} /> : <File size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">
                                {content.split('/').pop()}
                            </p>
                            <p className="text-[10px] text-gray-400 uppercase font-medium mt-0.5">
                                {extension || 'Document'}
                            </p>
                        </div>
                        <div className="p-1.5 rounded-full bg-gray-50 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500 transition-colors">
                            <Download size={14} />
                        </div>
                    </div>
                </div>
            );
        }

        // Handle bold formatting (*text*)
        const parts = content.split(/(\*.*?\*)/g);
        return (
            <span>
                {parts.map((part, i) => {
                    if (part.startsWith('*') && part.endsWith('*')) {
                        return <strong key={i}>{part.slice(1, -1)}</strong>;
                    }
                    return part;
                })}
            </span>
        );
    };

    const StatusIcon = ({ status }: { status: WhatsAppMessage['status'] }) => {
        if (status === 'read') return <CheckCheck size={14} className="text-blue-500" />;
        if (status === 'delivered') return <CheckCheck size={14} className="text-gray-400" />;
        if (status === 'sent') return <Check size={14} className="text-gray-400" />;
        return null;
    };

    if (isLoading && messages.length === 0) {
        return (
            <div className="space-y-4 p-6 h-[700px] bg-white/40 backdrop-blur-sm rounded-xl border border-white/20 flex flex-col justify-end">
                <div className="flex justify-start"><Skeleton className="h-10 w-48 rounded-2xl rounded-bl-none" /></div>
                <div className="flex justify-end"><Skeleton className="h-12 w-64 rounded-2xl rounded-br-none" /></div>
                <div className="flex justify-start"><Skeleton className="h-10 w-32 rounded-2xl rounded-bl-none" /></div>
                <div className="flex justify-end"><Skeleton className="h-20 w-80 rounded-2xl rounded-br-none" /></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[700px] bg-transparent animate-in fade-in duration-500">
            {/* Minimal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/60 backdrop-blur-md rounded-t-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="h-10 w-10 ring-2 ring-purple-100 ring-offset-2">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
                                {lead.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{lead.name}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {windowTimeRemaining && (
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${isWindowClosed
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-green-50 text-green-600 border-green-100'
                            }`}>
                            <Clock size={12} className={isWindowClosed ? 'text-red-500' : 'text-green-500'} />
                            <span>{isWindowClosed ? 'WINDOW CLOSED' : `${windowTimeRemaining} REMAINING`}</span>
                        </div>
                    )}
                    <button
                        onClick={() => fetchMessages(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-purple-600"
                        title="Refresh messages"
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={18} className={isRefreshing || isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 px-6 bg-white/20 backdrop-blur-[2px]">
                <div className="py-6 space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                            <div className="p-4 bg-gray-50 rounded-full mb-4">
                                <MessageSquare size={32} />
                            </div>
                            <p className="text-sm font-medium">No conversation history found</p>
                            <p className="text-xs mt-1">Send a message to start the conversation</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isOutgoing = msg.type === 'Outgoing';
                            const showDateHeader = index === 0 ||
                                new Date(messages[index - 1].creation).toLocaleDateString() !==
                                new Date(msg.creation).toLocaleDateString();

                            return (
                                <React.Fragment key={msg.name || index}>
                                    {showDateHeader && (
                                        <div className="flex justify-center my-6">
                                            <div className="px-4 py-1.5 bg-gray-100/80 backdrop-blur-sm border border-gray-200 text-gray-500 text-[11px] font-bold rounded-full uppercase tracking-wider">
                                                {formatDateHeader(msg.creation)}
                                            </div>
                                        </div>
                                    )}
                                    <div
                                        className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex items-end gap-1 max-w-[75%]`}>

                                            {/* Message bubble */}
                                            <div
                                                className={`px-4 py-1.5 rounded-2xl shadow-sm relative ${isOutgoing
                                                    ? 'bg-purple-600 text-white rounded-tr-none'
                                                    : 'bg-white text-gray-800 rounded-tl-none border'
                                                    }`}
                                            >
                                                <div className="text-md leading-relaxed whitespace-pre-wrap flex flex-col">
                                                    {renderMessageContent(msg)}
                                                    <span className={`text-[9px] opacity-80 mt-1 ${isOutgoing ? 'text-right' : 'text-left'}`}>
                                                        {formatTime(msg.creation)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status icon outside bubble */}
                                            {isOutgoing && (
                                                <div className="mb-1 px-1.5">
                                                    <StatusIcon status={msg.status} />
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Premium Input Bar */}
            <div className="p-4 bg-white backdrop-blur-xl border-t border-gray-100 rounded-b-2xl">
                <div className="flex items-end gap-4 bg-gray-50/80 p-1.5 pl-4 rounded-2xl border border-gray-100 shadow-md focus-within:bg-white focus-within:shadow-md focus-within:border-purple-200 transition-all duration-300 group">
                    <button className="text-gray-400 hover:text-purple-600 transition-colors p-2 mb-0.5">
                        <Smile size={20} />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder={isWindowClosed ? "Window closed. Only template messages allowed..." : "Write a message..."}
                        className="flex-1 bg-transparent border-none py-2.5 text-sm focus:ring-0 focus:outline-none placeholder:text-gray-400 resize-none min-h-[40px] max-h-[200px] leading-relaxed scrollbar-hide"
                        disabled={isSending || isWindowClosed}
                        rows={1}
                    />

                    <div className="flex items-center gap-1 mb-0.5">
                        <button className="text-gray-400 hover:text-purple-600 transition-colors p-2 rounded-xl hover:bg-white shadow-none hover:shadow-sm">
                            <Paperclip size={18} />
                        </button>
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || isSending || isWindowClosed}
                            className={`flex items-center justify-center p-2.5 rounded-xl transition-all ${newMessage.trim() && !isSending && !isWindowClosed
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 scale-100 active:scale-95'
                                : 'bg-gray-200 text-gray-400 scale-95 cursor-not-allowed opacity-50'
                                }`}
                        >
                            {isSending ? (
                                <RefreshCw size={18} className="animate-spin" />
                            ) : (
                                <Send size={18} className={newMessage.trim() ? "translate-x-0.5" : ""} />
                            )}
                        </button>
                    </div>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-3 font-medium flex items-center justify-center gap-1.5">
                    <Clock size={10} />
                    Messages will be sent via Business API
                </p>
            </div>
        </div>
    );
};

export default WhatsAppTab;

