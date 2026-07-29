'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function MessagePage({ params }: { params: { username: string } }) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [receiver, setReceiver] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const username = params.username;

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            try {
                setCurrentUser(JSON.parse(userData));
            } catch (error) {
                console.error('Error parsing user:', error);
            }
        }

        fetchReceiver();
    }, [username]);

    const fetchReceiver = async () => {
        try {
            const res = await api.get(`/users/${username}`);
            setReceiver(res.data.user);
            fetchMessages(res.data.user.id);
        } catch (error) {
            console.error('Error fetching receiver:', error);
            router.push('/');
        }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const res = await api.get(`/messages/${userId}`);
            setMessages(res.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !receiver) return;

        setSending(true);
        try {
            const res = await api.post(`/messages/${receiver.id}`, { content: newMessage });
            setMessages([...messages, { ...res.data, direction: 'sent' }]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (loading || !receiver) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-blue-600">
                        🚀 Social Media
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-700 hover:text-blue-600">
                            Home
                        </Link>
                        <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                            My Profile
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-white rounded-xl shadow-md p-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                            {receiver.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">{receiver.name}</h2>
                            <p className="text-sm text-gray-500">@{receiver.username}</p>
                        </div>
                        <Link href={`/profile/${receiver.username}`} className="ml-auto text-sm text-blue-600 hover:underline">
                            View Profile
                        </Link>
                    </div>

                    {/* Messages */}
                    <div className="h-96 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                No messages yet. Start a conversation!
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] p-3 rounded-lg ${
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

                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="flex gap-2 border-t border-gray-200 pt-4">
                        <input
                            type="text"
                            placeholder={`Message ${receiver.name}...`}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            maxLength={1000}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                            {sending ? 'Sending...' : 'Send'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}