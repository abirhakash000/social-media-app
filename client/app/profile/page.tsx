// ============================================================
// PROFILE PAGE - Displays current user's profile information
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import FollowList from '@/components/FollowList';

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ProfilePage() {
    // ============================================================
    // STATE DECLARATIONS - All component state variables
    // ============================================================
    const router = useRouter();                                          // Next.js router for navigation
    const [user, setUser] = useState<any>(null);                        // Current logged in user data
    const [profile, setProfile] = useState<any>(null);                  // Profile data of the viewed user
    const [posts, setPosts] = useState<any[]>([]);                      // List of user's posts
    const [loading, setLoading] = useState(true);                       // Loading state for UI
    const [editing, setEditing] = useState(false);                      // Toggle edit mode
    const [editData, setEditData] = useState({ name: '', bio: '' });    // Edit form data
    const [showFollowers, setShowFollowers] = useState(false);          // Show followers modal
    const [showFollowing, setShowFollowing] = useState(false);          // Show following modal

    // ============================================================
    // EFFECT HOOKS - Runs when component mounts
    // ============================================================
    useEffect(() => {
        // Get authentication data from localStorage
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        // Debug logging - helps identify issues
        console.log('🔍 Token:', token);
        console.log('🔍 User Data from localStorage:', userData);
        
        // Redirect to login if no token found
        if (!token) {
            console.log('❌ No token found, redirecting to login');
            router.push('/login');
            return;
        }

        // Parse user data from localStorage
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                console.log('✅ Parsed User:', parsedUser);
            } catch (error) {
                console.error('❌ Error parsing user:', error);
                router.push('/login');
                return;
            }
        } else {
            console.log('❌ No user data found, redirecting to login');
            router.push('/login');
            return;
        }

        // Fetch profile data from backend
        fetchProfile();
    }, []); // Empty dependency array = run once on mount

    // ============================================================
    // API FUNCTIONS - Handle backend communication
    // ============================================================

        /**
     * Fetch user profile from the backend API
     */
    const fetchProfile = async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('📤 Fetching profile for username:', userData.username);
            
            if (!userData.username) {
                console.error('❌ No username found');
                setLoading(false);
                return;
            }
            
            const res = await api.get(`/users/${userData.username}`);
            console.log('📥 Profile response:', res.data);
            
            setProfile(res.data.user);
            setPosts(res.data.posts);
            setEditData({ 
                name: res.data.user.name, 
                bio: res.data.user.bio || '' 
            });
            setLoading(false);
        } catch (error: any) {
            console.error('❌ Error fetching profile:', error);
            console.error('❌ Error response:', error.response?.data);
            
            // Only redirect to login if token is actually invalid
            if (error.response?.status === 401) {
                console.log('⚠️ Token expired or invalid');
                // Don't immediately redirect - let the user see the error
                setLoading(false);
                // Show error message on page instead of redirecting
                setProfile(null);
            } else if (error.response?.status === 404) {
                console.log('⚠️ User not found');
                setLoading(false);
                setProfile(null);
            } else {
                setLoading(false);
                setProfile(null);
            }
        }
    };

    /**
     * Update user profile (name and bio)
     * Sends PUT request to backend with updated data
     */
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent form from refreshing page
        
        try {
            // Send update request to backend
            const res = await api.put('/users/update', editData);
            const updatedUser = res.data;
            
            // Update profile state with new data
            setProfile({ ...profile, name: updatedUser.name, bio: updatedUser.bio });
            setEditing(false); // Exit edit mode
            
            // Update localStorage with new name
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            userData.name = updatedUser.name;
            localStorage.setItem('user', JSON.stringify(userData));
            
            console.log('✅ Profile updated successfully');
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    /**
     * Logout user - clear all auth data and redirect to login
     */
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        console.log('👋 User logged out');
    };

    // ============================================================
    // RENDER - LOADING STATE
    // ============================================================
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading profile...</div>
            </div>
        );
    }

    // ============================================================
    // RENDER - ERROR STATE (User not found)
    // ============================================================
    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-xl text-gray-600">User not found</p>
                <button 
                    onClick={handleLogout}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    // ============================================================
    // RENDER - MAIN PROFILE
    // ============================================================

    // Check if the current user is viewing their own profile
    const isOwnProfile = user?.username === profile.username;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* ============================================================
                NAVIGATION BAR
            ============================================================ */}
            <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-blue-600">
                        🚀 Social Media
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
                            Home
                        </Link>
                        <span className="text-gray-700 hidden sm:inline">
                            {user?.name || 'User'}
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

            {/* ============================================================
                MAIN CONTENT AREA
            ============================================================ */}
            <div className="max-w-4xl mx-auto p-4">
                {/* ============================================================
                    PROFILE HEADER CARD
                ============================================================ */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Profile Picture - Shows user avatar or default */}
                        <div className="relative">
                            {profile.profile_picture ? (
                                <img 
                                    src={profile.profile_picture} 
                                    alt="Profile" 
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                                    {profile.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>

                        {/* User Information - Name, username, bio */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl font-bold text-gray-800">{profile.name}</h1>
                            <p className="text-gray-500">@{profile.username}</p>
                            {profile.bio && (
                                <p className="text-gray-700 mt-2">{profile.bio}</p>
                            )}
                            
                            {/* Stats - Posts count, Followers, Following */}
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

                        {/* Edit Profile Button - Only visible when viewing own profile */}
                        <div className="flex gap-3">
                            {isOwnProfile && (
                                <button
                                    onClick={() => setEditing(!editing)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    {editing ? 'Cancel' : 'Edit Profile'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ============================================================
                        EDIT PROFILE FORM - Toggle with editing state
                    ============================================================ */}
                    {editing && (
                        <form onSubmit={handleUpdate} className="mt-6 border-t pt-6">
                            <div className="space-y-4">
                                {/* Name Input Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                {/* Bio Textarea Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bio
                                    </label>
                                    <textarea
                                        value={editData.bio}
                                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                                
                                {/* Form Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditing(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* ============================================================
                    USER'S POSTS SECTION
                ============================================================ */}
                <h2 className="text-xl font-bold text-gray-800 mb-4">Posts</h2>
                {posts.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
                        No posts yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <div key={post.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                {/* Post Header - User info and timestamp */}
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
                                
                                {/* Post Content */}
                                <p className="text-gray-700">{post.content}</p>
                                
                                {/* Post Stats - Likes and Comments count */}
                                <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                                    <span>❤️ {post.likes_count || 0}</span>
                                    <span>💬 {post.comments_count || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ============================================================
                FOLLOWERS MODAL - Shows list of followers
            ============================================================ */}
            {showFollowers && (
                <FollowList 
                    username={profile.username} 
                    type="followers" 
                    onClose={() => setShowFollowers(false)} 
                />
            )}

            {/* ============================================================
                FOLLOWING MODAL - Shows list of users being followed
            ============================================================ */}
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