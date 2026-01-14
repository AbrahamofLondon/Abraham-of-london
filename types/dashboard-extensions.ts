// types/dashboard-extensions.ts
declare module '@/components/DashboardHeader' {
  export interface DashboardHeaderProps {
    title: string;
    subtitle: string;
    stats: any;
    user?: any;
    onRefresh: () => void;
    onGenerateAll: () => void;
    isGenerating: boolean;
    additionalActions?: React.ReactNode; // Added
  }
  
  const DashboardHeader: React.FC<DashboardHeaderProps>;
  export default DashboardHeader;
}

declare module '@/components/PDFQuickActions' {
  export interface PDFQuickActionsProps {
    selectedCount: number;
    onRefresh: () => void;
    onGenerateAll: () => void;
    onBatchDelete: () => void;
    onClearSelection: () => void;
    isGenerating: boolean;
    additionalButtons?: React.ReactNode; // Added
  }
  
  const PDFQuickActions: React.FC<PDFQuickActionsProps>;
  export default PDFQuickActions;
}