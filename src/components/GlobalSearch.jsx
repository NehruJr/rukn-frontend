import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Building2, FileText, Clock } from 'lucide-react';
import styles from './GlobalSearch.module.css';

const GlobalSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // CMD+K or CTRL+K to open
    useEffect(() => {
        const handleKeyDown = (e) => {
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

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && results[selectedIndex]) {
                e.preventDefault();
                handleNavigate(results[selectedIndex]);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    // Search function (mock - replace with actual API call)
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        // Mock search data - replace with API call
        const mockData = [
            { type: 'lead', id: '1', title: 'John Doe', subtitle: 'Lead • New', path: '/leads/1' },
            { type: 'property', id: '2', title: 'Modern Villa', subtitle: 'Property • Sale', path: '/properties/2' },
            { type: 'deal', id: '3', title: 'Deal with ABC Corp', subtitle: 'Deal • $50,000', path: '/deals/3' },
        ];

        const filtered = mockData.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
        );

        setResults(filtered);
        setSelectedIndex(0);
    }, [query]);

    const handleNavigate = (item) => {
        navigate(item.path);
        setIsOpen(false);
        setQuery('');
    };

    const getIcon = (type) => {
        switch (type) {
            case 'lead':
                return <Users size={18} />;
            case 'property':
                return <Building2 size={18} />;
            case 'deal':
                return <FileText size={18} />;
            case 'task':
                return <Clock size={18} />;
            default:
                return <Search size={18} />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.searchBox}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        placeholder="Search leads, properties, deals..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <kbd className={styles.kbd}>ESC</kbd>
                </div>

                {results.length > 0 ? (
                    <div className={styles.results}>
                        {results.map((item, index) => (
                            <div
                                key={item.id}
                                className={`${styles.result} ${index === selectedIndex ? styles.selected : ''}`}
                                onClick={() => handleNavigate(item)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className={styles.icon}>{getIcon(item.type)}</div>
                                <div className={styles.content}>
                                    <div className={styles.title}>{item.title}</div>
                                    <div className={styles.subtitle}>{item.subtitle}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : query ? (
                    <div className={styles.empty}>No results found for "{query}"</div>
                ) : (
                    <div className={styles.hint}>
                        <div className={styles.hintItem}>
                            <Users size={16} /> Search for leads
                        </div>
                        <div className={styles.hintItem}>
                            <Building2 size={16} /> Search for properties
                        </div>
                        <div className={styles.hintItem}>
                            <FileText size={16} /> Search for deals
                        </div>
                    </div>
                )}

                <div className={styles.footer}>
                    <div className={styles.shortcuts}>
                        <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
                        <span><kbd>↵</kbd> to select</span>
                        <span><kbd>ESC</kbd> to close</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
