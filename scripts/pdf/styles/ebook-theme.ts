// lib/ebook/theme.ts

export const ebookTheme = {
  colors: {
    // Base
    bg: "#fbfaf7",
    paper: "#fffdf8",
    ink: "#111318",
    muted: "#5f6470",
    faint: "#8a8f99",
    
    // Rules & Borders
    rule: "#e8dfcf",
    ruleLight: "rgba(232, 223, 207, 0.5)",
    ruleDark: "#d8cfc0",
    
    // Accents
    gold: "#b8923f",
    goldLight: "#d8b87a",
    goldDark: "#8f6d2a",
    goldSoft: "rgba(184, 146, 63, 0.12)",
    goldGlow: "rgba(184, 146, 63, 0.08)",
    
    // Backgrounds
    navy: "#0c1730",
    panel: "#f6f2ea",
    panel2: "#f9f7f2",
    panel3: "#fcfbf8",
    
    // Text
    textDark: "#1c2230",
    textMedium: "#2a2f3c",
    textLight: "#4a4f5c",
    
    // Status
    success: "#2b6e4f",
    warning: "#b68b40",
    error: "#b34a4a",
    info: "#3b6e8f",
    
    // Overlays
    overlayLight: "rgba(255, 255, 255, 0.92)",
    overlayDark: "rgba(10, 15, 26, 0.85)",
  },

  spacing: {
    // Page dimensions (for @page)
    pageTop: "18mm",
    pageSide: "16mm",
    pageBottom: "18mm",
    
    // Vertical spacing
    sectionGap: "24px",
    chapterGap: "34px",
    paragraphGap: "18px",
    elementGap: "22px",
    
    // Horizontal spacing
    contentMaxWidth: "760px",
    contentNarrowWidth: "68%",
    contentWideWidth: "82%",
    
    // Padding
    panelPadding: "20px",
    sectionPadding: "70px 60px",
    bodyPadding: "0 0 28px 0",
  },

  typography: {
    fonts: {
      serif: "Georgia, 'Times New Roman', serif",
      sans: "'Arial', 'Helvetica', sans-serif",
      mono: "'Courier New', Courier, monospace",
      display: "'Times New Roman', Georgia, serif",
    },
    
    sizes: {
      // Body text
      body: "11.5px",
      bodySmall: "10.5px",
      bodyLarge: "12.5px",
      
      // Headings
      h1: "23px",
      h2: "18px",
      h3: "14px",
      h4: "12px",
      
      // Display
      title: "42px",
      subtitle: "20px",
      opening: "22px",
      
      // Special
      dropCap: "64px",
      callout: "10px",
      caption: "11px",
      meta: "9px",
      tiny: "8px",
    },
    
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.65,
      loose: 1.72,
      paragraph: 1.7,
    },
    
    letterSpacing: {
      normal: "normal",
      wide: "0.02em",
      wider: "0.05em",
      widest: "0.1em",
      uppercase: "0.18em",
      display: "0.22em",
    },
  },

  borders: {
    width: {
      thin: "1px",
      medium: "2px",
      thick: "3px",
    },
    
    style: {
      solid: "solid",
      dashed: "dashed",
      dotted: "dotted",
    },
    
    radius: {
      none: "0",
      small: "3px",
      medium: "6px",
      large: "8px",
      pill: "30px",
      circle: "50%",
    },
    
    shadows: {
      subtle: "0 2px 4px rgba(0, 0, 0, 0.02)",
      light: "0 4px 12px rgba(0, 0, 0, 0.03)",
      medium: "0 8px 24px rgba(0, 0, 0, 0.05)",
      inner: "inset 0 1px 3px rgba(0, 0, 0, 0.02)",
    },
  },

  gradients: {
    goldHorizontal: "linear-gradient(90deg, #b8923f 0%, #e8dfcf 100%)",
    goldVertical: "linear-gradient(180deg, #b8923f 0%, #e8dfcf 50%, #b8923f 100%)",
    goldFade: "linear-gradient(90deg, #b8923f 0%, #e8dfcf 70%, transparent 100%)",
    
    panelLight: "linear-gradient(180deg, #fefcf9 0%, #f9f7f2 100%)",
    panelWarm: "linear-gradient(135deg, #fefcf9 0%, #f9f7f2 100%)",
    
    bgDark: "linear-gradient(125deg, #0a0f1a 0%, #141c2c 35%, #1e2638 70%, #2b2a24 100%)",
    
    overlay: "linear-gradient(135deg, rgba(10,15,26,0.92) 0%, rgba(20,28,44,0.85) 100%)",
  },

  breakpoints: {
    page: {
      after: "always",
      before: "avoid",
      inside: "avoid",
    },
  },

  // Utility functions for consistent styling
  utils: {
    container: (options?: { narrow?: boolean; center?: boolean }) => `
      max-width: ${options?.narrow ? '68%' : '760px'};
      margin: ${options?.center ? '0 auto' : '0'};
      position: relative;
    `,
    
    goldRule: (orientation: 'horizontal' | 'vertical' = 'horizontal', length?: string) => `
      ${orientation === 'horizontal' 
        ? `width: ${length || '100%'}; height: 2px;` 
        : `height: ${length || '100%'}; width: 2px;`
      }
      background: ${ebookTheme.gradients.goldHorizontal};
      border-radius: 0 2px 2px 0;
    `,
    
    panel: (variant: 'light' | 'warm' | 'dark' = 'light') => `
      background: ${variant === 'light' 
        ? ebookTheme.colors.panel3 
        : variant === 'warm' 
          ? ebookTheme.gradients.panelWarm 
          : ebookTheme.colors.panel
      };
      border: 1px solid ${ebookTheme.colors.rule};
      border-radius: ${ebookTheme.borders.radius.medium};
      padding: ${ebookTheme.spacing.panelPadding};
    `,
  },
} as const;

// Type exports for use in components
export type EbookTheme = typeof ebookTheme;
export type ThemeColor = keyof typeof ebookTheme.colors;
export type ThemeSpacing = keyof typeof ebookTheme.spacing;
export type TypographySize = keyof typeof ebookTheme.typography.sizes;

// Helper to generate inline styles with theme values
export function themeStyle(selector: keyof EbookTheme, property: string): string {
  // This is a simple helper - in practice you'd want more sophisticated lookup
  return (ebookTheme as any)[selector]?.[property] || '';
}