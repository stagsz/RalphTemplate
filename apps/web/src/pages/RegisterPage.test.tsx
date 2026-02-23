import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';

// Mock the auth service
vi.mock('../services/auth.service', () => ({
  authService: {
    register: vi.fn(),
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
 * Renders RegisterPage with all required providers.
 */
function renderRegisterPage() {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </MantineProvider>
  );
}

describe('RegisterPage', () => {
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
    it('renders the create account heading', () => {
      renderRegisterPage();
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders the app branding', () => {
      renderRegisterPage();
      expect(screen.getAllByText('HazOp Assistant').length).toBeGreaterThanOrEqual(1);
    });

    it('renders full name input field', () => {
      renderRegisterPage();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    it('renders email input field', () => {
      renderRegisterPage();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('renders organization input field', () => {
      renderRegisterPage();
      expect(screen.getByLabelText(/organization/i)).toBeInTheDocument();
    });

    it('renders role selector', () => {
      renderRegisterPage();
      expect(screen.getByLabelText(/requested role/i)).toBeInTheDocument();
    });

    it('renders password input field', () => {
      renderRegisterPage();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it('renders confirm password input field', () => {
      renderRegisterPage();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('renders create account button', () => {
      renderRegisterPage();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders sign in link', () => {
      renderRegisterPage();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders platform description in sidebar', () => {
      renderRegisterPage();
      expect(screen.getByText(/industrial safety analysis platform/i)).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows error when name is empty on submit', async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const orgInput = screen.getByLabelText(/organization/i);
      await user.type(orgInput, 'Test Org');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    it('shows error when email is empty on submit', async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Smith');

      const orgInput = screen.getByLabelText(/organization/i);
      await user.type(orgInput, 'Test Org');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Smith');

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');

      const orgInput = screen.getByLabelText(/organization/i);
      await user.type(orgInput, 'Test Org');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    it('shows error when organization is empty on submit', async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Smith');

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/organization is required/i)).toBeInTheDocument();
    });

    it('shows error when password is empty on submit', async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Smith');

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const orgInput = screen.getByLabelText(/organization/i);
      await user.type(orgInput, 'Test Org');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('shows error when password is too short', async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Smith');

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const orgInput = screen.getByLabelText(/organization/i);
      await user.type(orgInput, 'Test Org');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'short');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'short');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('shows error when confirm password is empty on submit', async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Smith');

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const orgInput = screen.getByLabelText(/organization/i);
      await user.type(orgInput, 'Test Org');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    });

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Smith');

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const orgInput = screen.getByLabelText(/organization/i);
      await user.type(orgInput, 'Test Org');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'different123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('clears name error when user starts typing', async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/name is required/i)).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'J');

      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });

    it('clears email error when user starts typing', async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Smith');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/email is required/i)).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 't');

      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
    });

    it('clears password error when user starts typing', async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Smith');

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const orgInput = screen.getByLabelText(/organization/i);
      await user.type(orgInput, 'Test Org');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/password is required/i)).toBeInTheDocument();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'p');

      expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('calls authService.register with correct data', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.register).mockResolvedValue({ success: true, data: {} as never });

      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Smith');

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const orgInput = screen.getByLabelText(/organization/i);
      await user.type(orgInput, 'Acme Industries');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(authService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'John Smith',
        organization: 'Acme Industries',
        role: 'analyst',
      });
    });

    it('navigates to home on successful registration', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.register).mockResolvedValue({ success: true, data: {} as never });

      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Smith');

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const orgInput = screen.getByLabelText(/organization/i);
      await user.type(orgInput, 'Acme Industries');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('does not navigate on failed registration', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.register).mockResolvedValue({
        success: false,
        error: { code: 'CONFLICT', message: 'Email already exists' },
      });

      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Smith');

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const orgInput = screen.getByLabelText(/organization/i);
      await user.type(orgInput, 'Acme Industries');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('trims name, email, and organization before submission', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.register).mockResolvedValue({ success: true, data: {} as never });

      renderRegisterPage();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, '  John Smith  ');

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, '  test@example.com  ');

      const orgInput = screen.getByLabelText(/organization/i);
      await user.type(orgInput, '  Acme Industries  ');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(authService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'John Smith',
        organization: 'Acme Industries',
        role: 'analyst',
      });
    });
  });

  describe('loading state', () => {
    it('disables form inputs when loading', () => {
      useAuthStore.setState({ isLoading: true });
      renderRegisterPage();

      expect(screen.getByLabelText(/full name/i)).toBeDisabled();
      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      expect(screen.getByLabelText(/organization/i)).toBeDisabled();
      expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
      expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
    });

    it('shows loading state on submit button', () => {
      useAuthStore.setState({ isLoading: true });
      renderRegisterPage();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('error display', () => {
    it('displays API error message', () => {
      useAuthStore.setState({
        error: { code: 'CONFLICT', message: 'Email already registered' },
      });
      renderRegisterPage();

      expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
    });

    it('displays field-specific error from API', () => {
      useAuthStore.setState({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: [{ field: 'email', message: 'Email domain not allowed' }],
        },
      });
      renderRegisterPage();

      expect(screen.getByText(/email domain not allowed/i)).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('sign in link has correct href', () => {
      renderRegisterPage();
      const link = screen.getByRole('link', { name: /sign in/i });
      expect(link).toHaveAttribute('href', '/login');
    });
  });
});
