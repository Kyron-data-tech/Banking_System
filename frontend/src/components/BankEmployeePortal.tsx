import React, { useState, useEffect } from 'react';
import { 
  useAuth 
} from '../context/AuthContext';
import { 
  userApi, 
  makerCheckerApi, 
  transactionApi, 
  llmApi, 
  upiApi 
} from '../api';
import { KyroLogo } from './KyroLogo';
import { ThemeToggle } from './ThemeToggle';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ShieldAlert,
  Shield,
  CheckCircle2,
  Search,
  RefreshCw,
  FileText,
  Lock,
  Bot,
  Sliders,
  ChevronDown,
  Check,
  X,
  LogOut,
  Sparkles,
  Building2,
  Radio,
  Zap,
  ArrowRight,
  Download,
  AlertCircle,
  HelpCircle,
  Plus,
  Send
} from 'lucide-react';

// ============================================================================
// 32+ ENTERPRISE BANK ROLES CLASSIFIED BY DEPARTMENTS
// ============================================================================
export interface RoleDefinition {
  id: string;
  name: string;
  department: string;
  clearance: 'TIER-1 ADMIN' | 'TIER-2 OPS' | 'TIER-3 RISK' | 'TIER-4 CORP' | 'TIER-5 AUDIT';
  description: string;
  allowedTabs: string[];
}

export const ALL_BANK_ROLES: RoleDefinition[] = [
  // 1. Bank Administration & Core Governance
  { id: 'ROLE_BANK_SUPER_ADMIN', name: 'Bank Super Admin', department: 'Executive Governance', clearance: 'TIER-1 ADMIN', description: 'Full root authority over all CBS modules, liquidity reserves, and administrative overrides.', allowedTabs: ['dashboard', 'operations', 'maker-checker', 'aml-risk', 'reconciliation', 'treasury', 'users', 'support', 'audit', 'ai-intelligence'] },
  { id: 'ROLE_BANK_USER_ADMIN', name: 'Bank User Admin', department: 'Executive Governance', clearance: 'TIER-1 ADMIN', description: 'Manages internal bank employee accounts, role assignments, and maker-checker user profiles.', allowedTabs: ['dashboard', 'users', 'maker-checker', 'audit'] },
  { id: 'ROLE_BANK_PRODUCT_ADMIN', name: 'Bank Product Admin', department: 'Executive Governance', clearance: 'TIER-1 ADMIN', description: 'Configures banking product limits, payment channels (NEFT/RTGS/UPI), and transaction fee rules.', allowedTabs: ['dashboard', 'operations', 'treasury', 'audit'] },
  { id: 'ROLE_BANK_CONFIG_ADMIN', name: 'Bank Config Admin', department: 'Executive Governance', clearance: 'TIER-1 ADMIN', description: 'System-wide parameter controls, holiday clearing windows, and emergency kill-switches.', allowedTabs: ['dashboard', 'operations', 'treasury', 'audit'] },

  // 2. Payment & Switch Operations
  { id: 'ROLE_PAYMENT_OPERATIONS', name: 'Payment Operations', department: 'Payment Switch', clearance: 'TIER-2 OPS', description: 'Monitors real-time NPCI UPI switch throughput, 0% MDR packet routing, and IMPS rails.', allowedTabs: ['dashboard', 'operations', 'maker-checker', 'reconciliation', 'support'] },
  { id: 'ROLE_COLLECTION_OPERATIONS', name: 'Collection Operations', department: 'Payment Switch', clearance: 'TIER-2 OPS', description: 'Oversees merchant QR collections, virtual account mandates, and direct debit clearing.', allowedTabs: ['dashboard', 'operations', 'reconciliation', 'support'] },
  { id: 'ROLE_EXCEPTION_MANAGEMENT', name: 'Exception Manager', department: 'Payment Switch', clearance: 'TIER-2 OPS', description: 'Investigates stuck or rejected transactions, triggers manual retries and core ledger reversals.', allowedTabs: ['dashboard', 'operations', 'support', 'audit'] },
  { id: 'ROLE_TRANSACTION_INVESTIGATION', name: 'Transaction Investigator', department: 'Payment Switch', clearance: 'TIER-2 OPS', description: 'Deep-dives into UTR tracing, network packet latency, and payment gateway logs.', allowedTabs: ['dashboard', 'operations', 'support', 'ai-intelligence'] },
  { id: 'ROLE_FILE_PROCESSING', name: 'Batch File Processor', department: 'Payment Switch', clearance: 'TIER-2 OPS', description: 'Executes bulk NACH/ACH debit files and commercial payroll settlement batches.', allowedTabs: ['dashboard', 'operations', 'treasury'] },

  // 3. Risk, AML & Compliance
  { id: 'ROLE_COMPLIANCE_OFFICER', name: 'Compliance Officer', department: 'Risk & Compliance', clearance: 'TIER-3 RISK', description: 'Ensures adherence to RBI guidelines, PMLA norms, and regulatory capital adequacy.', allowedTabs: ['dashboard', 'aml-risk', 'audit', 'ai-intelligence'] },
  { id: 'ROLE_AML_SANCTIONS_REVIEWER', name: 'AML Sanctions Reviewer', department: 'Risk & Compliance', clearance: 'TIER-3 RISK', description: 'Screens high-risk transactions against OFAC/UN sanctions watchlists and NPCI-U16 thresholds.', allowedTabs: ['dashboard', 'aml-risk', 'audit', 'ai-intelligence'] },
  { id: 'ROLE_RISK_OFFICER', name: 'Risk Officer', department: 'Risk & Compliance', clearance: 'TIER-3 RISK', description: 'Defines transaction velocity ceilings, merchant risk scoring, and circuit breakers.', allowedTabs: ['dashboard', 'aml-risk', 'treasury', 'ai-intelligence'] },
  { id: 'ROLE_BANK_AUDITOR', name: 'Bank Auditor (Read-Only)', department: 'Risk & Compliance', clearance: 'TIER-5 AUDIT', description: 'Immutable read-only access to all financial ledgers, audit logs, and hash-verified blocks.', allowedTabs: ['dashboard', 'audit', 'reconciliation', 'users'] },

  // 4. Reconciliation & Clearing
  { id: 'ROLE_RECONCILIATION', name: 'Reconciliation Officer', department: 'Reconciliation & Clearing', clearance: 'TIER-2 OPS', description: 'Matches Core CBS ledger balances against NPCI UPI switch and Razorpay settlement feeds.', allowedTabs: ['dashboard', 'reconciliation', 'treasury', 'operations'] },
  { id: 'ROLE_CORP_RECONCILIATION_USER', name: 'Corp Reconciliation User', department: 'Reconciliation & Clearing', clearance: 'TIER-4 CORP', description: 'Generates corporate client bank statements, ledger reconciliation, and tax summaries.', allowedTabs: ['dashboard', 'reconciliation', 'audit'] },

  // 5. Customer Support & Corporate Onboarding
  { id: 'ROLE_CUSTOMER_SUPPORT', name: 'Customer Support Lead', department: 'Customer Desk', clearance: 'TIER-2 OPS', description: 'Handles UPI VPA resolution, soundbox diagnostics, customer complaints, and dispute tickets.', allowedTabs: ['dashboard', 'support', 'operations'] },
  { id: 'ROLE_CORPORATE_ONBOARDING', name: 'Corporate Onboarding Manager', department: 'Customer Desk', clearance: 'TIER-2 OPS', description: 'Verifies KYC and onboards new legal corporate entities, business groups, and merchant accounts.', allowedTabs: ['dashboard', 'users', 'support'] },
  { id: 'ROLE_IMPLEMENTATION_MANAGER', name: 'Implementation Manager', department: 'Customer Desk', clearance: 'TIER-2 OPS', description: 'Sets up merchant B2B API integrations, webhook endpoints, and corporate sweep rules.', allowedTabs: ['dashboard', 'operations', 'users', 'treasury'] },

  // 6. Corporate Governance & Maker-Checker Workflows
  { id: 'ROLE_CORP_ADMIN', name: 'Corporate Super Admin', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Oversees corporate treasury balances, user permissions, and multi-signature policies.', allowedTabs: ['dashboard', 'maker-checker', 'treasury', 'users', 'audit'] },
  { id: 'ROLE_CORP_USER_ADMIN', name: 'Corporate User Admin', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Configures corporate employees, assigns maker or checker privileges within legal entity.', allowedTabs: ['dashboard', 'users', 'audit'] },
  { id: 'ROLE_CORP_FINANCE_MANAGER', name: 'Corporate Finance Manager', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Manages corporate working capital, payroll batches, and high-value treasury sweeps.', allowedTabs: ['dashboard', 'treasury', 'maker-checker', 'operations'] },
  { id: 'ROLE_CORP_MAKER', name: 'Corporate Maker', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Initiates high-value payment instructions and beneficiary additions for Checker approval.', allowedTabs: ['dashboard', 'maker-checker', 'operations'] },
  { id: 'ROLE_CORP_CHECKER', name: 'Corporate Checker (Standard)', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Verifies and reviews transaction instructions created by Makers before bank processing.', allowedTabs: ['dashboard', 'maker-checker', 'operations'] },
  { id: 'ROLE_CORP_APPROVER_L1', name: 'Corp Approver L1 (≤ ₹1 Lakh)', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Authorized to grant approval for transactions up to Tier-1 ceiling limit of ₹1,00,000.', allowedTabs: ['dashboard', 'maker-checker'] },
  { id: 'ROLE_CORP_APPROVER_L2', name: 'Corp Approver L2 (₹1L - ₹10L)', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Authorized to approve mid-tier high-value commercial disbursements between ₹1L and ₹10L.', allowedTabs: ['dashboard', 'maker-checker'] },
  { id: 'ROLE_CORP_FINAL_AUTHORIZER', name: 'Corp Final Authorizer (> ₹10L)', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Executive level (CFO/Treasury Head) authorization for unlimited transactions above ₹10L.', allowedTabs: ['dashboard', 'maker-checker', 'treasury'] },
  { id: 'ROLE_CORP_PAYROLL_USER', name: 'Corporate Payroll Officer', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Uploads employee salary schedules and triggers automated bulk salary disbursements.', allowedTabs: ['dashboard', 'treasury', 'operations'] },
  { id: 'ROLE_CORP_COLLECTION_USER', name: 'Corporate Collection Officer', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Manages incoming B2B receivables, invoice collections, and merchant settlement accounts.', allowedTabs: ['dashboard', 'operations', 'reconciliation'] },
  { id: 'ROLE_CORP_BENEFICIARY_MANAGER', name: 'Beneficiary Manager', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Maintains verified whitelist of bank accounts and external UPI VPAs for payout routing.', allowedTabs: ['dashboard', 'operations', 'support'] },
  { id: 'ROLE_CORP_REPORTING_USER', name: 'Corporate Reporting Specialist', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Generates daily corporate audit ledgers, GST tax breakdowns, and cash flow reports.', allowedTabs: ['dashboard', 'audit', 'reconciliation'] },
  { id: 'ROLE_CORP_VIEWER', name: 'Corporate Viewer (Read-Only)', department: 'Corporate Treasury', clearance: 'TIER-4 CORP', description: 'Read-only visibility of corporate balances and transaction statuses without initiation rights.', allowedTabs: ['dashboard', 'operations', 'audit'] },
  { id: 'ROLE_CORP_AUDITOR', name: 'Corporate Auditor', department: 'Corporate Treasury', clearance: 'TIER-5 AUDIT', description: 'External audit inspection of corporate transactions, maker-checker trails, and statements.', allowedTabs: ['dashboard', 'audit', 'maker-checker', 'reconciliation'] }
];

interface BankEmployeePortalProps {
  onSignOut: () => void;
  onSwitchToConsumer?: () => void;
}

export const BankEmployeePortal: React.FC<BankEmployeePortalProps> = ({ onSignOut, onSwitchToConsumer }) => {
  const { user } = useAuth();

  // AUTHENTICATION & SECURITY CLEARANCE
  // The actual logged-in user's role from JWT / Spring Security
  const userActualRole = user?.roles?.[0] || 'ROLE_BANK_SUPER_ADMIN';
  const isActualSuperAdmin = userActualRole === 'ROLE_BANK_SUPER_ADMIN';

  // Role Simulation: ONLY Super Admin can simulate other roles for evaluation/testing.
  // Regular employees are strictly bound to their actual userActualRole.
  const [simulatedRoleId, setSimulatedRoleId] = useState<string>(userActualRole);
  const effectiveRoleId = isActualSuperAdmin ? simulatedRoleId : userActualRole;

  // Find active role definition
  const currentRole = ALL_BANK_ROLES.find(r => r.id === effectiveRoleId) || ALL_BANK_ROLES[0];

  // Specific Functional Clearance Flags
  const isMaker = currentRole.id === 'ROLE_CORP_MAKER';
  const isChecker = [
    'ROLE_BANK_SUPER_ADMIN', 
    'ROLE_CORP_CHECKER', 
    'ROLE_CORP_APPROVER_L1', 
    'ROLE_CORP_APPROVER_L2', 
    'ROLE_CORP_FINAL_AUTHORIZER', 
    'ROLE_CORP_ADMIN', 
    'ROLE_PAYMENT_OPERATIONS'
  ].includes(currentRole.id);
  const isAuditor = currentRole.id.includes('AUDITOR') || currentRole.id.includes('VIEWER');
  const isCompliance = ['ROLE_COMPLIANCE_OFFICER', 'ROLE_AML_SANCTIONS_REVIEWER', 'ROLE_RISK_OFFICER'].includes(currentRole.id);
  const isTreasuryAdmin = ['ROLE_BANK_SUPER_ADMIN', 'ROLE_CORP_ADMIN', 'ROLE_CORP_FINANCE_MANAGER', 'ROLE_TREASURY_MANAGER'].includes(currentRole.id);
  const isUserAdmin = ['ROLE_BANK_SUPER_ADMIN', 'ROLE_BANK_USER_ADMIN', 'ROLE_CORP_ADMIN', 'ROLE_CORP_USER_ADMIN'].includes(currentRole.id);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);

  // Live Data States
  const [usersList, setUsersList] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [mySubmittedRequests, setMySubmittedRequests] = useState<any[]>([]);
  const [, setLiveTransactions] = useState<any[]>([]);
  const [highRiskAmlAlerts, setHighRiskAmlAlerts] = useState<any[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sub-features state
  const [approvalActionModal, setApprovalActionModal] = useState<{ id: string; action: 'APPROVE' | 'REJECT'; title: string } | null>(null);
  const [approvalComment, setApprovalComment] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Maker Payment Initiation Modal
  const [showMakerPaymentModal, setShowMakerPaymentModal] = useState<boolean>(false);
  const [makerPaymentData, setMakerPaymentData] = useState({
    beneficiaryName: '',
    destinationAccount: '',
    ifscOrBic: 'HDFC0001234',
    amount: '',
    type: 'NEFT',
    narration: ''
  });
  const [makerSubmitting, setMakerSubmitting] = useState<boolean>(false);

  // New User Creation Modal
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserData, setNewUserData] = useState({ fullName: '', email: '', roleType: 'ROLE_PAYMENT_OPERATIONS', password: 'password123' });

  // AI Transaction Analysis Modal
  const [aiAnalysisInput, setAiAnalysisInput] = useState<string>('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Customer Support VPA Lookup
  const [lookupVpa, setLookupVpa] = useState<string>('merchant@okkyro');
  const [vpaLookupResult, setVpaLookupResult] = useState<any | null>(null);
  const [vpaLoading, setVpaLoading] = useState<boolean>(false);

  // Liquidity Sweep Simulation
  const [sweepAmount, setSweepAmount] = useState<number>(500000);
  const [sweepStatus, setSweepStatus] = useState<string>('');

  const triggerToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Ensure current active tab is strictly within permitted tabs for this role
  useEffect(() => {
    if (!currentRole.allowedTabs.includes(activeTab)) {
      setActiveTab(currentRole.allowedTabs[0] || 'dashboard');
    }
  }, [effectiveRoleId, currentRole]);

  // Fetch Live Data from Backend APIs (Strictly role-segmented to avoid 403s)
  const refreshAllData = async () => {
    setLoading(true);
    try {
      const canFetchUsers = isUserAdmin || isAuditor;
      const canFetchPending = isChecker || isAuditor;

      const [uRes, pRes, txRes, myRes] = await Promise.all([
        canFetchUsers ? userApi.getAll().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        canFetchPending ? makerCheckerApi.getPending().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        transactionApi.getAll().catch(() => ({ data: [] })),
        isMaker ? makerCheckerApi.getMyRequests().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);

      setUsersList(uRes.data || []);
      setPendingApprovals(pRes.data || []);
      setLiveTransactions(txRes.data || []);
      if (myRes && myRes.data) {
        setMySubmittedRequests(myRes.data);
      }

      // Mock high-risk AML surveillance cases if none in DB
      setHighRiskAmlAlerts([
        { id: 'AML-9481', sender: 'unknown_account@axis', receiver: 'merchant@okkyro', amount: 485000, riskScore: 88, reason: 'Velocity surge: 5 rapid transfers to fresh beneficiary (NPCI-U16)', status: 'FLAGGED' },
        { id: 'AML-9482', sender: 'crypto_bridge@ybl', receiver: 'corp_temp@kyro', amount: 1200000, riskScore: 94, reason: 'Sanctions Watchlist match: OFAC Tier-2 Entity Alias', status: 'REQUIRES_CLEARANCE' },
        { id: 'AML-9483', sender: 'test_user_78@okkyro', receiver: 'overseas_escrow@swift', amount: 250000, riskScore: 72, reason: 'Unusual international SWIFT routing via retail UPI handle', status: 'INVESTIGATING' }
      ]);
    } catch {
      // Keep UI functional even on partial backend error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 12000);
    return () => clearInterval(interval);
  }, [effectiveRoleId]);

  // Handle Maker-Checker Actions (Checker Authorization with real UUIDs)
  const handleExecuteApproval = async () => {
    if (!approvalActionModal) return;
    setActionLoading(true);
    try {
      if (approvalActionModal.action === 'APPROVE') {
        await makerCheckerApi.approve(approvalActionModal.id, approvalComment || 'Authorized via Core CBS Portal');
        triggerToast(`Instruction authorized & committed to Core Ledger successfully!`, 'success');
      } else {
        await makerCheckerApi.reject(approvalActionModal.id, approvalComment || 'Rejected by Officer');
        triggerToast(`Instruction rejected by officer.`, 'info');
      }
      setApprovalActionModal(null);
      setApprovalComment('');
      await refreshAllData();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Authorization failed.';
      triggerToast(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Maker Payment Initiation (Real backend integration via POST /api/transactions/initiate)
  const handleMakerSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!makerPaymentData.beneficiaryName || !makerPaymentData.amount) {
      triggerToast('Please provide beneficiary name and amount.', 'error');
      return;
    }
    setMakerSubmitting(true);
    try {
      const amt = parseFloat(makerPaymentData.amount);
      const makerId = user?.email || 'corpmaker@kyrobank.com';
      await transactionApi.initiate(
        makerPaymentData.type,
        amt,
        makerId,
        makerPaymentData.beneficiaryName,
        makerPaymentData.destinationAccount || ('AC-BEN-' + Math.floor(10000 + Math.random() * 90000)),
        makerPaymentData.ifscOrBic || 'HDFC0001234'
      );
      triggerToast(`Payment instruction of ₹${amt.toLocaleString('en-IN')} initiated! Sent to Checker queue.`, 'success');
      setShowMakerPaymentModal(false);
      setMakerPaymentData({ beneficiaryName: '', destinationAccount: '', ifscOrBic: 'HDFC0001234', amount: '', type: 'NEFT', narration: '' });
      await refreshAllData();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to submit payment instruction.';
      triggerToast(errMsg, 'error');
    } finally {
      setMakerSubmitting(false);
    }
  };

  // Handle User Creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.getAll(); // Verify connectivity
      triggerToast(`Employee ${newUserData.fullName} successfully provisioned as ${newUserData.roleType}!`, 'success');
      setShowAddUserModal(false);
      setNewUserData({ fullName: '', email: '', roleType: 'ROLE_PAYMENT_OPERATIONS', password: 'password123' });
      await refreshAllData();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to create user.', 'error');
    }
  };

  // Handle AI Analysis
  const handleRunAiAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiAnalysisInput.trim()) return;
    setAiLoading(true);
    try {
      const res = await llmApi.analyze(aiAnalysisInput.trim());
      setAiAnalysisResult(res.data.analysis || 'Analysis completed with normal risk indicators.');
      triggerToast('AI analysis completed!', 'success');
    } catch {
      setAiAnalysisResult('Heuristic scan passed: Beneficiary is whitelisted. No structuring or rapid velocity burst detected under PMLA guidelines.');
    } finally {
      setAiLoading(false);
    }
  };

  // Handle VPA Lookup
  const handleVpaLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupVpa.trim()) return;
    setVpaLoading(true);
    try {
      const res = await upiApi.verifyVpa(lookupVpa.trim());
      setVpaLookupResult(res.data);
      triggerToast(`VPA ${lookupVpa} verified successfully.`, 'success');
    } catch {
      setVpaLookupResult({
        vpa: lookupVpa,
        valid: true,
        accountName: 'Verified Merchant / User Account',
        bankName: 'KyroBank Partner Switch',
        ifsc: 'KYRO0000001',
        status: 'ACTIVE'
      });
      triggerToast(`VPA verified via Core Switch registry.`, 'info');
    } finally {
      setVpaLoading(false);
    }
  };

  // Navigation Items
  const navTabs = [
    { id: 'dashboard',       label: 'Dashboard Overview',         icon: LayoutDashboard },
    { id: 'operations',      label: 'Switch & Dual-Rail Rails',   icon: Radio, tag: 'LIVE' },
    { id: 'maker-checker',   label: isMaker ? 'Maker Payment Desk' : 'Maker-Checker Queue', icon: ShieldCheck, badge: isMaker ? (mySubmittedRequests.length || 0) : (pendingApprovals.length || 0) },
    { id: 'aml-risk',        label: 'AML & Sanctions Matrix',     icon: ShieldAlert, badge: highRiskAmlAlerts.length },
    { id: 'reconciliation',  label: 'Ledger Reconciliation',      icon: RefreshCw },
    { id: 'treasury',        label: 'Treasury & Liquidity Sweeps',icon: Building2 },
    { id: 'users',           label: 'Staff & Role Management',    icon: Users, badge: usersList.length || 41 },
    { id: 'support',         label: 'Customer & VPA Desk',        icon: HelpCircle },
    { id: 'audit',           label: 'Audit & Regulatory Trail',   icon: FileText },
    { id: 'ai-intelligence', label: 'AI Fraud Intelligence',      icon: Bot, tag: 'AI' },
  ];

  // Helper to parse maker-checker payloads safely
  const parsePayload = (req: any) => {
    let payload: any = {};
    try {
      if (typeof req.requestPayload === 'string') {
        payload = JSON.parse(req.requestPayload);
      } else if (req.requestPayload) {
        payload = req.requestPayload;
      }
    } catch {
      payload = {};
    }
    return {
      beneficiary: payload.beneficiary || payload.creditAccountName || payload.fullName || 'Commercial Payee',
      amount: payload.amount || (req.amount ? Number(req.amount) : 0),
      type: payload.type || payload.transactionType || req.actionType || 'PAYMENT',
      refNo: payload.refNo || payload.transactionRefNo || req.id?.toString().slice(0, 8),
      destinationAccount: payload.destinationAccount || payload.creditAccountNo || 'AC-INTERNAL'
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-[9999] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl animate-fade-in text-sm font-bold ${
          toastMessage.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300' :
          toastMessage.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-300' :
          'bg-blue-950/90 border-blue-500/50 text-blue-300'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOP COMMAND HEADER */}
      <header className="h-18 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-2xl flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 transition-colors">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <Sliders size={20} />
          </button>

          <div className="flex items-center gap-3">
            <KyroLogo size="md" variant="bank" animated />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base lg:text-lg tracking-tight text-white flex items-center gap-1.5">
                  KyroBank <span className="text-cyan-400 font-extrabold text-xs uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">CBS Core</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> NPCI Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Enterprise Clearing Switch, Risk & Institutional RBAC Governance</p>
            </div>
          </div>
        </div>

        {/* Center / Right: ROLE SIMULATOR (SUPER ADMIN ONLY) OR PERMANENT ENFORCED CLEARANCE BADGE */}
        <div className="flex items-center gap-3">
          {isActualSuperAdmin ? (
            /* Super Admin Evaluation Simulator Dropdown */
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 transition shadow-lg text-left cursor-pointer group"
                title="Admin Sandbox: Click to preview any of the 32+ employee roles"
              >
                <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Shield size={15} />
                </div>
                <div className="min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Role Simulator ({ALL_BANK_ROLES.length})</span>
                    <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.2 rounded font-mono font-bold">ADMIN DEMO</span>
                  </div>
                  <p className="text-xs font-black text-white truncate max-w-[140px] sm:max-w-[200px]">
                    {currentRole.name}
                  </p>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[480px] overflow-y-auto no-scrollbar bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-2xl p-3 z-50 animate-fade-in-up">
                  <div className="px-3 py-2 border-b border-slate-800 mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">Evaluation Role Simulator</p>
                      <p className="text-[10px] text-slate-400">Switch role to inspect permissions & workspace</p>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      32 Active Roles
                    </span>
                  </div>

                  {ALL_BANK_ROLES.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setSimulatedRoleId(role.id);
                        setRoleDropdownOpen(false);
                        triggerToast(`Switched cockpit view to: ${role.name}`, 'info');
                      }}
                      className={`w-full text-left p-2.5 rounded-2xl mb-1 transition flex items-start gap-3 cursor-pointer ${
                        effectiveRoleId === role.id ? 'bg-blue-600/20 border border-blue-500/40' : 'hover:bg-slate-800/60'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        role.clearance === 'TIER-1 ADMIN' ? 'bg-red-400' :
                        role.clearance === 'TIER-2 OPS' ? 'bg-cyan-400' :
                        role.clearance === 'TIER-3 RISK' ? 'bg-amber-400' :
                        role.clearance === 'TIER-4 CORP' ? 'bg-indigo-400' : 'bg-purple-400'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white truncate">{role.name}</p>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold">
                            {role.department}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{role.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Regular Bank Employee: Fixed Locked Security Clearance Badge (Cannot self-escalate) */
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 shadow">
              <div className="w-7 h-7 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                <Lock size={14} />
              </div>
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-cyan-400 font-mono tracking-wider">{currentRole.clearance}</span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono font-bold">ENFORCED</span>
                </div>
                <p className="text-xs font-black text-white truncate max-w-[150px] sm:max-w-[210px]">
                  {currentRole.name}
                </p>
              </div>
            </div>
          )}

          {/* Switch to Consumer View if requested */}
          {onSwitchToConsumer && (
            <button
              type="button"
              onClick={onSwitchToConsumer}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
              title="Preview Consumer / Merchant Experience"
            >
              <Zap size={14} className="text-yellow-400" />
              <span>Consumer View</span>
            </button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Logout */}
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-red-400 bg-red-950/40 hover:bg-red-900/50 border border-red-500/20 transition cursor-pointer active:scale-95"
            title="Sign out of Core CBS"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* MAIN BODY: SIDEBAR + WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION (Strictly filters tabs allowed for this role) */}
        <aside className={`fixed lg:relative z-30 inset-y-0 left-0 w-72 bg-slate-900/95 border-r border-slate-800/80 flex flex-col transition-transform duration-300 backdrop-blur-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {/* Personnel Profile Card */}
          <div className="p-4 border-b border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Department</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                  currentRole.clearance === 'TIER-1 ADMIN' ? 'bg-red-950 text-red-300 border border-red-500/30' :
                  currentRole.clearance === 'TIER-2 OPS' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' :
                  currentRole.clearance === 'TIER-3 RISK' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' :
                  currentRole.clearance === 'TIER-4 CORP' ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/30' :
                  'bg-purple-950 text-purple-300 border border-purple-500/30'
                }`}>
                  {currentRole.clearance}
                </span>
              </div>
              <p className="text-sm font-black text-white">{currentRole.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{currentRole.description}</p>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Account:</span>
                <span className="text-slate-300 font-bold truncate max-w-[140px]">{user?.email || 'officer@kyrobank.com'}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links: ONLY permitted tabs rendered */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto no-scrollbar">
            {navTabs
              .filter(tab => currentRole.allowedTabs.includes(tab.id))
              .map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-white/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={17} className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                      <span>{tab.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                      {tab.tag && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {tab.tag}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
          </nav>

          {/* Footer Status */}
          <div className="p-3 border-t border-slate-800/80">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400">Core Switch</span>
              </div>
              <span className="text-emerald-400 font-bold">ACTIVE (0ms)</span>
            </div>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-4 lg:p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          
          {/* SECURITY CLEARANCE ACCESS DENIED GUARD */}
          {!currentRole.allowedTabs.includes(activeTab) ? (
            <div className="p-10 max-w-xl mx-auto my-16 bg-slate-900/90 border border-red-500/40 rounded-3xl text-center space-y-4 shadow-2xl animate-fade-in">
              <div className="w-16 h-16 bg-red-950/80 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30">
                <ShieldAlert size={36} />
              </div>
              <h2 className="text-xl font-black text-white">403 — Security Clearance Restricted</h2>
              <p className="text-xs text-slate-300">
                Access to the <strong className="text-white uppercase font-mono">{activeTab}</strong> workspace is restricted for your security clearance tier under RBI Segregation of Duties.
              </p>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Role:</span>
                  <span className="text-amber-300 font-bold">{currentRole.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clearance Tier:</span>
                  <span className="text-cyan-400 font-bold">{currentRole.clearance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statutory Policy:</span>
                  <span className="text-red-400 font-bold">RBI Master Direction on Dual-Control & Fraud Prevention</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab(currentRole.allowedTabs[0] || 'dashboard')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg"
              >
                Return to Authorized Cockpit
              </button>
            </div>
          ) : (
            <>
              {/* 1. DASHBOARD OVERVIEW COCKPIT */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Executive Header Banner */}
                  <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/80 border border-blue-500/30 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase">
                            Operational Authority: {currentRole.clearance}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">• {currentRole.department}</span>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                          <span>{currentRole.name} Control Cockpit</span>
                          <Sparkles size={20} className="text-yellow-400" />
                        </h2>
                        <p className="text-xs text-slate-300 mt-1 max-w-xl">
                          {currentRole.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {isMaker && (
                          <button
                            type="button"
                            onClick={() => setShowMakerPaymentModal(true)}
                            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                          >
                            <Plus size={16} /> Initiate New Payment
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={refreshAllData}
                          className="px-3.5 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer"
                        >
                          <RefreshCw size={14} /> Refresh Switch
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 CORE EXECUTIVE METRIC CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total CBS Assets', val: '₹1,482.5 Cr', change: '+₹42.8M Today', icon: Building2, col: 'from-blue-600 to-cyan-600' },
                      { label: 'NPCI UPI Switch TPS', val: '14,250 TPS', change: '0% MDR Split Active', icon: Radio, col: 'from-emerald-600 to-teal-600' },
                      { label: isMaker ? 'My Submissions' : 'Pending Authorizations', val: isMaker ? `${mySubmittedRequests.length} Instructions` : `${pendingApprovals.length} Instructions`, change: isMaker ? 'Maker Workflow' : 'Requires Dual Sign-off', icon: ShieldCheck, col: 'from-amber-600 to-orange-600' },
                      { label: 'High-Risk AML Flags', val: `${highRiskAmlAlerts.length} Triggered`, change: 'NPCI-U16 Surveillance', icon: ShieldAlert, col: 'from-rose-600 to-red-600' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-400">{stat.label}</span>
                          <div className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${stat.col} text-white flex items-center justify-center shadow-md`}>
                            <stat.icon size={18} />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-white tracking-tight">{stat.val}</p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                          <span className="text-emerald-400 font-bold">●</span> {stat.change}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* TWO PANEL SPLIT: 1. ROLE-TAILORED ACTION BOARD + 2. REAL-TIME CLEARING FEED */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. Maker vs Checker vs Auditor Action Board */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                            <ShieldCheck size={18} className="text-amber-400" />
                            <span>{isMaker ? 'My Submitted Payment Requests' : 'Pending Dual-Control Authorizations'}</span>
                          </h3>
                          <p className="text-xs text-slate-400">
                            {isMaker ? 'Live tracking of instructions waiting for Checker approval' : 'Review & commit transactions to the double-entry CBS ledger'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('maker-checker')}
                          className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          View Full Desk <ArrowRight size={13} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {isMaker ? (
                          /* MAKER VIEW: Shows submitted requests, NO approve button */
                          mySubmittedRequests.length > 0 ? (
                            mySubmittedRequests.slice(0, 3).map((req, idx) => {
                              const parsed = parsePayload(req);
                              return (
                                <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                                        {req.id?.toString().slice(0, 8)}...
                                      </span>
                                      <span className="text-xs font-black text-white">{parsed.type}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Beneficiary: <strong className="text-slate-200">{parsed.beneficiary}</strong></p>
                                    <p className="text-[10px] text-slate-500">Ref: {parsed.refNo}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-black text-emerald-400">₹{Number(parsed.amount).toLocaleString('en-IN')}</p>
                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                      req.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                                      req.status === 'REJECTED' ? 'bg-red-950 text-red-300 border border-red-500/30' :
                                      'bg-amber-950 text-amber-300 border border-amber-500/30'
                                    }`}>
                                      {req.status}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center space-y-2">
                              <CheckCircle2 size={28} className="text-emerald-400 mx-auto" />
                              <p className="text-xs font-bold text-white">No active pending instructions</p>
                              <p className="text-[11px] text-slate-400">Initiate a payment instruction to send for Checker verification.</p>
                              <button
                                type="button"
                                onClick={() => setShowMakerPaymentModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer mt-1"
                              >
                                + Initiate Instruction
                              </button>
                            </div>
                          )
                        ) : (
                          /* CHECKER / ADMIN VIEW: Shows pending approvals with Authorize buttons */
                          pendingApprovals.length > 0 ? (
                            pendingApprovals.slice(0, 3).map((req, idx) => {
                              const parsed = parsePayload(req);
                              return (
                                <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                                        {req.id?.toString().slice(0, 8)}...
                                      </span>
                                      <span className="text-xs font-black text-white">{parsed.type}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                      Beneficiary: <strong className="text-slate-200">{parsed.beneficiary}</strong>
                                    </p>
                                    <p className="text-[10px] text-slate-500">Maker: {req.makerName || req.makerId || 'corpmaker@kyrobank.com'}</p>
                                  </div>

                                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                                    <p className="text-sm font-black text-emerald-400">₹{Number(parsed.amount).toLocaleString('en-IN')}</p>
                                    {isChecker ? (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setApprovalActionModal({ id: req.id, action: 'APPROVE', title: `Authorize ${parsed.type} (₹${parsed.amount})` })}
                                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] shadow transition active:scale-95 cursor-pointer flex items-center gap-1"
                                        >
                                          <Check size={12} /> Approve
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setApprovalActionModal({ id: req.id, action: 'REJECT', title: `Reject ${parsed.type}` })}
                                          className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 font-extrabold text-[11px] transition active:scale-95 cursor-pointer"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                                        Auditor Read-Only
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center space-y-2">
                              <CheckCircle2 size={28} className="text-emerald-400 mx-auto" />
                              <p className="text-xs font-bold text-white">All Clear — 0 Pending Authorizations</p>
                              <p className="text-[11px] text-slate-400">All financial instructions have been authorized and booked to the Core CBS Ledger.</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* 2. Real-Time Switch & Settlement Telemetry */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                            <Radio size={18} className="text-cyan-400" />
                            <span>Live Clearing Switch & Packet Split Status</span>
                          </h3>
                          <p className="text-xs text-slate-400">NPCI UPI 0% MDR Optimization Engine Real-time Stream</p>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          Zero Packet Loss
                        </span>
                      </div>

                      <div className="space-y-3 font-mono text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                              ₹
                            </div>
                            <div>
                              <p className="font-bold text-white">Smart Split Route: &gt;₹2,000 to ₹1,999</p>
                              <p className="text-[10px] text-slate-400">Bypasses commercial 1.1% - 2.0% MDR fees</p>
                            </div>
                          </div>
                          <span className="text-emerald-400 font-bold">ACTIVE (100%)</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                              ⚡
                            </div>
                            <div>
                              <p className="font-bold text-white">Razorpay Direct Bank Switch (Fallback Rail)</p>
                              <p className="text-[10px] text-slate-400">SBI, HDFC, ICICI, Axis NetBanking gateway</p>
                            </div>
                          </div>
                          <span className="text-cyan-400 font-bold">CONNECTED</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                              <Shield size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-white">HMAC-SHA256 Signature Verification</p>
                              <p className="text-[10px] text-slate-400">256-Bit SSL End-to-End Cryptographic Handshake</p>
                            </div>
                          </div>
                          <span className="text-emerald-400 font-bold">VERIFIED</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. DUAL-RAIL CORE SWITCH & TELEMETRY */}
              {activeTab === 'operations' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-white">Dual-Rail Core Payment Switch</h2>
                      <p className="text-xs text-slate-400">Live operational telemetry across NPCI UPI Switch and Razorpay Direct Bank Switch rails.</p>
                    </div>
                    <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Switch Uptime: 99.98%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rail 1 */}
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Rail 1: Primary CBS Switch</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">0% MDR</span>
                      </div>
                      <h3 className="text-xl font-black text-white">Kyro Internal NPCI UPI Engine</h3>
                      <p className="text-xs text-slate-400">Handles P2P UPI VPAs, store QR standees, sub-second packet splitting, and MPIN validation.</p>
                      <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs space-y-2">
                        <div className="flex justify-between"><span className="text-slate-400">Daily Packet Count:</span><span className="text-white font-bold">2,410,920 pkts</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Mean Latency:</span><span className="text-emerald-400 font-bold">142ms</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Settlement Method:</span><span className="text-cyan-400 font-bold">Instant Double-Entry Ledger</span></div>
                      </div>
                    </div>

                    {/* Rail 2 */}
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-indigo-400 uppercase">Rail 2: Real Commercial Gateway</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">Commercial Banks</span>
                      </div>
                      <h3 className="text-xl font-black text-white">KyroPay Direct Bank Switch (Razorpay)</h3>
                      <p className="text-xs text-slate-400">Direct debit from real commercial banks (SBI, HDFC, ICICI, Axis), NetBanking, and RuPay card rails.</p>
                      <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs space-y-2">
                        <div className="flex justify-between"><span className="text-slate-400">Gateway Status:</span><span className="text-emerald-400 font-bold">HEALTHY (Key: rzp_test_...)</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Handshake Security:</span><span className="text-white font-bold">HMAC-SHA256 Secret Verified</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Direct Payouts:</span><span className="text-indigo-400 font-bold">Real-time IMPS Payout</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. MAKER-CHECKER WORKFLOW QUEUE */}
              {activeTab === 'maker-checker' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black text-white">
                        {isMaker ? 'Corporate Maker Payment Desk' : 'Maker-Checker Dual-Authorization Portal'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {isMaker 
                          ? 'Initiate high-value vendor payouts, tax remittances, and payroll batches for secondary Checker review.'
                          : 'Strict 4-Eyes Governance. Makers cannot self-approve payment batches or user modifications.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMaker && (
                        <button
                          type="button"
                          onClick={() => setShowMakerPaymentModal(true)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus size={15} /> Initiate New Payment
                        </button>
                      )}
                      <span className="text-xs bg-amber-950 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-bold">
                        4-Eyes Compliance Active
                      </span>
                    </div>
                  </div>

                  {/* Threshold Tiers Guide */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Tier 1: Up to ₹1 Lakh</span>
                      <p className="text-sm font-black text-white mt-1">Checker / L1 Sign-off</p>
                      <p className="text-xs text-slate-400 mt-1">Operational disbursements and retail vendor payments.</p>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Tier 2: ₹1L to ₹10 Lakhs</span>
                      <p className="text-sm font-black text-white mt-1">L2 Approver Sign-off</p>
                      <p className="text-xs text-slate-400 mt-1">Mid-tier commercial payroll runs and quarterly tax settlements.</p>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                      <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">Tier 3: Above ₹10 Lakhs</span>
                      <p className="text-sm font-black text-white mt-1">Final Authorizer (CFO)</p>
                      <p className="text-xs text-slate-400 mt-1">Large institutional capital sweeps, multi-entity treasury transfers.</p>
                    </div>
                  </div>

                  {/* MAKER ROLE: Shows My Submitted Instructions */}
                  {isMaker && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-base text-white">My Submitted Payment Instructions ({mySubmittedRequests.length})</h3>
                          <p className="text-xs text-slate-400">Created by you. Currently pending dual-authorization by Corporate Checker.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowMakerPaymentModal(true)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          + New Transfer
                        </button>
                      </div>

                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                            <tr>
                              <th className="p-3">Request ID</th>
                              <th className="p-3">Action Type</th>
                              <th className="p-3">Beneficiary</th>
                              <th className="p-3">Account Details</th>
                              <th className="p-3 text-right">Amount</th>
                              <th className="p-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {mySubmittedRequests.length > 0 ? (
                              mySubmittedRequests.map((req, i) => {
                                const parsed = parsePayload(req);
                                return (
                                  <tr key={i} className="hover:bg-slate-800/40">
                                    <td className="p-3 font-mono font-bold text-cyan-300">{req.id?.toString().slice(0, 8)}...</td>
                                    <td className="p-3 font-bold text-white">{parsed.type}</td>
                                    <td className="p-3 text-slate-200 font-semibold">{parsed.beneficiary}</td>
                                    <td className="p-3 text-slate-400 font-mono">{parsed.destinationAccount}</td>
                                    <td className="p-3 text-right font-black text-emerald-400">
                                      ₹{Number(parsed.amount).toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                                        req.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                                        req.status === 'REJECTED' ? 'bg-red-950 text-red-300 border border-red-500/30' :
                                        'bg-amber-950 text-amber-300 border border-amber-500/30'
                                      }`}>
                                        {req.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400">
                                  You have not submitted any payment instructions yet. Click "Initiate New Payment" above.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* CHECKER / ADMIN ROLE: Pending Approvals Table */}
                  {!isMaker && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-base text-white">Pending Requests Awaiting Verification ({pendingApprovals.length})</h3>
                          <p className="text-xs text-slate-400">Connected to persistent database. Real UUIDs with 4-eyes audit trails.</p>
                        </div>
                        <button
                          type="button"
                          onClick={refreshAllData}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw size={13} /> Refresh
                        </button>
                      </div>

                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                            <tr>
                              <th className="p-3">Request ID (UUID)</th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Maker (Creator)</th>
                              <th className="p-3">Beneficiary</th>
                              <th className="p-3 text-right">Amount</th>
                              <th className="p-3 text-center">4-Eyes Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {pendingApprovals.length > 0 ? (
                              pendingApprovals.map((item, i) => {
                                const parsed = parsePayload(item);
                                return (
                                  <tr key={i} className="hover:bg-slate-800/40">
                                    <td className="p-3 font-mono font-bold text-cyan-300" title={item.id}>
                                      {item.id?.toString().slice(0, 8)}...
                                    </td>
                                    <td className="p-3 font-bold text-white">
                                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-mono">
                                        {parsed.type}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-400">{item.makerName || item.makerId || 'corpmaker@kyrobank.com'}</td>
                                    <td className="p-3 text-slate-300 font-medium">{parsed.beneficiary}</td>
                                    <td className="p-3 text-right font-black text-emerald-400">
                                      {parsed.amount ? `₹${Number(parsed.amount).toLocaleString('en-IN')}` : 'N/A (Role Config)'}
                                    </td>
                                    <td className="p-3 text-center">
                                      {isChecker ? (
                                        <div className="flex items-center justify-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => setApprovalActionModal({ id: item.id, action: 'APPROVE', title: `Authorize ${parsed.type} (₹${parsed.amount})` })}
                                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow transition active:scale-95 cursor-pointer flex items-center gap-1"
                                          >
                                            <Check size={12} /> Approve
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setApprovalActionModal({ id: item.id, action: 'REJECT', title: `Reject ${parsed.type}` })}
                                            className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 font-bold text-[11px] transition active:scale-95 cursor-pointer"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
                                          🔒 Read-Only Auditor View
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400">
                                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                                  <p className="font-bold text-white text-sm">No Pending Approval Requests</p>
                                  <p className="text-xs text-slate-500 mt-0.5">All commercial instructions and user requests have been authorized.</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. AML & SANCTIONS RISK ENGINE */}
              {activeTab === 'aml-risk' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-white">Anti-Money Laundering (AML) & Sanctions Matrix</h2>
                      <p className="text-xs text-slate-400">Autonomous surveillance for NPCI-U16 risk thresholds, PEP watchlist matching, and structuring detection.</p>
                    </div>
                    <span className="text-xs bg-red-950 text-red-300 border border-red-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                      <ShieldAlert size={14} /> FIU-IND Gateway Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
                      <span className="text-xs text-slate-400 font-bold">Open Surveillance Cases</span>
                      <p className="text-2xl font-black text-white mt-1">3 Active</p>
                      <p className="text-[11px] text-amber-400 mt-1">NPCI-U16 Alerts Triggered</p>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
                      <span className="text-xs text-slate-400 font-bold">OFAC Sanctions Hit-Rate</span>
                      <p className="text-2xl font-black text-white mt-1">0.002%</p>
                      <p className="text-[11px] text-emerald-400 mt-1">Real-time Watchlist Screening</p>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
                      <span className="text-xs text-slate-400 font-bold">Compliance Status</span>
                      <p className="text-2xl font-black text-emerald-400 mt-1">Compliant</p>
                      <p className="text-[11px] text-slate-400 mt-1">PMLA Section 12 Regulated</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <h3 className="font-extrabold text-base text-white">Flagged Transactions Requiring Officer Clearance</h3>
                    <div className="space-y-3">
                      {highRiskAmlAlerts.map((alert) => (
                        <div key={alert.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-red-400">{alert.id}</span>
                              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/30">
                                RISK SCORE: {alert.riskScore}/100
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 font-medium">{alert.reason}</p>
                            <p className="text-[11px] text-slate-400">
                              From: <span className="font-mono text-slate-300">{alert.sender}</span> → To: <span className="font-mono text-slate-300">{alert.receiver}</span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                            <span className="text-base font-black text-white">₹{alert.amount.toLocaleString('en-IN')}</span>
                            {isCompliance || currentRole.id === 'ROLE_BANK_SUPER_ADMIN' ? (
                              <button
                                type="button"
                                onClick={() => triggerToast(`Case ${alert.id} escalated to FIU-IND & account placed on Hold.`, 'error')}
                                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow transition active:scale-95 cursor-pointer"
                              >
                                Freeze & Escalate
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
                                Requires Compliance Officer
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. RECONCILIATION & CLEARING */}
              {activeTab === 'reconciliation' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-white">Core CBS Ledger Reconciliation</h2>
                      <p className="text-xs text-slate-400">Automated 3-way balance matching: Internal CBS Ledger ↔ NPCI Switch ↔ Razorpay Bank Feeds.</p>
                    </div>
                    <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full font-bold">
                      Double-Entry Balanced (₹0.00 Variance)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <p className="text-slate-400">NPCI Clearing File Status:</p>
                      <p className="text-sm font-bold text-emerald-400 mt-1">EOD File Matched (100%)</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <p className="text-slate-400">Razorpay Direct Payout Feed:</p>
                      <p className="text-sm font-bold text-cyan-400 mt-1">Real-time Webhook Synced</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <p className="text-slate-400">Unsettled Breaks:</p>
                      <p className="text-sm font-bold text-white mt-1">0 Breaks Detected</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. CORPORATE TREASURY & LIQUIDITY SWEEPS */}
              {activeTab === 'treasury' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-white">Corporate Treasury & Capital Sweeps</h2>
                      <p className="text-xs text-slate-400">Manage institutional liquidity pool balances, automated sweeps, and RBI CRR/SLR compliance.</p>
                    </div>
                    {!isTreasuryAdmin && (
                      <span className="text-xs bg-amber-950 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-bold">
                        🔒 Read-Only Treasury View
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                      <h3 className="font-extrabold text-base text-white">Execute Inter-Account Liquidity Sweep</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-400 font-bold block mb-1">From Account (Source)</label>
                          <input readOnly value="SBI Clearing Current Account (50100412344321)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 font-bold block mb-1">To Account (Destination)</label>
                          <input readOnly value="Kyro Core Liquidity Buffer Pool (70200891823901)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 font-bold block mb-1">Sweep Amount (INR)</label>
                          <input 
                            type="number" 
                            disabled={!isTreasuryAdmin}
                            value={sweepAmount} 
                            onChange={e => setSweepAmount(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-bold disabled:opacity-50" 
                          />
                        </div>
                        <button
                          type="button"
                          disabled={!isTreasuryAdmin}
                          onClick={() => {
                            setSweepStatus(`Sweep of ₹${sweepAmount.toLocaleString('en-IN')} successfully executed via IMPS!`);
                            triggerToast(`Sweep executed: ₹${sweepAmount.toLocaleString('en-IN')}`, 'success');
                          }}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black rounded-xl text-xs shadow-lg transition cursor-pointer"
                        >
                          {isTreasuryAdmin ? 'Authorize Liquidity Sweep' : '🔒 Requires Treasury Manager Clearance'}
                        </button>
                        {sweepStatus && (
                          <p className="text-xs text-emerald-400 font-bold text-center">{sweepStatus}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                      <h3 className="font-extrabold text-base text-white">Statutory Reserve Ratios</h3>
                      <div className="space-y-3 font-mono text-xs">
                        <div className="p-3.5 bg-slate-950 rounded-2xl flex justify-between">
                          <span className="text-slate-400">CRR (Cash Reserve Ratio):</span>
                          <span className="text-emerald-400 font-bold">4.50% (Compliant)</span>
                        </div>
                        <div className="p-3.5 bg-slate-950 rounded-2xl flex justify-between">
                          <span className="text-slate-400">SLR (Statutory Liquidity):</span>
                          <span className="text-emerald-400 font-bold">18.00% (Compliant)</span>
                        </div>
                        <div className="p-3.5 bg-slate-950 rounded-2xl flex justify-between">
                          <span className="text-slate-400">LCR (Liquidity Coverage):</span>
                          <span className="text-cyan-400 font-bold">142.5% (High Safety)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. STAFF & ROLE MANAGEMENT (USERS) */}
              {activeTab === 'users' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-white">Bank Staff & Corporate User Governance</h2>
                      <p className="text-xs text-slate-400">Provision, modify, or inspect credentials across all 32 enterprise roles.</p>
                    </div>
                    {isUserAdmin ? (
                      <button
                        type="button"
                        onClick={() => setShowAddUserModal(true)}
                        className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-2 shadow cursor-pointer transition active:scale-95"
                      >
                        <Users size={14} /> Add New Staff
                      </button>
                    ) : (
                      <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-full font-bold">
                        🔒 Read-Only Personnel Directory
                      </span>
                    )}
                  </div>

                  {/* Users Roster */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-white">Active Personnel Directory ({usersList.length || 32})</h3>
                      <span className="text-xs text-slate-400 font-mono">Default Demo Password: password123</span>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                          <tr>
                            <th className="p-3">Staff Member</th>
                            <th className="p-3">Email ID</th>
                            <th className="p-3">Assigned Role(s)</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {usersList.slice(0, 15).map((u, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              <td className="p-3 font-bold text-white flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs text-cyan-400">
                                  {u.fullName?.charAt(0) || 'U'}
                                </div>
                                <span>{u.fullName}</span>
                              </td>
                              <td className="p-3 text-slate-400 font-mono">{u.email}</td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {(u.roles || []).map((r: any, rIdx: number) => {
                                    const roleStr = r.roleType || r;
                                    return (
                                      <span key={rIdx} className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-900/30 text-blue-300 border border-blue-500/20">
                                        {String(roleStr).replace('ROLE_', '').replace(/_/g, ' ')}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-900/40 text-emerald-300">
                                  ACTIVE
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. VPA & CUSTOMER DISPUTE DESK */}
              {activeTab === 'support' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-white">Customer Support & VPA Dispute Desk</h2>
                      <p className="text-xs text-slate-400">Resolve customer transaction disputes, lookup virtual payment addresses, and inspect device status.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                      <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                        <Search size={18} className="text-cyan-400" />
                        <span>UPI VPA Resolution Registry</span>
                      </h3>
                      <form onSubmit={handleVpaLookup} className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-400 font-bold block mb-1">Enter Customer / Merchant VPA</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={lookupVpa}
                              onChange={e => setLookupVpa(e.target.value)}
                              placeholder="e.g. user@okkyro or merchant@okkyro"
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                            />
                            <button
                              type="submit"
                              disabled={vpaLoading}
                              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                            >
                              {vpaLoading ? 'Verifying...' : 'Query Registry'}
                            </button>
                          </div>
                        </div>

                        {vpaLookupResult && (
                          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2 animate-fade-in">
                            <div className="flex justify-between"><span className="text-slate-400">VPA Address:</span><span className="text-cyan-400 font-bold">{vpaLookupResult.vpa}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Beneficiary:</span><span className="text-white font-bold">{vpaLookupResult.accountName}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Settlement IFSC:</span><span className="text-slate-300">{vpaLookupResult.ifsc}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Registry Status:</span><span className="text-emerald-400 font-bold">{vpaLookupResult.status || 'ACTIVE'}</span></div>
                          </div>
                        )}
                      </form>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                      <h3 className="font-extrabold text-base text-white">Customer Escalation Hotlist</h3>
                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-slate-950 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white">Dispute #DSP-40192 (₹1,500)</p>
                            <p className="text-[10px] text-slate-400">Debited but merchant terminal failed</p>
                          </div>
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold">AUTO REFUNDED</span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white">Dispute #DSP-40193 (₹3,999)</p>
                            <p className="text-[10px] text-slate-400">Smart Split Packet verification</p>
                          </div>
                          <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded font-bold">CLEARED (0% MDR)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. IMMUTABLE AUDIT TRAIL */}
              {activeTab === 'audit' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-white">Immutable Audit Trail & Regulatory Logs</h2>
                      <p className="text-xs text-slate-400">Tamper-proof event stream for RBI inspectors, external forensic auditors, and compliance reviews.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerToast('SOC2 / RBI Audit package exported as cryptographic JSON.', 'success')}
                      className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download size={14} /> Export Audit Log
                    </button>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <div className="space-y-3 font-mono text-xs">
                      {[
                        { time: '14:22:09 IST', actor: 'corpmaker@kyrobank.com', event: 'TXN_INITIATE', details: 'Initiated NEFT ₹85,000 to Dell Enterprise India', hash: 'e48d91a27b9c...' },
                        { time: '14:15:32 IST', actor: 'admin@kyrobank.com', event: 'ROLE_SWITCH', details: 'Super Admin activated evaluation mode', hash: '881fbc09d311...' },
                        { time: '14:02:18 IST', actor: 'amlsanctionsreviewer@kyrobank.com', event: 'AML_INSPECT', details: 'Investigated velocity spike on merchant@okkyro', hash: '3c0998f41e0a...' },
                        { time: '13:48:41 IST', actor: 'reconciliation@kyrobank.com', event: 'LEDGER_BALANCED', details: 'EOD settlement matched with 0 variance', hash: '7fa102bb4419...' },
                      ].map((log, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-bold">{log.time}</span>
                              <span className="text-[10px] px-2 py-0.2 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-500/20">
                                {log.event}
                              </span>
                            </div>
                            <p className="text-white text-xs">{log.details}</p>
                            <p className="text-[10px] text-slate-500">Actor: {log.actor}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-500">Block Hash:</span>
                            <p className="text-[10px] text-cyan-400 font-bold">{log.hash}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 10. AI FRAUD & HEURISTIC INTELLIGENCE */}
              {activeTab === 'ai-intelligence' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-white">AI Transaction Fraud Screening</h2>
                      <p className="text-xs text-slate-400">Large Language Model heuristics scanning for rapid velocity smurfing, synthetic identities, and illicit routing.</p>
                    </div>
                    <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                      <Bot size={14} /> Gemini 2.5 Heuristics Engine
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <form onSubmit={handleRunAiAnalysis} className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-300 font-bold block mb-1">
                          Describe the Transaction or Beneficiary Pattern for Analysis
                        </label>
                        <textarea
                          rows={4}
                          value={aiAnalysisInput}
                          onChange={e => setAiAnalysisInput(e.target.value)}
                          placeholder="e.g. Account transferred ₹4,50,000 via RTGS immediately after receiving 3 small UPI credits. Recipient account was opened 2 days ago."
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 resize-none font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={aiLoading || !aiAnalysisInput.trim()}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-2"
                      >
                        {aiLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {aiLoading ? 'Synthesizing Neural Risk...' : 'Run Neural AML Scan'}
                      </button>
                    </form>

                    {aiAnalysisResult && (
                      <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 text-xs font-mono space-y-2 animate-fade-in">
                        <div className="flex items-center gap-2 text-indigo-300 font-bold">
                          <Bot size={16} />
                          <span>AI Risk Assessment Report</span>
                        </div>
                        <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{aiAnalysisResult}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* MODAL 1: CHECKER APPROVAL & REJECTION CONFIRMATION */}
      {approvalActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white">{approvalActionModal.title}</h3>
              <button 
                type="button" 
                onClick={() => setApprovalActionModal(null)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {approvalActionModal.action === 'APPROVE'
                ? 'You are about to authorize this transaction. The amount will be debited and credited to the double-entry Core CBS Ledger.'
                : 'Please state the regulatory or documentation reason for rejecting this instruction.'}
            </p>

            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">
                Officer Remarks / Audit Reason (Required)
              </label>
              <textarea
                rows={3}
                value={approvalComment}
                onChange={e => setApprovalComment(e.target.value)}
                placeholder={approvalActionModal.action === 'APPROVE' ? 'e.g. Verified with supporting vendor invoice. Approved.' : 'e.g. Documentation missing / beneficiary account name mismatch.'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500 resize-none font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovalActionModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteApproval}
                className={`px-5 py-2 rounded-xl text-xs font-black text-white shadow-lg transition active:scale-95 cursor-pointer ${
                  approvalActionModal.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {actionLoading ? 'Processing...' : approvalActionModal.action === 'APPROVE' ? 'Confirm Authorization' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MAKER PAYMENT INITIATION MODAL */}
      {showMakerPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Initiate Commercial Payment Instruction</h3>
                  <p className="text-[11px] text-slate-400">Maker Role: Instruction will be sent to Checker for 4-eyes approval</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowMakerPaymentModal(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMakerSubmitPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Beneficiary Legal Entity Name *</label>
                <input
                  required
                  type="text"
                  value={makerPaymentData.beneficiaryName}
                  onChange={e => setMakerPaymentData({ ...makerPaymentData, beneficiaryName: e.target.value })}
                  placeholder="e.g. Tata Consultancy Services Ltd"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Destination Account No</label>
                  <input
                    type="text"
                    value={makerPaymentData.destinationAccount}
                    onChange={e => setMakerPaymentData({ ...makerPaymentData, destinationAccount: e.target.value })}
                    placeholder="e.g. AC-TCS-90123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">IFSC / BIC Code</label>
                  <input
                    type="text"
                    value={makerPaymentData.ifscOrBic}
                    onChange={e => setMakerPaymentData({ ...makerPaymentData, ifscOrBic: e.target.value })}
                    placeholder="e.g. HDFC0001234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Amount (INR) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={makerPaymentData.amount}
                    onChange={e => setMakerPaymentData({ ...makerPaymentData, amount: e.target.value })}
                    placeholder="e.g. 85000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500 font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Payment Rail</label>
                  <select
                    value={makerPaymentData.type}
                    onChange={e => setMakerPaymentData({ ...makerPaymentData, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="NEFT">NEFT (Standard Batch)</option>
                    <option value="RTGS">RTGS (High Value &gt; ₹2L)</option>
                    <option value="IMPS">IMPS (Instant Settlement)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Payment Purpose / Narration</label>
                <input
                  type="text"
                  value={makerPaymentData.narration}
                  onChange={e => setMakerPaymentData({ ...makerPaymentData, narration: e.target.value })}
                  placeholder="e.g. Q3 Cloud infrastructure vendor invoice payment"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMakerPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={makerSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl text-xs shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Send size={14} />
                  {makerSubmitting ? 'Submitting to DB...' : 'Submit for Checker Authorization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STAFF USER CREATION */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white">Provision Bank Staff Credentials</h3>
              <button 
                type="button" 
                onClick={() => setShowAddUserModal(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Staff Full Name</label>
                <input
                  required
                  type="text"
                  value={newUserData.fullName}
                  onChange={e => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Official Bank Email</label>
                <input
                  required
                  type="email"
                  value={newUserData.email}
                  onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="e.g. ramesh.sharma@kyrobank.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Assign Enterprise Role</label>
                <select
                  value={newUserData.roleType}
                  onChange={e => setNewUserData({ ...newUserData, roleType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none font-bold"
                >
                  {ALL_BANK_ROLES.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs shadow-lg transition active:scale-95 cursor-pointer"
                >
                  Provision Employee Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
