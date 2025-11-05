import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_URL } from '../../config';
import './Practice.css';

type PracticeItem = {
  _id: string;
  title: string;
  language: string;
  topic: string;
  generating?: boolean;
};

export default function Practice() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ language: 'JavaScript', topic: 'DSA', numQuestions: 20 });
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    const res = await fetch(`${API_URL}/api/practice`, { credentials: 'include' });
    const data = await res.json();
    setItems(data.items || []);
  };
  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    if (!items.some((i) => i.generating)) return;
    const id = setInterval(fetchItems, 2000);
    return () => clearInterval(id);
  }, [items]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/practice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      await res.json();
      setOpenForm(false);
      fetchItems();
    } finally { setLoading(false); }
  };

  return (
    <div className="practice-page">
      <div className="page-header">
        <div>
          <h2 style={{ marginTop: 0 }}>Choose Your Challenge</h2>
          <p className="muted">Select a round to start your practice session.</p>
        </div>
        <button className="action btn" onClick={() => setOpenForm(true)}>+ Create Practice</button>
      </div>

      <div className="cards">
        {items.map((c) => (
          c.generating ? (
            <div key={c._id} className="card disabled">
              <div className="thumb" style={{ background: 'linear-gradient(135deg,#1f2937,#111827)' }} />
              <div className="card-body">
                <div className="card-title">{c.title}</div>
                <div className="card-sub">{c.topic}</div>
              </div>
              <div className="card-overlay"><div className="spinner" /><span className="gen-text">Generating…</span></div>
            </div>
          ) : (
            <Link key={c._id} to={`/practice/${c._id}`} className="card-link">
              <div className="card">
                <div className="thumb" style={{ background: 'linear-gradient(135deg,#1f2937,#111827)' }} />
                <div className="card-body">
                  <div className="card-title">{c.title}</div>
                  <div className="card-sub">{c.topic}</div>
                </div>
              </div>
            </Link>
          )
        ))}
      </div>

      {openForm && (
        <div className="modal">
          <div className="modal-card">
            <h3 style={{ marginTop: 0 }}>New Practice</h3>
            <form onSubmit={onSubmit} className="form-grid">
              <div>
                <label>Language</label>
                <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                  <option>JavaScript</option>
                  <option>TypeScript</option>
                  <option>Python</option>
                  <option>Java</option>
                  <option>C++</option>
                </select>
              </div>
              <div>
                <label>Topic</label>
                <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                  <option>DSA</option>
                  <option>Algorithms</option>
                  <option>System Design</option>
                  <option>Behavioral</option>
                </select>
              </div>
              <div className="actions">
                <button className="btn" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
                <button className="btn" type="button" onClick={() => setOpenForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


