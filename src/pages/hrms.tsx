// pages/hrms.tsx
import React, { useState, useEffect } from 'react';
import {
    Users,
    Building,
    CalendarCheck,
    FileText,
    CreditCard,
    Wallet,
    Briefcase,
    Home,
    ChevronDown,
    Download,
    Filter,
    Search,
    RefreshCw,
    User,
    Activity,
    MessageCircle,
    AlertTriangle,
    CheckCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import PettyCashManagement from '@/components/PettyCash/PettyCashManagement';
import { Tab } from '@/utils/types';
import { useFilter } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';

interface HRMSData {
    id: string;
    type: 'employee' | 'attendance' | 'payroll' | 'leave' | 'expense';
    title: string;
    status: 'active' | 'pending' | 'approved' | 'rejected' | 'completed';
    amount?: number;
    date: string;
    department: string;
    employee?: string;
}

const HRMS: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('petty-cash');
    const { dateRange } = useFilter(); // Use global date range from FilterContext
    const [loading, setLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [hrmsData, setHrmsData] = useState<HRMSData[]>([]);
    const [claimsData, setClaimsData] = useState<any>(null);

    const employeeId = user?.employeeId || '';
    const email = user?.email || '';
    const teamMembers = user?.team ? JSON.parse(user.team) : [];

    // Fetch HRMS claims data when component mounts or date range changes
    // Fetch HRMS claims data when component mounts or date range changes
    useEffect(() => {
        const fetchHRMSData = async () => {
            if (!dateRange.start || !dateRange.end) return;

            setLoading(true);
            try {
                const response = await fetch('https://n8n.gopocket.in/webhook/hrms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        source: 'claims',
                        start_date: dateRange.start,
                        end_date: dateRange.end,
                        employeeId,
                        email,
                        teamMembers
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch HRMS data: ${response.status}`);
                }

                const data = await response.json();
                console.log('HRMS Claims Data:', data);

                // Extract claims from the API response
                // The response is an array of objects with a "message" property containing the claims
                if (Array.isArray(data) && data.length > 0) {
                    // Flatten all claims from the message arrays
                    const allClaims = data.flatMap(item => item.message || []);
                    setClaimsData(allClaims);
                } else {
                    setClaimsData([]);
                }

            } catch (error) {
                console.error('Error fetching HRMS data:', error);
                setClaimsData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHRMSData();
    }, [dateRange]);

    // Generate dummy data for other tabs
    useEffect(() => {
        const generateDummyData = () => {
            const departments = ['Sales', 'Marketing', 'Engineering', 'HR', 'Finance', 'Operations'];
            const employees = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Singh', 'Vikram Mehta'];
            const statuses: ('active' | 'pending' | 'approved' | 'rejected' | 'completed')[] = ['active', 'pending', 'approved', 'rejected', 'completed'];

            const dummyData: HRMSData[] = [];

            for (let i = 1; i <= 30; i++) {
                const type = Math.random() > 0.5 ? 'employee' : 'expense';
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                dummyData.push({
                    id: `HR${String(i).padStart(4, '0')}`,
                    type,
                    title: type === 'employee' ? `New Employee Onboarding ${i}` : `Expense Claim ${i}`,
                    status,
                    amount: type === 'expense' ? Math.random() * 10000 + 500 : undefined,
                    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                    department: departments[Math.floor(Math.random() * departments.length)],
                    employee: employees[Math.floor(Math.random() * employees.length)]
                });
            }

            setHrmsData(dummyData);
        };

        generateDummyData();
    }, []);

    const tabs: Tab[] = [
        { id: 'petty-cash', label: 'Petty Cash', icon: Wallet },
        { id: 'overview', label: 'HRMS Overview', icon: Activity },
        { id: 'employees', label: 'Employee Management', icon: Users },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'leave', label: 'Leave Management', icon: FileText },
        { id: 'payroll', label: 'Payroll', icon: CreditCard },
        { id: 'reports', label: 'Reports', icon: MessageCircle }
    ];

    const renderOverviewTab = () => {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Requests</h3>
                    <div className="text-center py-8">
                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">Overview system will be implemented here</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderEmployeeManagementTab = () => {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Requests</h3>
                    <div className="text-center py-8">
                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">Team management system will be implemented here</p>
                    </div>
                </div>
            </div>
        );
    };


    const renderAttendanceTab = () => {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Overview</h3>
                    <div className="text-center py-8">
                        <CalendarCheck size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">Attendance tracking system will be implemented here</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderLeaveManagementTab = () => {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Requests</h3>
                    <div className="text-center py-8">
                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">Leave management system will be implemented here</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderPayrollTab = () => {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Payroll Processing</h3>
                    <div className="text-center py-8">
                        <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">Payroll processing system will be implemented here</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderReportsTab = () => {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">HRMS Reports</h3>
                    <div className="text-center py-8">
                        <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">Reporting dashboard will be implemented here</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="lg:pl-6">

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-lg shadow-blue-50 mb-6 border border-gray-100 overflow-x-auto">
                <div className="flex">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-fadeIn">
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'employees' && renderEmployeeManagementTab()}
                {activeTab === 'attendance' && renderAttendanceTab()}
                {activeTab === 'leave' && renderLeaveManagementTab()}
                {activeTab === 'payroll' && renderPayrollTab()}
                {activeTab === 'petty-cash' && (
                    <PettyCashManagement
                        initialClaims={claimsData || []}
                        currentUserEmail={user?.email || ''}
                    />
                )}
                {activeTab === 'reports' && renderReportsTab()}
            </div>
        </div>
    );
};

export default HRMS;