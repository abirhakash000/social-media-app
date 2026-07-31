'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    type: 'like' | 'comment' | 'follow';
    from_user: string;
    name: string;
    username: string;
    post_id: string | null;
    content_preview: string | null;
    is_read: boolean;
    created_at: string;
}

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);

    const fetchNotifications = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return; // Skip if no token
        }
        const res = await api.get('/notifications');
        setNotifications(res.data);
    } catch (error: any) {
        if (error.response?.status === 401) {
            // Token expired or invalid, redirect to login
            localStorage.clear();
            window.location.href = '/login';
        }
        console.error('Error fetching notifications:', error);
    } finally {
        setLoading(false);
    }
};

    const fetchUnreadCount = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return; // Skip if no token
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.count);
    } catch (error: any) {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        console.error('Error fetching unread count:', error);
    }
};

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const getNotificationText = (notification: Notification) => {
        switch (notification.type) {
            case 'like':
                return `${notification.name} liked your post`;
            case 'comment':
                return `${notification.name} commented on your post`;
            case 'follow':
                return `${notification.name} started following you`;
            default:
                return '';
        }
    };

    const getNotificationLink = (notification: Notification) => {
        if (notification.type === 'follow') {
            return `/profile/${notification.username}`;
        }
        return notification.post_id ? `/profile/${notification.username}` : '#';
    };

    if (loading) {
        return <div className="text-sm text-gray-500">Loading...</div>;
    }

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
            >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                        <h3 className="font-bold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <Link
                                key={notification.id}
                                href={getNotificationLink(notification)}
                                onClick={() => markAsRead(notification.id)}
                                className={`block p-4 hover:bg-gray-50 transition border-b border-gray-100 ${
                                    !notification.is_read ? 'bg-blue-50' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                        {notification.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800">
                                            {getNotificationText(notification)}
                                        </p>
                                        {notification.content_preview && (
                                            <p className="text-xs text-gray-500 mt-1 truncate">
                                                "{notification.content_preview}"
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                    )}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}