
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/authPages/Login';
import Register from './pages/authPages/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import AppLayout from './layout/AppLayout';
import Interview from './pages/Interviews/Interview';
import InterviewDetail from './pages/Interviews/InterviewDetail';
import MockTest from './pages/Interviews/MockTest';
import Result from './pages/Interviews/Result';
import Practice from './pages/Practice/Practice';
import PracticeTest from './pages/Practice/PracticeTest';
import PracticeResult from './pages/Practice/PracticeResult';
import Resume from './pages/Resume/Resume';
import SplashScreen from './components/SplashScreen';

function RequireGuest({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SplashScreen />
        <Routes>
          <Route
            path="/login"
            element={
              <RequireGuest>
                <Login />
              </RequireGuest>
            }
          />
          <Route
            path="/register"
            element={
              <RequireGuest>
                <Register />
              </RequireGuest>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="interviews" element={<Interview />} />
            <Route path="interviews/:id" element={<InterviewDetail />} />
            <Route path="interviews/:id/mock/:topicId" element={<MockTest />} />
            <Route path="interviews/:id/result/:topicId" element={<Result />} />
            <Route path="practice" element={<Practice />} />
            <Route path="practice/:id" element={<PracticeTest />} />
            <Route path="practice/:id/result" element={<PracticeResult />} />
            <Route path="resume" element={<Resume />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
