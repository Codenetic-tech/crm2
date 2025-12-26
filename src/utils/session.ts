export interface SessionData {
    email: string;
    login_datetime: string;
    logout_datetime: string;
    message: 'logged in' | 'manually logged out' | 'tab closed';
}

export const getISTTime = () => {
    // Format: YYYY-MM-DD HH:mm:ss
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(new Date()).replace(', ', ' ');
};

export const trackSession = async (data: SessionData) => {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const apiUrl = `${API_BASE_URL}/api/method/crm.api.lead.session_webhook`;

        console.log('Tracking session event (IST):', data.message, data);

        await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            keepalive: true
        });
    } catch (error) {
        console.error('Failed to track session:', error);
    }
};
