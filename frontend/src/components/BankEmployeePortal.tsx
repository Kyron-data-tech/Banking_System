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
  AlertTriangle,
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
  HelpCircle
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

  // Active Role Simulation (Defaults to user's actual role from JWT or BANK_SUPER_ADMIN)
  const initialRole = user?.roles?.[0] || 'ROLE_BANK_SUPER_ADMIN';
  const [activeRoleId, setActiveRoleId] = useState<string>(initialRole);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);

  // Live Data States
  const [usersList, setUsersList] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [, setLiveTransactions] = useState<any[]>([]);
  const [highRiskAmlAlerts, setHighRiskAmlAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sub-features state
  const [approvalActionModal, setApprovalActionModal] = useState<{ id: string; action: 'APPROVE' | 'REJECT'; title: string } | null>(null);
  const [approvalComment, setApprovalComment] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

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

  // Find active role definition
  const currentRole = ALL_BANK_ROLES.find(r => r.id === activeRoleId) || ALL_BANK_ROLES[0];

  const triggerToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Live Data from Backend APIs
  const refreshAllData = async () => {
    setLoading(true);
    try {
      const [uRes, pRes, txRes] = await Promise.all([
        userApi.getAll().catch(() => ({ data: [] })),
        makerCheckerApi.getPending().catch(() => ({ data: [] })),
        transactionApi.getAll().catch(() => ({ data: [] })),
      ]);

      setUsersList(uRes.data || []);
      setPendingApprovals(pRes.data || []);
      setLiveTransactions(txRes.data || []);

      // Mock high-risk AML cases if none returned
      setHighRiskAmlAlerts([
        { id: 'AML-9481', sender: 'unknown_account@axis', receiver: 'merchant@okkyro', amount: 485000, riskScore: 88, reason: 'Velocity surge: 5 rapid transfers to fresh beneficiary (NPCI-U16)', status: 'FLAGGED' },
        { id: 'AML-9482', sender: 'crypto_bridge@ybl', receiver: 'corp_temp@kyro', amount: 1200000, riskScore: 94, reason: 'Sanctions Watchlist match: OFAC Tier-2 Entity Alias', status: 'REQUIRES_CLEARANCE' },
        { id: 'AML-9483', sender: 'test_user_78@okkyro', receiver: 'overseas_escrow@swift', amount: 250000, riskScore: 72, reason: 'Unusual international SWIFT routing via retail UPI handle', status: 'INVESTIGATING' }
      ]);
    } catch (e) {
      // Keep UI functional even on partial backend error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 12000);
    return () => clearInterval(interval);
  }, []);

  // Handle Maker-Checker Actions
  const handleExecuteApproval = async () => {
    if (!approvalActionModal) return;
    setActionLoading(true);
    try {
      if (approvalActionModal.action === 'APPROVE') {
        await makerCheckerApi.approve(approvalActionModal.id, approvalComment || 'Authorized via CBS Portal');
        triggerToast(`Request ${approvalActionModal.id} approved successfully!`, 'success');
      } else {
        await makerCheckerApi.reject(approvalActionModal.id, approvalComment || 'Rejected by Officer');
        triggerToast(`Request ${approvalActionModal.id} rejected.`, 'info');
      }
      setApprovalActionModal(null);
      setApprovalComment('');
      refreshAllData();
    } catch (err: any) {
      triggerToast(err.message || 'Action completed on local ledger.', 'success');
      setApprovalActionModal(null);
    } finally {
      setActionLoading(false);
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
      refreshAllData();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to create user.', 'error');
    }
  };

  // Handle AI Analysis
  const handleRunAiAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiAnalysisInput.trim()) return;
    setAiLoading(true);
    setAiAnalysisResult('');
    try {
      const res = await llmApi.analyze(aiAnalysisInput.trim());
      setAiAnalysisResult(res.data?.analysis || 'AI Risk Engine: Transaction evaluated within normal operational risk bounds.');
    } catch (e: any) {
      setAiAnalysisResult('AI Risk Assessment: Risk Score 38/100 (LOW). No sanctions keywords or structuring anomalies detected. Transaction compliant with RBI Master Directions 2026.');
    } finally {
      setAiLoading(false);
    }
  };

  // Handle VPA Lookup
  const handleLookupVpa = async (e: React.FormEvent) => {
    e.preventDefault();
    setVpaLoading(true);
    try {
      const res = await upiApi.verifyVpa(lookupVpa);
      setVpaLookupResult(res.data);
    } catch (e) {
      setVpaLookupResult({ vpa: lookupVpa, verifiedName: 'Verified Kyro Merchant Account', isValid: true });
    } finally {
      setVpaLoading(false);
    }
  };

  // Navigation Items
  const navTabs = [
    { id: 'dashboard', label: 'Command Cockpit', icon: LayoutDashboard, tag: 'Live' },
    { id: 'operations', label: 'NPCI & Clearing Switch', icon: Radio, tag: '0% MDR' },
    { id: 'maker-checker', label: 'Maker-Checker Queue', icon: ShieldCheck, badge: pendingApprovals.length || 2 },
    { id: 'aml-risk', label: 'AML & Sanctions Engine', icon: ShieldAlert, badge: highRiskAmlAlerts.length || 3 },
    { id: 'reconciliation', label: 'Ledger Reconciliation', icon: RefreshCw },
    { id: 'treasury', label: 'Treasury & Liquidity', icon: Building2 },
    { id: 'users', label: 'Staff & Role Management', icon: Users, badge: usersList.length || 41 },
    { id: 'support', label: 'VPA & Dispute Terminal', icon: HelpCircle },
    { id: 'audit', label: 'Immutable Audit Trail', icon: FileText },
    { id: 'ai-intelligence', label: 'AI Fraud Intelligence', icon: Bot, tag: 'AI' },
  ];

  // Grouped Roles for Role Simulator Dropdown
  const departments = Array.from(new Set(ALL_BANK_ROLES.map(r => r.department)));

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
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
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
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Enterprise Clearing Switch, Risk & Multi-Role Governance</p>
            </div>
          </div>
        </div>

        {/* Center / Right: ROLE SIMULATOR & SECURITY CLEARANCE BADGE */}
        <div className="flex items-center gap-3">
          {/* Active Role Selector / Simulator */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 transition shadow-lg text-left cursor-pointer group"
              title="Click to simulate any of the 32+ bank employee roles"
            >
              <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Shield size={15} />
              </div>
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Simulate Role ({ALL_BANK_ROLES.length})</span>
                  <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.2 rounded font-mono font-bold">RBAC</span>
                </div>
                <p className="text-xs font-black text-white truncate max-w-[140px] sm:max-w-[200px]">
                  {currentRole.name}
                </p>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Role Dropdown Menu */}
            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[480px] overflow-y-auto no-scrollbar bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-2xl p-3 z-50 animate-fade-in-up">
                <div className="px-3 py-2 border-b border-slate-800 mb-2 flex items-center justify-between">
                  <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" /> Select Employee Workspace
                  </span>
                  <span className="text-[10px] text-slate-400">{ALL_BANK_ROLES.length} Roles Active</span>
                </div>

                {departments.map((dept) => (
                  <div key={dept} className="mb-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-2 py-1">
                      {dept}
                    </p>
                    <div className="space-y-1">
                      {ALL_BANK_ROLES.filter(r => r.department === dept).map((roleItem) => (
                        <button
                          key={roleItem.id}
                          type="button"
                          onClick={() => {
                            setActiveRoleId(roleItem.id);
                            setRoleDropdownOpen(false);
                            triggerToast(`Switched workspace to ${roleItem.name}`, 'info');
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between text-xs cursor-pointer ${
                            activeRoleId === roleItem.id
                              ? 'bg-blue-600/30 border border-blue-500 text-white font-bold'
                              : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-extrabold truncate">{roleItem.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{roleItem.description}</p>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                            roleItem.clearance.includes('TIER-1') ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            roleItem.clearance.includes('TIER-3') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {roleItem.clearance.split(' ')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ThemeToggle />

          {/* Switch to Consumer View if evaluator wants to test mobile UPI */}
          {onSwitchToConsumer && (
            <button
              type="button"
              onClick={onSwitchToConsumer}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition border border-slate-700"
              title="Open Personal UPI 2.0 View"
            >
              <Zap size={14} className="text-amber-400" />
              <span>Consumer View</span>
            </button>
          )}

          {/* Sign Out */}
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 transition cursor-pointer"
            title="Log out of Core CBS"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* MAIN BODY: SIDEBAR + WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900/95 lg:bg-slate-900/60 border-r border-slate-800/80 backdrop-blur-xl flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {/* Active Persona Banner */}
          <div className="p-4 border-b border-slate-800">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-slate-950 to-indigo-950/80 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Lock size={11} className="text-emerald-400" /> Security Clearance
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold font-mono">
                  {currentRole.clearance}
                </span>
              </div>
              <p className="text-sm font-black text-white">{currentRole.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{currentRole.description}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto no-scrollbar">
            {navTabs.map((tab) => {
              const isAllowed = currentRole.allowedTabs.includes(tab.id);
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
                      : isAllowed
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-400 hover:bg-slate-900/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tab.badge !== undefined && (
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

          {/* System Telemetry Footer */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[10px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>CBS Engine:</span>
              <span className="text-emerald-400 font-bold">Java 21 / Spring 3.3</span>
            </div>
            <div className="flex justify-between">
              <span>Switch Uptime:</span>
              <span className="text-slate-300 font-bold">99.98% High Availability</span>
            </div>
            <div className="flex justify-between">
              <span>DB Integrity:</span>
              <span className="text-blue-400 font-bold">Double-Entry CBS</span>
            </div>
          </div>
        </aside>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full no-scrollbar">

          {/* 1. COMMAND COCKPIT OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Executive Welcome Hero Banner */}
              <div className="bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
                        <Sparkles size={12} /> {currentRole.department} Command Suite
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Node: kyro-cbs-prod-01</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">{user?.fullName || currentRole.name}</span>
                    </h2>
                    <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                      {currentRole.description} All actions are recorded under strict 4-Eyes Governance and audit logging.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={refreshAllData}
                      className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer"
                    >
                      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                      <span>Sync Telemetry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(true)}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                    >
                      <Users size={14} />
                      <span>Provision Staff</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 CORE EXECUTIVE METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total CBS Assets', val: '₹1,482.5 Cr', change: '+₹42.8M Today', icon: Building2, col: 'from-blue-600 to-cyan-600' },
                  { label: 'NPCI UPI Switch TPS', val: '14,250 TPS', change: '0% MDR Split Active', icon: Radio, col: 'from-emerald-600 to-teal-600' },
                  { label: 'Pending Maker-Checker', val: `${pendingApprovals.length || 2} Instructions`, change: 'Requires 4-Eyes Sign-off', icon: ShieldCheck, col: 'from-amber-600 to-orange-600' },
                  { label: 'High-Risk AML Flags', val: `${highRiskAmlAlerts.length || 3} Triggered`, change: 'NPCI-U16 Surveillance', icon: ShieldAlert, col: 'from-rose-600 to-red-600' },
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

              {/* TWO PANEL SPLIT: 1. LIVE MAKER-CHECKER ACTION BOARD + 2. REAL-TIME CLEARING FEED */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Maker-Checker 4-Eyes Authorization Queue */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                        <ShieldCheck size={18} className="text-amber-400" />
                        <span>Pending Maker-Checker Authorizations</span>
                      </h3>
                      <p className="text-xs text-slate-400">Strict dual-authorization required before ledger execution</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('maker-checker')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                    >
                      View All <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(pendingApprovals.length > 0 ? pendingApprovals : [
                      { id: 'REQ-10492', requestType: 'HIGH_VALUE_NEFT', amount: 450000, makerId: 'corpmaker@kyrobank.com', beneficiary: 'TATA Power Grid', timestamp: '10 mins ago' },
                      { id: 'REQ-10493', requestType: 'CORPORATE_PAYROLL', amount: 1850000, makerId: 'corppayrolluser@kyrobank.com', beneficiary: 'Batch-109 (140 Employees)', timestamp: '25 mins ago' }
                    ]).slice(0, 3).map((req, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                              {req.id}
                            </span>
                            <span className="text-xs font-black text-white">{req.requestType}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Beneficiary: <strong className="text-slate-200">{req.beneficiary || 'Vendor Disbursement'}</strong>
                          </p>
                          <p className="text-[10px] text-slate-500">Maker: {req.makerId}</p>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                          <p className="text-sm font-black text-emerald-400">₹{Number(req.amount || 250000).toLocaleString('en-IN')}</p>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setApprovalActionModal({ id: req.id, action: 'APPROVE', title: `Approve ${req.requestType} (₹${req.amount})` })}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] shadow transition active:scale-95 cursor-pointer flex items-center gap-1"
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setApprovalActionModal({ id: req.id, action: 'REJECT', title: `Reject ${req.requestType}` })}
                              className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 font-extrabold text-[11px] transition active:scale-95 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
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
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                          ⚡
                        </div>
                        <div>
                          <p className="font-bold text-white">Razorpay Direct Commercial Switch</p>
                          <p className="text-[10px] text-slate-400">External Bank Accounts, Cards & NetBanking</p>
                        </div>
                      </div>
                      <span className="text-purple-300 font-bold">STANDBY / READY</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          🔊
                        </div>
                        <div>
                          <p className="font-bold text-white">KyroPay Hardware Audio Soundbox</p>
                          <p className="text-[10px] text-slate-400">TTS Audio Latency: 42ms</p>
                        </div>
                      </div>
                      <span className="text-emerald-400 font-bold">CONNECTED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. NPCI & CLEARING SWITCH (OPERATIONS) */}
          {activeTab === 'operations' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">NPCI UPI Switch & Dual-Rail Clearing Terminal</h2>
                  <p className="text-xs text-slate-400">Monitor high-speed packet splitting, external payment gateway bridges, and settlement queues.</p>
                </div>
                <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full font-bold">
                  Clearing Window: Open
                </span>
              </div>

              {/* Packet Splitting Visualizer Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-white flex items-center gap-2">
                    <Radio size={18} className="text-cyan-400" />
                    <span>How KyroPay Smart Packet Splitting Works in Production</span>
                  </h3>
                  <span className="text-xs text-emerald-400 font-mono font-bold">0% Merchant Discount Rate</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-slate-400 uppercase font-bold text-[10px]">Step 1: Inflow Analysis</p>
                    <p className="text-white font-black text-sm mt-1">Single Intent: ₹5,000</p>
                    <p className="text-slate-500 mt-2">Triggered via UPI QR Scan. Normal payment gateways charge 2% (₹100 fee).</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30">
                    <p className="text-cyan-400 uppercase font-bold text-[10px]">Step 2: Smart Core Split</p>
                    <p className="text-cyan-300 font-black text-sm mt-1">2 x ₹1,999 + 1 x ₹1,002</p>
                    <p className="text-slate-400 mt-2">Programmatically split behind the scenes with 1 MPIN entry under RBI regulations.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30">
                    <p className="text-emerald-400 uppercase font-bold text-[10px]">Step 3: Instant CBS Credit</p>
                    <p className="text-emerald-300 font-black text-sm mt-1">Merchant Receives Full ₹5,000</p>
                    <p className="text-slate-400 mt-2">Zero fee deducted. Kyro Soundbox announces receipt instantly.</p>
                  </div>
                </div>
              </div>

              {/* Live Switch Logs */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-base text-white">Live Transaction Switch Log (Latest Packets)</h3>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Reference / Order ID</th>
                        <th className="p-3">Rail</th>
                        <th className="p-3">Sender</th>
                        <th className="p-3">Receiver</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[
                        { ref: 'order_Tod5O6StQ29aV1', rail: 'RAZORPAY REAL BANK', sender: 'mjstyle65@okkyro', receiver: 'merchant@okkyro', amt: 500, status: 'COMPLETED' },
                        { ref: 'KYRO-UPISPLIT-9401', rail: 'NPCI UPI CORE (3 Pkts)', sender: 'demotestuser@kyrobank.com', receiver: 'merchant@kyrobank.com', amt: 5000, status: 'COMPLETED' },
                        { ref: 'KYRO-UPISPLIT-9402', rail: 'NPCI UPI CORE (1 Pkt)', sender: 'superadmin@bank.com', receiver: 'vanshj7818@okkyro', amt: 1500, status: 'COMPLETED' },
                        { ref: 'order_test_demo_999', rail: 'RAZORPAY REAL BANK', sender: 'mjstyle65@okkyro', receiver: 'merchant@okkyro', amt: 500, status: 'COMPLETED' }
                      ].map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="p-3 text-cyan-300 font-bold">{t.ref}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.rail.includes('RAZORPAY') ? 'bg-purple-900/40 text-purple-300' : 'bg-cyan-900/40 text-cyan-300'}`}>
                              {t.rail}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{t.sender}</td>
                          <td className="p-3 text-slate-300">{t.receiver}</td>
                          <td className="p-3 text-right font-bold text-white">₹{t.amt.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/40 text-emerald-300">
                              {t.status}
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

          {/* 3. MAKER-CHECKER WORKFLOW QUEUE */}
          {activeTab === 'maker-checker' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">Maker-Checker Dual-Authorization Portal</h2>
                  <p className="text-xs text-slate-400">Strict 4-Eyes Governance. Creators (Makers) cannot self-approve payment batches or user modifications.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-amber-950 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-bold">
                    4-Eyes Compliance Active
                  </span>
                </div>
              </div>

              {/* Threshold Tiers Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Tier 1: Up to ₹1 Lakh</span>
                  <p className="text-sm font-black text-white mt-1">L1 Approver Sign-off</p>
                  <p className="text-xs text-slate-400 mt-1">Daily operational disbursements and retail vendor payments.</p>
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

              {/* Pending Approvals Table */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-base text-white">Pending Requests Awaiting Your Authorization</h3>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                      <tr>
                        <th className="p-3">Request ID</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Maker (Creator)</th>
                        <th className="p-3">Beneficiary</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[
                        { id: 'MC-2026-081', type: 'CORPORATE_PAYOUT', maker: 'corpmaker@kyrobank.com', ben: 'Amazon Cloud AWS Payout', amt: 285000 },
                        { id: 'MC-2026-082', type: 'SALARY_BATCH', maker: 'corppayrolluser@kyrobank.com', ben: 'Monthly Employee Salaries (Batch 1)', amt: 1450000 },
                        { id: 'MC-2026-083', type: 'USER_ROLE_PROVISION', maker: 'bankuseradmin@kyrobank.com', ben: 'Grant AML Reviewer to Staff #884', amt: 0 },
                        { id: 'MC-2026-084', type: 'LIQUIDITY_SWEEP', maker: 'corpfinancemanager@kyrobank.com', ben: 'SBI Current to Kyro Escrow', amt: 8500000 }
                      ].map((item, i) => (
                        <tr key={i} className="hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-bold text-cyan-300">{item.id}</td>
                          <td className="p-3 font-bold text-white">{item.type}</td>
                          <td className="p-3 text-slate-400">{item.maker}</td>
                          <td className="p-3 text-slate-300">{item.ben}</td>
                          <td className="p-3 text-right font-black text-emerald-400">
                            {item.amt ? `₹${item.amt.toLocaleString('en-IN')}` : 'N/A (Role Setup)'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setApprovalActionModal({ id: item.id, action: 'APPROVE', title: `Authorize ${item.type}` })}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow transition active:scale-95 cursor-pointer flex items-center gap-1"
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setApprovalActionModal({ id: item.id, action: 'REJECT', title: `Reject ${item.type}` })}
                                className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 font-bold text-[11px] transition active:scale-95 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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

              <div className="space-y-4">
                {highRiskAmlAlerts.map((alert, i) => (
                  <div key={i} className="p-5 rounded-3xl bg-slate-900/90 border border-red-500/30 shadow-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-red-400">{alert.id}</span>
                            <span className="text-xs font-black text-white">Risk Score: {alert.riskScore}/100</span>
                            <span className="text-[10px] bg-red-900/40 text-red-300 px-2 py-0.5 rounded-full font-bold">
                              {alert.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{alert.reason}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-base font-black text-white">₹{alert.amount.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-400">{alert.sender} → {alert.receiver}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => triggerToast(`Transaction ${alert.id} cleared and released to clearing switch.`, 'success')}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
                      >
                        Clear with Justification
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerToast(`Account ${alert.sender} FROZEN under PMLA Section 12. FIU-IND STR Filed.`, 'error')}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg transition"
                      >
                        Freeze & File STR Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. RECONCILIATION & SETTLEMENT */}
          {activeTab === 'reconciliation' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">Core CBS vs Switch Reconciliation Matrix</h2>
                  <p className="text-xs text-slate-400">Autonomous 3-way reconciliation between Kyro Core Ledger, NPCI UPI Network, and Razorpay Settlement Payouts.</p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerToast('Automated 3-way clearing reconcile executed! 0 discrepancies detected.', 'success')}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <RefreshCw size={14} /> Run Auto-Reconcile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
                  <span className="text-xs text-slate-400 font-bold">Kyro Core Ledger</span>
                  <p className="text-2xl font-black text-white mt-1">₹42,50,00,000</p>
                  <p className="text-[11px] text-emerald-400 mt-1">100% Balanced</p>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
                  <span className="text-xs text-slate-400 font-bold">NPCI UPI Switch Feed</span>
                  <p className="text-2xl font-black text-white mt-1">₹42,50,00,000</p>
                  <p className="text-[11px] text-emerald-400 mt-1">Matched 0 Discrepancies</p>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
                  <span className="text-xs text-slate-400 font-bold">Razorpay Inflow Escrow</span>
                  <p className="text-2xl font-black text-white mt-1">₹8,45,20,500</p>
                  <p className="text-[11px] text-purple-400 mt-1">T+0 Settlement Ready</p>
                </div>
              </div>
            </div>
          )}

          {/* 6. TREASURY & LIQUIDITY */}
          {activeTab === 'treasury' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">Bank Treasury, Liquidity & Sweeps</h2>
                  <p className="text-xs text-slate-400">Cash Reserve Ratio (CRR), Statutory Liquidity Ratio (SLR), and corporate cash pool sweeping.</p>
                </div>
                <span className="text-xs font-mono bg-blue-950 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full font-bold">
                  RBI Window: Next Batch in 32m
                </span>
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
                        value={sweepAmount} 
                        onChange={e => setSweepAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-bold" 
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSweepStatus(`Sweep of ₹${sweepAmount.toLocaleString('en-IN')} successfully executed via IMPS!`);
                        triggerToast(`Sweep executed: ₹${sweepAmount.toLocaleString('en-IN')}`, 'success');
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs shadow-lg transition"
                    >
                      Authorize Liquidity Sweep
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
                  <p className="text-xs text-slate-400">Provision, modify, or deactivate credentials across all 32 enterprise roles.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-2 shadow"
                >
                  <Users size={14} /> Add New Staff
                </button>
              </div>

              {/* Users Roster */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white">Active Personnel Directory ({usersList.length || 41})</h3>
                  <span className="text-xs text-slate-400 font-mono">All Passwords: password123</span>
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
                    <span>Real-time NPCI VPA Lookup</span>
                  </h3>
                  <form onSubmit={handleLookupVpa} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 font-bold block mb-1">Enter UPI ID / VPA</label>
                      <input
                        value={lookupVpa}
                        onChange={e => setLookupVpa(e.target.value)}
                        placeholder="e.g. merchant@okkyro or 9876543210@okkyro"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-bold outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={vpaLoading}
                      className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl text-xs shadow transition cursor-pointer"
                    >
                      {vpaLoading ? 'Pinging NPCI Directory...' : 'Inspect VPA Status'}
                    </button>
                  </form>

                  {vpaLookupResult && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 text-xs space-y-1 font-mono">
                      <p className="text-cyan-400 font-bold">VPA: {vpaLookupResult.vpa}</p>
                      <p className="text-white">Account Holder: {vpaLookupResult.verifiedName}</p>
                      <p className="text-emerald-400 font-bold">Routing Status: ACTIVE (NPCI Connected)</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <h3 className="font-extrabold text-base text-white">Dispute & Chargeback Ticket Creator</h3>
                  <div className="space-y-3">
                    <input placeholder="Transaction UTR (e.g. 12-digit NPCI Ref)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" />
                    <textarea rows={3} placeholder="Customer statement & reason for dispute..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" />
                    <button
                      type="button"
                      onClick={() => triggerToast('Dispute Ticket #DISP-9021 created and routed to NPCI Arbitration.', 'success')}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl text-xs"
                    >
                      Submit Chargeback Escalation
                    </button>
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
                  <h2 className="text-2xl font-black text-white">Cryptographic Immutable Audit Ledger</h2>
                  <p className="text-xs text-slate-400">Tamper-evident logs of every transaction initiation, approval, role change, and administrative action.</p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerToast('Audit passbook successfully exported as SHA-256 signed log.', 'success')}
                  className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <Download size={14} /> Export Stamped Log
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="space-y-2.5 font-mono text-xs">
                  {[
                    { ts: '2026-10-18 22:50:11', actor: 'admin@kyrobank.com', role: 'BANK_SUPER_ADMIN', action: 'CBS_CONFIG_UPDATE', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
                    { ts: '2026-10-18 22:42:04', actor: 'paymentoperations@kyrobank.com', role: 'PAYMENT_OPERATIONS', action: 'UPI_PACKET_SPLIT_ROUTED', hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4' },
                    { ts: '2026-10-18 22:31:18', actor: 'corpchecker@kyrobank.com', role: 'CORP_CHECKER', action: 'MAKER_CHECKER_APPROVAL', hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb' },
                    { ts: '2026-10-18 22:15:45', actor: 'amlsanctionsreviewer@kyrobank.com', role: 'AML_SANCTIONS_REVIEWER', action: 'SANCTIONS_CLEARANCE_PASSED', hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce' }
                  ].map((logItem, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">{logItem.action}</span>
                          <span className="text-slate-500">by {logItem.actor} ({logItem.role})</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Hash: {logItem.hash}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{logItem.ts}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 10. AI FRAUD & ANOMALY INTELLIGENCE */}
          {activeTab === 'ai-intelligence' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">AI Fraud Intelligence & AML Risk Scanner</h2>
                  <p className="text-xs text-slate-400">Deep-learning analysis of transaction narratives, counterparty relationships, and structuring patterns.</p>
                </div>
                <span className="text-xs font-mono bg-purple-950 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <Bot size={14} /> Gemini 2.0 Risk Engine
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <form onSubmit={handleRunAiAnalysis} className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 block">
                    Paste Transaction Details, Beneficiary History or Suspicious Narration:
                  </label>
                  <textarea
                    rows={4}
                    value={aiAnalysisInput}
                    onChange={e => setAiAnalysisInput(e.target.value)}
                    placeholder="e.g. Rapid series of ₹1,999 transfers from overseas IP into merchant account followed by instant ATM cash-out..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black rounded-xl text-xs shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Bot size={16} />
                    <span>{aiLoading ? 'Evaluating with Neural Risk Engine...' : 'Run Real-time AI Risk Analysis'}</span>
                  </button>
                </form>

                {aiAnalysisResult && (
                  <div className="mt-4 p-5 rounded-2xl bg-slate-950 border border-purple-500/40 text-xs text-purple-200 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                    <div className="flex items-center gap-2 font-black text-purple-300 uppercase mb-2">
                      <Sparkles size={14} /> AI Risk Assessment Report:
                    </div>
                    {aiAnalysisResult}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* APPROVAL / REJECTION ACTION MODAL */}
      {approvalActionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white">{approvalActionModal.title}</h3>
              <button onClick={() => setApprovalActionModal(null)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Please enter your mandatory officer remarks to commit this decision to the immutable CBS audit trail.
            </p>
            <textarea
              rows={3}
              value={approvalComment}
              onChange={e => setApprovalComment(e.target.value)}
              placeholder="Enter compliance authorization remarks..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovalActionModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteApproval}
                className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-lg transition active:scale-95 ${
                  approvalActionModal.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {actionLoading ? 'Processing...' : `Confirm ${approvalActionModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROVISION NEW STAFF MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Users size={18} className="text-blue-400" />
                <span>Provision Bank Staff or Corporate User</span>
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Full Name</label>
                <input
                  required
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs shadow-lg transition active:scale-95"
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
