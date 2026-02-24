// lib/pdf/formatter.tsx
import React from 'react';
import { Text, View } from '@react-pdf/renderer';

/**
 * SOVEREIGN MDX-TO-PDF FORMATTER
 * Maps raw MDX/Markdown strings to @react-pdf/renderer primitives.
 * Utilizes the institutional stylesheet passed from the parent BriefDocument.
 */
export const formatMDXForPDF = (content: string, styles: any) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      // Handle paragraph spacing for empty lines
      elements.push(<View key={`spacer-${index}`} style={{ height: 8 }} />);
      return;
    }

    // 1. Handle Headings (### Heading)
    if (trimmed.startsWith('#')) {
      const level = (trimmed.match(/^#+/) || [''])[0].length;
      const text = trimmed.replace(/^#+\s*/, '');
      
      // Map to institutional heading levels defined in BriefDocument styles
      const headingStyle = level === 1 ? styles.heading1 : 
                           level === 2 ? styles.heading2 : 
                           styles.heading3;

      elements.push(
        <Text key={`h-${index}`} style={headingStyle || styles.heading}>
          {text.toUpperCase()}
        </Text>
      );
      return;
    }

    // 2. Handle Blockquotes (>)
    if (trimmed.startsWith('>')) {
      const text = trimmed.replace(/^>\s*/, '');
      elements.push(
        <View key={`quote-${index}`} style={styles.quoteBlock}>
          <Text>{parseInlineStyles(text, styles)}</Text>
        </View>
      );
      return;
    }

    // 3. Handle Bullet Points (* or -)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const text = trimmed.replace(/^[*|-]\s*/, '');
      elements.push(
        <View key={`li-${index}`} style={styles.bulletItem}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.bulletText}>
            {parseInlineStyles(text, styles)}
          </Text>
        </View>
      );
      return;
    }

    // 4. Default Paragraph
    elements.push(
      <Text key={`p-${index}`} style={styles.paragraph}>
        {parseInlineStyles(trimmed, styles)}
      </Text>
    );
  });

  return elements;
};

/**
 * INLINE PARSER
 * Handles **bold** and *italics* within any text block.
 */
function parseInlineStyles(text: string, styles: any) {
  // Regex to split by bold (**) or italic (*) markers
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  
  return parts.map((part, i) => {
    // Bold
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={`bold-${i}`} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    // Italic
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <Text key={`italic-${i}`} style={styles.italic}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    // Standard Text
    return part;
  });
}