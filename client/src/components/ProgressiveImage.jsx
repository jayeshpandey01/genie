import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { ImageLoading } from './LoadingStates';
import { ImageErrorFallback } from './ErrorFallbacks';

const ProgressiveImage = memo(function ProgressiveImage({
    src,
    alt,
    className = "",
    placeholderSrc = null,
    onLoad,
    onError,
    lazy = true,
    showLoadingState = true,
    errorFallback = null,
    ...props
}) {
    const [imageState, setImageState] = useState('loading');
    const [currentSrc, setCurrentSrc] = useState(placeholderSrc || null);
    const [isVisible, setIsVisible] = useState(!lazy);
    const imgRef = useRef(null);
    const observerRef = useRef(null);

    // Intersection Observer for lazy loading with improved performance
    useEffect(() => {
        if (!lazy || isVisible) return;

        // Use more aggressive intersection observer settings for better performance
        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observerRef.current?.disconnect();
                }
            },
            {
                threshold: 0.01, // Trigger earlier for smoother experience
                rootMargin: '100px' // Larger margin for preloading
            }
        );

        if (imgRef.current) {
            observerRef.current.observe(imgRef.current);
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [lazy, isVisible]);

    // Optimized image loading with better error handling
    useEffect(() => {
        if (!isVisible || !src) return;

        const img = new Image();
        let cancelled = false;
        
        const handleLoad = () => {
            if (!cancelled) {
                setCurrentSrc(src);
                setImageState('loaded');
                if (onLoad) onLoad();
            }
        };

        const handleError = () => {
            if (!cancelled) {
                setImageState('error');
                if (onError) onError();
            }
        };
        
        img.onload = handleLoad;
        img.onerror = handleError;

        // Start loading
        setImageState('loading');
        img.src = src;

        return () => {
            cancelled = true;
            img.onload = null;
            img.onerror = null;
        };
    }, [src, isVisible, onLoad, onError]);

    // Render loading state
    if (!isVisible || (imageState === 'loading' && showLoadingState && !currentSrc)) {
        return (
            <div ref={imgRef} className={className} {...props}>
                <ImageLoading className="w-full h-full" />
            </div>
        );
    }

    // Render error state
    if (imageState === 'error') {
        if (errorFallback) {
            return errorFallback;
        }
        
        return (
            <div ref={imgRef} className={className} {...props}>
                <ImageErrorFallback 
                    retry={() => {
                        setImageState('loading');
                        setIsVisible(true);
                    }}
                />
            </div>
        );
    }

    // Render image
    return (
        <div ref={imgRef} className={`relative ${className}`} {...props}>
            {currentSrc && (
                <img
                    src={currentSrc}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                        imageState === 'loaded' ? 'opacity-100' : 'opacity-75'
                    }`}
                    loading={lazy ? 'lazy' : 'eager'}
                />
            )}
            
            {/* Loading overlay for progressive loading */}
            {imageState === 'loading' && currentSrc && showLoadingState && (
                <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-full p-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                    </div>
                </div>
            )}
        </div>
    );
});

// Gallery component with progressive loading and performance optimizations
export const ProgressiveImageGallery = memo(function ProgressiveImageGallery({ 
    images = [], 
    alt = "", 
    className = "",
    onImageLoad,
    onImageError,
    showThumbnails = true,
    lazy = true
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState(new Set());

    const handleImageLoad = useCallback((index) => {
        setLoadedImages(prev => new Set([...prev, index]));
        if (onImageLoad) onImageLoad(index);
    }, [onImageLoad]);

    const handleImageError = useCallback((index) => {
        if (onImageError) onImageError(index);
    }, [onImageError]);

    const goToPrevious = useCallback(() => {
        setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
    }, [images.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    }, [images.length]);

    const selectImage = useCallback((index) => {
        setCurrentIndex(index);
    }, []);

    if (!images || images.length === 0) {
        return (
            <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
                <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p>No images available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main image */}
            <div className={`relative ${className}`}>
                <ProgressiveImage
                    src={images[currentIndex]}
                    alt={`${alt} - Image ${currentIndex + 1}`}
                    className="w-full aspect-square rounded-lg overflow-hidden"
                    lazy={lazy}
                    onLoad={() => handleImageLoad(currentIndex)}
                    onError={() => handleImageError(currentIndex)}
                />
                
                {/* Navigation arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                            aria-label="Previous image"
                        >
                            ←
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                            aria-label="Next image"
                        >
                            →
                        </button>
                    </>
                )}
                
                {/* Image counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </div>
            
            {/* Thumbnails */}
            {showThumbnails && images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => selectImage(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                                index === currentIndex 
                                    ? 'border-blue-500 ring-2 ring-blue-200' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <ProgressiveImage
                                src={image}
                                alt={`${alt} - Thumbnail ${index + 1}`}
                                className="w-full h-full"
                                lazy={index > 2} // Load first 3 thumbnails immediately
                                showLoadingState={false}
                                onLoad={() => handleImageLoad(index)}
                                onError={() => handleImageError(index)}
                            />
                        </button>
                    ))}
                </div>
            )}
            
            {/* Loading progress indicator */}
            {images.length > 1 && (
                <div className="text-center text-sm text-gray-500">
                    Loaded {loadedImages.size} of {images.length} images
                </div>
            )}
        </div>
    );
});

export default ProgressiveImage;