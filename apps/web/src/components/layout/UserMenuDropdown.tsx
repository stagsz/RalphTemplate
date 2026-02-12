import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from '@mantine/core';
import {
  IconUser,
  IconSettings,
  IconLogout,
  IconChevronDown,
} from '@tabler/icons-react';
import { useAuthStore, selectUser } from '../../store/auth.store';
import { authService } from '../../services/auth.service';

/**
 * User menu dropdown component.
 *
 * Displays the current user's avatar and name with a dropdown menu containing:
 * - Profile link
 * - Settings link
 * - Logout option
 *
 * Features:
 * - Accessible keyboard navigation via Mantine Menu
 * - Consistent styling with sidebar theme
 * - Loading state during logout
 * - Clean, professional design
 */
export function UserMenuDropdown() {
  const navigate = useNavigate();
  const user = useAuthStore(selectUser);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [menuOpened, setMenuOpened] = useState(false);

  /**
   * Format user role for display.
   */
  const formatRole = (role: string): string => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * Handle user logout.
   */
  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  /**
   * Handle navigation to profile page.
   */
  const handleProfile = () => {
    navigate('/profile');
  };

  /**
   * Handle navigation to settings page.
   */
  const handleSettings = () => {
    navigate('/settings');
  };

  if (!user) {
    return null;
  }

  return (
    <Menu
      opened={menuOpened}
      onChange={setMenuOpened}
      position="top-start"
      offset={4}
      width={220}
      shadow="md"
      styles={{
        dropdown: {
          backgroundColor: '#1e293b', // slate-800
          borderColor: '#334155', // slate-700
          padding: '4px',
        },
        item: {
          color: '#e2e8f0', // slate-200
          fontSize: '14px',
          padding: '10px 12px',
          borderRadius: '4px',
          '&[data-hovered]': {
            backgroundColor: '#334155', // slate-700
            color: '#ffffff',
          },
        },
        itemLabel: {
          fontWeight: 400,
        },
        divider: {
          borderColor: '#334155', // slate-700
          margin: '4px 0',
        },
      }}
    >
      <Menu.Target>
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors hover:bg-slate-800"
          disabled={isLoading}
          aria-label="User menu"
        >
          {/* Avatar */}
          <div className="flex items-center justify-center w-9 h-9 bg-slate-700 rounded-full text-sm font-medium text-white">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user.name}</div>
            <div className="text-xs text-slate-400 truncate">{formatRole(user.role)}</div>
          </div>

          {/* Chevron indicator */}
          <IconChevronDown
            size={16}
            stroke={1.5}
            className={`text-slate-400 transition-transform duration-200 ${
              menuOpened ? 'rotate-180' : ''
            }`}
          />
        </button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label styles={{ label: { color: '#94a3b8', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' } }}>
          Account
        </Menu.Label>

        <Menu.Item
          leftSection={<IconUser size={18} stroke={1.5} />}
          onClick={handleProfile}
        >
          Profile
        </Menu.Item>

        <Menu.Item
          leftSection={<IconSettings size={18} stroke={1.5} />}
          onClick={handleSettings}
        >
          Settings
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          leftSection={<IconLogout size={18} stroke={1.5} />}
          onClick={handleLogout}
          disabled={isLoading}
          styles={{
            item: {
              color: '#ef4444', // red-500
              '&[data-hovered]': {
                backgroundColor: 'rgba(239, 68, 68, 0.1)', // red-500 with opacity
                color: '#f87171', // red-400
              },
            },
          }}
        >
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
