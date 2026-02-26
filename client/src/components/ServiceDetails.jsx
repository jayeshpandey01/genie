import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getServiceDetails } from "../utils/api";
import ClipLoader from "react-spinners/ClipLoader";

const ServiceDetails = ({ serviceName }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [selectedServiceType, setSelectedServiceType] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log("🔄 Fetching service details for:", serviceName);
                
                const data = await getServiceDetails(serviceName);
                console.log("✅ Service details fetched:", data);
                
                if (!data) {
                    throw new Error("No service details returned");
                }
                
                if (!data.subcategories || Object.keys(data.subcategories).length === 0) {
                    console.warn("⚠️ No subcategories found for:", serviceName);
                }
                
                setDetails(data);
            } catch (err) {
                console.error("❌ Error fetching service details:", err);
                setError(`Failed to load service details: ${err.message || err}`);
            } finally {
                setLoading(false);
            }
        };

        if (serviceName) {
            fetchDetails();
        }
    }, [serviceName]);

    useEffect(() => {
        if (
            selectedSubcategory &&
            !details.subcategories[selectedSubcategory].serviceTypes
        ) {
            navigate(`/services/${serviceName}/${selectedSubcategory}`);
        }
    }, [selectedSubcategory, details, navigate, serviceName]);

    if (loading)
        return (
            <div className="w-[40rem] h-64 flex flex-col justify-center items-center">
                <ClipLoader />
                <p className="mt-4 text-gray-600">Loading service details...</p>
            </div>
        );
    if (error)
        return (
            <div className="w-[40rem] h-64 flex flex-col justify-center items-center text-center">
                <div className="text-red-600 mb-4">❌ {error}</div>
                <p className="text-gray-600 text-sm">
                    Service: <strong>{serviceName}</strong>
                </p>
                <p className="text-gray-500 text-xs mt-2">
                    Try running: <code>node scripts/fixServiceDetails.js</code>
                </p>
            </div>
        );
    if (!details)
        return (
            <div className="w-[40rem] h-64 flex flex-col justify-center items-center text-center">
                <div className="text-yellow-600 mb-4">⚠️ No details available</div>
                <p className="text-gray-600 text-sm">
                    Service: <strong>{serviceName}</strong>
                </p>
            </div>
        );

    const handleSubcategorySelect = (subcategory) => {
        setSelectedSubcategory(subcategory);
        setSelectedServiceType(null);
    };

    const handleServiceTypeSelect = (serviceType) => {
        setSelectedServiceType(serviceType);
        navigate(
            `/services/${serviceName}/${selectedSubcategory}/${serviceType}`
        );
    };

    return (
        <div className="p-10 pt-0">
            <h2 className="text-2xl text-center pb-8 font-bold">
                {serviceName}
            </h2>

            {!selectedSubcategory ? (
                <div>
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {" "}
                        {Object.keys(details.subcategories).map(
                            (subcategory) => (
                                <button
                                    key={subcategory}
                                    onClick={() =>
                                        handleSubcategorySelect(subcategory)
                                    }
                                    className="w-44 h-40 text-center mb-2 rounded border border-dashed border-black black hover:border-0 hover:ring-1 ring-black hover:scale-105 transition-transform duration-300 overflow-hidden"
                                >
                                    <div className="h-full flex flex-col justify-between">
                                        <img
                                            src={`${
                                                import.meta.env.VITE_BACKEND_URL
                                            }/${
                                                details.subcategories[
                                                    subcategory
                                                ].image
                                            }`}
                                            alt={subcategory}
                                            className="w-full h-28 p-2 object-contain border-b border-dashed border-black bg-gray-100 text-sm"
                                            onError={(e) => {
                                                console.error(`Failed to load subcategory image: ${e.target.src}`);
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.style.height = '100%';
                                            }}
                                        />
                                        <h1 className="text-sm leading-[1.25] h-12 flex items-center justify-center px-4">
                                            {subcategory}
                                        </h1>
                                    </div>
                                </button>
                            )
                        )}
                    </div>
                </div>
            ) : !selectedServiceType ? (
                <div className="flex flex-col gap-4">
                    {details.subcategories[selectedSubcategory].serviceTypes &&
                    Object.keys(
                        details.subcategories[selectedSubcategory].serviceTypes
                    ).length > 0 ? (
                        Object.keys(
                            details.subcategories[selectedSubcategory]
                                .serviceTypes
                        ).map((serviceType) => (
                            <button
                                key={serviceType}
                                onClick={() =>
                                    handleServiceTypeSelect(serviceType)
                                }
                                className="w-full text-left border border-dashed border-black hover:border-0 hover:ring-1 ring-black hover:scale-105 transition-transform duration-300 rounded overflow-hidden"
                            >
                                <div className="w-[28rem] h-36 flex items-center gap-4">
                                    <img
                                        src={`${
                                            import.meta.env.VITE_BACKEND_URL
                                        }/${
                                            details.subcategories[
                                                selectedSubcategory
                                            ].serviceTypes[serviceType].image
                                        }`}
                                        alt={serviceType}
                                        className="w-36 h-full object-cover object-left-top border-r border-dashed border-black"
                                        onError={(e) => {
                                            console.error(`Failed to load service type image: ${e.target.src}`);
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <div className="flex flex-col gap-1">
                                        <h1 className="text-lg">
                                            {serviceType}
                                        </h1>
                                        <div>
                                            {serviceType ===
                                                "Salon Classic" && (
                                                <div className="flex gap-2">
                                                    <div className="text-sm bg-green-100 text-green-800 text-center uppercase px-2 py-1 rounded">
                                                        ₹
                                                    </div>
                                                    <div className="text-sm bg-zinc-100 text-zinc-700 text-center uppercase px-2 py-1 rounded">
                                                        Economical
                                                    </div>
                                                </div>
                                            )}
                                            {serviceType === "Salon Prime" && (
                                                <div className="flex gap-2">
                                                    <div className="text-sm bg-green-100 text-green-800 text-center uppercase px-2 py-1 rounded">
                                                        ₹₹
                                                    </div>
                                                    <div className="text-sm bg-zinc-100 text-zinc-700 text-center uppercase px-2 py-1 rounded">
                                                        Premium
                                                    </div>
                                                </div>
                                            )}
                                            {serviceType === "Salon Luxe" && (
                                                <div className="flex gap-2">
                                                    <div className="text-sm bg-green-100 text-green-800 text-center uppercase px-2 py-1 rounded">
                                                        ₹₹₹
                                                    </div>
                                                    <div className="text-sm bg-zinc-100 text-zinc-700 text-center uppercase px-2 py-1 rounded">
                                                        Top Partners
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div>No service types available</div>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default ServiceDetails;
