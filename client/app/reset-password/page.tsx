// ============================================================
// RESET PASSWORD PAGE - With Suspense Boundary Fix
// ============================================================

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

// ============================================================
// MAIN COMPONENT WITH SUSPENSE
// ============================================================
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}

// ============================================================
// RESET PASSWORD CONTENT - uses useSearchParams
// ============================================================
function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);

    // Verify token when page loads
    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await api.post('/auth/verify-reset-token', { token });
                setTokenValid(res.data.valid);
            } catch (err) {
                setTokenValid(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await api.post('/auth/reset-password', { token, newPassword });
            setMessage(res.data.message);
            
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    // Invalid Token State
    if (tokenValid === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
                    <p className="text-gray-600 mb-6">
                        This password reset link is invalid or has expired.
                    </p>
                    <Link href="/forgot-password">
                        <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            Request New Link
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    // Loading State
    if (tokenValid === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Verifying link...</div>
            </div>
        );
    }

    // Main Form
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
                    Set New Password
                </h1>
                <p className="text-center text-gray-600 mb-6">
                    Enter your new password below.
                </p>

                {message && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">
                        {message} Redirecting to login...
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter new password"
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirm new password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-4">
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
}