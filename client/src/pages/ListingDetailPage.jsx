import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MarketplaceLayout from "../components/MarketplaceLayout";
import ListingDetail from "../components/ListingDetail";
import ContactSellerModal from "../components/ContactSellerModal";

export default function ListingDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [showContactModal, setShowContactModal] = useState(false);
    const [currentListing, setCurrentListing] = useState(null);

    const handleContactSeller = (listing) => {
        setCurrentListing(listing);
        setShowContactModal(true);
    };

    const handleCloseContactModal = () => {
        setShowContactModal(false);
        setCurrentListing(null);
    };

    const handleEdit = (listing) => {
        navigate(`/marketplace/edit/${listing._id}`);
    };

    const handleDelete = async (listingId) => {
        if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/marketplace/listings/${listingId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (response.ok) {
                    alert('Listing deleted successfully');
                    navigate('/marketplace/my-listings');
                } else {
                    const data = await response.json();
                    alert(data.message || 'Failed to delete listing');
                }
            } catch (error) {
                console.error('Error deleting listing:', error);
                alert('Failed to delete listing. Please try again.');
            }
        }
    };

    return (
        <MarketplaceLayout showFilters={false}>
            <ListingDetail
                listingId={id}
                onContactSeller={handleContactSeller}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Contact Seller Modal */}
            <ContactSellerModal
                listing={currentListing}
                isOpen={showContactModal}
                onClose={handleCloseContactModal}
            />
        </MarketplaceLayout>
    );
}