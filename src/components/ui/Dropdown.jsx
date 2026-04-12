import { useLanguage } from "@/hooks/useLanguage";
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import styles from './Dropdown.module.css';

const Dropdown = ({
    options = [],
    value,
    onChange,
    placeholder = 'Select...',
    multiSelect = false,
    searchable = false,
    label,
    error,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
    const { t } = useLanguage();
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = searchable
        ? options.filter((opt) =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : options;

    const handleSelect = (option) => {
        if (multiSelect) {
            const newValue = value?.includes(option.value)
                ? value.filter((v) => v !== option.value)
                : [...(value || []), option.value];
            onChange(newValue);
        } else {
            onChange(option.value);
            setIsOpen(false);
        }
    };

    const handleRemove = (valueToRemove, e) => {
        e.stopPropagation();
        onChange(value.filter((v) => v !== valueToRemove));
    };

    const getSelectedLabels = () => {
        if (!value) return placeholder;
        if (!multiSelect) {
            return options.find((opt) => opt.value === value)?.label || placeholder;
        }
        return value.map((v) => options.find((opt) => opt.value === v)?.label).filter(Boolean);
    };

    const selectedLabels = getSelectedLabels();

    return (
        <div className={`${styles.wrapper} ${className}`}>
            {label && <label className={styles.label}>{label}</label>}

            <div
                ref={dropdownRef}
                className={`${styles.dropdown} ${isOpen ? styles.open : ''} ${error ? styles.error : ''}`}
            >
                <div
                    className={styles.trigger}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className={styles.value}>
                        {multiSelect && Array.isArray(selectedLabels) ? (
                            selectedLabels.length > 0 ? (
                                <div className={styles.chips}>
                                    {selectedLabels.map((label, idx) => (
                                        <span key={idx} className={styles.chip}>
                                            {label}
                                            <button
                                                className={styles.chipRemove}
                                                onClick={(e) => handleRemove(value[idx], e)}
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className={styles.placeholder}>{placeholder}</span>
                            )
                        ) : (
                            <span className={!value ? styles.placeholder : ''}>
                                {selectedLabels}
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        size={18}
                        className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`}
                    />
                </div>

                {isOpen && (
                    <div className={styles.menu}>
                        {searchable && (
                            <div className={styles.searchWrapper}>
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        <div className={styles.options}>
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => {
                                    const isSelected = multiSelect
                                        ? value?.includes(option.value)
                                        : value === option.value;

                                    return (
                                        <div
                                            key={option.value}
                                            className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                                            onClick={() => handleSelect(option)}
                                        >
                                            {multiSelect && (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    readOnly
                                                    className={styles.checkbox}
                                                />
                                            )}
                                            <span>{option.label}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className={styles.empty}>{t('dashboard_extra.no_options_found')}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};

export default Dropdown;
