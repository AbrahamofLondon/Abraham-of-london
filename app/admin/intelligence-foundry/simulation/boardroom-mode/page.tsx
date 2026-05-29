// Server wrapper for boardroom-mode page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import BoardroomModeSimulatorPageClient from "./PageClient";

export default function BoardroomModeSimulatorPage() {
  return <BoardroomModeSimulatorPageClient />;
}
