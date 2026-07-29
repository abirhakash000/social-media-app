// ============================================
// CREATE POST COMPONENT
// ============================================

'use client';

import { useState, useRef } from 'react';
import api from '@/lib/api';

export default function CreatePost({ onPostCreated }) {
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Handle image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result;
                const res = await api.post('/upload/post', { image: base64 });
                setImage(res.data.url);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    // Handle post submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !image) return;

        setLoading(true);
        try {
            await api.post('/posts', { content, image });
            setContent('');
            setImage(null);
            onPostCreated();
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-4 mb-4">
            <textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
            />
            
            {/* Image Preview */}
            {image && (
                <div className="relative mt-2">
                    <img 
                        src={image} 
                        alt="Preview" 
                        className="max-h-48 rounded-lg object-cover"
                    />
                    <button
                        type="button"
                        onClick={() => setImage(null)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 text-lg"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-3">
                    {/* Image Upload Button */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="post-image-upload"
                    />
                    <label
                        htmlFor="post-image-upload"
                        className={`cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm ${
                            uploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {uploading ? '⏳ Uploading...' : '📸 Add Image'}
                    </label>
                    <span className="text-sm text-gray-500">{content.length}/1000</span>
                </div>
                <button
                    type="submit"
                    disabled={loading || (!content.trim() && !image)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {loading ? 'Posting...' : 'Post'}
                </button>
            </div>
        </form>
    );
}