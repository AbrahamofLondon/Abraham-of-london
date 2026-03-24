import React from "react";
import { View, Text, StyleSheet, Svg, Path } from "@react-pdf/renderer";

const INK = "#1A1C1E";
const GOLD = "#8B6F3E";

const styles = StyleSheet.create({
  container: {
    marginTop: 80,
    width: 250,
    alignSelf: "flex-end",
    paddingRight: 20,
  },
  signatureArea: {
    height: 80,
    borderBottom: `0.5pt solid ${GOLD}`,
    marginBottom: 10,
    justifyContent: "flex-end",
    paddingBottom: 5,
  },
  printedName: {
    fontSize: 10,
    fontFamily: "Times-Roman",
    letterSpacing: 1,
    color: INK,
    textTransform: "uppercase",
  },
  location: {
    fontSize: 7,
    fontFamily: "Times-Italic",
    color: "#6B7280",
    marginTop: 4,
  }
});

export const SignatureBlock: React.FC = () => (
  <View style={styles.container} wrap={false}>
    <View style={styles.signatureArea}>
      {/* Elegant, flowing 'Abraham of London' signature. 
          Simplified path for a clean, organic look. 
      */}
      <Svg viewBox="0 0 300 100" style={{ width: 180, height: 70 }}>
        <Path
          d="M30,70 C50,20 70,30 90,60 C110,85 130,10 160,40 C190,70 210,30 240,50 C260,65 280,40 290,20"
          stroke={INK}
          strokeWidth={1.2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* The 'London' flourish flourish */}
        <Path
          d="M50,75 Q150,85 270,65"
          stroke={INK}
          strokeWidth={0.8}
          fill="none"
          opacity={0.6}
        />
      </Svg>
    </View>
    <Text style={styles.printedName}>Abraham of London</Text>
    <Text style={styles.location}>St. James's, London</Text>
  </View>
);