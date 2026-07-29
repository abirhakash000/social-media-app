'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface SearchResult {
    id: string;
    name: string;
    username: string;
    bio?: string;
    profile_picture?: string;
    type: 'user' | 'post';
    content?: string;
    is_following?: boolean;
    created_at?: string;
}

export default function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const res = await api.get(`/search/all?q=${encodeURIComponent(query)}`);
                const combined = [...res.data.users, ...res.data.posts];
                setResults(combined);
                setShowResults(true);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(search, 500);
        return () => clearTimeout(debounce);
    }, [query]);

    return (
        <div className="relative" ref={searchRef}>
            {/* Search Input */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search users or posts..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setShowResults(true)}
                    className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">
                    🔍
                </span>
            </div>

            {/* Results Dropdown */}
            {showResults && query.length >= 2 && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Searching...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No results found for "{query}"
                        </div>
                    ) : (
                        results.map((result) => (
                            <Link
                                key={result.id}
                                href={result.type === 'user' ? `/profile/${result.username}` : `/post/${result.id}`}
                                onClick={() => setShowResults(false)}
                                className="block p-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    {result.type === 'user' ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                                {result.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-gray-800">
                                                    {result.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    @{result.username}
                                                </p>
                                                {result.bio && (
                                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                                        {result.bio}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                User
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                                                📝
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-gray-800">
                                                    {result.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    @{result.username}
                                                </p>
                                                <p className="text-xs text-gray-600 truncate mt-0.5">
                                                    {result.content}
                                                </p>
                                            </div>
                                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                Post
                                            </span>
                                        </>
                                    )}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}