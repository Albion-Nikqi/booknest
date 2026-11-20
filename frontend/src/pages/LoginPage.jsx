import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
    
        try {
            await login(username, password);
            navigate('/');
        }catch (err) {
            const detail = err.response?.detail;
            setError(detail || 'Emri i perdoruesit ose fjalekalimi eshte gabim.');
        }finally {
            setSubmitting(false);
        }
         
    };

    return (
        <div style={{maxWidth: '400px', margin: '30px auto', padding: '20px'}}>
            <h2>Kyqu ne BookNest</h2>

            {error && <p style={{color: 'red'}}>{{error}}</p>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div>
          <label>Fjalekalimi</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button type="submit" disabled={submitting} style={{ padding: '10px' }}>
          {submitting ? 'Duke u kyçur...' : 'Kyçu'}
        </button>
      </form>

      <p style={{ marginTop: '14px' }}>
        Nuk ke llogari? <Link to="/register">Regjistrohu ketu</Link>
      </p>
    </div>
  );
}

