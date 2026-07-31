// ============================================
// REGISTER PAGE
// ============================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/register', formData);
            
            // Store authentication data
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            // Redirect to home page
            window.location.href = '/';
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
                    Create Account
                </h1>
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

const [verificationSent, setVerificationSent] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const res = await api.post('/auth/register', formData);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        if (res.data.requiresVerification) {
            setVerificationSent(true);
        } else {
            window.location.href = '/';
        }
    } catch (err: any) {
        setError(err.response?.data?.error || 'Registration failed');
        setLoading(false);
    }
};

// Add this after the form:
{verificationSent && (
    <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-4">
        <p className="font-semibold">✅ Registration successful!</p>
        <p className="text-sm mt-1">Please check your email for verification link.</p>
        <p className="text-xs text-gray-500 mt-2">(For testing, check server console for the link)</p>
    </div>
)}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {loading ? 'Creating account...' : 'Register'}
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-4">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}