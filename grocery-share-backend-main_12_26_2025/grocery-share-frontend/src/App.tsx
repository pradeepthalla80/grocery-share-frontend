import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BottomNav } from './components/BottomNav';
import { InstallPrompt } from './components/InstallPrompt';
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
import { MyStore } from './pages/MyStore';
import { StoreSetup } from './pages/StoreSetup';
import { AdminDashboard } from './pages/AdminDashboard';
import { StripeOnboardingCallback } from './pages/StripeOnboardingCallback';
import { Impact } from './pages/Impact';
import { PlansAndPricing } from './pages/PlansAndPricing';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <BrowserRouter>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-1 pb-20 md:pb-0">
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
              path="/my-store"
              element={
                <ProtectedRoute>
                  <MyStore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store-setup"
              element={
                <ProtectedRoute>
                  <StoreSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/impact"
              element={
                <ProtectedRoute>
                  <Impact />
                </ProtectedRoute>
              }
            />
            <Route path="/plans" element={<PlansAndPricing />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/onboarding/complete"
              element={
                <ProtectedRoute>
                  <StripeOnboardingCallback type="complete" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/onboarding/refresh"
              element={
                <ProtectedRoute>
                  <StripeOnboardingCallback type="refresh" />
                </ProtectedRoute>
              }
            />
          </Routes>
          </main>
          <div className="hidden md:block">
            <Footer />
          </div>
          <BottomNav />
          <InstallPrompt />
        </div>
      </BrowserRouter>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
