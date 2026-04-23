import React from 'react';

const VerifiedTag = ({ verified }) => {
    if (!verified) return null;

    return (
        <span className="flex items-center gap-1 bg-blue-50 text-blue-600/60 px-2 py-1 rounded-md text-xs font-bold border border-blue-100/30 w-fit">
            <span className="material-icons-outlined text-[10px] leading-none">verified</span>
            Doctor Verified
        </span>
    );
};

export default VerifiedTag;
