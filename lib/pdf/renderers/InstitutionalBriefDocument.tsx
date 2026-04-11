/* lib/pdf/renderers/InstitutionalBriefDocument.tsx */
import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 24,
  },
  paragraph: {
    fontSize: 10.2,
    lineHeight: 1.62,
    marginBottom: 13,
    textAlign: "justify",
    color: "#1A1713",
  },
  heading2: {
    fontFamily: "AoLSerif",
    fontSize: 14,
    fontWeight: 700,
    marginTop: 24,
    marginBottom: 10,
    color: "#1A1713",
  },
  heading3: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 8,
    color: "#1A1713",
  },
  list: {
    marginTop: 8,
    marginBottom: 14,
    paddingLeft: 12,
  },
  listItem: {
    fontSize: 10.1,
    lineHeight: 1.58,
    marginBottom: 7,
    color: "#1A1713",
  },
  bullet: {
    width: 12,
    paddingRight: 6,
  },
  strong: {
    fontWeight: 700,
  },
});

/**
 * Strong, safe, and elegant body renderer for Institutional Briefs
 */
export const InstitutionalBriefInteriorPage: React.FC<{ content: string }> = ({ content }) => {
  if (!content || typeof content !== "string" || content.trim().length < 15) {
    return (
      <View style={styles.container}>
        <Text style={styles.paragraph}>
          No detailed body content was available for rendering in this brief.
        </Text>
      </View>
    );
  }

  // Simple but robust block parser
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        // Headings
        if (block.startsWith("## ")) {
          return (
            <Text key={index} style={styles.heading2}>
              {block.replace(/^##\s+/, "")}
            </Text>
          );
        }
        if (block.startsWith("### ")) {
          return (
            <Text key={index} style={styles.heading3}>
              {block.replace(/^###\s+/, "")}
            </Text>
          );
        }

        // Bullet lists
        if (/^\s*[-*+]\s+/.test(block)) {
          const items = block
            .split("\n")
            .map((line) => line.replace(/^\s*[-*+]\s+/, "").trim())
            .filter(Boolean);

          return (
            <View key={index} style={styles.list}>
              {items.map((item, i) => (
                <View key={i} style={{ flexDirection: "row", marginBottom: 5 }}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listItem}>{item}</Text>
                </View>
              ))}
            </View>
          );
        }

        // Regular paragraph
        return (
          <Text key={index} style={styles.paragraph}>
            {block}
          </Text>
        );
      })}
    </View>
  );
};

export default InstitutionalBriefInteriorPage;