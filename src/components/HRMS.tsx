// pages/HRMS.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  Users, 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  UserCheck,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  Building,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Star,
  Award,
  Target
} from 'lucide-react';

const HRMS = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const hrStats = [
    { label: 'Total Employees', value: 156, icon: Users, color: 'text-blue-600', change: '+12%' },
    { label: 'Active Today', value: 142, icon: UserCheck, color: 'text-green-600', change: '+5%' },
    { label: 'On Leave', value: 8, icon: Calendar, color: 'text-yellow-600', change: '-2' },
    { label: 'New Hires', value: 15, icon: TrendingUp, color: 'text-purple-600', change: '+8%' },
    { label: 'Avg. Tenure', value: '2.8y', icon: Clock, color: 'text-orange-600', change: '+0.3y' },
    { label: 'Monthly Payroll', value: '$425K', icon: DollarSign, color: 'text-emerald-600', change: '+3.2%' }
  ];

  const employees = [
    {
      id: 1,
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      employeeId: 'EMP001',
      department: 'Engineering',
      designation: 'Senior Developer',
      email: 'john.doe@company.com',
      phone: '+1 (555) 123-4567',
      location: 'New York',
      joiningDate: '2022-03-15',
      status: 'active',
      performance: 4.5
    },
    {
      id: 2,
      name: 'Jane Smith',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      employeeId: 'EMP002',
      department: 'Marketing',
      designation: 'Marketing Manager',
      email: 'jane.smith@company.com',
      phone: '+1 (555) 123-4568',
      location: 'San Francisco',
      joiningDate: '2021-08-22',
      status: 'active',
      performance: 4.8
    },
    {
      id: 3,
      name: 'Mike Johnson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      employeeId: 'EMP003',
      department: 'Sales',
      designation: 'Sales Executive',
      email: 'mike.johnson@company.com',
      phone: '+1 (555) 123-4569',
      location: 'Chicago',
      joiningDate: '2023-01-10',
      status: 'active',
      performance: 4.2
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      employeeId: 'EMP004',
      department: 'HR',
      designation: 'HR Manager',
      email: 'sarah.wilson@company.com',
      phone: '+1 (555) 123-4570',
      location: 'Boston',
      joiningDate: '2020-11-05',
      status: 'active',
      performance: 4.9
    }
  ];

  const departments = [
    { name: 'Engineering', employees: 45, budget: '$2.5M', head: 'Robert Brown' },
    { name: 'Marketing', employees: 23, budget: '$1.2M', head: 'Jennifer Lee' },
    { name: 'Sales', employees: 34, budget: '$1.8M', head: 'Michael Chen' },
    { name: 'HR', employees: 12, budget: '$800K', head: 'Sarah Wilson' },
    { name: 'Finance', employees: 18, budget: '$1.1M', head: 'David Kim' },
    { name: 'Operations', employees: 24, budget: '$1.5M', head: 'Amanda Davis' }
  ];

  const performanceData = [
    { metric: 'Productivity', current: 92, target: 90, trend: 'up' },
    { metric: 'Quality', current: 88, target: 85, trend: 'up' },
    { metric: 'Attendance', current: 96, target: 95, trend: 'up' },
    { metric: 'Teamwork', current: 94, target: 90, trend: 'up' },
    { metric: 'Innovation', current: 85, target: 80, trend: 'up' }
  ];

  const recruitmentData = [
    { position: 'Senior Frontend Developer', department: 'Engineering', applicants: 45, status: 'Interview', posted: '2024-01-20' },
    { position: 'Product Manager', department: 'Product', applicants: 32, status: 'Screening', posted: '2024-01-22' },
    { position: 'UX Designer', department: 'Design', applicants: 28, status: 'Offer', posted: '2024-01-15' },
    { position: 'DevOps Engineer', department: 'Engineering', applicants: 38, status: 'Interview', posted: '2024-01-18' }
  ];

  const getPerformanceColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-100 text-green-800';
    if (score >= 4.0) return 'bg-blue-100 text-blue-800';
    if (score >= 3.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on-leave': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderDashboardTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {hrStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departments.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">{dept.name}</p>
                      <p className="text-sm text-gray-500">{dept.employees} employees</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{dept.budget}</p>
                    <p className="text-sm text-gray-500">{dept.head}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{metric.metric}</span>
                    <span className="font-semibold text-green-600">{metric.current}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${metric.current}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Target: {metric.target}%</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {metric.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'New hire', person: 'Alex Thompson', role: 'Product Designer', time: '2 hours ago' },
              { action: 'Promotion', person: 'Maria Garcia', role: 'Senior Manager', time: '1 day ago' },
              { action: 'Leave approved', person: 'David Kim', duration: '5 days', time: '2 days ago' },
              { action: 'Performance review', person: 'Team Engineering', status: 'Completed', time: '3 days ago' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      <span className="capitalize">{activity.action}</span>: {activity.person}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.role || activity.duration || activity.status} • {activity.time}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">View</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmployeeManagementTab = () => (
    <div className="space-y-6">
      {/* Employee List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Employee Directory</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={employee.avatar} alt={employee.name} />
                        <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{employee.name}</p>
                        <p className="text-sm text-gray-500">{employee.employeeId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      {employee.department}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      {employee.designation}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="w-3 h-3" />
                        {employee.email}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone className="w-3 h-3" />
                        {employee.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(employee.joiningDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={getPerformanceColor(employee.performance)}>
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      {employee.performance}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderAttendanceLeavesTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { status: 'Present', count: 142, color: 'bg-green-100 text-green-800' },
                { status: 'Late', count: 12, color: 'bg-yellow-100 text-yellow-800' },
                { status: 'Absent', count: 8, color: 'bg-red-100 text-red-800' },
                { status: 'On Leave', count: 6, color: 'bg-blue-100 text-blue-800' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <Badge className={item.color}>{item.status}</Badge>
                  <span className="text-lg font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leave Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'Annual Leave', used: 8, total: 15, color: 'bg-blue-500' },
                { type: 'Sick Leave', used: 3, total: 10, color: 'bg-green-500' },
                { type: 'Personal Leave', used: 1, total: 5, color: 'bg-purple-500' },
                { type: 'Maternity Leave', used: 0, total: 90, color: 'bg-pink-500' }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.type}</span>
                    <span className="text-gray-500">{item.used}/{item.total} days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${(item.used / item.total) * 100}%`,
                        backgroundColor: item.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col h-20 gap-2">
              <Clock className="w-6 h-6" />
              <span>Mark Attendance</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-20 gap-2">
              <Calendar className="w-6 h-6" />
              <span>Approve Leave</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-20 gap-2">
              <Users className="w-6 h-6" />
              <span>Bulk Update</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-20 gap-2">
              <Download className="w-6 h-6" />
              <span>Export Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees
                .sort((a, b) => b.performance - a.performance)
                .slice(0, 5)
                .map((employee, index) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={employee.avatar} alt={employee.name} />
                        <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{employee.name}</p>
                        <p className="text-sm text-gray-500">{employee.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getPerformanceColor(employee.performance)}>
                        <Award className="w-3 h-3 mr-1" />
                        {employee.performance}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">Rank #{index + 1}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { goal: 'Complete Q1 Reviews', progress: 85, deadline: '2024-03-31' },
                { goal: 'Team Training Completion', progress: 60, deadline: '2024-02-28' },
                { goal: 'Employee Engagement Survey', progress: 30, deadline: '2024-03-15' },
                { goal: 'Leadership Development', progress: 45, deadline: '2024-04-30' }
              ].map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{goal.goal}</span>
                    <span className="text-gray-500">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                    <Target className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRecruitmentTab = () => (
    <div className="space-y-6">
      {/* Open Positions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Open Positions</CardTitle>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Position
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recruitmentData.map((position, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{position.position}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{position.department}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      {position.applicants}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      position.status === 'Offer' ? 'bg-green-100 text-green-800' :
                      position.status === 'Interview' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {position.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(position.posted).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recruitment Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">45</div>
            <div className="text-sm text-gray-500">Active Positions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">128</div>
            <div className="text-sm text-gray-500">Total Applicants</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">32</div>
            <div className="text-sm text-gray-500">Interviews</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">15</div>
            <div className="text-sm text-gray-500">Offers Made</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'HR Dashboard', component: renderDashboardTab },
    { id: 'employees', label: 'Employee Management', component: renderEmployeeManagementTab },
    { id: 'attendance', label: 'Attendance & Leaves', component: renderAttendanceLeavesTab },
    { id: 'performance', label: 'Performance', component: renderPerformanceTab },
    { id: 'recruitment', label: 'Recruitment', component: renderRecruitmentTab }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Management System</h1>
          <p className="text-gray-500 mt-1">Comprehensive human resources management dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-5 p-0">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="p-6">
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id}>
                  {tab.component()}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRMS;