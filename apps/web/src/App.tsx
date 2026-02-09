import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages';

/**
 * Main application component with routing.
 *
 * Public routes:
 * - /login - Login page
 * - /register - Registration page (TODO: AUTH-11)
 * - /forgot-password - Password reset flow (TODO: AUTH-12)
 *
 * Protected routes (TODO: AUTH-13):
 * - / - Dashboard (requires authentication)
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Placeholder: redirect root to login for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Catch-all: redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
