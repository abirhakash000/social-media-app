// ============================================
// COMMENT SECTION COMPONENT
// ============================================

'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
    postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Fetch comments for this post
    const fetchComments = async () => {
        try {
            const res = await api.get(`/comments/${postId}`);
            setComments(res.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    // Add new comment
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const res = await api.post(`/comments/${postId}`, { content: newComment });
            setComments([...comments, res.data]);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-sm text-gray-500">Loading comments...</div>;
    }

    return (
        <div className="mt-4 border-t pt-4">
            {/* Comments List */}
            <div className="space-y-3">
                {comments.length === 0 ? (
                    <p className="text-sm text-gray-500">No comments yet. Be the first!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                {comment.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                                <div className="bg-gray-100 rounded-lg p-3">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {comment.name || 'User'}
                                        <span className="text-xs text-gray-500 font-normal ml-2">
                                            @{comment.username}
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={500}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition"
                >
                    {submitting ? 'Posting...' : 'Comment'}
                </button>
            </form>
        </div>
    );
}