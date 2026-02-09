import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import App from './App';

/**
 * Renders component with all necessary providers for testing.
 */
function renderWithProviders(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('App', () => {
  it('renders the login page at /login route', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the app branding on login page', () => {
    renderWithProviders(<App />);
    // The branding appears in the left panel (desktop) and above form (mobile)
    expect(screen.getAllByText('HazOp Assistant').length).toBeGreaterThan(0);
  });

  it('renders email and password fields', () => {
    renderWithProviders(<App />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders registration link', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('link', { name: /request access/i })).toBeInTheDocument();
  });
});
