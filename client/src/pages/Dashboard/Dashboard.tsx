import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import './Dashboard.css';

type InterviewItem = {
  _id: string;
  company: string;
  role: string;
  type: string;
  salary?: string;
  topics?: { name: string; lastScore?: number; completed?: boolean }[];
  results?: { topicId: string; correct: number; total: number; takenAt?: string }[];
  generating?: boolean;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<InterviewItem[]>([]);

  const fetchItems = async () => {
    const res = await fetch(`${API_URL}/api/interviews`, { credentials: 'include' });
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => { fetchItems(); }, []);

  // keep checking while stuff is generating
  useEffect(() => {
    if (!items.some((i) => i.generating)) return;
    const id = setInterval(fetchItems, 2000);
    return () => clearInterval(id);
  }, [items]);

  const recentCount = items.length;
  const latestScore = useMemo(() => {
    const all = items.flatMap((i) => (i.results || []).map((r) => ({ ...r, _id: i._id })));
    if (!all.length) return 0;
    const last = all.sort((a, b) => new Date(a.takenAt || 0).getTime() - new Date(b.takenAt || 0).getTime())[all.length - 1];
    return last.total ? Math.round((last.correct / last.total) * 100) : 0;
  }, [items]);

  return (
    <div className='dashboard-page'>
        <section className="stats">
          <div className="stat">
            <div className="stat-title">Recent Interviews</div>
            <div className="stat-value">{recentCount}</div>
            <button className="link" onClick={() => navigate('/interviews')}>View All</button>
          </div>
          <div className="stat">
            <div className="stat-title">Upcoming Mock</div>
            <div className="stat-value">Dec 15, 2023</div>
            <button className="link">View Schedule</button>
          </div>
          <div className="stat">
            <div className="stat-title">Latest Score</div>
            <div className="stat-value">{latestScore}%</div>
            <button className="link" onClick={() => navigate('/interviews')}>View Report</button>
          </div>
        </section>

        <h3 className="section-title">My Interviews</h3>
        <div className="filters">
          <button className="chip">Role</button>
          <button className="chip">Date Range</button>
          <button className="chip">Package</button>
          <button className="action btn" onClick={() => navigate('/interviews')}>+ Add Interview</button>
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
    </div>
  );
}