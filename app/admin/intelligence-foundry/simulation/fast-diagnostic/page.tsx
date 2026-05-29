// Server wrapper for fast-diagnostic page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import FastDiagnosticSimulatorPageClient from "./PageClient";

export default function FastDiagnosticSimulatorPage() {
  return <FastDiagnosticSimulatorPageClient />;
}
