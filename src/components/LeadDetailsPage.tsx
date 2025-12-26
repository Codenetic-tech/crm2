// components/LeadDetailsPage.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity, CheckSquare, Mail, MessageCircle, FileText, MessageSquare,
  ChevronRight, Home, Building2, MailIcon, PhoneIcon,
  IndianRupee, ArrowUpRight, ArrowDownRight, Send, Paperclip,
  Smile, Calendar, Clock, User, Video, Phone, MoreVertical,
  Search, Filter, Archive, Trash2, Plus, RefreshCw,
  ChevronLeft, ChevronsUpDown, Check, Users,
} from 'lucide-react';
import { getLeadById, type Lead, fetchLeads } from '@/utils/crm';
import { getCachedLeadDetails, getCachedComments, saveCommentsToCache, type Comment } from '@/utils/crmCache';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/contexts/LeadContext';
import LeadTasksTab from '@/components/CRM/Lead Details/LeadTasksTab';
import LeadFormTab from '@/components/CRM/Lead Details/LeadFormTab';
import WhatsAppTab from '@/components/CRM/Lead Details/WhatsAppTab';
import { CampaignFilter, AssignedUserFilter, SourceFilter, getStatusColor as getSharedStatusColor } from '@/components/Filters';

// Import combobox components
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

// Filter functions
const globalFilterFn = (lead: Lead, filterValue: string) => {
  const search = filterValue.toLowerCase();
  return (
    lead.name?.toLowerCase().includes(search) ||
    lead.company?.toLowerCase().includes(search) ||
    lead.email?.toLowerCase().includes(search) ||
    lead.phone?.toLowerCase().includes(search) ||
    lead.city?.toLowerCase().includes(search) ||
    lead.source?.toLowerCase().includes(search) ||
    lead.campaign?.toLowerCase().includes(search) ||
    lead.status?.toLowerCase().includes(search) ||
    false
  );
};

const campaignFilterFn = (lead: Lead, filterValue: string) => {
  if (!filterValue || filterValue === 'all') return true;
  const campaign = lead.campaign || '';
  return campaign.toLowerCase().includes(filterValue.toLowerCase());
};

const assignedUserFilterFn = (lead: Lead, filterValue: string) => {
  if (!filterValue || filterValue === 'all') return true;
  const assignData = lead._assign as string;
  try {
    const assignedUsers = JSON.parse(assignData || "[]") as string[];
    return assignedUsers.some(user =>
      user.toLowerCase().includes(filterValue.toLowerCase())
    );
  } catch {
    return false;
  }
};

const statusFilterFn = (lead: Lead, filterValue: string) => {
  if (filterValue === 'all' || !filterValue) return true;
  return lead.status === filterValue;
};

const sourceFilterFn = (lead: Lead, filterValue: string) => {
  if (!filterValue || filterValue === 'all') return true;
  return (lead.source || '').toLowerCase() === filterValue.toLowerCase();
};

// Mock data for different tabs (you can replace these with API calls later)
const mockActivities = [
  { id: 1, action: 'Lead created', date: '2024-01-15 10:30 AM', user: 'System', type: 'created', description: 'New lead registered in system' },
  { id: 2, action: 'Initial contact made', date: '2024-01-16 02:15 PM', user: 'System', type: 'contact', description: 'Phone call - discussed basic requirements' },
  { id: 3, action: 'Product demo scheduled', date: '2024-01-17 11:00 AM', user: 'System', type: 'meeting', description: 'Demo scheduled for next week' },
  { id: 4, action: 'Proposal sent', date: '2024-01-18 04:45 PM', user: 'System', type: 'proposal', description: 'Sent enterprise proposal package' }
];

const mockEmails = [
  { id: 1, subject: 'Welcome to Our Platform', preview: 'Thank you for your interest in our services...', date: '2024-01-15 10:35 AM', read: true, type: 'sent' },
  { id: 2, subject: 'Follow-up on Demo Request', preview: 'Following up on our conversation about scheduling...', date: '2024-01-16 02:20 PM', read: true, type: 'received' },
  { id: 3, subject: 'Proposal Documents', preview: 'Attached please find the detailed proposal...', date: '2024-01-18 04:50 PM', read: false, type: 'sent' }
];


const LeadDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const { leads: contextLeads, isLoading: contextLoading, updateLead: updateLeadInContext } = useLeads();
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'form');

  // Sync activeTab with searchParams when searchParams change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // New states for comments
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // New states for navigation between leads
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [currentLeadIndex, setCurrentLeadIndex] = useState(-1);

  // Filter states
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedAssignedUser, setSelectedAssignedUser] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const employeeId = user?.employeeId || '';
  const email = user?.email || '';

  const tabs: Tab[] = [
    { id: 'form', label: 'Lead Details', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'comment', label: 'Comments', icon: MessageSquare },
    { id: 'task', label: 'Tasks', icon: CheckSquare },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle }
  ];

  // Local status options for this page only (different from global statusOptions in Filters.tsx)
  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'followup', label: 'Followup' },
    { value: 'Not Interested', label: 'Not Interested' },
    { value: 'Call Back', label: 'Call Back' },
    { value: 'Switch off', label: 'Switch off' },
    { value: 'RNR', label: 'RNR' },
    { value: 'won', label: 'Won' },
    { value: 'client', label: 'Client' }
  ];


  // Helper function to get display name from email
  const getDisplayName = (email: string) => {
    if (email === 'all') return 'All Users';
    const namePart = email.split('@')[0];
    return namePart.split('.').map(part =>
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  // Get all leads from context and filter by status
  const allLeads = useMemo(() => {
    // Filter to only include statuses that are in our custom statusOptions
    const filtered = contextLeads.filter(lead =>
      ['new', 'followup', 'Not Interested', 'Call Back', 'Switch off', 'RNR', 'won', 'client'].includes(lead.status)
    );
    // Sort by creation date (newest first) like in dashboard
    return filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [contextLeads]);

  // Get unique campaigns and assigned users
  const campaignOptions = useMemo(() => {
    const campaigns = Array.from(new Set(
      allLeads
        .map(lead => lead.campaign)
        .filter(Boolean)
        .sort()
    )).map(campaign => ({
      value: campaign,
      label: campaign
    }));

    return [{ value: 'all', label: 'All Campaigns' }, ...campaigns];
  }, [allLeads]);

  const sourceOptions = useMemo(() => {
    const sources = Array.from(new Set(
      allLeads
        .map(lead => lead.source)
        .filter(Boolean)
        .sort()
    )).map(source => ({
      value: source,
      label: source
    }));

    return [{ value: 'all', label: 'All Sources' }, ...sources];
  }, [allLeads]);

  const assignedUserOptions = useMemo(() => {
    const users = new Set<string>();
    allLeads.forEach(lead => {
      try {
        const assignData = JSON.parse(lead._assign || "[]") as string[];
        assignData.forEach(user => {
          if (user !== "gokul.krishna.687@gopocket.in") {
            users.add(user);
          }
        });
      } catch (e) {
        // ignore parsing errors
      }
    });

    const userOptions = Array.from(users).sort().map(user => ({
      value: user,
      label: getDisplayName(user)
    }));

    return [{ value: 'all', label: 'All Users' }, ...userOptions];
  }, [allLeads]);

  // Apply filters to leads
  useEffect(() => {
    let filtered = allLeads;

    // Apply global filter
    if (globalFilter) {
      filtered = filtered.filter(lead => globalFilterFn(lead, globalFilter));
    }

    // Apply campaign filter
    if (selectedCampaign && selectedCampaign !== 'all') {
      filtered = filtered.filter(lead => campaignFilterFn(lead, selectedCampaign));
    }

    // Apply assigned user filter
    if (selectedAssignedUser && selectedAssignedUser !== 'all') {
      filtered = filtered.filter(lead => assignedUserFilterFn(lead, selectedAssignedUser));
    }

    // Apply status filter
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(lead => statusFilterFn(lead, selectedStatus));
    }

    // Apply source filter
    if (selectedSource && selectedSource !== 'all') {
      filtered = filtered.filter(lead => sourceFilterFn(lead, selectedSource));
    }

    setFilteredLeads(filtered);
  }, [allLeads, globalFilter, selectedCampaign, selectedAssignedUser, selectedStatus, selectedSource]);

  // Update current lead index when filtered leads or leadId changes
  useEffect(() => {
    if (leadId && filteredLeads.length > 0) {
      const index = filteredLeads.findIndex(lead => lead.id === leadId);
      setCurrentLeadIndex(index);
    } else {
      setCurrentLeadIndex(-1);
    }
  }, [filteredLeads, leadId]);

  // Function to handle lead updates from child components
  const handleLeadUpdate = (updatedLead: Lead) => {
    setLead(updatedLead);
  };

  // Function to navigate to previous lead
  const goToPreviousLead = () => {
    if (currentLeadIndex > 0) {
      const previousLead = filteredLeads[currentLeadIndex - 1];
      navigate(`/crm/leads/${previousLead.id}`);
      // Reset tab to form view when navigating
      setActiveTab('form');
    }
  };

  // Function to navigate to next lead
  const goToNextLead = () => {
    if (currentLeadIndex < filteredLeads.length - 1) {
      const nextLead = filteredLeads[currentLeadIndex + 1];
      navigate(`/crm/leads/${nextLead.id}`);
      // Reset tab to form view when navigating
      setActiveTab('form');
    }
  };



  // Clear all filters
  const clearAllFilters = () => {
    setGlobalFilter('');
    setSelectedCampaign('');
    setSelectedSource('');
    setSelectedAssignedUser('');
    setSelectedStatus('all');
  };

  // Parse comments from lead object (instant, no fetching needed)
  const comments = useMemo(() => {
    if (!lead || !lead._comments) return [];

    try {
      const parsedComments = JSON.parse(lead._comments) as Array<{
        comment: string;
        by: string;
        name: string;
      }>;

      // Convert the simple comment format to the Comment interface format
      // Sort by name (which appears to be a timestamp-based ID) in reverse order
      return parsedComments
        .map((c, index) => ({
          name: c.name,
          owner: c.by,
          creation: new Date().toISOString(), // We don't have exact timestamp, use current
          modified: new Date().toISOString(),
          modified_by: c.by,
          docstatus: 0,
          idx: index,
          comment_type: 'Comment',
          comment_email: c.by,
          subject: null,
          comment_by: c.by,
          published: 0,
          seen: 0,
          reference_doctype: 'Lead',
          reference_name: lead.id,
          reference_owner: null,
          content: c.comment,
          ip_address: null,
        } as Comment))
        .reverse(); // Newest first
    } catch (error) {
      console.error('Error parsing comments from lead:', error);
      return [];
    }
  }, [lead]);

  // Function to post a new comment
  const postComment = async () => {
    if (!newComment.trim() || !leadId || postingComment) return;

    setPostingComment(true);
    try {
      const response = await fetch('https://n8n.gopocket.in/webhook/hrms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'postcomments',
          employeeId: employeeId,
          email: email,
          leadid: leadId,
          content: newComment.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to post comment: ${response.status}`);
      }

      // Clear the input immediately for better UX
      setNewComment('');

      // Refetch the lead to get updated comments
      const updatedLead = await getLeadById(leadId, employeeId, email, user.team);
      if (updatedLead) {
        setLead(updatedLead);
        // Update the lead in context as well
        await updateLeadInContext(updatedLead);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setPostingComment(false);
    }
  };

  // Get current lead from context leads (instant, no loading)
  useEffect(() => {
    if (leadId && allLeads.length > 0) {
      const currentLead = allLeads.find(l => l.id === leadId);
      if (currentLead) {
        setLead(currentLead);
      } else {
        // Lead not found in context, might be a different status
        // Fall back to fetching individually
        const loadLead = async () => {
          try {
            const cachedLead = await getCachedLeadDetails(leadId);
            if (cachedLead) {
              setLead(cachedLead);
              return;
            }
            const leadData = await getLeadById(leadId, employeeId, email, user.team);
            setLead(leadData);
          } catch (error) {
            console.error('Error fetching lead:', error);
            setLead(null);
          }
        };
        loadLead();
      }
    }
  }, [leadId, allLeads, employeeId, email, user.team]);

  // Scroll to bottom removed - now handled in WhatsAppTab
  // Get current lead from context leads (instant, no loading)





  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postComment();
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Lead['status']) => {
    return getSharedStatusColor(status);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return <User size={16} className="text-blue-500" />;
      case 'contact': return <Phone size={16} className="text-green-500" />;
      case 'meeting': return <Video size={16} className="text-purple-500" />;
      case 'proposal': return <FileText size={16} className="text-orange-500" />;
      default: return <Activity size={16} className="text-gray-500" />;
    }
  };

  if (contextLoading && allLeads.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
          <p className="text-gray-600 mb-4">The requested lead could not be found.</p>
          <button
            onClick={() => navigate('/crm')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to CRM
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-[30px] p-0.5 lg:pl-6 lg:pr-6 lg:pt-6">
      {/* Header (One Row) */}
      <div className="mb-6">
        <div className="flex items-center justify-between w-full">

          {/* LEFT — Breadcrumb */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/crm')}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <Home size={16} />
              <span>CRM</span>
            </button>

            <ChevronRight size={16} />

            <button
              onClick={() => navigate('/crm')}
              className="hover:text-blue-600 transition-colors"
            >
              Leads
            </button>

            <ChevronRight size={16} />

            <span className="text-gray-900 font-medium">{lead.id}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </span>
          </div>

          {/* RIGHT — Filters + Navigation (Merged) */}
          <div className="flex items-center gap-4">

            {/* Filters */}
            <div className="flex flex-row gap-3 items-center">
              <CampaignFilter
                value={selectedCampaign}
                onChange={setSelectedCampaign}
                options={campaignOptions}
                placeholder="All Campaigns"
                width="w-full sm:w-[300px]"
              />
              <AssignedUserFilter
                value={selectedAssignedUser}
                onChange={setSelectedAssignedUser}
                options={assignedUserOptions}
                placeholder="All Users"
                width="w-full sm:w-[180px]"
              />
              <SourceFilter
                value={selectedSource}
                onChange={setSelectedSource}
                options={sourceOptions}
                placeholder="All Sources"
                searchPlaceholder="Search source..."
                emptyMessage="No source found."
                width="w-full sm:w-[180px]"
              />
              <SourceFilter
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[{ value: 'all', label: 'All Status' }, ...statusOptions]}
                placeholder="All Status"
                searchPlaceholder="Search status..."
                emptyMessage="No status found."
                width="w-full sm:w-[150px]"
              />

              {(globalFilter || selectedCampaign || selectedAssignedUser || selectedStatus !== 'all') && (
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="h-10 text-gray-600 hover:text-gray-800"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={goToPreviousLead}
                disabled={currentLeadIndex <= 0}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 
                          hover:bg-blue-300 hover:shadow-md 
                          disabled:opacity-50 disabled:cursor-not-allowed 
                          transition-all duration-200"
                title="Previous Lead"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="text-sm font-medium text-gray-700">
                {currentLeadIndex + 1} of {filteredLeads.length}
              </span>

              <button
                onClick={goToNextLead}
                disabled={currentLeadIndex >= filteredLeads.length - 1}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 
                          hover:bg-blue-300 hover:shadow-md 
                          disabled:opacity-50 disabled:cursor-not-allowed 
                          transition-all duration-200"
                title="Next Lead"
              >
                <ChevronRight size={20} />
              </button>
            </div>

          </div>

        </div>
      </div>


      {/* Header */}
      {/*<div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                {lead.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
                <p className="text-gray-600">{lead.source}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MailIcon size={16} />
                    {lead.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PhoneIcon size={16} />
                    {lead.phone}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </span>
                </div>
                {lead.ucc && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>UCC: {lead.ucc}</span>
                    {lead.panNumber && <span>PAN: {lead.panNumber}</span>}
                  </div>
                )}
              </div>
            </div>*/}

      {/* Navigation Buttons and Lead Info */}
      {/*<div className="text-right">
              <div className="flex items-center justify-end gap-3 mb-4">
                <button
                  onClick={goToPreviousLead}
                  disabled={currentLeadIndex <= 0}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 
                            hover:bg-blue-300 hover:shadow-md 
                            disabled:opacity-50 disabled:cursor-not-allowed 
                            transition-all duration-200"
                  title="Previous Lead"
                >
                  <ChevronLeft size={20} />
                </button>

                <span className="text-sm font-medium text-gray-700">
                  {currentLeadIndex + 1} of {filteredLeads.length}
                </span>

                <button
                  onClick={goToNextLead}
                  disabled={currentLeadIndex >= filteredLeads.length - 1}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 
                            hover:bg-blue-300 hover:shadow-md 
                            disabled:opacity-50 disabled:cursor-not-allowed 
                            transition-all duration-200"
                  title="Next Lead"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-600">Last Modified</p>
              {lead.noOfEmployees && (
                <p className="text-sm text-gray-500 mt-1">{lead.lastActivity}</p>
              )}
            </div>
          </div>
        </div> */}

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
        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Activity Timeline</h3>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors">
                    <Filter size={16} />
                    Filter
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {mockActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors group">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <span className="text-sm text-gray-500 whitespace-nowrap">{activity.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-sm text-gray-500 mt-2">by {activity.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comment' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Comments Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Comments & Notes</h3>
                  <div className="text-sm text-gray-500">
                    {comments.length} comment{comments.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                      Add a Comment
                    </label>
                    <textarea
                      id="comment"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Type your comment here..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={postingComment}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newComment.trim() || postingComment}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {postingComment ? (
                        <>
                          <RefreshCw className="animate-spin h-4 w-4" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <MessageSquare size={16} />
                          Post Comment
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Comments List */}
              <div className="divide-y divide-gray-100">
                {comments.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No comments yet</p>
                    <p className="text-gray-400 text-sm mt-1">Be the first to add a comment</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.name} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                            {comment.comment_by?.charAt(0) || comment.comment_email?.charAt(0) || 'U'}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-600">
                                {comment.comment_by} ({comment.comment_email}) commented
                              </p>
                            </div>
                            <span className="text-sm text-gray-400 whitespace-nowrap">
                              {formatCommentDate(comment.creation)}
                            </span>
                          </div>

                          <p className="font-semibold text-black-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab - Now using the separated component */}
        {activeTab === 'task' && (
          <LeadTasksTab
            leadId={leadId || ''}
            employeeId={employeeId}
            email={email}
          />
        )}

        {/* Form Tab - Now using the separated component */}
        {activeTab === 'form' && lead && (
          <LeadFormTab
            lead={lead}
            leadId={leadId || ''}
            employeeId={employeeId}
            email={email}
            onLeadUpdate={handleLeadUpdate}
          />
        )}

        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Email Communication</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Mail size={16} />
                    Compose Email
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search emails..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors">
                    <Filter size={16} />
                    Filter
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {mockEmails.map((email) => (
                  <div key={email.id} className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!email.read ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-3 h-3 rounded-full mt-2 ${email.read ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {email.type === 'sent' ? `To: ${lead.email}` : `From: ${lead.email}`}
                          </span>
                          <span className="text-sm text-gray-500">{email.date}</span>
                        </div>
                        <p className="font-semibold text-gray-900 mb-1">{email.subject}</p>
                        <p className="text-sm text-gray-600 truncate">{email.preview}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && lead && (
          <WhatsAppTab lead={lead} />
        )}
      </div>
    </div>
  );
};

export default LeadDetailsPage;