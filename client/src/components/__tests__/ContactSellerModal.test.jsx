import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ContactSellerModal from '../ContactSellerModal';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';

// Mock fetch
global.fetch = vi.fn();

// Mock user data
const mockUser = {
    _id: 'user123',
    email: 'buyer@example.com',
    phone: '+91 98765 43210'
};

// Mock listing data
const mockListing = {
    _id: 'listing123',
    title: 'Test Listing',
    price: 25000,
    location: 'Mumbai, Maharashtra',
    images: ['test-image.jpg'],
    seller: {
        _id: 'seller123',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+91 87654 32109'
    }
};

// Test wrapper component
const TestWrapper = ({ children, user = mockUser }) => (
    <AuthProvider value={{ user, isAuthenticated: !!user }}>
        <ToastProvider>
            {children}
        </ToastProvider>
    </AuthProvider>
);

describe('ContactSellerModal', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    test('renders modal when open', () => {
        render(
            <TestWrapper>
                <ContactSellerModal
                    listing={mockListing}
                    isOpen={true}
                    onClose={vi.fn()}
                />
            </TestWrapper>
        );

        expect(screen.getByText('Contact Seller')).toBeInTheDocument();
        expect(screen.getByText('Test Listing')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('does not render when closed', () => {
        render(
            <TestWrapper>
                <ContactSellerModal
                    listing={mockListing}
                    isOpen={false}
                    onClose={vi.fn()}
                />
            </TestWrapper>
        );

        expect(screen.queryByText('Contact Seller')).not.toBeInTheDocument();
    });

    test('pre-fills user email and phone', () => {
        render(
            <TestWrapper>
                <ContactSellerModal
                    listing={mockListing}
                    isOpen={true}
                    onClose={vi.fn()}
                />
            </TestWrapper>
        );

        const emailInput = screen.getByDisplayValue('buyer@example.com');
        const phoneInput = screen.getByDisplayValue('+91 98765 43210');
        
        expect(emailInput).toBeInTheDocument();
        expect(phoneInput).toBeInTheDocument();
    });

    test('validates required fields', async () => {
        render(
            <TestWrapper>
                <ContactSellerModal
                    listing={mockListing}
                    isOpen={true}
                    onClose={vi.fn()}
                />
            </TestWrapper>
        );

        const submitButton = screen.getByText('Send Message');
        
        // Try to submit without message
        fireEvent.click(submitButton);
        
        // Should show validation error
        await waitFor(() => {
            expect(screen.getByText('Please enter a message')).toBeInTheDocument();
        });
    });

    test('submits form with valid data', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, message: 'Message sent successfully' })
        });

        const onClose = vi.fn();
        
        render(
            <TestWrapper>
                <ContactSellerModal
                    listing={mockListing}
                    isOpen={true}
                    onClose={onClose}
                />
            </TestWrapper>
        );

        // Fill in the message
        const messageInput = screen.getByPlaceholderText(/Hi, I'm interested/);
        fireEvent.change(messageInput, { target: { value: 'Is this item still available?' } });

        // Submit the form
        const submitButton = screen.getByText('Send Message');
        fireEvent.click(submitButton);

        // Wait for API call
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                `/api/marketplace/listings/${mockListing._id}/contact`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        message: 'Is this item still available?',
                        buyerEmail: 'buyer@example.com',
                        buyerPhone: '+91 98765 43210'
                    })
                })
            );
        });

        // Should close modal on success
        await waitFor(() => {
            expect(onClose).toHaveBeenCalled();
        });
    });

    test('handles API errors', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ success: false, message: 'Failed to send message' })
        });

        render(
            <TestWrapper>
                <ContactSellerModal
                    listing={mockListing}
                    isOpen={true}
                    onClose={vi.fn()}
                />
            </TestWrapper>
        );

        // Fill in the message
        const messageInput = screen.getByPlaceholderText(/Hi, I'm interested/);
        fireEvent.change(messageInput, { target: { value: 'Test message' } });

        // Submit the form
        const submitButton = screen.getByText('Send Message');
        fireEvent.click(submitButton);

        // Should show error message
        await waitFor(() => {
            expect(screen.getByText('Failed to send message')).toBeInTheDocument();
        });
    });

    test('closes modal when close button is clicked', () => {
        const onClose = vi.fn();
        
        render(
            <TestWrapper>
                <ContactSellerModal
                    listing={mockListing}
                    isOpen={true}
                    onClose={onClose}
                />
            </TestWrapper>
        );

        const closeButton = screen.getByLabelText('Close modal');
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalled();
    });

    test('closes modal when cancel button is clicked', () => {
        const onClose = vi.fn();
        
        render(
            <TestWrapper>
                <ContactSellerModal
                    listing={mockListing}
                    isOpen={true}
                    onClose={onClose}
                />
            </TestWrapper>
        );

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(onClose).toHaveBeenCalled();
    });
});