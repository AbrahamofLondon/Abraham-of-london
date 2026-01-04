// scripts/client/pdf-registry.ts - NO fs MODULE
export { 
  PDF_REGISTRY, 
  getPDFById, 
  getAllPDFs,
  // ... but NOT functions that use fs
} from '../pdf-registry';