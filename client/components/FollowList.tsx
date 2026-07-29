'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface FollowListProps {
    username: string;
    type: 'followers' | 'following';
    onClose: () => void;
}

export default function FollowList({ username, type, onClose }: FollowListProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get(`/users/${username}/${type}`);
                setUsers(res.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [username, type]);

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">
                Loading...
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {type === 'followers' ? 'Followers' : 'Following'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {users.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            No {type} yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <Link
                                    key={user.id}
                                    href={`/profile/${user.username}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                                        {user.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800">{user.name}</p>
                                        <p className="text-sm text-gray-500">@{user.username}</p>
                                        {user.bio && (
                                            <p className="text-sm text-gray-400 truncate">{user.bio}</p>
                                        )}
                                    </div>
                                    {user.is_following && (
                                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                            Following
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}