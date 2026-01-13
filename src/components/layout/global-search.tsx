'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, FileText, Folder, MessageSquare, User } from 'lucide-react';

interface SearchResult {
    tasks: Array<{
        id: string;
        title: string;
        status: { name: string; isClosed: boolean };
        priority: { name: string; color: string | null };
        project: { id: string; name: string };
    }>;
    projects: Array<{
        id: string;
        name: string;
        identifier: string;
        description: string | null;
    }>;
    comments: Array<{
        id: string;
        content: string;
        user: { name: string };
        task: { id: string; title: string };
    }>;
    users: Array<{
        id: string;
        name: string;
        email: string;
        avatar: string | null;
    }>;
}

export function GlobalSearch() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Search API
    useEffect(() => {
        if (query.length < 2) {
            setResults(null);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.success) {
                    setResults(data.data.results);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleClose = () => {
        setIsOpen(false);
        setQuery('');
        setResults(null);
    };

    const handleSelect = (href: string) => {
        router.push(href);
        handleClose();
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
                <Search className="w-4 h-4" />
                <span>Tìm kiếm...</span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-white rounded text-xs text-gray-400 border border-gray-200">
                    ⌘K
                </kbd>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

            {/* Modal */}
            <div className="relative min-h-screen flex items-start justify-center pt-[10vh] px-4">
                <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tìm kiếm công việc, dự án, bình luận..."
                            className="flex-1 text-lg outline-none placeholder-gray-400"
                        />
                        {loading && (
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {query.length < 2 && (
                            <div className="p-8 text-center text-gray-500">
                                Nhập ít nhất 2 ký tự để tìm kiếm
                            </div>
                        )}

                        {results && (
                            <div className="divide-y divide-gray-100">
                                {/* Tasks */}
                                {results.tasks.length > 0 && (
                                    <div className="p-2">
                                        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                                            Công việc ({results.tasks.length})
                                        </div>
                                        {results.tasks.map((task) => (
                                            <button
                                                key={task.id}
                                                onClick={() => handleSelect(`/tasks/${task.id}`)}
                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-md text-left"
                                            >
                                                <FileText className="w-4 h-4 text-blue-500" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                        {task.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {task.project.name} · {task.status.name}
                                                    </div>
                                                </div>
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: task.priority.color || '#6b7280' }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Projects */}
                                {results.projects.length > 0 && (
                                    <div className="p-2">
                                        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                                            Dự án ({results.projects.length})
                                        </div>
                                        {results.projects.map((project) => (
                                            <button
                                                key={project.id}
                                                onClick={() => handleSelect(`/projects/${project.id}`)}
                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-md text-left"
                                            >
                                                <Folder className="w-4 h-4 text-green-500" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {project.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {project.description || project.identifier}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Comments */}
                                {results.comments.length > 0 && (
                                    <div className="p-2">
                                        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                                            Bình luận ({results.comments.length})
                                        </div>
                                        {results.comments.map((comment) => (
                                            <button
                                                key={comment.id}
                                                onClick={() => handleSelect(`/tasks/${comment.task.id}`)}
                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-md text-left"
                                            >
                                                <MessageSquare className="w-4 h-4 text-purple-500" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-gray-900 truncate">
                                                        {comment.content.substring(0, 100)}...
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {comment.user.name} trong {comment.task.title}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Users */}
                                {results.users.length > 0 && (
                                    <div className="p-2">
                                        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                                            Người dùng ({results.users.length})
                                        </div>
                                        {results.users.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-3 px-3 py-2 rounded-md"
                                            >
                                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* No Results */}
                                {results.tasks.length === 0 &&
                                    results.projects.length === 0 &&
                                    results.comments.length === 0 &&
                                    results.users.length === 0 && (
                                        <div className="p-8 text-center text-gray-500">
                                            Không tìm thấy kết quả phù hợp
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-400 flex items-center gap-4">
                        <span>↑↓ để di chuyển</span>
                        <span>↵ để chọn</span>
                        <span>ESC để đóng</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
