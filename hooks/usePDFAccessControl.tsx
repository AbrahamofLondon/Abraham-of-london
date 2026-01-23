 // hooks/usePDFAccessControl.tsx
export interface PDFAccessControl {
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export function usePDFAccessControl(): PDFAccessControl {
  // Wire to auth/tiers later
  return {
    canEdit: true,
    canDelete: true,
    canShare: true,
  };
}