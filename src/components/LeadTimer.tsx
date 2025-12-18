
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const LeadTimer: React.FC<{ createdAt: string }> = ({ createdAt }) => {
    const [timeRemaining, setTimeRemaining] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const updateTimer = () => {
            const createdDate = new Date(createdAt);
            const expirationDate = new Date(createdDate.getTime() + (45 * 24 * 60 * 60 * 1000)); // 45 days validity
            const now = new Date().getTime();
            const diff = expirationDate.getTime() - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeRemaining('Expired');
                return;
            }

            setIsExpired(false);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            const parts = [];
            if (days > 0) parts.push(`${days}d`);
            parts.push(`${hours}h`);

            setTimeRemaining(`${parts.join(' ')} remaining`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 3600000); // Update every hour

        return () => clearInterval(interval);
    }, [createdAt]);

    return (
        <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border w-fit whitespace-nowrap ${isExpired
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}
            title="Time remaining to convert (45 days validity)"
        >
            <Clock size={12} className={isExpired ? "text-red-500" : "text-emerald-500"} />
            <span>{timeRemaining}</span>
        </div>
    );
};
