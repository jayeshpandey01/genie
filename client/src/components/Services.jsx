import React from 'react';

const Services = ({ serviceImage, serviceName, onServiceClick }) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);
    
    // Construct the full image URL
    const imageUrl = serviceImage?.startsWith('http') 
        ? serviceImage 
        : `${import.meta.env.VITE_BACKEND_URL}/${serviceImage}`;
    
    return (
        <>
            <div onClick={() => onServiceClick(serviceName)}>
                <div className="w-full overflow-hidden rounded-md border border-black hover:shadow-lg hover:scale-105 duration-300 transition-transform">
                    <button className="w-full">
                        <div className="relative w-full h-36 border-b border-black bg-yellow-100">
                            {!imageLoaded && !imageError && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-pulse text-gray-400">Loading...</div>
                                </div>
                            )}
                            <img
                                src={imageUrl}
                                alt={serviceName}
                                className={`w-full h-full object-contain p-3 transition-opacity duration-300 ${
                                    imageLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                                onLoad={() => setImageLoaded(true)}
                                onError={(e) => {
                                    console.error(`Failed to load image: ${imageUrl}`);
                                    setImageError(true);
                                    e.target.onerror = null;
                                    e.target.src = '/placeholder-service.svg';
                                }}
                                loading="lazy"
                            />
                        </div>
                        <h1 className="h-12 flex items-center justify-center px-4 text-sm bg-yellow-200">
                            {serviceName}
                        </h1>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Services;
