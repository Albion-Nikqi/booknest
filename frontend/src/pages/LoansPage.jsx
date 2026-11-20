import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(''); 
  const [success, setSuccess] = useState(''); 
  const [returningId, setReturningId] = useState(null);


  const fetchLoans = async () => {
    try {
      const res = await apiClient.get('/loans/');
      setLoans(res.data);
    } catch (err) {
      setError('Nuk u arrit te ngarkohen huazimet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleReturn = async (loanId) => {
    setError('');
    setSuccess('');
    setReturningId(loanId);

    try {
      await apiClient.post(`/loans/${loanId}/return_book/`);
      setSuccess('Libri u kthye me sukses!');
      await fetchLoans(); 
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'string') {
        setError(data);
      } else if (data && typeof data === 'object') {
        const firstMsg =
          data.detail ||
          (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) ||
          Object.values(data).flat()[0];
        setError(String(firstMsg || 'Kthimi i librit deshtoi.'));
      } else {
        setError('Kthimi i librit deshtoi.');
      }
    } finally {
      setReturningId(null);
    }
  };

  if (loading) {
    return <p style={{ padding: '20px' }}>Duke u ngarkuar huazimet...</p>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '24px auto', padding: '0 20px' }}>
      <h2>Huazimet</h2>

      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loans.length === 0 ? (
        <p>Nuk ka asnje huazim per te shfaqur.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {loans.map((loan) => {
            const isReturned = Boolean(loan.returned_at);

            return (
              <div
                key={loan.id}
                style={{
                  border: '1px solid #ccc',
                  padding: '14px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 6px 0' }}>
                    {loan.book_title || `Libri #${loan.book}`}
                  </h3>
                  {loan.user_username && (
                    <p style={{ margin: '2px 0' }}>
                      <strong>Perdoruesi:</strong> {loan.user_username}
                    </p>
                  )}
                  <p style={{ margin: '2px 0' }}>
                    <strong>Afati i kthimit:</strong> {loan.due_date || '-'}
                  </p>
                  <p style={{ margin: '4px 0 0 0' }}>
                    <strong>Statusi:</strong>{' '}
                    {isReturned ? `Kthyer (${loan.returned_at})` : 'Aktiv'}
                  </p>
                </div>

                <div>
                  {!isReturned ? (
                    <button
                      type="button"
                      disabled={returningId === loan.id}
                      onClick={() => handleReturn(loan.id)}
                      style={{ padding: '8px 14px' }}
                    >
                      {returningId === loan.id ? 'Duke kthyer...' : 'Kthe librin'}
                    </button>
                  ) : (
                    <span>I mbyllur</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}