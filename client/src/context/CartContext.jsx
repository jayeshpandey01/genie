import { createContext, useContext, useEffect, useState } from "react";
import { updateUserCart, clearUserCart, getUserDetails } from "../utils/api";
import { 
    getCart, 
    updateCart, 
    addToCart as addToCartAPI, 
    removeFromCart as removeFromCartAPI, 
    updateCartItemQuantity,
    clearCart as clearCartAPI 
} from "../utils/cartApi";

export const CART_STORAGE_KEY = "userCart";
const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};

export const CartProvider = ({ children, isAuthenticated }) => {
    const [cartServices, setCartServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize and handle auth state changes
    useEffect(() => {
        const initializeCart = async () => {
            try {
                setLoading(true);
                setError(null);
                
                if (isAuthenticated) {
                    // Use the new cart API to get cart data
                    const serverCart = await getCart();
                    const localCart = JSON.parse(
                        localStorage.getItem(CART_STORAGE_KEY) || "[]"
                    );

                    // Transform server cart to match expected format
                    const transformedServerCart = serverCart.map((item) => ({
                        _id: item.service,
                        quantity: item.quantity,
                        title: item.title,
                        OurPrice: item.OurPrice,
                        category: item.category,
                        type: item.type,
                        time: item.time,
                        MRP: item.MRP,
                        description: item.description,
                        image: item.image,
                    }));

                    if (localCart.length > 0) {
                        // Merge carts only if there are items in local storage
                        const mergedCart = await mergeCartsOnLogin(
                            localCart,
                            transformedServerCart
                        );
                        setCartServices(mergedCart);
                        localStorage.removeItem(CART_STORAGE_KEY);
                    } else {
                        // Use server cart if no local cart
                        setCartServices(transformedServerCart);
                    }
                } else {
                    // Not authenticated - use local storage
                    const localCart = JSON.parse(
                        localStorage.getItem(CART_STORAGE_KEY) || "[]"
                    );
                    setCartServices(localCart);
                }
            } catch (err) {
                console.error("Cart initialization error:", err);
                setError(err.message);
                // Fallback to local storage on error
                const localCart = JSON.parse(
                    localStorage.getItem(CART_STORAGE_KEY) || "[]"
                );
                setCartServices(localCart);
            } finally {
                setLoading(false);
            }
        };

        initializeCart();
    }, [isAuthenticated]);

    // Modified save effect to prevent empty cart updates and use new API
    // Use debouncing to prevent excessive API calls
    useEffect(() => {
        if (!loading && cartServices) {
            // Debounce timer to prevent rapid API calls
            const timeoutId = setTimeout(() => {
                if (isAuthenticated) {
                    if (cartServices.length > 0) {
                        // Use the new updateCart API with retry logic
                        updateCart(cartServices).catch((err) => {
                            console.error("Error updating server cart:", err);
                            setError(err.message);
                        });
                    }
                } else {
                    localStorage.setItem(
                        CART_STORAGE_KEY,
                        JSON.stringify(cartServices)
                    );
                }
            }, 500); // Wait 500ms before updating

            return () => clearTimeout(timeoutId);
        }
    }, [cartServices, isAuthenticated, loading]);

    const mergeCartsOnLogin = async (localCart, serverCart) => {
        const mergedCart = [...serverCart];

        localCart.forEach((localItem) => {
            const existingItem = mergedCart.find(
                (item) => item._id === localItem._id
            );
            if (existingItem) {
                existingItem.quantity += localItem.quantity;
            } else {
                mergedCart.push(localItem);
            }
        });

        // Update server with merged cart using new API
        try {
            await updateCart(mergedCart);
            return mergedCart;
        } catch (error) {
            console.error("Error updating merged cart:", error);
            throw error;
        }
    };

    const addToCart = async (service) => {
        try {
            setError(null);
            
            if (isAuthenticated) {
                // Use atomic add operation for authenticated users
                const result = await addToCartAPI({
                    service: service._id,
                    quantity: 1,
                    title: service.title,
                    OurPrice: service.OurPrice,
                    category: service.category,
                    type: service.type,
                    time: service.time,
                    MRP: service.MRP,
                    description: service.description,
                    image: service.image
                });
                
                // Transform server response to match expected format
                const transformedCart = result.cart.map((item) => ({
                    _id: item.service,
                    quantity: item.quantity,
                    title: item.title,
                    OurPrice: item.OurPrice,
                    category: item.category,
                    type: item.type,
                    time: item.time,
                    MRP: item.MRP,
                    description: item.description,
                    image: item.image,
                }));
                
                setCartServices(transformedCart);
            } else {
                // For unauthenticated users, update local state
                setCartServices((prevServices) => {
                    const existingItemIndex = prevServices.findIndex(
                        (item) => item._id === service._id
                    );

                    if (existingItemIndex !== -1) {
                        const updatedServices = [...prevServices];
                        updatedServices[existingItemIndex] = {
                            ...updatedServices[existingItemIndex],
                            quantity:
                                updatedServices[existingItemIndex].quantity + 1,
                        };
                        return updatedServices;
                    }

                    return [...prevServices, { ...service, quantity: 1 }];
                });
            }
        } catch (err) {
            console.error("Add to cart error:", err);
            setError(err.message);
        }
    };

    const removeFromCart = async (service) => {
        try {
            setError(null);
            
            if (isAuthenticated) {
                const existingItem = cartServices.find(
                    (item) => item._id === service._id
                );

                if (existingItem && existingItem.quantity > 1) {
                    // Update quantity using atomic operation
                    const result = await updateCartItemQuantity(
                        service._id, 
                        existingItem.quantity - 1
                    );
                    
                    // Transform server response
                    const transformedCart = result.cart.map((item) => ({
                        _id: item.service,
                        quantity: item.quantity,
                        title: item.title,
                        OurPrice: item.OurPrice,
                        category: item.category,
                        type: item.type,
                        time: item.time,
                        MRP: item.MRP,
                        description: item.description,
                        image: item.image,
                    }));
                    
                    setCartServices(transformedCart);
                } else {
                    // Remove item completely using atomic operation
                    const result = await removeFromCartAPI(service._id);
                    
                    // Transform server response
                    const transformedCart = result.cart.map((item) => ({
                        _id: item.service,
                        quantity: item.quantity,
                        title: item.title,
                        OurPrice: item.OurPrice,
                        category: item.category,
                        type: item.type,
                        time: item.time,
                        MRP: item.MRP,
                        description: item.description,
                        image: item.image,
                    }));
                    
                    setCartServices(transformedCart);
                }
            } else {
                // For unauthenticated users, update local state
                setCartServices((prevServices) => {
                    const existingItem = prevServices.find(
                        (item) => item._id === service._id
                    );

                    if (existingItem && existingItem.quantity > 1) {
                        // If quantity > 1, decrement quantity
                        return prevServices.map((item) =>
                            item._id === service._id
                                ? { ...item, quantity: item.quantity - 1 }
                                : item
                        );
                    }

                    // If quantity is 1 or item not found, remove item
                    return prevServices.filter((item) => item._id !== service._id);
                });
            }
        } catch (err) {
            console.error("Remove from cart error:", err);
            setError(err.message);
        }
    };

    const clearCart = async () => {
        try {
            setError(null);
            
            if (isAuthenticated) {
                await clearCartAPI();
            } else {
                localStorage.removeItem(CART_STORAGE_KEY);
            }
            
            setCartServices([]);
        } catch (err) {
            console.error("Clear cart error:", err);
            setError(err.message);
        }
    };

    const getCartSubTotal = () => {
        const totalInclusive = cartServices.reduce(
            (total, item) => total + item.OurPrice * item.quantity,
            0
        );
        const tax = totalInclusive * 0.18;
        return (totalInclusive - tax).toFixed(2);
    };

    const getCartTax = () => {
        return (
            cartServices.reduce(
                (total, item) => total + item.OurPrice * item.quantity,
                0
            ) * 0.18
        ).toFixed(2);
    };

    const getCartTotal = () => {
        return cartServices
            .reduce((total, item) => total + item.OurPrice * item.quantity, 0)
            .toFixed(2);
    };

    const getCartCount = () => {
        return cartServices.reduce((count, item) => count + item.quantity, 0);
    };

    // Find cart item by service ID
    const findCartItem = (serviceId) => {
        return cartServices.find((item) => item._id === serviceId);
    };

    return (
        <CartContext.Provider
            value={{
                cartServices, // Matches your existing code structure
                loading,
                error,
                addToCart,
                removeFromCart,
                clearCart,
                getCartSubTotal,
                getCartTax,
                getCartTotal,
                getCartCount,
                findCartItem,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export { CartContext };
