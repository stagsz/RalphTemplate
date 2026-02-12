import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Breadcrumb } from './Breadcrumb';

/**
 * AppLayout component that wraps authenticated pages with navigation sidebar.
 *
 * Features:
 * - Fixed sidebar on the left (w-64 / 256px)
 * - Breadcrumb navigation below header area
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

      {/* Main content area with breadcrumb */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb navigation */}
        <Breadcrumb />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
