import { useNavigate } from "react-router-dom";
import MarketplaceLayout from "../components/MarketplaceLayout";
import ListingForm from "../components/ListingForm";

export default function CreateListingPage() {
    const navigate = useNavigate();

    const handleSubmit = (listing) => {
        // Navigate to the newly created listing
        navigate(`/marketplace/listing/${listing._id}`);
    };

    const handleCancel = () => {
        navigate('/marketplace');
    };

    return (
        <MarketplaceLayout showFilters={false}>
            <div className="max-w-4xl mx-auto">
                <ListingForm 
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            </div>
        </MarketplaceLayout>
    );
}