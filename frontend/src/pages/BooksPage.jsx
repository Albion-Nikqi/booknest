import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export function BooksPage() {
  const [books, setBooks] = useState([]); 
  const [search, setSearch] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); 
  const [success, setSuccess] = useState(''); 
  const [borrowingId, setBorrowingId] = useState(null); 

  const { isAuthenticated } = useAuth(); 

  const fetchBooks = async () => {
    try {
      const res = await apiClient.get('/books/');
      setBooks(res.data);
    } catch (err) {
      setError('Nuk u arrit te ngarkohen librat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleBorrow = async (bookId) => {
    setError('');
    setSuccess('');
    setBorrowingId(bookId);

    try {
      await apiClient.post('/loans/', { book: bookId });
      setSuccess('Libri u huazua me sukses! Afati i kthimit eshte 14 dite.');
      await fetchBooks(); 
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'string') {
        setError(data);
      } else if (data && typeof data === 'object') {

        const firstMsg =
          data.detail ||
          (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) ||
          Object.values(data).flat()[0];
        setError(String(firstMsg || 'Huazimi deshtoi.'));
      } else {
        setError('Huazimi deshtoi.');
      }
    } finally {
      setBorrowingId(null);
    }
  };

  const filteredBooks = books.filter((book) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const titleMatch = (book.title || '').toLowerCase().includes(q);
    const authorMatch = (book.author_name || '').toLowerCase().includes(q);
    const isbnMatch = (book.isbn || '').toLowerCase().includes(q);
    return titleMatch || authorMatch || isbnMatch;
  });

  if (loading) {
    return <p style={{ padding: '20px' }}>Duke u ngarkuar librat...</p>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '24px auto', padding: '0 20px' }}>
      <h2>Katalogu i Librave</h2>

      <input
        type="text"
        placeholder="Kerko sipas titullit, autorit ose ISBN..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '16px' }}
      />

      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {filteredBooks.length === 0 ? (
        <p>Nuk u gjet asnje liber.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredBooks.map((book) => (
            <div
              key={book.id}
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
                <h3 style={{ margin: '0 0 6px 0' }}>{book.title}</h3>
                <p style={{ margin: '2px 0' }}>
                  <strong>Autori:</strong> {book.author_name || book.author} | <strong>ISBN:</strong> {book.isbn}
                </p>
                {Array.isArray(book.genre_names) && book.genre_names.length > 0 && (
                  <p style={{ margin: '2px 0' }}>
                    <strong>Zhanret:</strong> {book.genre_names.join(', ')}
                  </p>
                )}
                <p style={{ margin: '4px 0 0 0' }}>
                  <strong>Kopje te lira:</strong> {book.available_copies} / {book.total_copies}
                </p>
              </div>

              <div>
                {isAuthenticated ? (
                  <button
                    type="button"
                    disabled={book.available_copies <= 0 || borrowingId === book.id}
                    onClick={() => handleBorrow(book.id)}
                    style={{ padding: '8px 14px' }}
                  >
                    {borrowingId === book.id
                      ? 'Duke huazuar...'
                      : book.available_copies <= 0
                        ? 'Pa kopje'
                        : 'Huazo'}
                  </button>
                ) : (
                  <span>Kyçu per te huazuar</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}