import React from 'react';

const RiskBadge = ({ risk }) => {
    const getColors = () => {
        switch (risk) {
            case 'underweight':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'overweight':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'obese':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'normal':
            default:
                return 'bg-green-100 text-green-700 border-green-200';
        }
    };

    const getLabel = () => {
        if (!risk) return 'Unknown';
        return risk.charAt(0).toUpperCase() + risk.slice(1);
    };

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getColors()} uppercase tracking-wide`}>
            {getLabel()}
        </span>
    );
};

export default RiskBadge;
