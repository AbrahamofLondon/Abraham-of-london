--- a/components/mdx-components.tsx
+++ b/components/mdx-components.tsx
@@
-// (old file either missing or exporting something else)
+import Image from "next/image";
+import React from "react";
+
+// Simple, zero-dependency callout & grid so MDX doesn't crash if used
+export const Grid: React.FC<React.PropsWithChildren<{ cols?: number; gap?: string }>> = ({
+  cols = 2,
+  gap = "1rem",
+  children,
+}) => (
+  <div
+    style={{
+      display: "grid",
+      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
+      gap,
+    }}
+  >
+    {children}
+  </div>
+);
+
+export const Callout: React.FC<React.PropsWithChildren<{ type?: "info" | "warn" | "success" }>> = ({
+  type = "info",
+  children,
+}) => {
+  const palette = {
+    info: { bg: "#eef6ff", border: "#93c5fd" },
+    warn: { bg: "#fff7ed", border: "#fdba74" },
+    success: { bg: "#ecfdf5", border: "#6ee7b7" },
+  }[type];
+  return (
+    <div style={{ background: palette.bg, borderLeft: `4px solid ${palette.border}`, padding: "0.75rem 1rem", borderRadius: 8 }}>
+      {children}
+    </div>
+  );
+};
+
+// Next/Image wrapper that is safe to use inside MDX
+const Img = (props: any) => {
+  const { src, alt = "", width, height, ...rest } = props;
+  if (!width || !height) {
+    // MDX often lacks explicit dims; use fill with object-cover in a 16:9 box
+    return (
+      <span style={{ position: "relative", display: "block", width: "100%", aspectRatio: "16 / 9" }}>
+        <Image src={src} alt={alt} fill className="object-cover" {...rest} />
+      </span>
+    );
+  }
+  return <Image src={src} alt={alt} width={width} height={height} {...rest} />;
+};
+
+export const MDXComponents = {
+  img: Img,
+  Image: Img,
+  Grid,
+  Callout,
+};
+
+export default MDXComponents;
