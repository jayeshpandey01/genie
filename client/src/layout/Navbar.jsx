import { useEffect, useState, useCallback, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import { bookings, cart, logo, marketplace } from "../assets";
import { HiUser, HiChevronDown } from "react-icons/hi2";

import Login from "../components/Login";
import Register from "../components/Register";
import PortalLayout from "../components/PortalLayout";

import { CartContext } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import PortalContext from "../context/PortalContext";
import LocationSelector from "../components/LocationSelector";

export default function Navbar() {
    const navigate = useNavigate();

    const {
        showAddress,
        openAddress,
        closeAddress,
        showLogin,
        openLogin,
        closeLogin,
        showRegister,
        openRegister,
        closeRegister,
    } = useContext(PortalContext);

    const { isAuthenticated, user, login, logout } = useAuth();
    const { getCartCount } = useContext(CartContext);

    const [top, setTop] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const scrollHandler = () => {
            window.scrollY > 10 ? setTop(false) : setTop(true);
        };
        window.addEventListener("scroll", scrollHandler);
        
        // Listen for marketplace login requests
        const handleMarketplaceLogin = () => {
            openLogin();
        };
        const handleMarketplaceRegister = () => {
            openRegister();
        };
        window.addEventListener('openLogin', handleMarketplaceLogin);
        window.addEventListener('openRegister', handleMarketplaceRegister);
        
        // Close user menu when clicking outside
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            window.removeEventListener("scroll", scrollHandler);
            window.removeEventListener('openLogin', handleMarketplaceLogin);
            window.removeEventListener('openRegister', handleMarketplaceRegister);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [top, openLogin, openRegister]);

    const handleLoginSuccess = useCallback(
        (userData) => {
            login(userData);
            closeLogin();
            
            // Redirect admin to dashboard
            if (userData.role === 'admin') {
                navigate('/admin');
            }
        },
        [closeLogin, login, navigate]
    );

    const handleRegisterSuccess = useCallback(
        (userData) => {
            login(userData);
            closeRegister();
            
            // Redirect admin to dashboard if registered as admin
            if (userData.role === 'admin') {
                navigate('/admin');
            }
        },
        [closeRegister, login, navigate]
    );

    const handleLogout = useCallback(async () => {
        try {
            await logout();
            navigate("/");
        } catch (error) {
            console.error("Logout failed", error);
        }
    }, [logout, navigate]);

    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        setCartCount(getCartCount());
    }, [getCartCount]);

    return (
        <>
            <div
                className={`bg-[#FFFFEE] px-10 ${
                    !top && `shadow-xl border-b border-black`
                }`}
            >
                <nav
                    className={` w-full flex items-center justify-between py-3 select-none z-40 border-b border-black ${
                        !top && `border-b-0`
                    }`}
                >
                    <div className="flex items-center gap-0.5">
                        <div className="pt-2">
                            <img src={logo} alt="" className="h-10" />
                        </div>
                        <Link
                            to="/"
                            className="text-2xl tracking-tighter font-semibold logo  hover:text-green-600 transition-colors duration-300"
                        >
                            GENIE
                        </Link>
                        {isAuthenticated && user?.role === "admin" && (
                            <Link
                                to="/admin"
                                className="text-xs uppercase font-semibold font-[NeuwMachina] tracking-wide mt-0.5 mx-2 bg-orange-200 border border-orange-600 rounded-md px-2 py-0.5 hover:text-orange-600 transition-colors duration-300"
                            >
                                Admin
                            </Link>
                        )}
                    </div>
                    <div className="hidden md:flex">
                        <LocationSelector />
                    </div>
                    <div className="hidden items-center gap-8 md:flex">
                        <Link to="/marketplace">
                            <div className="flex items-center gap-2 hover:text-orange-500">
                                <img
                                    src={marketplace}
                                    alt="Marketplace"
                                    className="h-6"
                                />
                                <span className="h-6">Marketplace</span>
                            </div>
                        </Link>
                        <Link to="/viewcart">
                            <div className="flex items-center gap-2 hover:text-orange-500">
                                <img
                                    id="cart"
                                    name="cart"
                                    src={cart}
                                    alt="Cart"
                                    className="h-6"
                                />
                                <div className="flex items-center gap-1 w-20 h-6">
                                    <span>Cart</span>
                                    <div className="flex">
                                        (
                                        <span className="pt-[0.055rem]">
                                            {cartCount}
                                        </span>
                                        )
                                    </div>
                                </div>
                            </div>
                        </Link>
                        {isAuthenticated && user ? (
                            <Link to="/bookings">
                                <div className="flex gap-2 hover:text-orange-500">
                                    <img
                                        src={bookings}
                                        alt="Bookings"
                                        className="h-6"
                                    />
                                    <span className="h-6">Bookings</span>
                                </div>
                            </Link>
                        ) : null}
                        <div className="w-[0.09rem] h-6 bg-black rounded-full"></div>
                        {isAuthenticated && user ? (
                            <>
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-2 hover:text-orange-500"
                                    >
                                        <span className="h-6">
                                            Hi, {user?.first_name}
                                        </span>
                                        <HiChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                                            <Link
                                                to="/profile"
                                                onClick={() => setShowUserMenu(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                My Profile
                                            </Link>
                                            <Link
                                                to="/bookings"
                                                onClick={() => setShowUserMenu(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                My Bookings
                                            </Link>
                                            <Link
                                                to="/marketplace/my-listings"
                                                onClick={() => setShowUserMenu(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                My Listings
                                            </Link>
                                            <hr className="my-2" />
                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    handleLogout();
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    onClick={openLogin}
                                    className="flex gap-2 hover:text-orange-500"
                                >
                                    <span className="h-6 ">Login</span>
                                </div>
                                <div
                                    onClick={openRegister}
                                    className="group relative px-4 py-1 rounded flex items-center justify-center gap-1 border-2 border-black overflow-hidden hover:rounded-full hover:text-white duration-200 transition-all"
                                >
                                    <div className="w-full h-full relative flex items-center justify-center gap-2 z-50">
                                        <HiUser htmlFor="user" size="18px" />
                                        <label htmlFor="user" className="h-6">
                                            Register
                                        </label>
                                    </div>
                                    <div className="absolute -bottom-full h-full w-full bg-blue-400 group-hover:bottom-0 transition-bottom duration-400 ease"></div>
                                </div>
                            </>
                        )}
                    </div>
                </nav>
            </div>
            <PortalLayout isOpen={showLogin} onClose={closeLogin}>
                <Login
                    onLoginSuccess={handleLoginSuccess}
                    onClose={closeLogin}
                    onSwitchToRegister={openRegister}
                />
            </PortalLayout>
            <PortalLayout isOpen={showRegister} onClose={closeRegister}>
                <Register
                    onRegisterSuccess={handleRegisterSuccess}
                    onClose={closeRegister}
                    onSwitchToLogin={openLogin}
                    openLogin={openLogin}
                />
            </PortalLayout>
        </>
    );
}
