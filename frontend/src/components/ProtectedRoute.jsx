import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, libraryOnly = false }) {
    const { isAuthenticated, isLibrarian, loading } = useAuth();

    if (loading){ 
        return <p>Duke u ngarkuar...</p>
    }

    if (!isAuthenticated) {
        return <Navigate to='/login' replace />;
    }

    if (libraryOnly && !isLibrarian) {
        return <Navigate to='/' replace />;
    }

    return children;

}