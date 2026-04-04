import styles from './SkeletonLoader.module.css';

const SkeletonLoader = ({
    variant = 'text',
    width = '100%',
    height,
    count = 1,
    className = ''
}) => {
    const getHeight = () => {
        if (height) return height;
        switch (variant) {
            case 'text': return '1rem';
            case 'title': return '2rem';
            case 'avatar': return '3rem';
            case 'card': return '12rem';
            case 'chart': return '20rem';
            default: return '1rem';
        }
    };

    const skeletons = Array.from({ length: count }, (_, i) => (
        <div
            key={i}
            className={`${styles.skeleton} ${styles[variant]} ${className}`}
            style={{ width, height: getHeight() }}
        />
    ));

    return count === 1 ? skeletons[0] : <div className={styles.container}>{skeletons}</div>;
};

// Pre-built skeleton patterns
export const SkeletonCard = () => (
    <div className={styles.skeletonCard}>
        <SkeletonLoader variant="card" height="10rem" />
        <div className={styles.cardContent}>
            <SkeletonLoader variant="title" width="70%" />
            <SkeletonLoader variant="text" width="90%" />
            <SkeletonLoader variant="text" width="60%" />
        </div>
    </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
    <div className={styles.skeletonTable}>
        {Array.from({ length: rows }, (_, i) => (
            <div key={i} className={styles.skeletonRow}>
                <SkeletonLoader variant="text" width="20%" />
                <SkeletonLoader variant="text" width="30%" />
                <SkeletonLoader variant="text" width="25%" />
                <SkeletonLoader variant="text" width="15%" />
            </div>
        ))}
    </div>
);

export const SkeletonList = ({ items = 5 }) => (
    <div className={styles.skeletonList}>
        {Array.from({ length: items }, (_, i) => (
            <div key={i} className={styles.skeletonListItem}>
                <SkeletonLoader variant="avatar" width="3rem" />
                <div className={styles.skeletonListContent}>
                    <SkeletonLoader variant="text" width="40%" />
                    <SkeletonLoader variant="text" width="60%" />
                </div>
            </div>
        ))}
    </div>
);

export default SkeletonLoader;
