import { useUIStore } from '@/store/uiStore';
import Toast from './Toast';
import styles from './ToastContainer.module.css';

const ToastContainer = () => {
    const { toasts, removeToast } = useUIStore();

    return (
        <div className={styles.container}>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={removeToast}
                />
            ))}
        </div>
    );
};

export default ToastContainer;
