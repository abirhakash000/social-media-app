// ============================================================
// EMAIL VERIFICATION PAGE
// ============================================================

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

// ============================================================
// MAIN COMPONENT WITH SUSPENSE
// ============================================================
export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}

// ============================================================
// VERIFY EMAIL CONTENT
// ============================================================
function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token found');
            return;
        }

        const verifyEmail = async () => {
            try {
                const res = await api.post('/auth/verify-email', { token });
                setStatus('success');
                setMessage(res.data.message);
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.error || 'Verification failed');
            }
        };

        verifyEmail();
    }, [token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <div className="text-6xl mb-4">⏳</div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Verifying...</h1>
                        <p className="text-gray-600">Please wait while we verify your email.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-6xl mb-4">✅</div>
                        <h1 className="text-2xl font-bold text-green-600 mb-2">Email Verified!</h1>
                        <p className="text-gray-600">{message}</p>
                        <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-4">❌</div>
                        <h1 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h1>
                        <p className="text-gray-600">{message}</p>
                        <Link href="/login">
                            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                Go to Login
                            </button>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}