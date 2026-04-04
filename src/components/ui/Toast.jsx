import { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import styles from './Toast.module.css';

const Toast = ({
    id,
    message,
    type = 'info',
    duration = 5000,
    onClose
}) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, id, onClose]);

    const icons = {
        success: <CheckCircle size={20} />,
        error: <XCircle size={20} />,
        warning: <AlertCircle size={20} />,
        info: <Info size={20} />
    };

    return (
        <div className={`${styles.toast} ${styles[type]}`}>
            <div className={styles.icon}>
                {icons[type]}
            </div>
            <div className={styles.message}>{message}</div>
            <button
                className={styles.closeButton}
                onClick={() => onClose(id)}
                aria-label="Close notification"
            >
                <X size={18} />
            </button>
        </div>
    );
};

export default Toast;
