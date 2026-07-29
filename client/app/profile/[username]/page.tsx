'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import FollowList from '@/components/FollowList';

export default function UserProfilePage({ params }: { params: { username: string } }) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);

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

        fetchProfile();
    }, [username]);

    const fetchProfile = async () => {
        try {
            const res = await api.get(`/users/${username}`);
            setProfile(res.data.user);
            setPosts(res.data.posts);
        } catch (error) {
            console.error('Error fetching profile:', error);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!profile) return;
        setFollowLoading(true);
        try {
            const res = await api.post(`/users/${profile.username}/follow`);
            setProfile({ 
                ...profile, 
                is_following: res.data.following,
                follower_count: res.data.following 
                    ? (profile.follower_count || 0) + 1 
                    : (profile.follower_count || 0) - 1
            });
        } catch (error) {
            console.error('Error following:', error);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!profile) {
        return <div>User not found</div>;
    }

    const isOwnProfile = currentUser?.username === profile.username;

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
                        <span className="text-gray-700 hidden sm:inline">
                            {currentUser?.name || 'User'}
                        </span>
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
                {/* Profile Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                            {profile.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl font-bold text-gray-800">{profile.name}</h1>
                            <p className="text-gray-500">@{profile.username}</p>
                            {profile.bio && (
                                <p className="text-gray-700 mt-2">{profile.bio}</p>
                            )}
                            <div className="flex justify-center md:justify-start gap-6 mt-3 text-sm">
                                <div>
                                    <span className="font-bold">{profile.post_count || 0}</span>
                                    <span className="text-gray-500 ml-1">Posts</span>
                                </div>
                                <button 
                                    onClick={() => setShowFollowers(true)}
                                    className="hover:bg-gray-100 px-3 py-1 rounded-lg transition"
                                >
                                    <span className="font-bold">{profile.follower_count || 0}</span>
                                    <span className="text-gray-500 ml-1">Followers</span>
                                </button>
                                <button 
                                    onClick={() => setShowFollowing(true)}
                                    className="hover:bg-gray-100 px-3 py-1 rounded-lg transition"
                                >
                                    <span className="font-bold">{profile.following_count || 0}</span>
                                    <span className="text-gray-500 ml-1">Following</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {!isOwnProfile && (
                                <>
                                    <button
                                        onClick={handleFollow}
                                        disabled={followLoading}
                                        className={`px-4 py-2 rounded-lg transition font-medium ${
                                            profile.is_following
                                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        } disabled:opacity-50`}
                                    >
                                        {followLoading ? 'Loading...' : (profile.is_following ? '✓ Following' : '+ Follow')}
                                    </button>
                                    <Link href={`/messages/${profile.username}`}>
                                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                                            💬 Message
                                        </button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* User's Posts */}
                <h2 className="text-xl font-bold text-gray-800 mb-4">Posts by {profile.name}</h2>
                {posts.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
                        No posts yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <div key={post.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                        {profile.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{profile.name}</p>
                                        <p className="text-sm text-gray-500">@{profile.username}</p>
                                    </div>
                                    <p className="text-sm text-gray-400 ml-auto">
                                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                <p className="text-gray-700">{post.content}</p>
                                <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                                    <span>❤️ {post.likes_count || 0}</span>
                                    <span>💬 {post.comments_count || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Followers Modal */}
            {showFollowers && (
                <FollowList 
                    username={profile.username} 
                    type="followers" 
                    onClose={() => setShowFollowers(false)} 
                />
            )}

            {/* Following Modal */}
            {showFollowing && (
                <FollowList 
                    username={profile.username} 
                    type="following" 
                    onClose={() => setShowFollowing(false)} 
                />
            )}
        </div>
    );
}