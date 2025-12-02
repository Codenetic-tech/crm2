import React from 'react';
import { DateRangePicker } from 'rsuite';
import { Calendar, RefreshCw, User, Bell, Github } from 'lucide-react';
import { DateRange } from '@/utils/types';
import { formatDate } from '@/utils/types';
import 'rsuite/DateRangePicker/styles/index.css';

interface DateRangePickerProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  loading: boolean;
}

const CustomDateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  setDateRange,
  loading
}) => {
  const handleDateChange = (value: [Date, Date] | null) => {
    if (value) {
      const [start, end] = value;
      
      // Fix: Use local date components to avoid timezone issues
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

  // Convert string dates to Date objects for rsuite
  const pickerValue = dateRange.start && dateRange.end 
    ? [new Date(dateRange.start), new Date(dateRange.end)] as [Date, Date]
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-blue-50 p-6 mb-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
            <Calendar className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Date Range</h3>
            <p className="text-lg font-bold text-gray-800">
              {dateRange.start ? formatDate(dateRange.start) : ''} - {dateRange.end ? formatDate(dateRange.end) : ''}
            </p>
            {loading && (
              <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading data...
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Date Range Picker */}
          <div className="flex flex-col sm:flex-row gap-3">
            <DateRangePicker
              value={pickerValue}
              onChange={handleDateChange}
              disabled={loading}
              placeholder="Select Date Range"
              style={{ width: 400 }}
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

          {/* Icons Container */}
          <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
            {/* Profile Icon */}
            <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group">
              <User size={20} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Profile
              </div>
            </button>

            {/* Notification Icon */}
            <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group">
              <Bell size={20} />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
                3
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Notifications
              </div>
            </button>

            {/* GitHub Icon */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group">
              <Github size={20} />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                GitHub Repository
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDateRangePicker;