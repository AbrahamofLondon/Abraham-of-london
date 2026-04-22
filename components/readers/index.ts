// components/readers/index.ts
// Reader System Exports

import {
  CanonCallout,
  CanonReader,
  validateCanonContent,
} from "./CanonReader";
import {
  VaultCallout,
  VaultCodeBlock,
  VaultDataBlock,
  VaultReader,
  validateVaultContent,
} from "./VaultReader";

// Canon Reader (Editorial Authority)
export { CanonReader, CanonCallout, validateCanonContent } from './CanonReader';
export type { CanonReaderProps } from './CanonReader';

// Vault Reader (Technical Precision)  
export { 
  VaultReader, 
  VaultDataBlock, 
  VaultCodeBlock, 
  VaultCallout,
  validateVaultContent 
} from './VaultReader';
export type { VaultReaderProps } from './VaultReader';

// Reader selection helper
export function getReaderForContent(type: 'canon' | 'vault' | 'editorial' | 'technical') {
  switch (type) {
    case 'canon':
    case 'editorial':
      return {
        Component: CanonReader,
        callout: CanonCallout,
        validator: validateCanonContent,
        description: 'Editorial Authority - Serif typography, warm reading experience'
      };
    
    case 'vault':
    case 'technical':
      return {
        Component: VaultReader,
        dataBlock: VaultDataBlock,
        codeBlock: VaultCodeBlock,
        callout: VaultCallout,
        validator: validateVaultContent,
        description: 'Technical Precision - Sans typography, structured intelligence'
      };
    
    default:
      return {
        Component: CanonReader,
        callout: CanonCallout,
        validator: validateCanonContent,
        description: 'Defaulting to Canon Reader'
      };
  }
}

// Content type detection
export function detectContentType(content: string): 'canon' | 'vault' {
  // Simple heuristic based on content characteristics
  const hasCodeBlocks = /```|<\/?code|<\/?pre/i.test(content);
  const hasTechnicalTerms = /API|endpoint|configuration|implementation|algorithm/i.test(content);
  const hasDataTables = /<table|<\/tr>|<\/td>/i.test(content);
  const hasLongParagraphs = content.split('\n\n').some(p => p.length > 500);
  const hasLiteraryLanguage = /metaphor|narrative|contemplate|reflection/i.test(content);
  
  const technicalScore = (hasCodeBlocks ? 2 : 0) + 
                         (hasTechnicalTerms ? 1 : 0) + 
                         (hasDataTables ? 1 : 0);
  
  const editorialScore = (hasLongParagraphs ? 2 : 0) + 
                         (hasLiteraryLanguage ? 1 : 0);
  
  return technicalScore > editorialScore ? 'vault' : 'canon';
}
