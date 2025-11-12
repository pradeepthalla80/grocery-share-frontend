import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { MyItems } from './pages/MyItems';
import { AddItem } from './pages/AddItem';
import { EditItem } from './pages/EditItem';
import { Profile } from './pages/Profile';
import { AuthCallback } from './pages/AuthCallback';
import { Chat } from './pages/Chat';
import { ItemRequests } from './pages/ItemRequests';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { ContactUs } from './pages/ContactUs';
import { ItemDetail } from './pages/ItemDetail';
import { RequestDetail } from './pages/RequestDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { Analytics } from './pages/Analytics';
import { StoreDashboard } from './pages/StoreDashboard';
import { LegalAgreements } from './pages/LegalAgreements';
import { PickupRequests } from './pages/PickupRequests';
import { NotFound } from './pages/NotFound';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/terms-acceptance" element={<TermsAndConditions />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-items"
              element={
                <ProtectedRoute>
                  <MyItems />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-item"
              element={
                <ProtectedRoute>
                  <AddItem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-item/:id"
              element={
                <ProtectedRoute>
                  <EditItem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/item-requests"
              element={
                <ProtectedRoute>
                  <ItemRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pickup-requests"
              element={
                <ProtectedRoute>
                  <PickupRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/item/:id"
              element={
                <ProtectedRoute>
                  <ItemDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/request/:id"
              element={
                <ProtectedRoute>
                  <RequestDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store-dashboard"
              element={
                <ProtectedRoute>
                  <StoreDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/legal/agreements"
              element={
                <ProtectedRoute>
                  <LegalAgreements />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
