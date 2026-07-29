// ============================================
// POST CARD COMPONENT - Display single post
// ============================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import CommentSection from './CommentSection';

interface PostCardProps {
    post: any;           // Post data
    onLike: () => void;  // Refresh feed after like
    onDelete?: () => void; // Refresh feed after delete
    currentUserId?: string; // Current logged in user ID
}

export default function PostCard({ post, onLike, onDelete, currentUserId }: PostCardProps) {
    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Check if current user owns this post
    const isOwner = currentUserId === post.user_id;

    // Handle Like/Unlike
    const handleLike = async () => {
        try {
            const res = await api.post(`/posts/${post.id}/like`);
            setIsLiked(res.data.liked);
            setLikesCount(prev => res.data.liked ? prev + 1 : prev - 1);
            onLike();
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    // Handle Delete Post
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        
        setIsDeleting(true);
        try {
            await api.delete(`/posts/${post.id}`);
            if (onDelete) onDelete();
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle Edit Post
    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editContent.trim() || editContent === post.content) {
            setIsEditing(false);
            return;
        }

        setIsUpdating(true);
        try {
            const res = await api.put(`/posts/${post.id}`, { content: editContent });
            post.content = res.data.content;
            post.edited_at = res.data.edited_at;
            setIsEditing(false);
            onLike(); // Refresh feed
        } catch (error) {
            console.error('Error editing post:', error);
            alert('Failed to edit post');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-4">
            {/* Post Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {post.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                    <Link href={`/profile/${post.username}`}>
                        <p className="font-semibold text-gray-800 hover:text-blue-600 cursor-pointer transition">
                            {post.name || 'User'}
                        </p>
                    </Link>
                    <p className="text-sm text-gray-500">@{post.username}</p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-sm text-gray-400">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                    {post.edited_at && (
                        <p className="text-xs text-gray-400">(edited)</p>
                    )}
                </div>
            </div>
            
            {/* Post Content */}
            {isEditing ? (
                // Edit Mode
                <form onSubmit={handleEdit} className="mb-4">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        maxLength={1000}
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            type="submit"
                            disabled={isUpdating || !editContent.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                            {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setEditContent(post.content);
                            }}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <p className="text-gray-700 mb-4">{post.content}</p>
            )}

            {/* Post Image */}
            {post.image && (
                <div className="mb-4 rounded-lg overflow-hidden">
                    <img 
                        src={post.image} 
                        alt="Post image" 
                        className="w-full max-h-96 object-cover"
                    />
                </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between text-gray-600">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={handleLike}
                        className={`flex items-center gap-2 hover:text-red-500 transition ${
                            isLiked ? 'text-red-500' : ''
                        }`}
                    >
                        <span className="text-xl">❤️</span>
                        <span>{likesCount}</span>
                    </button>
                    <button 
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-2 hover:text-blue-500 transition"
                    >
                        <span className="text-xl">💬</span>
                        <span>{post.comments_count || 0}</span>
                    </button>
                </div>

                {/* Edit & Delete buttons (only for post owner) */}
                {isOwner && !isEditing && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-sm text-blue-600 hover:text-blue-800 transition"
                        >
                            ✏️ Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="text-sm text-red-600 hover:text-red-800 transition disabled:opacity-50"
                        >
                            {isDeleting ? '...' : '🗑️ Delete'}
                        </button>
                    </div>
                )}
            </div>

            {/* Comments Section */}
            {showComments && <CommentSection postId={post.id} />}
        </div>
    );
}