// components/CRM/LeadDetails/LeadFormTab.tsx
import React, { useEffect, useState } from 'react';
import {
  Save,
  RefreshCw,
  Edit3,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
  BadgeInfo,
  FileText,
  Users,
  TrendingUp,
  Tag,
  Target,
  Calendar,
  MessageSquare,
  BarChart3,
  Briefcase,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { type Lead } from '@/utils/crm';
import { updateCachedLeadDetails } from '@/utils/crmCache';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface LeadFormTabProps {
  lead: Lead;
  leadId: string;
  employeeId: string;
  email: string;
  onLeadUpdate: (updatedLead: Lead) => void;
}

// Indian languages for the dropdown
const indianLanguages = [
  'Tamil', 'Hindi', 'English', 'Telugu', 'Kannada', 'Malayalam',
];

// Status options for the dropdown
const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'followup', label: 'Followup' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Call Back', label: 'Call Back' },
  { value: 'Switch off', label: 'Switch off' },
  { value: 'RNR', label: 'RNR' },
];

// Profession options
const professionOptions = [
  'Business',
  'Student',
  'Professional',
  'Trader',
  'Investor',
  'Housewife',
  'Retired',
  'Other'
];

// Experience level options
const experienceOptions = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Professional'
];

// Medium options
const mediumOptions = [
  'Phone Call',
  'WhatsApp',
  'Email',
  'SMS',
  'In-Person',
  'Video Call'
];

// Demat account options
const dematAccountOptions = [
  '0_to_25',
  '26_to_50',
  '51_to_100',
  '100_plus'
];

import { LeadTimer } from '@/components/LeadTimer';

// Status colors for display
const getStatusColor = (status: Lead['status']) => {
  const colors = {
    new: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    Contacted: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    qualified: 'bg-green-100 text-green-800 hover:bg-green-100',
    followup: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    won: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    'Not Interested': 'bg-red-100 text-red-800 hover:bg-red-100',
    'Call Back': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    'Switch off': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    'RNR': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100'
  };
  return colors[status];
};

const LeadFormTab: React.FC<LeadFormTabProps> = ({
  lead,
  leadId,
  employeeId,
  email,
  onLeadUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [updating, setUpdating] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    trading: true,
    additional: false
  });

  // Function to update lead
  const updateLead = async () => {
    if (!leadId || !lead || updating) return;

    setUpdating(true);
    try {
      const { source: _, ...cleanEditedLead } = editedLead;

      const response = await fetch('https://n8n.gopocket.in/webhook/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'Update Lead',
          employeeId: employeeId,
          email: email,
          leadid: leadId,
          ...cleanEditedLead
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update lead: ${response.status}`);
      }

      const updatedLead = { ...lead, ...cleanEditedLead };
      onLeadUpdate(updatedLead);
      await updateCachedLeadDetails(leadId, updatedLead);

      setIsEditing(false);
      setEditedLead({});

    } catch (error) {
      console.error('Error updating lead:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedLead({});
    } else {
      setEditedLead(lead || {});
    }
    setIsEditing(!isEditing);
  };

  const handleFieldChange = (field: keyof Lead, value: any) => {
    setEditedLead(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateLead = () => {
    updateLead();
  };

  const getDisplayValue = (value: any, fallback: string = 'Not specified') => {
    return value || fallback;
  };

  const formatRevenue = (revenue: string) => {
    if (!revenue) return 'Not specified';
    return `₹${revenue}`;
  };

  const toggleSection = (section: 'trading' | 'additional') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Compact Field Component
  const CompactField = ({
    icon: Icon,
    label,
    value,
    editValue,
    onChange,
    type = 'text',
    placeholder,
    options,
    span = 1
  }: any) => (
    <div className={`space-y-1 ${span === 2 ? 'md:col-span-2' : ''}`}>
      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </Label>
      {isEditing ? (
        options ? (
          <Select value={editValue || value || ''} onValueChange={onChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt: any) => (
                <SelectItem key={opt.value || opt} value={opt.value || opt}>
                  {opt.label || opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === 'textarea' ? (
          <Textarea
            value={editValue || value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="resize-none"
          />
        ) : (
          <Input
            type={type}
            value={editValue || value || ''}
            onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={placeholder}
            className="h-9"
          />
        )
      ) : (
        <div className="px-3 py-1.5 rounded-md bg-muted/50 text-sm min-h-[36px] flex items-center">
          {value || 'Not specified'}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{lead.name}</h2>
            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
              <Mail className="w-3 h-3" />
              {lead.email}
              <span className="mx-1">•</span>
              <Phone className="w-3 h-3" />
              {lead.phone}
              <button
                onClick={() => {
                  const event = new CustomEvent('trigger-kyc-search', {
                    detail: { clientCode: lead.phone }
                  });
                  window.dispatchEvent(event);
                }}
                className="ml-2 p-1 hover:bg-purple-100 rounded-full transition-colors group"
                title="Search in KYC Tracker"
              >
                <ArrowRight className="w-3 h-3 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <Badge variant="outline" className="px-3 py-1">
                {lead.industry}
              </Badge>
              {lead.createdAt && <LeadTimer createdAt={lead.createdAt} />}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                onClick={handleUpdateLead}
                disabled={updating}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {updating ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-1.5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} className="mr-1.5" />
                    Save
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
              >
                <X size={14} className="mr-1.5" />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              onClick={handleEditToggle}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Edit3 size={14} className="mr-1.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - Personal & Contact */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <CompactField
                icon={Globe}
                label="Language"
                value={lead.language}
                editValue={editedLead.language}
                onChange={(val: string) => handleFieldChange('language', val)}
                options={indianLanguages}
                placeholder="Select language"
              />
              <CompactField
                icon={Tag}
                label="Status"
                value={lead.status}
                editValue={editedLead.status}
                onChange={(val: string) => handleFieldChange('status', val)}
                options={statusOptions}
              />
              <CompactField
                icon={Briefcase}
                label="Profession"
                value={(lead as any).whats_your_profession}
                editValue={(editedLead as any).whats_your_profession}
                onChange={(val: string) => handleFieldChange('whats_your_profession' as any, val)}
                options={professionOptions}
                placeholder="Select profession"
              />
              <CompactField
                label="Gender"
                value={(lead as any).gender}
                editValue={(editedLead as any).gender}
                onChange={(val: string) => handleFieldChange('gender' as any, val)}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' }
                ]}
                placeholder="Select gender"
              />
            </div>

            <Separator className="my-3" />

            <div className="grid grid-cols-2 gap-3">
              <CompactField
                icon={MapPin}
                label="City"
                value={lead.city}
                editValue={editedLead.city}
                onChange={(val: string) => handleFieldChange('city', val)}
                placeholder="Enter city"
              />
              <CompactField
                icon={MapPin}
                label="State"
                value={lead.state}
                editValue={editedLead.state}
                onChange={(val: string) => handleFieldChange('state', val)}
                placeholder="Enter state"
              />
              <CompactField
                icon={BadgeInfo}
                label="UCC Number"
                value={lead.ucc}
                editValue={editedLead.ucc}
                onChange={(val: string) => handleFieldChange('ucc', val)}
                placeholder="Enter UCC"
              />
              <CompactField
                icon={FileText}
                label="PAN Number"
                value={lead.panNumber}
                editValue={editedLead.panNumber}
                onChange={(val: string) => handleFieldChange('panNumber', val)}
                placeholder="Enter PAN"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Source & Business */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-600" />
              Source & Business
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <CompactField
                label="Form ID"
                value={(lead as any).form_id}
                editValue={(editedLead as any).form_id}
                onChange={(val: string) => handleFieldChange('form_id' as any, val)}
              />
              <CompactField
                icon={Target}
                label="Campaign"
                value={lead.campaign}
                editValue={editedLead.campaign}
                onChange={(val: string) => handleFieldChange('campaign', val)}
                placeholder="Enter campaign"
              />
              <CompactField
                icon={Building}
                label="Branch Code"
                value={lead.branchCode}
                editValue={editedLead.branchCode}
                onChange={(val: string) => handleFieldChange('branchCode', val)}
                placeholder="Enter branch code"
              />
              <CompactField
                icon={Users}
                label="Referred By"
                value={lead.referredBy}
                editValue={editedLead.referredBy}
                onChange={(val: string) => handleFieldChange('referredBy', val)}
                placeholder="Referrer name"
              />
            </div>

            <Separator className="my-3" />

            <div className="grid grid-cols-2 gap-3">
              <CompactField
                icon={BarChart3}
                label="Trading Experience"
                value={(lead as any).what_is_your_experience_level_in_trading}
                editValue={(editedLead as any).what_is_your_experience_level_in_trading}
                onChange={(val: string) => handleFieldChange('what_is_your_experience_level_in_trading' as any, val)}
                options={experienceOptions}
                placeholder="Select experience"
              />
              <CompactField
                icon={Smartphone}
                label="Preferred Medium"
                value={(lead as any).what_is_your_preferred_medium_to_get_services_details}
                editValue={(editedLead as any).what_is_your_preferred_medium_to_get_services_details}
                onChange={(val: string) => handleFieldChange('what_is_your_preferred_medium_to_get_services_details' as any, val)}
                options={mediumOptions}
                placeholder="Select medium"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Details - Collapsible */}
      <Card className="shadow-sm">
        <CardHeader
          className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('trading')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Trading & Revenue Details
            </CardTitle>
            {expandedSections.trading ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expandedSections.trading && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <CompactField
                label="Demat Accounts/Month"
                value={(lead as any).how_many_demat_account_can_you_open_in_a_month?.replace(/_/g, ' ').replace('to', ' to ')}
                editValue={(editedLead as any).how_many_demat_account_can_you_open_in_a_month}
                onChange={(val: string) => handleFieldChange('how_many_demat_account_can_you_open_in_a_month' as any, val)}
                options={dematAccountOptions.map(opt => ({
                  value: opt,
                  label: opt.replace(/_/g, ' ').replace('to', ' to ')
                }))}
              />
              <CompactField
                label="Monthly Revenue Target"
                value={formatRevenue((lead as any).how_much_revenue_are_you_targeting_in_a_month)}
                editValue={(editedLead as any).how_much_revenue_are_you_targeting_in_a_month}
                onChange={(val: string) => handleFieldChange('how_much_revenue_are_you_targeting_in_a_month' as any, val)}
                placeholder="Enter revenue target"
              />
              <CompactField
                label="No. of Employees"
                value={lead.noOfEmployees}
                editValue={editedLead.noOfEmployees}
                onChange={(val: string) => handleFieldChange('noOfEmployees', val)}
                type="number"
              />
              <CompactField
                label="Trade Done"
                value={lead.tradeDone}
                editValue={editedLead.tradeDone}
                onChange={(val: string) => handleFieldChange('tradeDone', val)}
              />
            </div>

            {/* Trading Segments - Compact */}
            <div className="mt-4 pt-3 border-t">
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">Trading Segments</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'nseCm', label: 'NSE CM' },
                  { key: 'nseCd', label: 'NSE CD' },
                  { key: 'bseFo', label: 'BSE FO' },
                  { key: 'mcxCo', label: 'MCX CO' },
                  { key: 'nseFo', label: 'NSE FO' },
                  { key: 'bseCm', label: 'BSE CM' }
                ].map((segment) => (
                  <Badge
                    key={segment.key}
                    variant={lead[segment.key as keyof Lead] ? "default" : "outline"}
                    className="text-xs"
                  >
                    {segment.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Additional Details - Collapsible */}
      <Card className="shadow-sm">
        <CardHeader
          className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('additional')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Additional Information
            </CardTitle>
            {expandedSections.additional ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expandedSections.additional && (
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <CompactField
                label="Other Brokers"
                value={lead.other_brokers}
                editValue={editedLead.other_brokers}
                onChange={(val: string) => handleFieldChange('other_brokers', val)}
                placeholder="Enter other brokers"
              />
              <CompactField
                icon={MessageSquare}
                label="Notes & Issues"
                value={lead.notes}
                editValue={editedLead.notes}
                onChange={(val: string) => handleFieldChange('notes', val)}
                type="textarea"
                placeholder="Add notes or issues about this lead..."
                span={2}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default LeadFormTab;