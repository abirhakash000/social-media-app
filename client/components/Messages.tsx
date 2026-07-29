'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
    id: string;
    name: string;
    username: string;
    profile_picture: string | null;
    last_message: string | null;
    last_message_time: string | null;
    unread_count: number;
}

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
    direction: 'sent' | 'received';
    name: string;
    username: string;
}

export default function Messages() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/messages/conversations');
            setConversations(res.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const res = await api.get(`/messages/${userId}`);
            setMessages(res.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/messages/unread/count');
            setUnreadCount(res.data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        setSending(true);
        try {
            const res = await api.post(`/messages/${selectedUser.id}`, { content: newMessage });
            setMessages([...messages, { ...res.data, direction: 'sent', name: '', username: '' }]);
            setNewMessage('');
            // Update last message in conversation
            setConversations(conversations.map(c => 
                c.id === selectedUser.id 
                    ? { ...c, last_message: newMessage, last_message_time: new Date().toISOString() }
                    : c
            ));
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleSelectUser = (user: Conversation) => {
        setSelectedUser(user);
        fetchMessages(user.id);
        // Mark as read
        setConversations(conversations.map(c => 
            c.id === user.id ? { ...c, unread_count: 0 } : c
        ));
        fetchUnreadCount();
    };

    useEffect(() => {
        fetchConversations();
        fetchUnreadCount();
        const interval = setInterval(() => {
            fetchUnreadCount();
            if (selectedUser) {
                fetchMessages(selectedUser.id);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedUser]);

    if (loading) {
        return <div className="text-sm text-gray-500">Loading...</div>;
    }

    return (
        <div className="relative">
            {/* Message Icon */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
            >
                <span className="text-2xl">💬</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-[500px] bg-white rounded-xl shadow-xl border border-gray-200 h-96 z-50 flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Messages</h3>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Conversations List */}
                        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No conversations yet
                                </div>
                            ) : (
                                conversations.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelectUser(user)}
                                        className={`w-full text-left p-3 hover:bg-gray-50 transition border-b border-gray-100 ${
                                            selectedUser?.id === user.id ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                                {user.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-gray-800">{user.name}</p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    @{user.username}
                                                </p>
                                                {user.last_message && (
                                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                                        {user.last_message}
                                                    </p>
                                                )}
                                            </div>
                                            {user.unread_count > 0 && (
                                                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                                                    {user.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 flex flex-col">
                            {selectedUser ? (
                                <>
                                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                                        <p className="font-semibold text-sm text-gray-800">
                                            {selectedUser.name}
                                        </p>
                                        <p className="text-xs text-gray-500">@{selectedUser.username}</p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {messages.length === 0 ? (
                                            <div className="text-center text-gray-500 text-sm mt-4">
                                                No messages yet. Start a conversation!
                                            </div>
                                        ) : (
                                            messages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${
                                                        msg.direction === 'sent' ? 'justify-end' : 'justify-start'
                                                    }`}
                                                >
                                                    <div
                                                        className={`max-w-[80%] p-3 rounded-lg ${
                                                            msg.direction === 'sent'
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-200 text-gray-800'
                                                        }`}
                                                    >
                                                        <p className="text-sm">{msg.content}</p>
                                                        <p className={`text-xs mt-1 ${
                                                            msg.direction === 'sent' ? 'text-blue-200' : 'text-gray-500'
                                                        }`}>
                                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            maxLength={1000}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sending || !newMessage.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                                        >
                                            Send
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                                    Select a conversation
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}