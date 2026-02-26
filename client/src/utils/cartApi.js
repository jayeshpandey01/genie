// Cart API utilities with retry logic for handling concurrency issues

const API_BASE = '/api/users';

// Helper function to make API calls with retry logic
const apiCallWithRetry = async (url, options, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (!response.ok) {
                // If it's a concurrent update error, retry
                if (data.error === 'CONCURRENT_UPDATE' && attempt < maxRetries) {
                    console.log(`Cart update conflict, retrying... (${attempt}/${maxRetries})`);
                    // Add exponential backoff delay
                    await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
                    continue;
                }
                throw new Error(data.msg || 'API call failed');
            }
            
            return data;
        } catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                console.log(`API call failed, retrying... (${attempt}/${maxRetries}):`, error.message);
                // Add delay before retry
                await new Promise(resolve => setTimeout(resolve, 100 * attempt));
            }
        }
    }
    
    throw lastError;
};

// Get cart contents
export const getCart = async () => {
    try {
        const response = await fetch(`${API_BASE}/cart`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch cart');
        }
        
        const data = await response.json();
        return data.cart || [];
    } catch (error) {
        console.error('Get cart error:', error);
        throw error;
    }
};

// Update entire cart (with retry logic)
export const updateCart = async (cartItems) => {
    return apiCallWithRetry(`${API_BASE}/cart`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(cartItems)
    });
};

// Add item to cart (atomic operation)
export const addToCart = async (item) => {
    return apiCallWithRetry(`${API_BASE}/cart/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(item)
    });
};

// Remove item from cart (atomic operation)
export const removeFromCart = async (serviceId) => {
    return apiCallWithRetry(`${API_BASE}/cart/remove/${serviceId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
};

// Update cart item quantity (atomic operation)
export const updateCartItemQuantity = async (serviceId, quantity) => {
    return apiCallWithRetry(`${API_BASE}/cart/update/${serviceId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ quantity })
    });
};

// Clear entire cart
export const clearCart = async () => {
    try {
        const response = await fetch(`${API_BASE}/cart`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to clear cart');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Clear cart error:', error);
        throw error;
    }
};

// Batch cart operations (for multiple items)
export const batchUpdateCart = async (operations) => {
    const results = [];
    const errors = [];
    
    for (const operation of operations) {
        try {
            let result;
            switch (operation.type) {
                case 'add':
                    result = await addToCart(operation.item);
                    break;
                case 'remove':
                    result = await removeFromCart(operation.serviceId);
                    break;
                case 'update':
                    result = await updateCartItemQuantity(operation.serviceId, operation.quantity);
                    break;
                default:
                    throw new Error(`Unknown operation type: ${operation.type}`);
            }
            results.push({ success: true, operation, result });
        } catch (error) {
            errors.push({ success: false, operation, error: error.message });
        }
    }
    
    return { results, errors, hasErrors: errors.length > 0 };
};