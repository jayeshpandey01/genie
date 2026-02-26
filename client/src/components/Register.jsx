import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../utils/api";
import { useUserLocation } from "../context/LocationContext";
import { HiMapPin } from "react-icons/hi2";

export default function Register({
    onRegisterSuccess,
    onClose,
    onSwitchToLogin,
}) {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const { location, openLocationModal, getLocationString } = useUserLocation();

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const registrationData = {
                ...userData,
                location: location || undefined
            };
            const response = await register(registrationData);
            onRegisterSuccess(response.user);
            onClose();
        } catch (error) {
            setError(error.msg || error.message || "An error occurred");
        }
    };

    const handleSwitchToLogin = (e) => {
        e.preventDefault();
        onClose();
        onSwitchToLogin();
    };

    const handleWorkerRegister = () => {
        onClose();
        navigate("/worker/register");
    };

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className="w-96 flex flex-col gap-8 p-10 pt-0"
            >
                <h1 className="text-lg text-center">Register your Account</h1>
                
                {/* User Type Selection */}
                <div className="flex gap-2 -mt-4">
                    <div className="flex-1 text-center p-2 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
                        <p className="text-sm font-semibold">Customer</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleWorkerRegister}
                        className="flex-1 text-center p-2 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                        <p className="text-sm font-semibold">Service Worker</p>
                    </button>
                </div>
                
                <div className="flex flex-col gap-3 -mt-4">
                    <div className="flex flex-col gap-2">
                        <div className="w-full flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter First Name"
                                name="first_name"
                                value={userData.first_name}
                                onChange={handleChange}
                                className="w-1/2 text-sm rounded-md p-2 text-ellipsis border border-dashed outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Enter Last Name"
                                name="last_name"
                                value={userData.last_name}
                                onChange={handleChange}
                                className="w-1/2 text-sm rounded-md p-2 text-ellipsis border border-dashed outline-none"
                            />
                        </div>
                        <input
                            type="tel"
                            placeholder="Enter Mobile No"
                            pattern="[0-9]{10}"
                            maxLength="10"
                            autoComplete="off"
                            name="phone"
                            value={userData.phone}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                                if (
                                    !/[0-9]/.test(e.key) &&
                                    e.key !== "Backspace" &&
                                    e.key !== "Delete" &&
                                    e.key !== "ArrowLeft" &&
                                    e.key !== "ArrowRight" &&
                                    e.key !== "Tab"
                                ) {
                                    e.preventDefault();
                                }
                            }}
                            className="text-sm rounded-md p-2 border border-dashed outline-none"
                        />
                        <input
                            type="email"
                            placeholder="Enter Email"
                            autoComplete="off"
                            name="email"
                            value={userData.email}
                            onChange={handleChange}
                            className="text-sm rounded-md p-2 border border-dashed outline-none"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            autoComplete="off"
                            name="password"
                            value={userData.password}
                            onChange={handleChange}
                            className="text-sm rounded-md p-2 border border-dashed outline-none"
                        />
                        <button
                            type="button"
                            onClick={openLocationModal}
                            className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <HiMapPin className={`w-5 h-5 ${location ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className={location ? 'text-gray-900' : 'text-gray-500'}>
                                {getLocationString()}
                            </span>
                        </button>
                    </div>
                </div>
                {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                )}
                <button
                    type="submit"
                    className="bg-yellow-300 border border-dotted border-black p-2 rounded-lg shadow-inner hover:bg-blue-400 hover:text-white hover:rounded-full transition-colors"
                >
                    Register
                </button>
                <h1 className="text-sm text-center -mt-4">
                    Already have an account?{" "}
                    <span
                        onClick={handleSwitchToLogin}
                        className="font-bold tracking-wide underline underline-offset-2"
                    >
                        Login
                    </span>
                </h1>
            </form>
        </>
    );
}
