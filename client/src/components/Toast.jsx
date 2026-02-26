import { useState, useEffect } from 'react';
import { HiCheckCircle, HiXCircle, HiInformationCircle, HiExclamationTriangle } from 'react-icons/hi2';

export default function Toast({ message, type = 'info', duration = 5000, onClose }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
                if (onClose) onClose();
            }, 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <HiCheckCircle className="h-5 w-5 text-green-400" />;
            case 'error':
                return <HiXCircle className="h-5 w-5 text-red-400" />;
            case 'warning':
                return <HiExclamationTriangle className="h-5 w-5 text-yellow-400" />;
            default:
                return <HiInformationCircle className="h-5 w-5 text-blue-400" />;
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    const getTextColor = () => {
        switch (type) {
            case 'success':
                return 'text-green-800';
            case 'error':
                return 'text-red-800';
            case 'warning':
                return 'text-yellow-800';
            default:
                return 'text-blue-800';
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}>
            <div className={`rounded-lg border p-4 shadow-lg ${getBackgroundColor()}`}>
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {getIcon()}
                    </div>
                    <div className="ml-3 flex-1">
                        <p className={`text-sm font-medium ${getTextColor()}`}>
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(() => {
                                if (onClose) onClose();
                            }, 300);
                        }}
                        className={`ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                        <HiXCircle className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}