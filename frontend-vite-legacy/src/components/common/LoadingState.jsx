import React from 'react';

const LoadingState = ({ message = "Finding best pediatric care nearby..." }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-24 h-24 mb-8">
                {/* Outer ring */}
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>

                {/* Center Icon Container */}
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-lg z-10">
                    <div className="animate-bounce">
                        <span className="material-symbols-outlined text-4xl text-blue-600">
                            cardiology
                        </span>
                    </div>
                </div>

                {/* Orbiting dot */}
                <div className="absolute inset-0 animate-spin-slow">
                    <div className="h-3 w-3 bg-blue-500 rounded-full absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 shadow-md"></div>
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2 animate-pulse">{message}</h3>
            <p className="text-gray-500 text-sm">Searching trusted hospitals and clinics...</p>

            <style>{`
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingState;
