// lib/constitution/export-standards.ts
// ─── CONSTITUTIONAL DATA STANDARDS ────────────────────────────────────────────

import crypto from 'crypto';
import { CanonicalSectionsEnvelope } from '@/lib/decision/canonical-sections';
import { ConstitutionalDecision } from './rules';

export type ExportFormat = 'CANONICAL_JSON' | 'CONSTITUTIONAL_JSON' | 'CSV' | 'PDF';
export type ImportValidation = 'STRICT' | 'LENIENT' | 'AUTO_MIGRATE';

export interface ConstitutionalExport {
  version: '1.0.0';
  schema: 'https://constitutional.sovereign/schema/v1';
  campaignId: string;
  exportedAt: string;
  exportedBy: string;
  exportFormat: ExportFormat;
  integrityHash: string;
  content: CanonicalSectionsEnvelope | ConstitutionalDecision;
  metadata: {
    participantCount: number;
    thresholdStatus: string;
    constitutionalRoute: string;
    signatureCount: number;
  };
}

export interface ConstitutionalImport {
  version: string;
  campaignId: string;
  importData: unknown;
  validationMode: ImportValidation;
  migrationLog: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Constitutional Export Standards - Law 6
 * Standardized format for interoperability.
 */
export function exportConstitutionalData(
  canonicalData: CanonicalSectionsEnvelope,
  constitutionalDecision: ConstitutionalDecision,
  campaignId: string,
  userId: string,
  format: ExportFormat = 'CANONICAL_JSON'
): ConstitutionalExport {
  const exportData: ConstitutionalExport = {
    version: '1.0.0',
    schema: 'https://constitutional.sovereign/schema/v1',
    campaignId,
    exportedAt: new Date().toISOString(),
    exportedBy: userId,
    exportFormat: format,
    integrityHash: '',
    content: format === 'CONSTITUTIONAL_JSON' ? constitutionalDecision : canonicalData,
    metadata: {
      participantCount: 0, // Would be populated from actual data
      thresholdStatus: 'UNKNOWN',
      constitutionalRoute: constitutionalDecision.route,
      signatureCount: 0,
    },
  };

  // Generate integrity hash
  const contentHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(exportData.content))
    .digest('base64');
  exportData.integrityHash = contentHash;

  return exportData;
}

export function importConstitutionalData(
  importData: ConstitutionalExport,
  validationMode: ImportValidation = 'STRICT'
): ConstitutionalImport {
  const migrationLog: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Validate version
  if (importData.version !== '1.0.0') {
    if (validationMode === 'STRICT') {
      errors.push(`Unsupported version: ${importData.version}`);
    } else if (validationMode === 'LENIENT') {
      warnings.push(`Unsupported version: ${importData.version}, attempting migration`);
      migrationLog.push('Version migration attempted');
    }
  }

  // Validate integrity
  const calculatedHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(importData.content))
    .digest('base64');

  if (calculatedHash !== importData.integrityHash) {
    if (validationMode === 'STRICT') {
      errors.push('Integrity hash mismatch - data may be corrupted');
    } else {
      warnings.push('Integrity hash mismatch - proceeding with caution');
    }
  }

  return {
    version: importData.version,
    campaignId: importData.campaignId,
    importData: importData.content,
    validationMode,
    migrationLog,
    warnings,
    errors,
  };
}