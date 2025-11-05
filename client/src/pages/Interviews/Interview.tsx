import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_URL } from '../../config';
import './Interview.css';

type InterviewItem = {
  _id: string;
  company: string;
  role: string;
  type: string;
  salary?: string;
  topics?: { name: string; lastScore?: number; completed?: boolean }[];
  generating?: boolean;
};

export default function Interview() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InterviewItem[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({
    company: '',
    role: '',
    type: 'technical',
    techStack: '',
    salary: '',
    rounds: '5',
    perRound: '5',
  });
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    const res = await fetch(`${API_URL}/api/interviews`, { credentials: 'include' });
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => { fetchItems(); }, []);

  // keep refreshing while interviews are being generated
  useEffect(() => {
    if (!items.some((i) => i.generating)) return;
    const id = setInterval(fetchItems, 2000);
    return () => clearInterval(id);
  }, [items]);

  const [pendingId, setPendingId] = useState<string | null>(null);
  // open the interview detail page once it's ready
  useEffect(() => {
    if (!pendingId) return;
    const found = items.find((i) => i._id === pendingId);
    if (found && !found.generating && (found.topics || []).length > 0) {
      setPendingId(null);
      navigate(`/interviews/${found._id}`);
    }
  }, [items, pendingId, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const roundsNum = Math.max(1, Math.min(10, Number(form.rounds || 0)));
      const perRoundNum = Math.max(5, Math.min(10, Number(form.perRound || 0)));
      const payload = {
        ...form,
        rounds: roundsNum,
        perRound: perRoundNum,
        numQuestions: roundsNum * perRoundNum,
        techStack: form.techStack.split(',').map((s) => s.trim()).filter(Boolean),
      } as any;
      const res = await fetch(`${API_URL}/api/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      setPendingId(created?.item?._id || null);
      await fetchItems();
      setOpenForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="interviews-page">
      <div className="page-header">
        <h2 style={{ marginTop: 0 }}>My Interviews</h2>
        <div className="filters">
          <button className="action btn" onClick={() => setOpenForm(true)}>+ Add Interview</button>
        </div>
      </div>

      <div className="cards">
        {items.map((c) => (
          c.generating ? (
            <div key={c._id} className="card disabled">
              <div className="thumb" style={{ background: 'linear-gradient(135deg,#1f2937,#111827)' }} />
              <div className="card-body">
                <div className="card-title">{c.role}</div>
                <div className="card-sub">{c.company}</div>
                <div className="card-meta">{c.salary || ''}</div>
                <div className="badges">
                  {(c.topics || []).slice(0,3).map((t) => (
                    <span key={t.name} className="badge">{t.name}</span>
                  ))}
                </div>
              </div>
              <div className="card-overlay"><div className="spinner" /><span className="gen-text">Generating…</span></div>
            </div>
          ) : (
            <Link key={c._id} to={`/interviews/${c._id}`} className="card-link">
              <div className="card">
                <div className="thumb" style={{ background: 'linear-gradient(135deg,#1f2937,#111827)' }} />
                <div className="card-body">
                  <div className="card-title">{c.role}</div>
                  <div className="card-sub">{c.company}</div>
                  <div className="card-meta">{c.salary || ''}</div>
                  <div className="badges">
                    {(c.topics || []).slice(0,3).map((t) => (
                      <span key={t.name} className="badge">{t.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          )
        ))}
      </div>

      {openForm && (
        <div className="modal">
          <div className="modal-card">
            <h3 style={{ marginTop: 0 }}>Add Interview</h3>
            <form onSubmit={onSubmit} className="form-grid">
              <div>
                <label>Company</label>
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
              </div>
              <div>
                <label>Job Role</label>
                <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
              </div>
              <div>
                <label>Interview Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label>Tech Stack (comma separated)</label>
                <input type="text" value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} placeholder="e.g. React, Node, MongoDB" />
              </div>
              <div>
                <label>Salary Range</label>
                <input type="text" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="$90k - $120k" />
              </div>
              <div>
                <label>Rounds</label>
                <input type="number" min={1} max={10} value={form.rounds} onChange={(e) => setForm({ ...form, rounds: e.target.value })} />
              </div>
              <div>
                <label>Questions per Round (5-10)</label>
                <input type="number" min={5} max={10} value={form.perRound} onChange={(e) => setForm({ ...form, perRound: e.target.value })} />
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


