import { useState } from 'react'; 
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await register(username, email, password); 
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const messages = Object.entries(data)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
        setError(messages || 'Regjistrimi deshtoi.');
      } else {
        setError('Regjistrimi deshtoi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '30px auto', padding: '20px' }}>
      <h2>Regjistrohu si Anetar</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

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
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {submitting ? 'Duke u regjistruar...' : 'Regjistrohu'}
        </button>
      </form>

      <p style={{ marginTop: '14px' }}>
        Ke tashme llogari? <Link to="/login">Kyçu ketu</Link>
      </p>
    </div>
  );
}