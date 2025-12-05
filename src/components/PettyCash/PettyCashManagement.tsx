// components/PettyCash/PettyCashManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar as CalendarIcon,
  Upload,
  DollarSign,
  Receipt,
  User,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  IndianRupee,
  Users,
  IndianRupeeIcon,
  CalendarCheck,
  PhoneMissed,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Check,
  Circle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { SummaryCard } from '@/components/SummaryCard';

// TanStack Table imports
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types
export interface PettyCashClaim {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  category: 'travel' | 'meals' | 'office-supplies' | 'entertainment' | 'transport' | 'other';
  status: 'pending' | 'manager_approved' | 'management_approved' | 'hr_approved' | 'rejected' | 'paid';
  submittedBy: string;
  submittedDate: Date;
  approvedBy?: string;
  approvedDate?: Date;
  approvedByManager?: string;
  approvedByManagement?: string;
  approvedByHR?: string;
  approvedDateManager?: Date;
  approvedDateManagement?: Date;
  approvedDateHR?: Date;
  receiptUrl?: string;
  receiptNumber?: string;
  projectCode?: string;
  department: string;
  paymentMethod: 'cash' | 'bank-transfer' | 'credit-card' | 'UPI';
  notes?: string;
  attachments?: string[];
}

interface ApiClaim {
  name: string;
  tittle: string;
  description: string;
  category: string;
  amount: string;
  date: string;
  status: string;
  submitted_by: string;
  payment_method: string;
  expense_date: string;
  proof_of_attachment: string;
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  manager_approval: string | null;
  management_approval: string | null;
  hr_approval: string | null;
  manager_approval_date: string | null;
  management_approval_date: string | null;
  hr_approved_date: string | null;
}

// Form Schema
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().default('INR'),
  category: z.enum(['travel', 'meals', 'office-supplies', 'entertainment', 'transport', 'other']),
  projectCode: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  paymentMethod: z.enum(['cash', 'bank-transfer', 'credit-card', 'UPI']),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  submittedDate: z.date(),
});

type DateRange = {
  from?: Date;
  to?: Date;
};

interface PettyCashManagementProps {
  initialClaims?: ApiClaim[];
  currentUserEmail: string;
}

const PettyCashManagement: React.FC<PettyCashManagementProps> = ({
  initialClaims = [],
  currentUserEmail = ''
}) => {
  const [claims, setClaims] = useState<PettyCashClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [selectedClaim, setSelectedClaim] = useState<PettyCashClaim | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState<string | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState<string | null>(null);

  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      amount: 0,
      currency: 'INR',
      category: 'other',
      projectCode: '',
      department: 'Sales',
      paymentMethod: 'cash',
      receiptNumber: '',
      notes: '',
      submittedDate: new Date(),
    },
  });

  // Check user role based on email
  const getUserRole = (email: string): 'management' | 'manager' | 'hr' | 'employee' => {
    const emailLower = email.toLowerCase();
    if (emailLower === 'yuvaraj@gopocket.in') {
      return 'management';
    } else if (emailLower.includes('hr') || emailLower.includes('human.resource')) {
      return 'hr';
    } else if (emailLower.includes('manager') || emailLower.includes('lead')) {
      return 'manager';
    }
    return 'employee';
  };

  const userRole = getUserRole(currentUserEmail);
  const isManagementUser = userRole === 'management';
  const isManagerUser = userRole === 'manager';
  const isHRUser = userRole === 'hr';

  // Map API data to PettyCashClaim format
  const mapApiClaimToPettyCashClaim = (apiClaim: ApiClaim): PettyCashClaim => {
    // Determine status based on approval stages
    let status: PettyCashClaim['status'] = 'pending';

    if (apiClaim.hr_approval && apiClaim.hr_approved_date) {
      status = 'hr_approved';
    } else if (apiClaim.management_approval && apiClaim.management_approval_date) {
      status = 'management_approved';
    } else if (apiClaim.manager_approval && apiClaim.manager_approval_date) {
      status = 'manager_approved';
    } else if (apiClaim.status === 'Rejected') {
      status = 'rejected';
    } else if (apiClaim.status === 'Paid') {
      status = 'paid';
    }

    // Map category from API to our category
    const categoryMap: Record<string, 'travel' | 'meals' | 'office-supplies' | 'entertainment' | 'transport' | 'other'> = {
      'Travel': 'travel',
      'Meals': 'meals',
      'Office Supplies': 'office-supplies',
      'Entertainment': 'entertainment',
      'Transport': 'transport',
      'Other': 'other'
    };

    // Map payment method from API to our paymentMethod
    const paymentMethodMap: Record<string, 'cash' | 'bank-transfer' | 'credit-card' | 'UPI'> = {
      'Cash': 'cash',
      'Bank Transfer': 'bank-transfer',
      'UPI': 'UPI',
      'Credit Card': 'credit-card'
    };

    return {
      id: apiClaim.name,
      title: apiClaim.tittle || 'Untitled Expense',
      description: apiClaim.description || 'No description provided',
      amount: parseFloat(apiClaim.amount) || 0,
      currency: 'INR',
      category: categoryMap[apiClaim.category] || 'other',
      status,
      submittedBy: apiClaim.submitted_by || 'Unknown',
      submittedDate: new Date(apiClaim.date || apiClaim.creation),
      approvedBy: apiClaim.modified_by !== 'Administrator' ? apiClaim.modified_by : undefined,
      approvedDate: apiClaim.status !== 'Pending' ? new Date(apiClaim.modified) : undefined,
      approvedByManager: apiClaim.manager_approval || undefined,
      approvedByManagement: apiClaim.management_approval || undefined,
      approvedByHR: apiClaim.hr_approval || undefined,
      approvedDateManager: apiClaim.manager_approval_date ? new Date(apiClaim.manager_approval_date) : undefined,
      approvedDateManagement: apiClaim.management_approval_date ? new Date(apiClaim.management_approval_date) : undefined,
      approvedDateHR: apiClaim.hr_approved_date ? new Date(apiClaim.hr_approved_date) : undefined,
      receiptUrl: apiClaim.proof_of_attachment,
      receiptNumber: apiClaim.name,
      department: 'Unknown',
      paymentMethod: paymentMethodMap[apiClaim.payment_method] || 'cash',
      notes: `Created: ${format(new Date(apiClaim.creation), 'MMM dd, yyyy')}`,
      attachments: apiClaim.proof_of_attachment ? [apiClaim.proof_of_attachment] : [],
    };
  };

  // Process initial claims from API
  useEffect(() => {
    if (initialClaims && initialClaims.length > 0) {
      const mappedClaims = initialClaims.map(mapApiClaimToPettyCashClaim);
      setClaims(mappedClaims);
      setLoading(false);
    } else {
      // If no initial claims, show empty state
      setClaims([]);
      setLoading(false);
    }
  }, [initialClaims]);

  // Check if current user is the submitter
  const isCurrentUserSubmitter = (submittedBy: string) => {
    return currentUserEmail.toLowerCase() === submittedBy.toLowerCase();
  };

  // Check what approval action user can perform based on role and current status
  const getUserApprovalAction = (claim: PettyCashClaim): string | null => {
    const isSubmitter = isCurrentUserSubmitter(claim.submittedBy);
    if (isSubmitter) return null;

    if (claim.status === 'rejected' || claim.status === 'paid') return null;

    // Check based on user role and claim status
    if (isManagerUser && !claim.approvedDateManager && claim.status === 'pending') {
      return 'Manager Approval';
    }

    if (isManagementUser && claim.approvedDateManager && !claim.approvedDateManagement && claim.status === 'manager_approved') {
      return 'Management Approval';
    }

    if (isHRUser && claim.approvedDateManagement && !claim.approvedDateHR && claim.status === 'management_approved') {
      return 'HR Approval';
    }

    if (claim.status === 'hr_approved' && (isHRUser || isManagementUser)) {
      return 'Mark as Paid';
    }

    return null;
  };

  // Approval stages component
  const ApprovalStages = ({ claim }: { claim: PettyCashClaim }) => {
    const stages = [
      {
        label: 'Manager',
        approved: !!claim.approvedDateManager,
        date: claim.approvedDateManager,
        approver: claim.approvedByManager
      },
      {
        label: 'Management',
        approved: !!claim.approvedDateManagement,
        date: claim.approvedDateManagement,
        approver: claim.approvedByManagement
      },
      {
        label: 'HR',
        approved: !!claim.approvedDateHR,
        date: claim.approvedDateHR,
        approver: claim.approvedByHR
      },
    ];

    return (
      <div className="flex items-center">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.label}>
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2",
                stage.approved
                  ? "bg-green-500 border-green-600"
                  : "bg-gray-100 border-gray-300"
              )}>
                {stage.approved ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <Circle className={cn(
                    "h-3 w-3",
                    claim.status === 'rejected' ? "text-red-500" : "text-gray-400"
                  )} />
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{stage.label}</span>
              {stage.date && (
                <span className="text-xs text-gray-500">
                  {format(new Date(stage.date), 'MM/dd')}
                </span>
              )}
            </div>
            {index < stages.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2",
                stage.approved ? "bg-green-500" : "bg-gray-300"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Filter claims
  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      const matchesSearch =
        claim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;

      const claimDate = new Date(claim.submittedDate);
      const matchesDate =
        (!dateRange.from || claimDate >= dateRange.from) &&
        (!dateRange.to || claimDate <= dateRange.to);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [claims, searchTerm, statusFilter, dateRange]);

  // Calculate statistics
  const totalClaims = claims.length;
  const totalAmount = claims.reduce((sum, claim) => sum + claim.amount, 0);
  const pendingAmount = claims
    .filter(c => c.status === 'pending')
    .reduce((sum, claim) => sum + claim.amount, 0);
  const approvedAmount = claims
    .filter(c => ['manager_approved', 'management_approved', 'hr_approved'].includes(c.status))
    .reduce((sum, claim) => sum + claim.amount, 0);
  const paidAmount = claims
    .filter(c => c.status === 'paid')
    .reduce((sum, claim) => sum + claim.amount, 0);

  // Format Indian Rupees
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Form handlers
  const handleAddClaim = (values: z.infer<typeof formSchema>) => {
    const newClaim: PettyCashClaim = {
      id: `PC${String(claims.length + 1).padStart(4, '0')}`,
      title: values.title,
      description: values.description,
      amount: values.amount,
      currency: values.currency,
      category: values.category,
      status: 'pending',
      submittedBy: currentUserEmail,
      submittedDate: values.submittedDate,
      department: values.department,
      paymentMethod: values.paymentMethod,
      projectCode: values.projectCode,
      receiptNumber: values.receiptNumber,
      notes: values.notes,
    };

    setClaims([newClaim, ...claims]);
    setIsAddDialogOpen(false);
    form.reset();
  };

  const handleEditClaim = (values: z.infer<typeof formSchema>) => {
    if (!selectedClaim) return;

    const updatedClaims = claims.map(claim =>
      claim.id === selectedClaim.id
        ? {
          ...claim,
          title: values.title,
          description: values.description,
          amount: values.amount,
          category: values.category,
          projectCode: values.projectCode,
          department: values.department,
          paymentMethod: values.paymentMethod,
          receiptNumber: values.receiptNumber,
          notes: values.notes,
          submittedDate: values.submittedDate,
        }
        : claim
    );

    setClaims(updatedClaims);
    setIsEditDialogOpen(false);
    setSelectedClaim(null);
    form.reset();
  };

  const handleDeleteClaim = (id: string) => {
    setClaims(claims.filter(claim => claim.id !== id));
  };

  const handleApproveClaim = async (id: string, action: string) => {
    setIsApproving(id);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedClaims = claims.map(claim => {
      if (claim.id === id) {
        const updates: Partial<PettyCashClaim> = {};
        let newStatus: PettyCashClaim['status'] = claim.status;

        if (action === 'Manager Approval') {
          updates.approvedByManager = currentUserEmail;
          updates.approvedDateManager = new Date();
          newStatus = 'manager_approved';
        } else if (action === 'Management Approval') {
          updates.approvedByManagement = currentUserEmail;
          updates.approvedDateManagement = new Date();
          newStatus = 'management_approved';
        } else if (action === 'HR Approval') {
          updates.approvedByHR = currentUserEmail;
          updates.approvedDateHR = new Date();
          newStatus = 'hr_approved';
        }

        return {
          ...claim,
          status: newStatus,
          ...updates,
        };
      }
      return claim;
    });

    setClaims(updatedClaims);
    setIsApproving(null);
  };

  const handleRejectClaim = async (id: string) => {
    setIsRejecting(id);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedClaims = claims.map(claim =>
      claim.id === id
        ? {
          ...claim,
          status: 'rejected' as const,
          approvedBy: currentUserEmail,
          approvedDate: new Date(),
        }
        : claim
    );

    setClaims(updatedClaims);
    setIsRejecting(null);
  };

  const handleMarkAsPaid = async (id: string) => {
    setIsMarkingPaid(id);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedClaims = claims.map(claim =>
      claim.id === id
        ? { ...claim, status: 'paid' as const }
        : claim
    );

    setClaims(updatedClaims);
    setIsMarkingPaid(null);
  };

  // Status badge with multi-stage support
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'manager_approved':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Shield className="h-3 w-3 mr-1" /> Manager Approved</Badge>;
      case 'management_approved':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200"><ShieldCheck className="h-3 w-3 mr-1" /> Management Approved</Badge>;
      case 'hr_approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><ShieldCheck className="h-3 w-3 mr-1" /> HR Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><ShieldAlert className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle className="h-3 w-3 mr-1" /> Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Category badge
  const getCategoryBadge = (category: string) => {
    const labels: Record<string, string> = {
      travel: 'Travel',
      meals: 'Meals',
      'office-supplies': 'Office Supplies',
      entertainment: 'Entertainment',
      transport: 'Transport',
      other: 'Other',
    };

    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        {labels[category] || 'Other'}
      </Badge>
    );
  };

  // Payment method badge
  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'cash': return <Badge variant="outline" className="bg-gray-50">Cash</Badge>;
      case 'bank-transfer': return <Badge variant="outline" className="bg-blue-50">Bank Transfer</Badge>;
      case 'UPI': return <Badge variant="outline" className="bg-purple-50">UPI</Badge>;
      case 'credit-card': return <Badge variant="outline" className="bg-purple-50">Card</Badge>;
      default: return <Badge variant="outline">{method}</Badge>;
    }
  };

  // TanStack Table columns
  const columns: ColumnDef<PettyCashClaim>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("title")}</div>
          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
            {row.original.description}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => getCategoryBadge(row.getValue("category")),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div>
          <div className="font-bold flex items-center gap-1">
            <IndianRupee className="h-3 w-3" />
            {row.original.amount.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {getPaymentMethodBadge(row.original.paymentMethod)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center w-full">Status</div>,
      cell: ({ row }) => (
        <div className="space-y-2">
          <ApprovalStages claim={row.original} />
        </div>
      ),
    },
    {
      accessorKey: "submittedBy",
      header: "Submitted By",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="truncate max-w-[120px]">{row.getValue("submittedBy")}</span>
        </div>
      ),
    },
    {
      accessorKey: "submittedDate",
      header: "Date",
      cell: ({ row }) => format(new Date(row.getValue("submittedDate")), 'MMM dd, yyyy'),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const claim = row.original;
        const isSubmitter = isCurrentUserSubmitter(claim.submittedBy);
        const approvalAction = getUserApprovalAction(claim);
        const showApprove = approvalAction && approvalAction !== 'Mark as Paid';
        const showMarkAsPaid = approvalAction === 'Mark as Paid';
        const canReject = !isSubmitter &&
          ['pending', 'manager_approved', 'management_approved'].includes(claim.status);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setSelectedClaim(claim);
                setIsViewSheetOpen(true);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {!isSubmitter && claim.status === 'pending' && (
                <DropdownMenuItem onClick={() => {
                  setSelectedClaim(claim);
                  form.reset({
                    title: claim.title,
                    description: claim.description,
                    amount: claim.amount,
                    currency: claim.currency,
                    category: claim.category,
                    projectCode: claim.projectCode,
                    department: claim.department,
                    paymentMethod: claim.paymentMethod,
                    receiptNumber: claim.receiptNumber,
                    notes: claim.notes,
                    submittedDate: new Date(claim.submittedDate),
                  });
                  setIsEditDialogOpen(true);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {showApprove && (
                <DropdownMenuItem
                  onClick={() => handleApproveClaim(claim.id, approvalAction!)}
                  disabled={isApproving === claim.id}
                >
                  {isApproving === claim.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      {approvalAction}
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {showMarkAsPaid && (
                <DropdownMenuItem
                  onClick={() => handleMarkAsPaid(claim.id)}
                  disabled={isMarkingPaid === claim.id}
                >
                  {isMarkingPaid === claim.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Marking as Paid...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                      Mark as Paid
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {canReject && (
                <DropdownMenuItem
                  onClick={() => handleRejectClaim(claim.id)}
                  disabled={isRejecting === claim.id}
                >
                  {isRejecting === claim.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2 text-red-600" />
                      Reject
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the expense claim.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteClaim(claim.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // TanStack Table instance
  const table = useReactTable({
    data: filteredClaims,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="">

      {/* Summary Cards - Responsive Grid */}
      <div className="hidden lg:grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 mt-7">
        <SummaryCard
          title="Total Claims"
          value={totalClaims}
          icon={Users}
          color="blue"
          shadowColor="blue"
          trend={{ value: 12.5, isPositive: true }}
          showTrend={true}
          className="h-full"
        />
        <SummaryCard
          title="Total Amount"
          value={formatINR(totalAmount)}
          icon={IndianRupeeIcon}
          color="blue"
          shadowColor="blue"
          trend={{ value: 8.2, isPositive: true }}
          showTrend={true}
          className="h-full"
        />
        <SummaryCard
          title="Pending Amount"
          value={formatINR(pendingAmount)}
          icon={CalendarCheck}
          color="blue"
          shadowColor="blue"
          trend={{ value: 22.1, isPositive: true }}
          showTrend={true}
          className="h-full"
        />
        <SummaryCard
          title="Approved Amount"
          value={formatINR(approvedAmount)}
          icon={CheckCircle}
          color="green"
          shadowColor="green"
          trend={{ value: 15.3, isPositive: true }}
          showTrend={true}
          className="h-full"
        />
        <SummaryCard
          title="Paid Amount"
          value={formatINR(paidAmount)}
          icon={PhoneMissed}
          color="green"
          shadowColor="green"
          trend={{ value: 8.1, isPositive: false }}
          showTrend={true}
          className="h-full"
        />
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search claims..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="manager_approved">Manager Approved</SelectItem>
                  <SelectItem value="management_approved">Management Approved</SelectItem>
                  <SelectItem value="hr_approved">HR Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className='bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors'>
                      <Plus className="h-4 w-4 mr-2" />
                      New Claim
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Expense Claim</DialogTitle>
                      <DialogDescription>
                        Fill in the details below to submit a new petty cash claim.
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleAddClaim)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Client Meeting Lunch" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount (₹) *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                      <IndianRupee className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      className="pl-10"
                                      {...field}
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="travel">Travel</SelectItem>
                                    <SelectItem value="meals">Meals</SelectItem>
                                    <SelectItem value="office-supplies">Office Supplies</SelectItem>
                                    <SelectItem value="entertainment">Entertainment</SelectItem>
                                    <SelectItem value="transport">Transport</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Sales">Sales</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                    <SelectItem value="Engineering">Engineering</SelectItem>
                                    <SelectItem value="HR">HR</SelectItem>
                                    <SelectItem value="Finance">Finance</SelectItem>
                                    <SelectItem value="Operations">Operations</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="submittedDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expense Date *</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="credit-card">Card</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Detailed description of the expense..."
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Upload className="h-4 w-4" />
                            <FormLabel>Receipt Attachment</FormLabel>
                          </div>
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="h-8 w-8 mb-2 text-gray-500" />
                                <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 5MB)</p>
                              </div>
                              <input type="file" className="hidden" />
                            </label>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button type="submit">Submit Claim</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table - TanStack Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Claims</CardTitle>
          <CardDescription>
            Manage and review all petty cash claims
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="text-muted-foreground">Loading claims...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-gray-50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {claims.length === 0 ? "No claims found. Create your first claim!" : "No claims match your filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredClaims.length} of {claims.length} claims
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* View Details Sheet */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Claim Details</SheetTitle>
            <SheetDescription>
              Complete information about this expense claim
            </SheetDescription>
          </SheetHeader>

          {selectedClaim && (
            <div className="space-y-6 mt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedClaim.title}</h3>
                  <p className="text-muted-foreground">{selectedClaim.id}</p>
                </div>
                {getStatusBadge(selectedClaim.status)}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    <IndianRupee className="h-5 w-5" />
                    {selectedClaim.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="text-lg">{getCategoryBadge(selectedClaim.category)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{selectedClaim.description}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Approval Stages</p>
                <ApprovalStages claim={selectedClaim} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted By</p>
                  <p className="text-sm">{selectedClaim.submittedBy}</p>
                  <p className="text-xs text-muted-foreground">
                    {isCurrentUserSubmitter(selectedClaim.submittedBy) ? "(You)" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="text-sm">{selectedClaim.department}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="text-sm">{getPaymentMethodBadge(selectedClaim.paymentMethod)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project Code</p>
                  <p className="text-sm">{selectedClaim.projectCode || 'N/A'}</p>
                </div>
              </div>

              {/* Detailed approval information */}
              {selectedClaim.status !== 'pending' && selectedClaim.status !== 'rejected' && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Approval Details</p>
                  <div className="space-y-3 text-sm">
                    {selectedClaim.approvedByManager && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Manager Approved</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{selectedClaim.approvedByManager}</div>
                          <div className="text-muted-foreground">
                            {format(new Date(selectedClaim.approvedDateManager!), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedClaim.approvedByManagement && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Management Approved</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{selectedClaim.approvedByManagement}</div>
                          <div className="text-muted-foreground">
                            {format(new Date(selectedClaim.approvedDateManagement!), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedClaim.approvedByHR && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>HR Approved</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{selectedClaim.approvedByHR}</div>
                          <div className="text-muted-foreground">
                            {format(new Date(selectedClaim.approvedDateHR!), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Dates</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>{' '}
                    {format(new Date(selectedClaim.submittedDate), 'MMM dd, yyyy')}
                  </div>
                  {selectedClaim.approvedDate && (
                    <div>
                      <span className="text-muted-foreground">Final Approval:</span>{' '}
                      {format(new Date(selectedClaim.approvedDate), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>
              </div>

              {selectedClaim.receiptUrl && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Receipt</p>
                  <p className="text-sm mb-2">Attachment: {selectedClaim.receiptUrl.split('/').pop()}</p>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Receipt
                  </Button>
                </div>
              )}

              {selectedClaim.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{selectedClaim.notes}</p>
                </div>
              )}

              {!isCurrentUserSubmitter(selectedClaim.submittedBy) && (
                <div className="flex gap-2 pt-4">
                  {getUserApprovalAction(selectedClaim) && (
                    <>
                      <Button
                        onClick={() => {
                          const action = getUserApprovalAction(selectedClaim);
                          if (action === 'Mark as Paid') {
                            handleMarkAsPaid(selectedClaim.id);
                          } else {
                            handleApproveClaim(selectedClaim.id, action!);
                          }
                        }}
                        className="flex-1"
                        disabled={isApproving === selectedClaim.id || isMarkingPaid === selectedClaim.id}
                      >
                        {(isApproving === selectedClaim.id || isMarkingPaid === selectedClaim.id) ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {getUserApprovalAction(selectedClaim) === 'Mark as Paid' ? (
                              <>
                                <IndianRupee className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {getUserApprovalAction(selectedClaim)}
                              </>
                            )}
                          </>
                        )}
                      </Button>
                      {['pending', 'manager_approved', 'management_approved'].includes(selectedClaim.status) && (
                        <Button
                          variant="outline"
                          onClick={() => handleRejectClaim(selectedClaim.id)}
                          className="flex-1"
                          disabled={isRejecting === selectedClaim.id}
                        >
                          {isRejecting === selectedClaim.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense Claim</DialogTitle>
            <DialogDescription>
              Make changes to the expense claim below.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditClaim)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (₹) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <IndianRupee className="h-4 w-4 text-gray-500" />
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            className="pl-10"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="meals">Meals</SelectItem>
                          <SelectItem value="office-supplies">Office Supplies</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="credit-card">Credit Card</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PettyCashManagement;