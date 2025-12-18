// Header.tsx
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFilter } from '@/contexts/FilterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, User, LogOut, Settings, Bell, AlarmClockCheck, Ticket, TicketIcon, AlarmClockCheckIcon } from 'lucide-react';
import Notification from './Notification';
import { KYCTracker } from './KYCTracker';
import { toast } from '@/hooks/use-toast';
import { CheckTreePicker } from 'rsuite';
import { DateRangePicker } from 'rsuite';
import 'rsuite/CheckTreePicker/styles/index.css';
import 'rsuite/DateRangePicker/styles/index.css';

interface TreeDataNode {
  label: string;
  value: string;
  children?: TreeDataNode[];
}

interface HeaderProps {
  hierarchyTreeData: TreeDataNode[];
}

const Header: React.FC<HeaderProps> = ({ hierarchyTreeData }) => {
  const { user, logout } = useAuth();
  const {
    selectedHierarchy,
    setSelectedHierarchy,
    dateRange,
    setDateRange
  } = useFilter();

  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: "Search",
        description: `Searching for UCC: ${searchQuery}`,
      });
      // Implement actual search logic here
    }
  };

  // Handle date range change
  const handleDateChange = (value: [Date, Date] | null) => {
    if (value) {
      const [start, end] = value;

      // Format date to avoid timezone issues
      const formatDateForState = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      setDateRange({
        start: formatDateForState(start),
        end: formatDateForState(end)
      });
    }
  };

  // Convert string dates to Date objects for DateRangePicker
  const pickerValue = dateRange.start && dateRange.end
    ? [new Date(dateRange.start), new Date(dateRange.end)] as [Date, Date]
    : null;

  // Handle hierarchy selection
  const handleHierarchyChange = (value: string[]) => {
    setSelectedHierarchy(value);
  };

  // Clear hierarchy filter
  const clearHierarchyFilter = () => {
    setSelectedHierarchy([]);
  };

  // Get count of selected individuals (excluding branches)
  const getSelectedIndividualsCount = () => {
    return selectedHierarchy.filter(value => !value.startsWith('branch-')).length;
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-lg shadow-blue-50">
      <div className="flex items-center space-x-4 flex-1 pl-10">

        {/* Logo */}
        <img
          src="/expanded-logo.png"
          alt="Gopocket"
          className="h-7 w-auto"
        />

        {/* Hierarchy Filter */}
        {hierarchyTreeData.length > 0 && (
          <div className="flex items-center gap-2 pl-2">
            <div className="bg-white border border-slate-200 rounded-lg">
              <CheckTreePicker
                data={hierarchyTreeData}
                value={selectedHierarchy}
                onChange={handleHierarchyChange}
                placeholder="Select Team"
                style={{ width: 250 }}
                size="md"
                placement="bottomStart"
                cleanable
                onClean={clearHierarchyFilter}
                renderValue={(value, selectedNodes) => {
                  if (value.length === 0) {
                    return 'Select Team';
                  }

                  const individualCount = getSelectedIndividualsCount();
                  const branchCount = value.length - individualCount;

                  if (branchCount > 0 && individualCount > 0) {
                    return `${branchCount} branches, ${individualCount} users`;
                  } else if (branchCount > 0) {
                    return `${branchCount} branches`;
                  } else {
                    return `${individualCount} users`;
                  }
                }}
              />
            </div>
          </div>
        )}

      </div>


      <div className="flex items-center space-x-4">

        {/* KYC Tracker */}
        <div className="relative">
          <KYCTracker />
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-lg">
            <DateRangePicker
              value={pickerValue}
              onChange={handleDateChange}
              placeholder="Select Date Range"
              style={{ width: 250 }}
              size="md"
              showOneCalendar={false}
              ranges={[
                {
                  label: 'Today',
                  value: [new Date(), new Date()]
                },
                {
                  label: 'Yesterday',
                  value: [new Date(new Date().setDate(new Date().getDate() - 1)), new Date(new Date().setDate(new Date().getDate() - 1))]
                },
                {
                  label: 'Last 7 Days',
                  value: [new Date(new Date().setDate(new Date().getDate() - 6)), new Date()]
                },
                {
                  label: 'Last 30 Days',
                  value: [new Date(new Date().setDate(new Date().getDate() - 29)), new Date()]
                },
                {
                  label: 'This Month',
                  value: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()]
                },
                {
                  label: 'Last Month',
                  value: [
                    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                    new Date(new Date().getFullYear(), new Date().getMonth(), 0)
                  ]
                }
              ]}
              appearance="default"
            />
          </div>
        </div>
        {/* Search Bar */}
        {/* <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search UCC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 w-64 bg-slate-50 border-slate-200 rounded-lg"
          />
        </form> */}

        {/* Icons Container */}
        <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
          {/* Profile Icon */}
          <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group">
            <AlarmClockCheckIcon size={20} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Task
            </div>
          </button>

          {/* GitHub Icon */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group">
            <TicketIcon size={20} />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Tickets
            </div>
          </button>

          {/* Notification Icon */}
          <Notification />

        </div>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 hover:bg-slate-100">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white">
                  {user?.employeeId?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-sm font-medium text-slate-800">
                  {user?.employeeId}
                </div>
                <div className="text-xs text-slate-500">
                  {user?.firstName}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;