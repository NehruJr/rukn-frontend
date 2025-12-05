import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '@/store/uiStore';
import styles from './MainLayout.module.css';

const MainLayout = () => {
    const { sidebarOpen } = useUIStore();

    return (
        <div className={styles.layout}>
            <Sidebar />

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
