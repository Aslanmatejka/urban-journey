import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HowItWorks from './pages/HowItWorks';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiesPolicy from './pages/CookiesPolicy';
import LoginPage from './pages/LoginPage';  
import MainLayout from './components/layout/MainLayout';
import './styles/main.css';
import './styles/components.css';
import ProfilePage from './pages/ProfilePage';
import UserDashboard from './pages/UserDashboard';
import ShareFoodPage from './pages/ShareFoodPage';
import CommunityPage from './pages/CommunityPage';
import UserSettings from './pages/UserSettings';
import Notifications from './pages/Notifications';
import UserListings from './pages/UserListings';
import FindFoodPage from './pages/FindFoodPage';
import NearMePage from './pages/NearMePage';
import Blog from './pages/Blog';
import Success from './pages/Success';
import SignupPage from './pages/SignupPage';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminProfile from './pages/admin/AdminProfile';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import ContentModeration from './pages/admin/ContentModeration.jsx';
import DistributionAttendees from './pages/admin/DistributionAttendees.jsx';
import FoodDistributionManagement from './pages/admin/FoodDistributionManagement.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import { AuthProvider, useAuthContext } from './utils/AuthContext';
import { GoodsProvider, useGoods } from './utils/stores/goodsStore.jsx';
import { reportError } from './utils/helpers';
import Button from './components/common/Button';
import ErrorBoundary from './components/common/ErrorBoundary';

function AppContent() {
    const { isAuthenticated, isAdmin, loading, initialized } = useAuthContext();
    const [renderContent, setRenderContent] = React.useState(null);
    
    React.useEffect(() => {
        try {
            const path = window.location.pathname;
            
            // Show loading spinner while auth is initializing
            if (!initialized || loading) {
                setRenderContent(
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading...</p>
                        </div>
                    </div>
                );
                return;
            }
            
            // Public routes that don't require authentication
            // const publicRoutes = ['/', '/login', '/signup', '/how-it-works', '/blog', '/success', '/impact', '/find', '/terms', '/privacy', '/cookies'];
            
            // Admin-only routes
            // const adminRoutes = ['/admin', '/admin/users', '/admin/content', '/admin/distribution', '/admin/reports', '/admin/settings', '/admin/profile'];
            
            // Protected routes that require user authentication
            const protectedRoutes = ['/profile', '/share', '/community', '/settings', '/notifications', '/dashboard', '/listings'];

            // Check if current path requires admin access
            const isAdminRoute = path.startsWith('/admin');
            
            // Check if current path is a protected route
            const isProtectedRoute = protectedRoutes.includes(path);
            
            // Handle authentication redirects
            if (isAdminRoute && !isAdmin && path !== '/admin/login') {
                // Use setTimeout to avoid DOM manipulation during render
                setTimeout(() => {
                    window.location.replace('/admin/login');
                }, 0);
                return;
            }

            if (isProtectedRoute && !isAuthenticated) {
                // Use setTimeout to avoid DOM manipulation during render
                setTimeout(() => {
                    window.location.replace('/login');
                }, 0);
                return;
            }

            // Redirect authenticated users away from login/signup
            if ((path === '/login' || path === '/signup') && isAuthenticated) {
                // Use setTimeout to avoid DOM manipulation during render
                setTimeout(() => {
                    window.location.replace(isAdmin ? '/admin' : '/dashboard');
                }, 0);
                return;
            }

            const renderPage = () => {
                // Admin routes
                if (path.startsWith('/admin')) {
                    // Special case for admin login
                    if (path === '/admin/login') {
                        return <AdminLogin />;
                    }

                    // Admin authenticated routes
                    switch (path) {
                        case '/admin':
                            return <AdminDashboard />;
                        case '/admin/users':
                            return <UserManagement />;
                        case '/admin/content':
                            return <ContentModeration />;
                        case '/admin/distribution':
                            return <FoodDistributionManagement />;
                        case '/admin/reports':
                            return <AdminReports />;
                        case '/admin/settings':
                            return <AdminSettings />;
                        case '/admin/profile':
                            return <AdminProfile />;
                        default:
                            if (path.match(/\/admin\/distribution\/\d+\/attendees/)) {
                                return <DistributionAttendees />;
                            }
                            // if (path.match(/\/admin\/users\/\d+/)) {
                            //     return <UserDetails />;
                            // }
                            return (
                                <AdminLayout active="dashboard">
                                    <div className="text-center py-16">
                                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Page Not Found</h1>
                                        <p className="text-gray-600 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
                                        <Button
                                            variant="primary"
                                            onClick={() => window.location.href = '/admin'}
                                        >
                                            Go to Dashboard
                                        </Button>
                                    </div>
                                </AdminLayout>
                            );
                    }
                }

                // Regular routes with MainLayout
                let content;
                switch (path) {
                    // Public pages
                    case '/':
                        content = <HomePage/>;
                        break;
                    case '/find':
                        content = <FindFoodPage/>;
                        break;
                    case '/near-me':
                        content = <NearMePage/>;
                        break;
                    case '/blog':
                        content = <Blog/>;
                        break;
                    case '/success':
                        content = <Success/>;
                        break;
                    case '/how-it-works':
                        content = <HowItWorks />;
                        break;
                    case '/terms':
                        content = <TermsOfService />;
                        break;
                    case '/privacy':
                        content = <PrivacyPolicy />;
                        break;
                    case '/cookies':
                        content = <CookiesPolicy />;
                        break;

                    // Auth pages (without MainLayout)
                    case '/login':
                        return <LoginPage />;
                    case '/signup':
                        return <SignupPage />;
                    case '/forgot-password':
                        return <SignupPage />; //<ForgotPassword />;

                    // Protected pages
                    case '/profile':
                        content = <ProfilePage />;
                        break;
                    case '/dashboard':
                        content = <UserDashboard />;
                        break;

                    case '/share':
                        content = <ShareFoodPage />;
                        break;

                    case '/claim':
                        content = React.createElement(
                            React.lazy(() => import('./pages/ClaimFoodForm.jsx'))
                        );
                        break;

                    case '/community':
                        content = <CommunityPage />;
                        break;
                    case '/settings':
                        content = <UserSettings />;
                        break;
                    case '/notifications':
                        content = <Notifications />;
                        break;
                    case '/listings':
                        content = <UserListings />;
                        break;
                    

                    default:
                        // Check if path matches a food category
                        const categoryMatch = path.match(/^\/find\/category\/([a-zA-Z-]+)$/);
                        if (categoryMatch) {
                            content = <FindFoodPage initialCategory={categoryMatch[1]} />;
                            break;
                        }
                        
                        // Check if path matches a food item detail
                        // const foodItemMatch = path.match(/^\/food\/(\d+)$/);
                        // if (foodItemMatch) {
                        //     content = <FoodItemDetail foodId={foodItemMatch[1]} />;
                        //     break;
                        // }
                        
                        // 404 Page
                        content = (
                            <div className="text-center py-16">
                                <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                                <p className="text-gray-600 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
                                <Button
                                    variant="primary"
                                    onClick={() => window.location.href = '/'}
                                >
                                    Go Home
                                </Button>
                            </div>
                        );
                        break;
                }
                
                // Wrap non-auth pages in MainLayout
                return <MainLayout>{content}</MainLayout>;
            };

            setRenderContent(renderPage());
        } catch (error) {
            console.error('App component error:', error);
            reportError(error);
            setRenderContent(
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-600 mb-4">
                            <h1 className="text-2xl font-bold">Something went wrong</h1>
                            <p>Please refresh the page to try again</p>
                        </div>
                    </div>
                </div>
            );
        }
    }, [isAuthenticated, isAdmin, loading, initialized]);

    return renderContent;
}


function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <GoodsProvider>
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div><p className="text-gray-600">Loading...</p></div></div>}>
                        <AppContent />
                    </React.Suspense>
                </GoodsProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Router>
            <App />
        </Router>
    </React.StrictMode>
); 