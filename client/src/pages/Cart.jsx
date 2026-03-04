import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { cart } from "../assets";
import { useNavigate } from "react-router-dom";
import {
    clearUserCart,
    createRazorpayOrder,
    verifyRazorpayPayment,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useUserLocation } from "../context/LocationContext";
import PortalContext from "../context/PortalContext";
import { ImageOff, PackageOpen } from "lucide-react";
import { HiCheckCircle, HiUser } from "react-icons/hi2";
import axios from "axios";
import WorkerSelection from "../components/WorkerSelection";

export default function Cart() {
    const { user, isAuthenticated } = useAuth();
    const { userLocation } = useUserLocation();
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState("online"); // "online" or "cod"
    const [selectedWorkers, setSelectedWorkers] = useState({}); // { serviceId: worker }
    const [showWorkerSelection, setShowWorkerSelection] = useState(false);

    const { openLogin } = useContext(PortalContext);

    const navigateToHome = () => {
        navigate("/");
    };

    const {
        cartServices,
        addToCart,
        removeFromCart,
        getCartTax,
        getCartSubTotal,
        getCartTotal,
    } = useContext(CartContext);

    // Sort and group cart services by category
    const sortedCartServices = [...cartServices].sort((a, b) =>
        a.category.localeCompare(b.category)
    );

    if (sortedCartServices.length === 0) {
        return (
            <>
                <div className="h-[75vh] flex flex-col items-center justify-center py-8">
                    <img src={cart} alt="Empty Cart" className="h-14 mb-4" />
                    <h1 className="text-3xl font-bold uppercase tracking-wider mb-4">
                        Your Cart is Empty
                    </h1>
                    <p className="text-lg text-gray-600">
                        Looks like you haven&apos;t added anything to your cart
                        yet.
                    </p>
                    <button
                        onClick={() => navigateToHome()}
                        className="mt-6 px-6 py-3 bg-yellow-300 border border-dashed border-black text-sm font-semibold shadow-inner uppercase tracking-wider rounded-md hover:bg-blue-400 hover:text-white transition-colors duration-300"
                    >
                        Start Booking Services
                    </button>
                </div>
            </>
        );
    }

    const handlePaymentWrap = (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            openLogin();
            return;
        }
        
        // Check if all services have workers assigned
        const servicesWithoutWorkers = sortedCartServices.filter(
            service => !selectedWorkers[service._id]
        );
        
        if (servicesWithoutWorkers.length > 0) {
            alert('Please select a worker for all services before proceeding to payment');
            setShowWorkerSelection(true);
            return;
        }
        
        if (paymentMethod === "cod") {
            handleCODOrder();
        } else {
            handlePayment();
        }
    };

    const handleWorkerSelect = (serviceId, worker) => {
        setSelectedWorkers(prev => ({
            ...prev,
            [serviceId]: worker
        }));
    };

    const allWorkersSelected = sortedCartServices.every(
        service => selectedWorkers[service._id]
    );

    const handleCODOrder = async () => {
        try {
            // Calculate cart totals
            const subtotal = getCartSubTotal();
            const tax = getCartTax();
            const total = getCartTotal();

            // Create COD order with worker assignments
            const orderData = {
                userId: user._id,
                paymentMethod: "cod",
                paymentStatus: "pending",
                items: sortedCartServices.map((service) => ({
                    serviceId: service._id,
                    image: service.image,
                    title: service.title,
                    quantity: service.quantity,
                    price: service.OurPrice,
                    total: service.OurPrice * service.quantity,
                    assignedWorker: selectedWorkers[service._id]?._id, // Add worker ID
                })),
                summary: {
                    subtotal,
                    tax,
                    total,
                    itemCount: sortedCartServices.length,
                },
                customerDetails: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: user.email,
                    phone: user.phone,
                },
                workerAssignments: Object.entries(selectedWorkers).map(([serviceId, worker]) => ({
                    serviceId,
                    workerId: worker._id,
                    workerName: `${worker.first_name} ${worker.last_name}`,
                    workerPhone: worker.phone
                }))
            };

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/razorpay/cod-order`,
                orderData,
                { withCredentials: true }
            );

            if (response.data.success) {
                // Clear cart
                sortedCartServices.forEach((service) => {
                    removeFromCart(service);
                });
                await clearUserCart();
                
                alert("Order placed successfully! Workers have been assigned. Pay cash on delivery.");
                navigate("/bookings");
            }
        } catch (error) {
            console.error("COD order failed:", error);
            alert("Unable to place order. Please try again later.");
        }
    };

    const handlePayment = async () => {
        try {
            // Calculate cart totals
            const subtotal = getCartSubTotal();
            const tax = getCartTax();
            const total = getCartTotal();

            // Create order with worker assignments
            const orderData = {
                _id: user._id,
                amount: parseFloat((total * 100).toFixed(2)),
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
                items: sortedCartServices.map((service) => ({
                    serviceId: service._id,
                    image: service.image,
                    title: service.title,
                    quantity: service.quantity,
                    price: service.OurPrice,
                    total: service.OurPrice * service.quantity,
                    assignedWorker: selectedWorkers[service._id]?._id, // Add worker ID
                })),
                summary: {
                    subtotal,
                    tax,
                    total,
                    itemCount: sortedCartServices.length,
                },
                customerDetails: {
                    name: user.first_name,
                    email: user.email,
                    phone: user.phone,
                },
                workerAssignments: Object.entries(selectedWorkers).map(([serviceId, worker]) => ({
                    serviceId,
                    workerId: worker._id,
                    workerName: `${worker.first_name} ${worker.last_name}`,
                    workerPhone: worker.phone
                }))
            };

            const order = await createRazorpayOrder(orderData);

            // Initialize Razorpay
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "GENIE",
                description: `Order Total: ₹${total} (Incl. GST)`,
                image: "https://raw.githubusercontent.com/AgarwalYash14/Genie/main/client/public/logo.png",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verificationData = {
                            userId: user._id,
                            razorpay_order_id: order.id, // Use the order ID from the created order
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderDetails: orderData,
                        };

                        const verification = await verifyRazorpayPayment(
                            verificationData
                        );

                        if (verification.success) {
                            sortedCartServices.forEach((service) => {
                                removeFromCart(service);
                            });
                            await clearUserCart();
                            navigate("/bookings");
                        } else {
                            throw new Error(
                                verification.message ||
                                    "Payment verification failed"
                            );
                        }
                    } catch (error) {
                        console.error("Payment verification failed:", error);
                        alert(
                            "Payment verification failed. Please contact support."
                        );
                    }
                },
                prefill: {
                    name: user.name || "",
                    email: user.email || "",
                    contact: user.phone || "",
                },
                theme: {
                    color: "#FFFFEE",
                },
            };

            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();
        } catch (error) {
            console.error("Payment initialization failed:", error);
            alert("Unable to initialize payment. Please try again later.");
        }
    };

    return (
        <div className="min-h-screen flex gap-6 pb-8">
            <div className="w-3/4 flex flex-col pr-6 border-r border-black">
                <h1 className="text-4xl font-bold uppercase tracking-wider pb-6 font-[NeuwMachina]">
                    Cart
                </h1>
                
                {/* Toggle between Cart Items and Worker Selection */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setShowWorkerSelection(false)}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                            !showWorkerSelection
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        1. Cart Items ({sortedCartServices.length})
                    </button>
                    <button
                        onClick={() => setShowWorkerSelection(true)}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                            showWorkerSelection
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        2. Select Workers
                        {allWorkersSelected && (
                            <HiCheckCircle className="h-5 w-5 text-green-400" />
                        )}
                    </button>
                </div>

                {!showWorkerSelection ? (
                    <>
                        {/* Cart Items View */}
                        <div className="w-full grid grid-cols-6 gap-8 text-gray-600 text-sm tracking-wider uppercase py-2 pr-8">
                            <h1>Service</h1>
                            <h1 className="col-span-3">Description</h1>
                            <h1>Price</h1>
                            <h1>Quantity</h1>
                        </div>
                        <hr className="mt-1 mb-6 border-t border-gray-600" />
                        <div className="flex-grow overflow-auto">
                            {Array.from(
                                new Set(sortedCartServices.map((s) => s.category))
                            ).map((category, id) => (
                                <div key={category} className="mr-6">
                                    <div className="flex items-center pb-4 gap-2">
                                        <PackageOpen size={17} color="#16a34a " />
                                        <h1 className="text-green-600 text-sm font-extrabold uppercase tracking-wide">
                                            {category}
                                        </h1>
                                    </div>
                                    {sortedCartServices
                                        .filter(
                                            (service) => service.category === category
                                        )
                                        .map((service, id) => (
                                            <div key={id}>
                                                <div className="flex justify-between gap-4">
                                                    <div className="w-full grid grid-cols-6 gap-8">
                                                        {service.image ? (
                                                            <img
                                                                src={`${
                                                                    import.meta.env
                                                                        .VITE_BACKEND_URL
                                                                }/${service.image}`}
                                                                alt={service.title}
                                                                className="w-36 h-20 object-cover text-xs border border-black bg-gray-100 rounded"
                                                            />
                                                        ) : (
                                                            <div className="w-36 h-20 flex flex-col gap-1 items-center justify-center border border-black bg-gray-100 rounded">
                                                                <ImageOff
                                                                    size={16}
                                                                    color="#525252"
                                                                />
                                                                <h1 className="text-xs text-neutral-600">Image unavailable</h1>
                                                            </div>
                                                        )}
                                                        <p className="h-full flex items-center col-span-3">
                                                            {service.title}
                                                        </p>
                                                        <p className="h-full flex items-center">
                                                            ₹{service.OurPrice}
                                                        </p>
                                                        <div className="h-full flex items-center">
                                                            <div className="w-20 h-7 flex items-center justify-center text-sm border border-black rounded overflow-hidden">
                                                                <button
                                                                    onClick={() =>
                                                                        removeFromCart(
                                                                            service
                                                                        )
                                                                    }
                                                                    className="w-full h-full bg-yellow-300 text-black border-r border-black pt-1 pb-1.5 leading-[1] hover:bg-amber-300 transition-colors duration-300"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="bg-[#FFFFEE] w-20 h-full leading-[1.625rem] text-center">
                                                                    {
                                                                        cartServices.find(
                                                                            (
                                                                                cartService
                                                                            ) =>
                                                                                cartService._id ===
                                                                                service._id
                                                                        ).quantity
                                                                    }
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        addToCart(
                                                                            service
                                                                        )
                                                                    }
                                                                    className="w-full h-full bg-yellow-300 text-black border-l border-black pt-1 pb-1.5 leading-[1] hover:bg-amber-300 transition-colors duration-300"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {id < sortedCartServices.length - 1 && (
                                                    <hr className="border-t border-dashed border-black my-4" />
                                                )}
                                            </div>
                                        ))}
                                </div>
                            ))}
                        </div>
                        
                        {/* Next Button */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowWorkerSelection(true)}
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Next: Select Workers →
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Worker Selection View */}
                        <div className="flex-grow overflow-auto space-y-6">
                            {sortedCartServices.map((service) => (
                                <div key={service._id} className="bg-white rounded-lg border-2 border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            {service.image ? (
                                                <img
                                                    src={`${import.meta.env.VITE_BACKEND_URL}/${service.image}`}
                                                    alt={service.title}
                                                    className="w-16 h-16 object-cover rounded border border-gray-300"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 flex items-center justify-center border border-gray-300 bg-gray-100 rounded">
                                                    <ImageOff size={20} color="#525252" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-lg">{service.title}</h3>
                                                <p className="text-sm text-gray-600">₹{service.OurPrice}</p>
                                            </div>
                                        </div>
                                        {selectedWorkers[service._id] && (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <HiCheckCircle className="h-6 w-6" />
                                                <span className="font-medium">Worker Selected</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {selectedWorkers[service._id] ? (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {selectedWorkers[service._id].first_name?.[0]}
                                                        {selectedWorkers[service._id].last_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">
                                                            {selectedWorkers[service._id].first_name} {selectedWorkers[service._id].last_name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {selectedWorkers[service._id].phone}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newWorkers = { ...selectedWorkers };
                                                        delete newWorkers[service._id];
                                                        setSelectedWorkers(newWorkers);
                                                    }}
                                                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                                                >
                                                    Change Worker
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <WorkerSelection
                                            serviceId={service.title}
                                            userLocation={userLocation}
                                            onWorkerSelect={(worker) => handleWorkerSelect(service._id, worker)}
                                            selectedWorkerId={selectedWorkers[service._id]?._id}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Navigation Buttons */}
                        <div className="mt-6 flex justify-between">
                            <button
                                onClick={() => setShowWorkerSelection(false)}
                                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                ← Back to Cart
                            </button>
                            {allWorkersSelected && (
                                <button
                                    onClick={() => setShowWorkerSelection(false)}
                                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                                >
                                    <HiCheckCircle className="h-5 w-5" />
                                    All Workers Selected - Proceed to Payment
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
            <div className="h-full w-1/4 bg-yellow-200 flex flex-col justify-between rounded-md overflow-hidden">
                <h1 className="text-2xl font-bold uppercase tracking-wider p-5 pb-0">
                    Order Summary
                </h1>
                <div className="h-full flex flex-col justify-between p-5 overflow-auto">
                    <div className="pr-4 mb-5 overflow-auto">
                        {cartServices.map((service, id) => (
                            <div key={id}>
                                <p className="h-full flex items-center col-span-3 text-neutral-800">
                                    {service.title}
                                </p>
                                <div className="flex justify-between text-neutral-600 text-sm tracking-wider">
                                    <div className="flex items-center">
                                        <p>₹{service.OurPrice}</p>
                                        <span className="px-2">X</span>
                                        <p>
                                            {
                                                cartServices.find(
                                                    (cartService) =>
                                                        cartService._id ===
                                                        service._id
                                                ).quantity
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p>
                                            ₹
                                            {service.OurPrice *
                                                service.quantity}
                                        </p>
                                    </div>
                                </div>
                                {id < cartServices.length - 1 && (
                                    <hr className="border-t border-dashed border-black my-3" />
                                )}
                            </div>
                        ))}
                    </div>
                    <div>
                        <div className="py-2 border-y border-black">
                            <div className="flex items-center justify-between">
                                <h1 className="text-sm font-bold uppercase tracking-wider">
                                    Subtotal
                                </h1>
                                <p>₹{getCartSubTotal()}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <h1 className="text-sm font-bold uppercase tracking-wider">
                                    Tax
                                </h1>
                                <p>₹{getCartTax()}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-3">
                            <h1 className="text-sm font-bold uppercase tracking-wider">
                                Total
                            </h1>
                            <p>₹{getCartTotal()}</p>
                        </div>
                    </div>
                </div>
                
                {/* Worker Selection Status */}
                {!allWorkersSelected && (
                    <div className="px-5 pb-4">
                        <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <HiUser className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-orange-800">Workers Not Selected</p>
                                    <p className="text-xs text-orange-700 mt-1">
                                        Please select a worker for each service before proceeding to payment.
                                    </p>
                                    <button
                                        onClick={() => setShowWorkerSelection(true)}
                                        className="mt-2 text-xs font-medium text-orange-800 underline hover:text-orange-900"
                                    >
                                        Select Workers Now →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Selected Workers Summary */}
                {allWorkersSelected && (
                    <div className="px-5 pb-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                            <HiCheckCircle className="h-5 w-5 text-green-600" />
                            Selected Workers
                        </h2>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {Object.entries(selectedWorkers).map(([serviceId, worker]) => {
                                const service = sortedCartServices.find(s => s._id === serviceId);
                                return (
                                    <div key={serviceId} className="text-xs bg-green-50 border border-green-200 rounded p-2">
                                        <p className="font-medium text-gray-800 truncate">{service?.title}</p>
                                        <p className="text-gray-600">
                                            {worker.first_name} {worker.last_name}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Payment Method Selection */}
                <div className="px-5 pb-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-3">Payment Method</h2>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 border-2 border-black rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors">
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="online"
                                checked={paymentMethod === "online"}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-4 h-4"
                            />
                            <div className="flex-1">
                                <p className="font-medium">Online Payment</p>
                                <p className="text-xs text-gray-600">Pay via UPI, Card, Net Banking</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 border-2 border-black rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors">
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="cod"
                                checked={paymentMethod === "cod"}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-4 h-4"
                            />
                            <div className="flex-1">
                                <p className="font-medium">Cash on Delivery</p>
                                <p className="text-xs text-gray-600">Pay when service is completed</p>
                            </div>
                        </label>
                    </div>
                </div>
                
                <button
                    onClick={(e) => handlePaymentWrap(e)}
                    disabled={!allWorkersSelected}
                    className={`w-full tracking-wider p-6 transition-colors duration-300 ${
                        allWorkersSelected
                            ? 'bg-blue-800 text-white hover:bg-blue-900 cursor-pointer'
                            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                >
                    {!allWorkersSelected 
                        ? "SELECT WORKERS FIRST" 
                        : paymentMethod === "cod" 
                            ? "PLACE ORDER (COD)" 
                            : "PAY NOW"
                    }
                </button>
            </div>
        </div>
    );
}
