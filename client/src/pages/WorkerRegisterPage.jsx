import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserLocation } from "../context/LocationContext";
import { useToast } from "../context/ToastContext";
import axios from "axios";

const SERVICES = [
    "Women's Salon & Spa",
    "Men's Salon & Spa",
    "AC & Appliances Repair",
    "Cleaning & Pest Control",
    "Electrician, Plumber & Carpenter",
    "Painting & Waterproofing"
];

export default function WorkerRegisterPage() {
    const navigate = useNavigate();
    const { location, openLocationModal, getLocationString } = useUserLocation();
    const { showSuccess, showError } = useToast();

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const [skills, setSkills] = useState([]);
    const [currentSkill, setCurrentSkill] = useState({
        serviceName: "",
        subcategory: "",
        experienceYears: "",
        description: ""
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSkillChange = (e) => {
        setCurrentSkill({
            ...currentSkill,
            [e.target.name]: e.target.value
        });
    };

    const addSkill = () => {
        if (!currentSkill.serviceName || !currentSkill.experienceYears) {
            showError("Please fill service name and experience");
            return;
        }

        setSkills([...skills, { ...currentSkill }]);
        setCurrentSkill({
            serviceName: "",
            subcategory: "",
            experienceYears: "",
            description: ""
        });
    };

    const removeSkill = (index) => {
        setSkills(skills.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            showError("Passwords do not match");
            return;
        }

        if (skills.length === 0) {
            showError("Please add at least one skill");
            return;
        }

        setLoading(true);

        try {
            const registrationData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                skills: skills,
                location: location || undefined
            };

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/workers/register`,
                registrationData,
                { withCredentials: true }
            );

            if (response.data.success) {
                showSuccess("Registration successful! Awaiting admin approval.");
                setTimeout(() => {
                    navigate("/worker/login");
                }, 2000);
            }
        } catch (error) {
            console.error("Registration error:", error);
            showError(error.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Worker Registration
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Join our team of service professionals
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        pattern="[0-9]{10}"
                                        maxLength="10"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        minLength="8"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        minLength="8"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location *
                            </label>
                            <button
                                type="button"
                                onClick={openLocationModal}
                                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <svg className={`w-5 h-5 ${location ? "text-blue-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className={location ? "text-gray-900" : "text-gray-500"}>
                                    {getLocationString()}
                                </span>
                            </button>
                        </div>

                        {/* Skills Section */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Skills & Experience
                            </h2>
                            
                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Service *
                                        </label>
                                        <select
                                            name="serviceName"
                                            value={currentSkill.serviceName}
                                            onChange={handleSkillChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select Service</option>
                                            {SERVICES.map(service => (
                                                <option key={service} value={service}>{service}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Experience (Years) *
                                        </label>
                                        <input
                                            type="number"
                                            name="experienceYears"
                                            value={currentSkill.experienceYears}
                                            onChange={handleSkillChange}
                                            min="0"
                                            max="50"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={currentSkill.description}
                                            onChange={handleSkillChange}
                                            rows="2"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Brief description of your expertise..."
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={addSkill}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Skill
                                </button>
                            </div>

                            {/* Added Skills List */}
                            {skills.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-gray-700">Added Skills:</h3>
                                    {skills.map((skill, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                                            <div>
                                                <p className="font-medium text-gray-900">{skill.serviceName}</p>
                                                <p className="text-sm text-gray-600">
                                                    {skill.experienceYears} years experience
                                                </p>
                                                {skill.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{skill.description}</p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeSkill(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Registering..." : "Register as Worker"}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
