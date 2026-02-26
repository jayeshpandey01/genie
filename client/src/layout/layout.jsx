import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Fixed Navbar */}
            <div className="w-full fixed max-sm:px-5 z-50">
                <Navbar />
            </div>
            
            {/* Main Content */}
            <main className="flex-grow mx-10 mt-24 max-sm:mx-5 mb-8">
                <Outlet />
            </main>
            
            {/* Footer - Always at bottom */}
            <Footer />
        </div>
    );
}
