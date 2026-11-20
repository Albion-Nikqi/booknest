import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export function LibrarianPage() {
  const [stats, setStats] = useState(null); 
  const [authors, setAuthors] = useState([]); 
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(''); 
  const [success, setSuccess] = useState(''); 
  
  
  const [authorName, setAuthorName] = useState('');
  const [authorBio, setAuthorBio] = useState('');

 const [genreName, setGenreName] = useState('');

  // Forma per liber te ri
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [totalCopies, setTotalCopies] = useState(1);

  // Merr statistikat, autoret dhe zhanret nga backend-i
  const loadLibrarianData = async () => {
    try {
      const [statsRes, authorsRes, genresRes] = await Promise.all([
        apiClient.get('/stats/'),
        apiClient.get('/authors/'),
        apiClient.get('/genres/'),
      ]);

      setStats(statsRes.data);
      setAuthors(authorsRes.data);
      setGenres(genresRes.data);

      // Vendos autorin e pare si vlera te paracaktuar nese nuk eshte zgjedhur ende
      if (authorsRes.data.length > 0 && !authorId) {
        setAuthorId(String(authorsRes.data[0].id));
      }
    } catch (err) {
      setError('Nuk u arrit te ngarkohen te dhenat e bibliotekarit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrarianData();
  }, []);

  // Nderron zgjedhjen e nje zhanri (shton ose heq ID-ne)
  const toggleGenre = (genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  };

  // Shton autor te ri (POST /api/authors/)
  const handleAddAuthor = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await apiClient.post('/authors/', {
        name: authorName,
        bio: authorBio,
      });
      setAuthorName('');
      setAuthorBio('');
      setAuthorId(String(res.data.id));
      setSuccess('Autori u shtua me sukses.');
      await loadLibrarianData();
    } catch (err) {
      setError('Shtimi i autorit deshtoi.');
    }
  };

  // Shton zhaner te ri (POST /api/genres/)
  const handleAddGenre = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await apiClient.post('/genres/', { name: genreName });
      setGenreName('');
      setSuccess('Zhanri u shtua me sukses.');
      await loadLibrarianData();
    } catch (err) {
      setError('Shtimi i zhanrit deshtoi.');
    }
  };

  // Shton liber te ri (POST /api/books/)
  const handleAddBook = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await apiClient.post('/books/', {
        title,
        isbn,
        author: Number(authorId),
        genres: selectedGenres,
        total_copies: Number(totalCopies),
      });
      setTitle('');
      setIsbn('');
      setSelectedGenres([]);
      setTotalCopies(1);
      setSuccess('Libri u shtua me sukses ne katalog.');
      await loadLibrarianData();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const firstMsg =
          data.detail ||
          (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) ||
          Object.values(data).flat()[0];
        setError(String(firstMsg || 'Shtimi i librit deshtoi.'));
      } else {
        setError('Shtimi i librit deshtoi.');
      }
    }
  };

  if (loading) {
    return <p style={{ padding: '20px' }}>Duke u ngarkuar paneli i bibliotekarit...</p>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '24px auto', padding: '0 20px' }}>
      <h2>Paneli i Bibliotekarit</h2>

      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {stats && (
        <div
          style={{
            border: '1px solid #ccc',
            padding: '14px',
            borderRadius: '6px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Statistikat</h3>
          <p style={{ margin: '4px 0' }}>
            <strong>Totali i librave:</strong> {stats.total_books ?? '-'} |{' '}
            <strong>Kopje te lira:</strong> {stats.available_copies ?? '-'}
          </p>
          <p style={{ margin: '4px 0' }}>
            <strong>Huazime aktive:</strong> {stats.active_loans ?? '-'} |{' '}
            <strong>Huazime te vonuara:</strong> {stats.overdue_loans ?? '-'}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        <form
          onSubmit={handleAddBook}
          style={{ border: '1px solid #ccc', padding: '14px', borderRadius: '6px' }}
        >
          <h3 style={{ marginTop: 0 }}>Shto Liber te Ri</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Titulli i librit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ padding: '8px' }}
            />
            <input
              type="text"
              placeholder="ISBN"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              required
              style={{ padding: '8px' }}
            />
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              required
              style={{ padding: '8px' }}
            >
              <option value="">Zgjedh autorin</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <div>
              <strong>Zhanret:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                {genres.map((g) => (
                  <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(g.id)}
                      onChange={() => toggleGenre(g.id)}
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            </div>

            <input
              type="number"
              min="1"
              placeholder="Numri i kopjeve"
              value={totalCopies}
              onChange={(e) => setTotalCopies(e.target.value)}
              required
              style={{ padding: '8px' }}
            />
            <button type="submit" style={{ padding: '10px' }}>
              Ruaj Librin
            </button>
          </div>
        </form>

        <form
          onSubmit={handleAddAuthor}
          style={{ border: '1px solid #ccc', padding: '14px', borderRadius: '6px' }}
        >
          <h3 style={{ marginTop: 0 }}>Shto Autor</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Emri i autorit"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              style={{ padding: '8px' }}
            />
            <input
              type="text"
              placeholder="Biografi e shkurter (opsionale)"
              value={authorBio}
              onChange={(e) => setAuthorBio(e.target.value)}
              style={{ padding: '8px' }}
            />
            <button type="submit" style={{ padding: '10px' }}>
              Shto Autorin
            </button>
          </div>
        </form>

        <form
          onSubmit={handleAddGenre}
          style={{ border: '1px solid #ccc', padding: '14px', borderRadius: '6px' }}
        >
          <h3 style={{ marginTop: 0 }}>Shto Zhaner</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Emri i zhanrit"
              value={genreName}
              onChange={(e) => setGenreName(e.target.value)}
              required
              style={{ flex: 1, padding: '8px' }}
            />
            <button type="submit" style={{ padding: '10px' }}>
              Shto Zhanrin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}