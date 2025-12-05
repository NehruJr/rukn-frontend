import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Main Pages
import Dashboard from './pages/dashboard/Dashboard';
import LeadList from './pages/leads/LeadList';
import LeadDetails from './pages/leads/LeadDetails';
import LeadPipeline from './pages/leads/LeadPipeline';
import PropertyList from './pages/properties/PropertyList';
import PropertyDetail from './pages/properties/PropertyDetail';
import AddEditProperty from './pages/properties/AddEditProperty';
import DealList from './pages/deals/DealList';
import DealPipeline from './pages/deals/DealPipeline';
import Calendar from './pages/calendar/Calendar';
import UserManagement from './pages/team/UserManagement';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';

// Layout
import MainLayout from './components/layout/MainLayout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Role Based Route Component
const RoleRoute = ({ children, roles }) => {
    const { user } = useAuthStore();

    if (!user || !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

function App() {
    const { isAuthenticated } = useAuthStore();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

            {/* Protected Routes */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Dashboard />} />

                {/* Leads */}
                <Route path="leads" element={<LeadList />} />
                <Route path="leads/pipeline" element={<LeadPipeline />} />
                <Route path="leads/:id" element={<LeadDetails />} />

                {/* Properties */}
                <Route path="properties" element={<PropertyList />} />
                <Route path="properties/new" element={<AddEditProperty />} />
                <Route path="properties/:id" element={<PropertyDetail />} />
                <Route path="properties/:id/edit" element={<AddEditProperty />} />

                {/* Deals */}
                <Route path="deals" element={<DealList />} />
                <Route path="deals/pipeline" element={<DealPipeline />} />

                {/* Calendar */}
                <Route path="calendar" element={<Calendar />} />

                {/* Team - Admin/Manager Only */}
                <Route
                    path="team"
                    element={
                        <RoleRoute roles={['admin', 'manager']}>
                            <UserManagement />
                        </RoleRoute>
                    }
                />

                {/* Reports */}
                <Route path="reports" element={<Reports />} />

                {/* Settings */}
                <Route path="settings" element={<Settings />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
