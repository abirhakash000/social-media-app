// ============================================
// HOME PAGE - Feed
// ============================================

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import api from '@/lib/api';
import Notifications from '@/components/Notifications';
import Messages from '@/components/Messages';
import Search from '@/components/Search';

export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all posts from API
    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts');
            setPosts(res.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    // Check if user is logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (error) {
                console.error('Error parsing user:', error);
            }
        }

        fetchPosts();
        setLoading(false);
    }, [router]);

    // Logout function
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

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600">
                        🚀 Social Media
                    </h1>
                    <div className="flex items-center gap-4">
                        <Notifications />
                        <Messages />
                        <Search />
                        <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                            Profile
                        </Link>
                        <span className="text-gray-700 hidden sm:inline">
                            Welcome, {user.name || user.username}!
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
            
            {/* Main Content */}
            <div className="max-w-2xl mx-auto p-4">
                <CreatePost onPostCreated={fetchPosts} />
                
                {/* Posts Feed */}
                <div className="space-y-4">
                    {posts.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
                            No posts yet. Be the first to post!
                        </div>
                    ) : (
                        posts.map((post) => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                onLike={fetchPosts}
                                onDelete={fetchPosts}
                                currentUserId={user?.id}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}