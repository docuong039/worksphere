import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    X,
    FileText,
    Folder,
    MessageSquare,
    User as UserIcon,
    CornerDownLeft,
    Loader2,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import Image from 'next/image';

interface SearchResultItem {
    id: string;
    type: 'task' | 'project' | 'comment' | 'user';
    title: string;
    subtitle?: string;
    href: string;
    icon?: any;
    meta?: any;
}

interface SearchResult {
    tasks: any[];
    projects: any[];
    comments: any[];
    users: any[];
}

export function GlobalSearch() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Flatten results for keyboard navigation
    const flatResults = useMemo(() => {
        if (!results) return [];
        const items: SearchResultItem[] = [];

        results.tasks.forEach(t => items.push({
            id: t.id,
            type: 'task',
            title: t.title,
            subtitle: `${t.project.name} • ${t.status.name}`,
            href: `/tasks/${t.id}`,
            icon: FileText,
            meta: t.priority
        }));

        results.projects.forEach(p => items.push({
            id: p.id,
            type: 'project',
            title: p.name,
            subtitle: p.description || p.identifier,
            href: `/projects/${p.id}`,
            icon: Folder
        }));

        results.comments.forEach(c => items.push({
            id: c.id,
            type: 'comment',
            title: c.content,
            subtitle: `${c.user.name} trong ${c.task.title}`,
            href: `/tasks/${c.task.id}`,
            icon: MessageSquare
        }));

        results.users.forEach(u => items.push({
            id: u.id,
            type: 'user',
            title: u.name,
            subtitle: u.email,
            href: '#',
            icon: UserIcon,
            meta: u.avatar
        }));

        return items;
    }, [results]);

    // Handle clicks outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                inputRef.current?.blur();
            }

            if (flatResults.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % flatResults.length);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const selected = flatResults[selectedIndex];
                    if (selected && selected.href !== '#') {
                        handleSelect(selected.href);
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, flatResults, selectedIndex]);

    // Global shortcut (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                setIsOpen(true);
            }
        };
        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    // Search API with Debounce
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults(null);
            setSelectedIndex(0);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.success) {
                    setResults(data.data.results);
                    setSelectedIndex(0);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (href: string) => {
        if (href === '#') return;
        router.push(href);
        setIsOpen(false);
        setQuery('');
    };

    const clearSearch = () => {
        setQuery('');
        setResults(null);
        inputRef.current?.focus();
    };

    const highlightMatch = (text: string) => {
        if (!query.trim()) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase() ? (
                        <span key={i} className="text-blue-600 font-bold">
                            {part}
                        </span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Search Input Bar */}
            <div className="relative flex items-center">
                <div className="absolute left-4 text-gray-400">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Tìm dự án, công việc, thành viên..."
                    className="w-full h-11 pl-11 pr-12 bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 rounded-full text-sm font-medium outline-none transition-all"
                />
                <div className="absolute right-2.5 flex items-center gap-2">
                    {loading ? (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    ) : query.length > 0 ? (
                        <button
                            onClick={clearSearch}
                            className="p-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 shadow-sm"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    ) : (
                        null
                    )}
                </div>
            </div>

            {/* Results Dropdown */}
            {isOpen && (query.length > 0 || results) && (
                <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50">
                    {/* Active Search Context */}
                    {query.length > 0 && (
                        <div className="px-6 py-5 border-b border-gray-100 bg-white flex items-center gap-4 group cursor-pointer hover:bg-gray-50">
                            <div className="w-12 h-12 bg-[#E8F5E9] rounded-full flex items-center justify-center text-[#4CAF50]">
                                <Search className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 leading-tight">
                                    Tìm kiếm "<span className="text-[#4CAF50]">{query}</span>"
                                </h3>
                                <p className="text-xs text-gray-500 font-medium">trong toàn bộ hệ thống</p>
                            </div>
                        </div>
                    )}

                    {/* Results Content */}
                    <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
                        {loading && !results ? (
                            <div className="py-12 text-center">
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                                <p className="text-xs text-gray-500 font-medium">Đang tìm kết quả...</p>
                            </div>
                        ) : results && flatResults.length > 0 ? (
                            <div className="p-2 space-y-4">
                                {(['project', 'task', 'comment', 'user'] as const).map((type) => {
                                    const typeItems = flatResults.filter(item => item.type === type);
                                    if (typeItems.length === 0) return null;

                                    const typeLabels: Record<string, string> = {
                                        project: 'Dự án',
                                        task: 'Công việc',
                                        comment: 'Bình luận',
                                        user: 'Thành viên'
                                    };

                                    return (
                                        <div key={type} className="space-y-1">
                                            <div className="px-3 py-2 flex items-center gap-2">
                                                <div className="h-px flex-1 bg-gray-100" />
                                                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-[0.1em]">
                                                    {typeLabels[type]}
                                                </span>
                                                <div className="h-px flex-1 bg-gray-100" />
                                            </div>

                                            <div className="space-y-0.5">
                                                {typeItems.map((item) => {
                                                    const globalIndex = flatResults.findIndex(f => f.id === item.id && f.type === item.type);
                                                    const isSelected = selectedIndex === globalIndex;
                                                    const Icon = item.icon;

                                                    return (
                                                        <button
                                                            key={`${item.type}-${item.id}`}
                                                            onClick={() => handleSelect(item.href)}
                                                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                            className={`w-full text-left flex items-center gap-4 px-3 py-3 rounded-2xl ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                                        >
                                                            {/* Item Thumbnail/Icon */}
                                                            <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center overflow-hidden border ${isSelected ? 'bg-white border-blue-200' : 'bg-white border-gray-100'}`}>
                                                                {item.type === 'user' && item.meta ? (
                                                                    <Image src={item.meta} alt="" width={48} height={48} className="w-full h-full object-cover" />
                                                                ) : item.type === 'project' ? (
                                                                    <div className={`w-full h-full flex items-center justify-center font-bold text-lg text-blue-600 ${isSelected ? 'bg-blue-50/50' : 'bg-blue-50'}`}>
                                                                        {item.title.charAt(0).toUpperCase()}
                                                                    </div>
                                                                ) : (
                                                                    <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                                                                )}
                                                            </div>

                                                            {/* Item Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-semibold truncate text-gray-900">
                                                                    {highlightMatch(item.title)}
                                                                </div>
                                                                {item.subtitle && (
                                                                    <div className="text-[11px] truncate mt-0.5 font-normal text-gray-500">
                                                                        {item.subtitle}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Action Indicator */}
                                                            <div className={`shrink-0 ${isSelected ? 'opacity-100 text-blue-500' : 'opacity-0 text-gray-300'}`}>
                                                                <ChevronRight className="w-5 h-5" />
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : query.length >= 2 ? (
                            <div className="py-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <X className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-base font-bold text-gray-900">Không tìm thấy kết quả</p>
                                <p className="text-sm text-gray-400 mt-1">Vui lòng thử từ khóa khác</p>
                            </div>
                        ) : (
                            <div className="py-12 text-center px-10">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                                    <Search className="w-8 h-8" />
                                </div>
                                <p className="text-sm text-gray-600 font-bold">
                                    Nhập nội dung tìm kiếm
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Chúng tôi sẽ tìm kiếm trong dự án, công việc và thành viên...
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Guide */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Worksphere Search</span>
                    </div>
                </div>
            )}
        </div>
    );
}

