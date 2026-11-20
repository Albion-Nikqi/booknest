import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
    const { user, isAuthenticated, isLibrarian, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={{ display: 'flex', gap: '16px', padding: '12px 20px', borderBottom: '1px solid #ccc'}}>
            <Link to='/'>Librat</Link>

            {isAuthenticated && <Link to='/loans'>Huazimet</Link>}

            {isLibrarian && <Link to='/librarian'>Paneli Bibliotekarit</Link>}

            <div style={{ marginLeft: 'auto', display: 'flex', gap:'12px', alignItems: 'center'}}>
                {isAuthenticated ? (
                    <>
                    <span>
                        <strong>{user.username}</strong>({user.role})
                    </span>
                    <button type="button" onClick={handleLogout}>
                        Dil
                    </button>
                    </>
                ) : (
                    <>
                    <Link to='/login'>Kyqu</Link>
                    <Link to='/register'>Regjistrohu</Link>
                    </>
                )}
            </div>
        </nav>
    );

}