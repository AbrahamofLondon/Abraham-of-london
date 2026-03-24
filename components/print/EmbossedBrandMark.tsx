import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
  },
  brandText: {
    fontFamily: "Times-Bold",
    fontSize: 48,
    color: "#1A1C1E",
    letterSpacing: -2,
  },
  line: {
    width: 30,
    height: 1,
    backgroundColor: "#8B6F3E",
    marginTop: 5,
  }
});

export const EmbossedBrandMark: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.brandText}>AoL</Text>
    <View style={styles.line} />
  </View>
);