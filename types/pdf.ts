// types/pdf.ts
import { ReactNode } from 'react';

// ==================== CORE PDF TYPES ====================
export interface PDFConfig {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  exists: boolean;
  fileSize?: number;
  outputPath: string;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: PDFMetadata;
  accessLevel?: AccessLevel;
  tags?: string[];
  version?: number;
}

export interface PDFMetadata {
  author?: string;
  keywords?: string[];
  subject?: string;
  producer?: string;
  creator?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount?: number;
  encrypted?: boolean;
}

export interface GenerationResponse {
  success: boolean;
  filename?: string;
  error?: string;
  count?: number;
  timestamp?: Date;
  duration?: number;
  fileSize?: number;
  warnings?: string[];
}

export interface FilterState {
  searchQuery: string;
  selectedCategory: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  accessLevel?: AccessLevel[];
}

export interface DashboardStats {
  totalPDFs: number;
  availablePDFs: number;
  missingPDFs: number;
  categories: string[];
  totalFileSize: number;
  averageFileSize: number;
  byAccessLevel: Record<AccessLevel, number>;
  byCategory: Record<string, number>;
}

// ==================== MANAGEMENT TYPES ====================
export type AccessLevel = 'public' | 'internal' | 'confidential' | 'restricted';

export interface ManagementControl {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  permissions: UserPermission[];
  action?: () => Promise<void>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  category: 'security' | 'users' | 'content' | 'system' | 'automation';
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  userId: string;
  timestamp: Date;
  status: 'success' | 'error' | 'warning';
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  resourceId?: string;
  resourceType: 'pdf' | 'user' | 'system' | 'api';
  duration?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  storageUsed: number;
  storageTotal: number;
  activeSessions: number;
  pdfsGeneratedToday: number;
  apiRequests: number;
  apiErrors: number;
  uptime: number;
  lastBackup?: Date;
  queueSize: number;
}

export interface UserPermission {
  canGenerate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canManageSettings: boolean;
  canBulkOperations: boolean;
  canScheduleTasks: boolean;
  canOverrideLimits: boolean;
  canViewConfidential: boolean;
  canEditMetadata: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: UserPermission;
  lastLogin?: Date;
  createdAt: Date;
  isActive: boolean;
  department?: string;
  accessLevel: AccessLevel;
  sessionCount: number;
}

export type UserRole = 'viewer' | 'editor' | 'manager' | 'admin' | 'superadmin';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  action: AutomationAction;
  conditions?: AutomationCondition[];
  lastExecuted?: Date;
  executionCount: number;
  createdBy: string;
  createdAt: Date;
}

export type AutomationTrigger = 
  | 'schedule' 
  | 'file_creation' 
  | 'file_modification'
  | 'api_call'
  | 'manual';

export type AutomationAction = 
  | 'generate_pdf'
  | 'delete_old_files'
  | 'send_email'
  | 'webhook_call'
  | 'backup'
  | 'cleanup';

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

// ==================== DASHBOARD STATE TYPES ====================
export interface PDFDashboardState {
  pdfs: PDFConfig[];
  selectedPDFId: string | null;
  isGenerating: boolean;
  generationStatus: GenerationStatus | null;
  filters: FilterState;
  refreshKey: number;
  isLoading: boolean;
  error: Error | null;
  managementView: ManagementView;
  selectedAuditLogs: AuditLog[];
  systemMetrics: SystemMetrics;
  activeUsers: User[];
}

export interface GenerationStatus {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: Date;
  progress?: number;
  total?: number;
  current?: number;
}

export type ManagementView = 
  | 'overview'
  | 'audit'
  | 'users'
  | 'security'
  | 'storage'
  | 'automation'
  | 'settings';

// ==================== CONSTANTS ====================
export const ACCESS_LEVELS: Record<AccessLevel, { label: string; color: string; description: string }> = {
  public: { 
    label: 'Public', 
    color: 'text-green-400 bg-green-400/10', 
    description: 'Accessible to all users' 
  },
  internal: { 
    label: 'Internal', 
    color: 'text-blue-400 bg-blue-400/10', 
    description: 'Internal use only' 
  },
  confidential: { 
    label: 'Confidential', 
    color: 'text-amber-400 bg-amber-400/10', 
    description: 'Restricted to authorized personnel' 
  },
  restricted: { 
    label: 'Restricted', 
    color: 'text-red-400 bg-red-400/10', 
    description: 'Highly restricted access' 
  },
};
