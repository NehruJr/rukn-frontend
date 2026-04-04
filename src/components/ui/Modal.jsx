import { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={`${styles.modal} ${styles[size]}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    {title && <h3 className={styles.title}>{title}</h3>}
                    {showCloseButton && (
                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
