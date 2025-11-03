import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { MyItems } from './pages/MyItems';
import { AddItem } from './pages/AddItem';
import { EditItem } from './pages/EditItem';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
          </Routes>
        </div>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
