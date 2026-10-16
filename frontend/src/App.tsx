import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import Login from './pages/Login';
import { BackgroundBlobs } from './components/BackgroundBlobs';
import { ErrorBoundary } from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const { isSignedIn, isLoaded } = useClerkAuth();
  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading auth state...</div>;
  return (isAuthenticated || isSignedIn) ? <>{children}</> : <Navigate to="/" replace />;
};

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userId = params.get('userId');
    const email = params.get('email');
    const fullName = params.get('fullName');
    const roles = params.get('roles');

    if (!accessToken || !userId || !email || !fullName) {
      navigate('/', { replace: true });
      return;
    }

    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify({
      id: userId,
      email,
      fullName,
      roles: roles ? roles.split(',') : [],
    }));
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return <div className="min-h-screen flex items-center justify-center text-slate-500">Signing you in...</div>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const { isSignedIn } = useClerkAuth();
  const isLoggedIn = isAuthenticated || isSignedIn;
  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/oauth2/callback" element={<OAuthCallback />} />
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/scan" element={
        <ProtectedRoute>
          <Dashboard initialTab="scan" />
        </ProtectedRoute>
      } />
      <Route path="/my-qr" element={
        <ProtectedRoute>
          <Dashboard initialTab="my-qr" />
        </ProtectedRoute>
      } />
      <Route path="/pay" element={
        <ProtectedRoute>
          <Dashboard initialTab="pay" />
        </ProtectedRoute>
      } />
      <Route path="/contacts" element={
        <ProtectedRoute>
          <Dashboard initialTab="contact" />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <Dashboard initialTab="history" />
        </ProtectedRoute>
      } />
      <Route path="/banks" element={
        <ProtectedRoute>
          <Dashboard initialTab="banks" />
        </ProtectedRoute>
      } />
      <Route path="/rewards" element={
        <ProtectedRoute>
          <Dashboard initialTab="rewards" />
        </ProtectedRoute>
      } />
      <Route path="/soundbox" element={
        <ProtectedRoute>
          <Dashboard initialTab="soundbox" />
        </ProtectedRoute>
      } />
      <Route path="/statement" element={
        <ProtectedRoute>
          <Dashboard initialTab="statement" />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BackgroundBlobs />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
