/* components/print/BrandFrame.tsx — V8.9 (STRICT COMPILER ALIGNMENT) */
import React from "react";
import { View, StyleSheet } from "@react-pdf/renderer";

const GOLD = "#B8860B";
const INK = "#0B0F17";

const styles = StyleSheet.create({
  outerFrame: {
    position: "absolute",
    top: 25,
    left: 25,
    right: 25,
    bottom: 25,
    border: `1.8pt solid ${INK}`,
  },
  innerFrame: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    border: `0.6pt solid ${GOLD}`,
  },
  cornerBlock: {
    position: "absolute",
    width: 12,
    height: 12,
    backgroundColor: INK,
  },
  contentWrapper: {
    padding: 60,
    height: '100%',
  }
});

// These must exist to satisfy the 301 content documents
export interface BrandFrameProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  pageSize?: string;
  author?: string; // REQUIRED for build success
  date?: string;   // REQUIRED for build success
}

export const BrandFrame: React.FC<BrandFrameProps> = ({ 
  children,
  title,     // Destructured but ignored for "Sovereign" look
  subtitle,  // Destructured but ignored for "Sovereign" look
  pageSize,  // Destructured but ignored for "Sovereign" look
  author,    // Destructured but ignored for "Sovereign" look
  date       // Destructured but ignored for "Sovereign" look
}) => (
  <View style={{ flex: 1 }}>
    {/* Visual Ornamentation */}
    <View style={styles.outerFrame} fixed>
      <View style={styles.innerFrame} />
      <View style={[styles.cornerBlock, { top: -2, left: -2 }]} />
      <View style={[styles.cornerBlock, { top: -2, right: -2 }]} />
      <View style={[styles.cornerBlock, { bottom: -2, left: -2 }]} />
      <View style={[styles.cornerBlock, { bottom: -2, right: -2 }]} />
    </View>

    {/* Content Area */}
    <View style={styles.contentWrapper}>
      {children}
    </View>
  </View>
);

export default BrandFrame;