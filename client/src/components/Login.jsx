import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../utils/api";

export default function Login({ onLoginSuccess, onClose, onSwitchToRegister }) {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        emailOrPhone: "",
        password: "",
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        // Basic validation
        if (!userData.emailOrPhone.trim()) {
            setError("Please enter your email or phone number");
            return;
        }
        
        if (!userData.password) {
            setError("Please enter your password");
            return;
        }
        
        try {
            const loginData = {
                email: userData.emailOrPhone.includes("@")
                    ? userData.emailOrPhone.trim()
                    : undefined,
                phone: !userData.emailOrPhone.includes("@")
                    ? userData.emailOrPhone.trim()
                    : undefined,
                password: userData.password,
            };

            const response = await login(loginData);

            onLoginSuccess(response.user);
            onClose();
        } catch (error) {
            console.error('Login error:', error);
            setError(error.msg || "Invalid Credentials. Please check your email/phone and password.");
        }
    };

    const handleSwitchToRegister = (e) => {
        e.preventDefault();
        onClose();
        onSwitchToRegister();
    };

    const handleWorkerLogin = () => {
        onClose();
        navigate("/worker/login");
    };

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className="w-96 flex flex-col gap-8 p-10 pt-0"
            >
                <h1 className="text-lg text-center">Login to your Account</h1>
                
                {/* User Type Selection */}
                <div className="flex gap-2 -mt-4">
                    <div className="flex-1 text-center p-2 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
                        <p className="text-sm font-semibold">Customer</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleWorkerLogin}
                        className="flex-1 text-center p-2 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                        <p className="text-sm font-semibold">Service Worker</p>
                    </button>
                </div>
                
                <div className="flex flex-col gap-3 -mt-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                            <input
                                id="validatingEmail"
                                type="text"
                                placeholder="Enter Email / Phone No"
                                autoComplete="off"
                                name="emailOrPhone"
                                value={userData.emailOrPhone}
                                onChange={handleChange}
                                className="text-sm rounded-md p-2 border border-dashed outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <input
                                id="validatingPassword"
                                type="password"
                                placeholder="Password"
                                autoComplete="off"
                                name="password"
                                value={userData.password}
                                onChange={handleChange}
                                className="text-sm rounded-md p-2 border border-dashed outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-1 select-none">
                        <input
                            type="checkbox"
                            name="RememberMe"
                            id="RememberMe"
                            className="outline-none"
                        />
                        <label
                            htmlFor="RememberMe"
                            className="text-sm font-thin"
                        >
                            Remember Me
                        </label>
                    </div>
                </div>
                {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                )}
                <button
                    type="submit"
                    className="bg-yellow-300 border border-dotted border-black p-2 rounded-lg shadow-inner hover:bg-blue-400 hover:text-white hover:rounded-full transition-colors"
                >
                    Login
                </button>
                <h1 className="text-sm text-center -mt-4">
                    Don&apos;t have an account?{" "}
                    <span
                        onClick={handleSwitchToRegister}
                        className="font-bold underline underline-offset-2 tracking-wide"
                    >
                        Register Now
                    </span>
                </h1>
            </form>
        </>
    );
}
