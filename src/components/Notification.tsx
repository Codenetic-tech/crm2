import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, CheckCheck, RefreshCw, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface NotificationUser {
    name: string;
    full_name: string;
}

interface NotificationItem {
    creation: string;
    from_user: NotificationUser;
    type: string;
    to_user: string;
    read: number;
    hash: string;
    notification_text: string;
    notification_type_doctype: string;
    notification_type_doc: string;
    reference_doctype: string;
    reference_name: string;
    route_name: string;
}

const NotificationSystem: React.FC = () => {
    const { employee } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('all');

    // Track previous unread count to trigger sound
    const lastUnreadCount = useRef<number>(0);
    const isFirstLoad = useRef<boolean>(true);

    // Sound URL (Bell/Ding sound)
    const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    // Helper for time ago
    const timeAgo = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch (e) {
            return dateString;
        }
    };

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            if (window.Notification.permission !== 'granted' && window.Notification.permission !== 'denied') {
                await window.Notification.requestPermission();
            }
        }
    };

    const triggerNotification = (count: number) => {
        // Play Sound
        notificationSound.play().catch(e => console.log('Audio play failed', e));

        // Show System Notification
        if ('Notification' in window && window.Notification.permission === 'granted') {
            new window.Notification('New Notification', {
                body: `You have ${count} unread notifications`,
                icon: '/lovable-uploads/e80701e6-7295-455c-a88c-e3c4a1baad9b.png' // Using app logo
            });
        }
    };

    const fetchNotifications = async () => {
        if (!employee?.email) return;

        setLoading(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
            const apiUrl = `${API_BASE_URL}/api/method/crm.api.lead.get_notifications`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({
                    email: employee.email,
                }),
            });

            if (!response.ok) {
                console.error('Failed to fetch notifications');
                return;
            }

            const data = await response.json();

            let newNotifications: NotificationItem[] = [];
            if (data.message?.data && Array.isArray(data.message.data)) {
                newNotifications = data.message.data.filter((n: NotificationItem) => {
                    // Filter out "removed by Administrator" notifications
                    return !/removed by\s*<span[^>]*>\s*Administrator\s*<\/span>/i.test(n.notification_text);
                });
            }

            setNotifications(newNotifications);

            // Check for new unread notifications
            const currentUnreadCount = newNotifications.filter(n => n.read === 0).length;

            if (!isFirstLoad.current && currentUnreadCount > lastUnreadCount.current) {
                triggerNotification(currentUnreadCount);
            }

            lastUnreadCount.current = currentUnreadCount;
            isFirstLoad.current = false;

        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        if (!employee?.email) return;

        setIsMarkingRead(true);
        const previousNotifications = [...notifications];
        setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));

        // Update ref so we don't trigger notification on next fetch if count drops
        lastUnreadCount.current = 0;

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
            const apiUrl = `${API_BASE_URL}/api/method/crm.api.lead.mark_as_read`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({
                    email: employee.email,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to mark as read');
            }

            await response.json();
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            setNotifications(previousNotifications);
            // Revert ref
            lastUnreadCount.current = previousNotifications.filter(n => n.read === 0).length;
        } finally {
            setIsMarkingRead(false);
        }
    };

    useEffect(() => {
        requestNotificationPermission();
        fetchNotifications();

        const intervalId = setInterval(fetchNotifications, 300000);
        return () => clearInterval(intervalId);
    }, [employee]);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const unreadCount = notifications.filter((n) => n.read === 0).length;

    // Get unique types
    const uniqueTypes = Array.from(new Set(notifications.map(n => n.type).filter(Boolean)));

    // Filter notifications
    const filteredNotifications = notifications.filter(n => {
        if (selectedType === 'all') return true;
        return n.type === selectedType;
    });

    const handleNotificationClick = (notification: NotificationItem) => {
        setIsOpen(false);

        let targetLeadId = notification.reference_name;

        // If reference_name is missing, try to parse from notification_text
        if (!targetLeadId && notification.notification_text) {
            const match = notification.notification_text.match(/CRM-LEAD-\d{4}-\d+/i);
            if (match) {
                targetLeadId = match[0];
            }
        }

        if (targetLeadId) {
            // Check if it's a WhatsApp notification
            const isWhatsApp = /whatsapp/i.test(notification.notification_text || '') ||
                /whatsapp/i.test(notification.type || '');

            if (isWhatsApp) {
                navigate(`/crm/leads/${targetLeadId}?tab=whatsapp`);
            } else {
                navigate(`/crm/leads/${targetLeadId}`);
            }
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group focus:outline-none">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <div className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            {unreadCount}
                        </div>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h4 className="font-semibold text-gray-900 text-sm">Notifications</h4>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-6 w-6 ${selectedType !== 'all' ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600`}
                                >
                                    <Filter className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedType('all')}>
                                    All
                                </DropdownMenuItem>
                                {uniqueTypes.map(type => (
                                    <DropdownMenuItem key={type} onClick={() => setSelectedType(type)}>
                                        {type}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-500 hover:text-blue-600"
                            onClick={() => fetchNotifications()}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                disabled={isMarkingRead}
                                className="h-6 text-[10px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                                <CheckCheck className="w-3 h-3 mr-1" />
                                Mark all read
                            </Button>
                        )}

                    </div>
                </div>

                <ScrollArea className="h-[400px]">
                    {filteredNotifications.length === 0 && !loading ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No notifications
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredNotifications.map((notification, index) => (
                                <div
                                    key={`${notification.creation}-${index}`}
                                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${notification.read === 0 ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div
                                        className="text-sm text-gray-800 mb-1 prose prose-sm max-w-none prose-p:my-0 prose-span:text-gray-900"
                                        dangerouslySetInnerHTML={{ __html: notification.notification_text }}
                                    />
                                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${notification.read === 0 ? 'bg-blue-500' : 'bg-transparent'}`}></span>
                                        {timeAgo(notification.creation)}
                                    </div>
                                </div>
                            ))}
                            {loading && notifications.length > 0 && (
                                <div className="p-4 text-center text-xs text-gray-400">
                                    Updating...
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationSystem;
