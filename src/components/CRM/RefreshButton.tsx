import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isRefreshing: boolean;
    onRefresh: () => void;
    disabled?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
    isRefreshing,
    onRefresh,
    disabled = false,
    className,
    ...props
}) => {
    return (
        <button
            onClick={onRefresh}
            disabled={disabled || isRefreshing}
            className={`px-4 py-2 text-gray-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md ${className}`}
            title={isRefreshing ? 'Refreshing...' : disabled ? 'Please wait' : 'Refresh'}
            {...props}
        >
            {isRefreshing ? (
                <>
                    <RefreshCw size={16} className="animate-spin" />
                    Refreshing...
                </>
            ) : (
                <>
                    <RefreshCw size={16} />
                </>
            )}
        </button>
    );
};
