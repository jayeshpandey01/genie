import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../Components/AdminSidebar";
import AdminNavbar from "../Components/AdminNavbar";
import AdminServicesPage from "./AdminServicesPage";
import AdminDashboard from "./AdminDashboardNew";
import AdminBookings from "./AdminBookings";
import AdminMarketplace from "./AdminMarketplace";
import AdminWorkersPage from "./AdminWorkersPage";
import Footer from "../../layout/Footer";

export default function Main() {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex items-start gap-10 px-10 py-5 flex-grow">
                <AdminSidebar />
                <div className="w-full flex flex-col">
                    <AdminNavbar />
                    <div className="flex-grow">
                        <Routes>
                            <Route path="/" element={<AdminDashboard />} />
                            <Route path="/services" element={<AdminServicesPage />} />
                            <Route path="/bookings" element={<AdminBookings />} />
                            <Route path="/marketplace" element={<AdminMarketplace />} />
                            <Route path="/workers" element={<AdminWorkersPage />} />
                            <Route path="*" element={<div>Page not found</div>} />
                        </Routes>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
