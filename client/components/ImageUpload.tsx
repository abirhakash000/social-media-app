'use client';

import { useState, useRef } from 'react';
import api from '@/lib/api';

export default function ImageUpload({ onUpload, type, buttonText = '📸 Add Image' }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result;
                const res = await api.post(`/upload/${type}`, { image: base64 });
                onUpload(res.data.url);
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

    return (
        <div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id={`image-upload-${type}`}
            />
            <label
                htmlFor={`image-upload-${type}`}
                className={`cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
                {uploading ? '⏳ Uploading...' : buttonText}
            </label>
        </div>
    );
}