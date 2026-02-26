// src/App.jsx
import "./App.css";
import { Routes, Route } from "react-router-dom";
import PortalLayout from "./components/PortalLayout";
import Layout from "./layout/layout";
import HomePage from "./pages/HomePage";
import ServiceList from "./pages/ServiceList";
import ServiceDetails from "./components/ServiceDetails";
import Cart from "./pages/Cart";
import Bookings from "./pages/Bookings";
import MarketplacePage from "./pages/MarketplacePage";
import CategoryPage from "./pages/CategoryPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import CreateListingPage from "./pages/CreateListingPage";
import MyListingsPage from "./pages/MyListingsPage";
import EditListingPage from "./pages/EditListingPage";
import ProfilePage from "./pages/ProfilePage";
import WorkerRegisterPage from "./pages/WorkerRegisterPage";
import WorkerLoginPage from "./pages/WorkerLoginPage";
import WorkerLayout from "./worker/Layout/WorkerLayout";
import WorkerDashboard from "./worker/Pages/WorkerDashboard";
import WorkerTasks from "./worker/Pages/WorkerTasks";
import WorkerPayments from "./worker/Pages/WorkerPayments";
import Admin from "./admin/Pages/Main";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminServicesPage from "./admin/Pages/AdminServicesPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PortalProvider } from "./context/PortalContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { LocationProvider, useUserLocation } from "./context/LocationContext";
import LocationModal from "./components/LocationModal";
import { AnimatePresence } from "framer-motion";

function AppContent() {
    const { isAuthenticated, loading } = useAuth();
    const { isLocationModalOpen, closeLocationModal, setLocation } = useUserLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <PortalProvider>
            <CartProvider isAuthenticated={isAuthenticated}>
                <ToastProvider>
                    <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<HomePage />} />
                        <Route path="/services">
                            <Route
                                path=":serviceName"
                                element={<ServiceDetails />}
                            />
                            <Route
                                path=":serviceName/:subcategory"
                                element={<ServiceList />}
                            />
                            <Route
                                path=":serviceName/:subcategory/:serviceType"
                                element={<ServiceList />}
                            />
                            <Route
                                path=":serviceName/portal"
                                element={<PortalLayout />}
                            />
                        </Route>
                        <Route path="/viewcart" element={<Cart />} />
                        <Route path="/bookings" element={<Bookings />} />
                        
                        {/* Profile Route - Protected */}
                        <Route 
                            path="/profile" 
                            element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            } 
                        />
                        
                        {/* Worker Routes */}
                        <Route path="/worker/register" element={<WorkerRegisterPage />} />
                        <Route path="/worker/login" element={<WorkerLoginPage />} />
                        
                        {/* Worker Dashboard Routes - Protected */}
                        <Route path="/worker" element={<WorkerLayout />}>
                            <Route path="dashboard" element={<WorkerDashboard />} />
                            <Route path="tasks" element={<WorkerTasks />} />
                            <Route path="payments" element={<WorkerPayments />} />
                        </Route>
                        
                        {/* Marketplace Routes */}
                        <Route path="/marketplace" element={<MarketplacePage />} />
                        <Route path="/marketplace/category/:category" element={<CategoryPage />} />
                        <Route path="/marketplace/listing/:id" element={<ListingDetailPage />} />
                        
                        {/* Protected Marketplace Routes - Require Authentication */}
                        <Route 
                            path="/marketplace/create" 
                            element={
                                <ProtectedRoute>
                                    <CreateListingPage />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/marketplace/my-listings" 
                            element={
                                <ProtectedRoute>
                                    <MyListingsPage />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/marketplace/edit/:id" 
                            element={
                                <ProtectedRoute>
                                    <EditListingPage />
                                </ProtectedRoute>
                            } 
                        />
                        
                        <Route path="*" element={<h1>Not Found</h1>} />
                    </Route>

                    {/* Protected Admin Routes */}
                    <Route
                        path="/admin/*"
                        element={
                            <ProtectedAdminRoute>
                                <Routes>
                                    <Route path="*" element={<Admin />} />
                                </Routes>
                            </ProtectedAdminRoute>
                        }
                    />
                </Routes>

                {/* Global Location Modal */}
                <LocationModal
                    isOpen={isLocationModalOpen}
                    onClose={closeLocationModal}
                    onLocationSelect={setLocation}
                />
                </ToastProvider>
            </CartProvider>
        </PortalProvider>
    );
}

function App() {
    return (
        <AnimatePresence mode="wait">
            <AuthProvider>
                <LocationProvider>
                    <AppContent />
                </LocationProvider>
            </AuthProvider>
        </AnimatePresence>
    );
}

export default App;
