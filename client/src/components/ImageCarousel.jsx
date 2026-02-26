import { useState, useEffect, useRef } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

export default function ImageCarousel({ 
    images = [], 
    alt = "Image", 
    showThumbnails = true, 
    autoPlay = false, 
    className = "" 
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const intervalRef = useRef(null);
    const imageRefs = useRef([]);

    // Auto-play functionality
    useEffect(() => {
        if (autoPlay && images.length > 1) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) => 
                    prevIndex === images.length - 1 ? 0 : prevIndex + 1
                );
            }, 3000);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [autoPlay, images.length]);

    // Pause auto-play on hover
    const handleMouseEnter = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    const handleMouseLeave = () => {
        if (autoPlay && images.length > 1) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) => 
                    prevIndex === images.length - 1 ? 0 : prevIndex + 1
                );
            }, 3000);
        }
    };

    // Handle image loading
    const handleImageLoad = (index) => {
        setLoadedImages(prev => new Set([...prev, index]));
        if (index === 0) {
            setIsLoading(false);
        }
    };

    const handleImageError = (e, index) => {
        console.error(`Failed to load image at index ${index}:`, e.target.src);
        // Set a placeholder image
        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiM5QjlCQTAiLz4KPHA+dGggZD0iTTE5MCAx0EgMjEwVjE2MEgxOTBWMTQwWiIgZmlsbD0iI0YzRjRGNiIvPgo8dGV4dCB4PSIyMDAiIHk9IjIwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlCOUJBMCIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9IkFyaWFsIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPgo=';
        handleImageLoad(index);
    };

    // Navigation functions
    const goToPrevious = () => {
        setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
    };

    const goToNext = () => {
        setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
            } else if (e.key === 'ArrowRight') {
                setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, images.length]);

    // If no images, show placeholder
    if (!images || images.length === 0) {
        return (
            <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
                <div className="aspect-square flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl text-gray-300 mb-4">🖼️</div>
                        <span className="text-gray-500 text-lg">No Images Available</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Main Image Display */}
            <div className="relative aspect-square">
                {/* Loading Skeleton */}
                {isLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                        <div className="text-gray-400">Loading...</div>
                    </div>
                )}

                {/* Current Image */}
                <img
                    ref={el => imageRefs.current[currentIndex] = el}
                    src={images[currentIndex]}
                    alt={`${alt} ${currentIndex + 1}`}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                        loadedImages.has(currentIndex) ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => handleImageLoad(currentIndex)}
                    onError={(e) => handleImageError(e, currentIndex)}
                    loading="lazy"
                />

                {/* Preload adjacent images for smooth navigation */}
                {images.length > 1 && (
                    <>
                        {/* Preload previous image */}
                        <img
                            src={images[currentIndex === 0 ? images.length - 1 : currentIndex - 1]}
                            alt="preload"
                            className="hidden"
                            onLoad={() => handleImageLoad(currentIndex === 0 ? images.length - 1 : currentIndex - 1)}
                            onError={(e) => handleImageError(e, currentIndex === 0 ? images.length - 1 : currentIndex - 1)}
                        />
                        {/* Preload next image */}
                        <img
                            src={images[currentIndex === images.length - 1 ? 0 : currentIndex + 1]}
                            alt="preload"
                            className="hidden"
                            onLoad={() => handleImageLoad(currentIndex === images.length - 1 ? 0 : currentIndex + 1)}
                            onError={(e) => handleImageError(e, currentIndex === images.length - 1 ? 0 : currentIndex + 1)}
                        />
                    </>
                )}

                {/* Navigation Arrows - only show if multiple images */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                            aria-label="Previous image"
                        >
                            <HiChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                            aria-label="Next image"
                        >
                            <HiChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </div>

            {/* Thumbnail Navigation */}
            {showThumbnails && images.length > 1 && (
                <div className="p-2 bg-white">
                    <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                        {images.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                    currentIndex === index 
                                        ? 'border-blue-500 ring-2 ring-blue-200' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                aria-label={`Go to image ${index + 1}`}
                            >
                                <img
                                    src={image}
                                    alt={`${alt} thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yOCAyNEgzNlYzMkgyOFYyNFoiIGZpbGw9IiM5QjlCQTAiLz4KPHA+dGggZD0iTTMwIDI2SDM0VjMwSDMwVjI2WiIgZmlsbD0iI0YzRjRGNiIvPgo8L3N2Zz4K';
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Dot Indicators (alternative to thumbnails for mobile) */}
            {!showThumbnails && images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                currentIndex === index 
                                    ? 'bg-white' 
                                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}