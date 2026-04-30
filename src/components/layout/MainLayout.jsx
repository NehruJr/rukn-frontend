import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '@/store/uiStore';
import { useEffect } from 'react';
import styles from './MainLayout.module.css';

const MainLayout = () => {
    const { sidebarOpen, closeSidebar } = useUIStore();
    const location = useLocation();

    // Auto-close sidebar on mobile when navigating
    useEffect(() => {
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    }, [location.pathname]);

    // Auto-close sidebar on small screens on initial mount
    useEffect(() => {
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    }, []);

    const isMobileOverlayVisible = sidebarOpen && window.innerWidth <= 768;

    return (
        <div className={styles.layout}>
            <Sidebar />

            {/* Backdrop overlay on mobile */}
            {isMobileOverlayVisible && (
                <div className={styles.overlay} onClick={closeSidebar} />
            )}

            <div className={`${styles.mainContent} ${!sidebarOpen ? styles.sidebarClosed : ''}`}>
                <Header />

                <main className={styles.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
