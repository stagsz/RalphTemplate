import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';

// Mock the auth service
vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

/**
 * Renders LoginPage with all required providers.
 */
function renderLoginPage() {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </MantineProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      tokens: null,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the sign in heading', () => {
      renderLoginPage();
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders the app branding', () => {
      renderLoginPage();
      // Appears in both left panel (desktop) and above form (mobile)
      expect(screen.getAllByText('HazOp Assistant').length).toBeGreaterThanOrEqual(1);
    });

    it('renders email input field', () => {
      renderLoginPage();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('renders password input field', () => {
      renderLoginPage();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('renders remember me checkbox', () => {
      renderLoginPage();
      expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument();
    });

    it('renders sign in button', () => {
      renderLoginPage();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      renderLoginPage();
      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
    });

    it('renders registration link', () => {
      renderLoginPage();
      expect(screen.getByRole('link', { name: /request access/i })).toBeInTheDocument();
    });

    it('renders platform description in sidebar', () => {
      renderLoginPage();
      expect(screen.getByText(/industrial safety analysis platform/i)).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows error when email is empty on submit', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    it('shows error when password is empty on submit', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    it('clears email error when user starts typing', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      // Submit with empty email to trigger error
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(screen.getByText(/email is required/i)).toBeInTheDocument();

      // Start typing to clear error
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 't');

      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
    });

    it('clears password error when user starts typing', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      // Type email first
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      // Submit with empty password to trigger error
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(screen.getByText(/password is required/i)).toBeInTheDocument();

      // Start typing to clear error
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'p');

      expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('calls authService.login with correct credentials', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.login).mockResolvedValue({ success: true, data: {} as never });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });

    it('includes rememberMe when checkbox is checked', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.login).mockResolvedValue({ success: true, data: {} as never });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
      await user.click(rememberMeCheckbox);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      });
    });

    it('navigates to home on successful login', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.login).mockResolvedValue({ success: true, data: {} as never });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('does not navigate on failed login', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.login).mockResolvedValue({
        success: false,
        error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid credentials' },
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('trims email before submission', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.login).mockResolvedValue({ success: true, data: {} as never });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, '  test@example.com  ');

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });
  });

  describe('loading state', () => {
    it('disables form inputs when loading', () => {
      useAuthStore.setState({ isLoading: true });
      renderLoginPage();

      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
      expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeDisabled();
    });

    it('shows loading state on submit button', () => {
      useAuthStore.setState({ isLoading: true });
      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      // Mantine shows a loading indicator on the button
      expect(submitButton).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('error display', () => {
    it('displays API error message', () => {
      useAuthStore.setState({
        error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid credentials' },
      });
      renderLoginPage();

      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    it('displays field-specific error from API', () => {
      useAuthStore.setState({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: [{ field: 'email', message: 'Email not found' }],
        },
      });
      renderLoginPage();

      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('forgot password link has correct href', () => {
      renderLoginPage();
      const link = screen.getByRole('link', { name: /forgot password/i });
      expect(link).toHaveAttribute('href', '/forgot-password');
    });

    it('registration link has correct href', () => {
      renderLoginPage();
      const link = screen.getByRole('link', { name: /request access/i });
      expect(link).toHaveAttribute('href', '/register');
    });
  });
});
