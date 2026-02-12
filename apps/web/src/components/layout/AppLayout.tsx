import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

/**
 * AppLayout component that wraps authenticated pages with navigation sidebar.
 *
 * Features:
 * - Fixed sidebar on the left (w-64 / 256px)
 * - Main content area fills remaining space
 * - Responsive scrolling in main content
 * - Clean separation between navigation and content
 *
 * Usage with React Router Outlet:
 * ```tsx
 * <Route element={<AppLayout />}>
 *   <Route path="/" element={<DashboardPage />} />
 *   <Route path="/projects" element={<ProjectsPage />} />
 * </Route>
 * ```
 */
export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
