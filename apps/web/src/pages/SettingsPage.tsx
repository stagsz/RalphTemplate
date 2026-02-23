import { Link } from 'react-router-dom';
import { Switch } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useThemeStore, selectColorScheme } from '../store/theme.store';

/**
 * Settings page component for managing application preferences.
 *
 * Features:
 * - Theme (light/dark mode) preference
 * - Placeholder sections for future settings (notifications, display, etc.)
 * - Clean, professional design consistent with HazOp aesthetic
 */
export function SettingsPage() {
  const colorScheme = useThemeStore(selectColorScheme);
  const toggleColorScheme = useThemeStore((state) => state.toggleColorScheme);
  const isDark = colorScheme === 'dark';

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link to="/" className="text-sm text-blue-700 hover:text-blue-800">
            Dashboard
          </Link>
          <span className="text-sm text-slate-400 mx-2">/</span>
          <span className="text-sm text-slate-600">Settings</span>
        </nav>

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your application preferences
          </p>
        </div>

        {/* Appearance settings */}
        <div className="bg-white rounded border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Appearance</h2>
            <p className="text-sm text-slate-500 mt-1">
              Customize how the application looks
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded">
                  {isDark ? (
                    <IconMoon size={20} stroke={1.5} className="text-slate-600" />
                  ) : (
                    <IconSun size={20} stroke={1.5} className="text-amber-500" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Dark mode</div>
                  <div className="text-sm text-slate-500">
                    Use dark theme for the interface
                  </div>
                </div>
              </div>
              <Switch
                checked={isDark}
                onChange={toggleColorScheme}
                size="md"
                styles={{
                  track: {
                    backgroundColor: isDark ? '#1e40af' : '#e2e8f0',
                    borderColor: isDark ? '#1e40af' : '#cbd5e1',
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Notification settings placeholder */}
        <div className="bg-white rounded border border-slate-200 mt-6">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <p className="text-sm text-slate-500 mt-1">
              Configure how you receive alerts and updates
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <div className="text-sm font-medium text-slate-900">Analysis updates</div>
                <div className="text-sm text-slate-500">
                  Notify when analysis entries are modified
                </div>
              </div>
              <Switch
                defaultChecked
                size="md"
                styles={{
                  track: {
                    backgroundColor: '#1e40af',
                    borderColor: '#1e40af',
                  },
                }}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <div className="text-sm font-medium text-slate-900">Report completion</div>
                <div className="text-sm text-slate-500">
                  Notify when reports are generated
                </div>
              </div>
              <Switch
                defaultChecked
                size="md"
                styles={{
                  track: {
                    backgroundColor: '#1e40af',
                    borderColor: '#1e40af',
                  },
                }}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Collaboration invites</div>
                <div className="text-sm text-slate-500">
                  Notify when invited to collaboration sessions
                </div>
              </div>
              <Switch
                defaultChecked
                size="md"
                styles={{
                  track: {
                    backgroundColor: '#1e40af',
                    borderColor: '#1e40af',
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Display settings placeholder */}
        <div className="bg-white rounded border border-slate-200 mt-6">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Display</h2>
            <p className="text-sm text-slate-500 mt-1">
              Adjust how information is displayed
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <div className="text-sm font-medium text-slate-900">Compact tables</div>
                <div className="text-sm text-slate-500">
                  Use condensed row spacing in data tables
                </div>
              </div>
              <Switch
                size="md"
                styles={{
                  track: {
                    backgroundColor: '#e2e8f0',
                    borderColor: '#cbd5e1',
                  },
                }}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Show risk colors</div>
                <div className="text-sm text-slate-500">
                  Highlight entries by risk level
                </div>
              </div>
              <Switch
                defaultChecked
                size="md"
                styles={{
                  track: {
                    backgroundColor: '#1e40af',
                    borderColor: '#1e40af',
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 flex gap-3 text-sm">
          <Link
            to="/profile"
            className="text-blue-700 hover:text-blue-800 hover:underline"
          >
            Edit profile
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to="/"
            className="text-blue-700 hover:text-blue-800 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
