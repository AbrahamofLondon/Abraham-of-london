/* lib/pdf/formatter.tsx — V7.6 (STRICT TYPE ALIGNMENT) */
import React from 'react';
import { Text, View, Link } from '@react-pdf/renderer';

const GOLD = "#B8860B";
const INK = "#0B0F17";
const MUTE = "#5B6472";

/**
 * PHASE 1: PRE-SCAN (TOC Extraction)
 */
export const extractTOC = (content: string) => {
  if (!content) return [];
  const lines = content.split('\n');
  const toc: { level: number; text: string; id: string }[] = [];
  let hIndex = 0;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      const level = trimmed.startsWith('## ') ? 2 : 3;
      const text = trimmed.replace(/^###?\s+/, '');
      toc.push({
        level,
        text,
        id: `section-${level}-${hIndex++}`
      });
    }
  });
  return toc;
};

/**
 * PHASE 2: TOC RENDERER
 */
export const renderTOC = (toc: any[], styles: any) => {
  if (toc.length < 2) return null;

  return (
    <View style={{ 
      marginBottom: 35, 
      padding: 20, 
      backgroundColor: '#F9FAFB', 
      borderLeft: `2.5pt solid ${GOLD}` 
    }}>
      <Text style={{ 
        fontSize: 9, 
        letterSpacing: 2, 
        fontWeight: "bold", 
        color: INK, 
        marginBottom: 15,
        textTransform: 'uppercase'
      }}>
        Structural Overview // Table of Contents
      </Text>
      {toc.map((item, i) => (
        <View key={i} style={{ 
          flexDirection: 'row', 
          marginBottom: 6, 
          paddingLeft: item.level === 3 ? 12 : 0 
        }}>
          <Text style={{ fontSize: 8, color: GOLD, marginRight: 8 }}>
            {item.level === 2 ? '►' : '↳'}
          </Text>
          <Link src={`#${item.id}`} style={{ 
            fontSize: 8.5, 
            color: MUTE, 
            textDecoration: 'none' 
          }}>
            {item.text}
          </Link>
        </View>
      ))}
    </View>
  );
};

/**
 * PHASE 3: MAIN MDX ENGINE
 * Fixed: Explicit null-checks for regex match groups to satisfy TS compiler.
 */
export const formatMDXForPDF = (content: string, styles: any) => {
  if (!content || typeof content !== 'string') return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let hIndex = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      elements.push(<View key={`spacer-${index}`} style={{ height: 8 }} />);
      return;
    }

    // 1. Headings (#, ##, ###) - STRENGTHENED TYPE SAFETY
    if (trimmed.startsWith('#')) {
      const match = trimmed.match(/^(#+)\s*(.*)/);
      // Ensure match exists and both capture groups are defined
      if (match && match[1] && match[2]) {
        const level = match[1].length;
        const text = match[2];
        const id = (level === 2 || level === 3) ? `section-${level}-${hIndex++}` : undefined;
        const style = styles[`heading${level}`] || styles.paragraph;

        elements.push(
          <Text key={`h-${index}`} id={id} style={[style, { marginBottom: 10, marginTop: level === 1 ? 0 : 15 }]}>
            {level === 1 ? text.toUpperCase() : text}
          </Text>
        );
        return;
      }
    }

    // 2. Alert & Blockquote Handling
    if (trimmed.startsWith('>')) {
      const text = trimmed.replace(/^>\s*/, '');
      const isAlert = text.startsWith('**ALERT');
      
      elements.push(
        <View key={`quote-${index}`} style={{
          padding: 15,
          marginVertical: 12,
          backgroundColor: isAlert ? '#FDFCFB' : '#F3F4F6',
          borderLeft: `1.5pt solid ${isAlert ? GOLD : INK}`,
          borderRadius: 1
        }}>
          <Text style={{ fontSize: 9, fontFamily: 'AoLInter', color: INK, lineHeight: 1.6, fontStyle: isAlert ? 'normal' : 'italic' }}>
            {parseInlineStyles(text, styles)}
          </Text>
        </View>
      );
      return;
    }

    // 3. List Logic
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const isTask = trimmed.includes('[ ]') || trimmed.includes('[x]');
      const isChecked = trimmed.includes('[x]');
      const text = trimmed.replace(/^[*|-]\s*(\[[\sx]\]\s*)?/, '');
      
      elements.push(
        <View key={`li-${index}`} style={{ flexDirection: 'row', marginBottom: 6, paddingLeft: 5 }}>
          {isTask ? (
            <View style={{ 
              width: 8, height: 8, 
              border: `0.5pt solid ${INK}`, 
              backgroundColor: isChecked ? INK : 'transparent',
              marginRight: 10, marginTop: 4 
            }} />
          ) : (
            <Text style={{ width: 12, color: GOLD, fontSize: 10 }}>•</Text>
          )}
          <Text style={[styles.paragraph, { flex: 1 }]}>
            {parseInlineStyles(text, styles)}
          </Text>
        </View>
      );
      return;
    }

    // 4. Standard Paragraphs
    elements.push(
      <Text key={`p-${index}`} style={[styles.paragraph, { marginBottom: 10, lineHeight: 1.5, textAlign: 'justify' }]}>
        {parseInlineStyles(trimmed, styles)}
      </Text>
    );
  });

  return elements;
};

/**
 * PHASE 4: INLINE PARSER
 */
function parseInlineStyles(text: string, styles: any) {
  try {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);
    
    return parts.map((part, i) => {
      if (!part) return null;

      if (part.startsWith('**') && part.endsWith('**')) {
        return <Text key={`b-${i}`} style={{ fontWeight: 'bold', color: INK }}>{part.slice(2, -2)}</Text>;
      }
      
      if (part.startsWith('*') && part.endsWith('*')) {
        return <Text key={`i-${i}`} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</Text>;
      }

      if (part.startsWith('[') && part.includes('](')) {
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch && linkMatch[1] && linkMatch[2]) {
          const label = linkMatch[1];
          const url = linkMatch[2];
          return (
            <Link key={`link-${i}`} src={url} style={{ color: GOLD, textDecoration: 'underline' }}>
              {label}
            </Link>
          );
        }
      }

      return part;
    });
  } catch (err) {
    return text;
  }
}