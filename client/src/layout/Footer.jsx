import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaGithub } from "react-icons/fa";
import { MdEmail, MdPhone, MdLocationOn } from "react-icons/md";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Company Info */}
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Genie Marketplace</h3>
                        <p className="text-sm mb-4">
                            Your trusted platform for buying and selling quality items in your local community.
                        </p>
                        <div className="flex space-x-4">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                               className="hover:text-blue-500 transition-colors">
                                <FaFacebook size={20} />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                               className="hover:text-blue-400 transition-colors">
                                <FaTwitter size={20} />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                               className="hover:text-pink-500 transition-colors">
                                <FaInstagram size={20} />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                               className="hover:text-blue-600 transition-colors">
                                <FaLinkedin size={20} />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                               className="hover:text-gray-400 transition-colors">
                                <FaGithub size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/" className="hover:text-white transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/marketplace" className="hover:text-white transition-colors">
                                    Marketplace
                                </Link>
                            </li>
                            <li>
                                <Link to="/marketplace/create" className="hover:text-white transition-colors">
                                    Post an Item
                                </Link>
                            </li>
                            <li>
                                <Link to="/marketplace/my-listings" className="hover:text-white transition-colors">
                                    My Listings
                                </Link>
                            </li>
                            <li>
                                <Link to="/bookings" className="hover:text-white transition-colors">
                                    My Bookings
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Categories</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/marketplace/category/electronics" className="hover:text-white transition-colors">
                                    Electronics
                                </Link>
                            </li>
                            <li>
                                <Link to="/marketplace/category/furniture" className="hover:text-white transition-colors">
                                    Furniture
                                </Link>
                            </li>
                            <li>
                                <Link to="/marketplace/category/vehicles" className="hover:text-white transition-colors">
                                    Vehicles
                                </Link>
                            </li>
                            <li>
                                <Link to="/marketplace/category/clothing" className="hover:text-white transition-colors">
                                    Clothing
                                </Link>
                            </li>
                            <li>
                                <Link to="/marketplace/category/books" className="hover:text-white transition-colors">
                                    Books
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Contact Us</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start">
                                <MdEmail className="mt-1 mr-2 flex-shrink-0" size={18} />
                                <a href="mailto:support@genie-marketplace.com" className="hover:text-white transition-colors">
                                    support@genie-marketplace.com
                                </a>
                            </li>
                            <li className="flex items-start">
                                <MdPhone className="mt-1 mr-2 flex-shrink-0" size={18} />
                                <a href="tel:+1234567890" className="hover:text-white transition-colors">
                                    +91 12345-6789
                                </a>
                            </li>
                            <li className="flex items-start">
                                <MdLocationOn className="mt-1 mr-2 flex-shrink-0" size={18} />
                                <span>
                                    opp Reliance Petrol Pump<br />
                                    Nashik, India 422004
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="text-sm text-center md:text-left">
                            <p>&copy; {currentYear} Genie Marketplace. All rights reserved.</p>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-end gap-4 text-sm">
                            <Link to="/privacy" className="hover:text-white transition-colors">
                                Privacy Policy
                            </Link>
                            <span className="text-gray-600">|</span>
                            <Link to="/terms" className="hover:text-white transition-colors">
                                Terms of Service
                            </Link>
                            <span className="text-gray-600">|</span>
                            <Link to="/help" className="hover:text-white transition-colors">
                                Help Center
                            </Link>
                            <span className="text-gray-600">|</span>
                            <Link to="/about" className="hover:text-white transition-colors">
                                About Us
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
