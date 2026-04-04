import styles from './EmptyState.module.css';

const EmptyState = ({
    icon,
    title,
    description,
    action,
    actionLabel,
    onAction
}) => {
    return (
        <div className={styles.emptyState}>
            {icon && (
                <div className={styles.icon}>
                    {icon}
                </div>
            )}
            <h3 className={styles.title}>{title}</h3>
            {description && <p className={styles.description}>{description}</p>}
            {action && onAction && (
                <button className={styles.actionButton} onClick={onAction}>
                    {action}
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
