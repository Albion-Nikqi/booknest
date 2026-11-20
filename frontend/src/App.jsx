import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BooksPage } from './pages/BooksPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoansPage } from './pages/LoansPage';
import { LibrarianPage } from './pages/LibrarianPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<BooksPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/loans"
            element={
              <ProtectedRoute>
                <LoansPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/librarian"
            element={
              <ProtectedRoute requiredRole="librarian">
                <LibrarianPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;