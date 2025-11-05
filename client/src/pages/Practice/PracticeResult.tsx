import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../config';
import ResultGauge from '../../components/ResultGauge';
import '../Interviews/Result.css';

export default function PracticeResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { score?: number; correct?: number; total?: number; durationSec?: number } };
  const [correct, setCorrect] = useState<number>(state?.correct ?? 0);
  const [total, setTotal] = useState<number>(state?.total ?? 0);
  const [durationSec, setDurationSec] = useState<number>(state?.durationSec ?? 0);
  const score = total ? Math.round((correct / total) * 100) : (state?.score ?? 0);

  useEffect(() => {
    if (state?.total != null && state?.correct != null) return;
    (async () => {
      const res = await fetch(`${API_URL}/api/practice/${id}`, { credentials: 'include' });
      const data = await res.json();
      const r = (data.item?.results || []).slice(-1)[0];
      if (r) {
        setCorrect(r.correct || 0);
        setTotal(r.total || 0);
        setDurationSec(r.durationSec || 0);
      }
    })();
  }, [id]);

  const timeTaken = (() => {
    const sec = Math.max(0, Number(durationSec || 0));
    const mm = String(Math.floor(sec / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    const hh = Math.floor(sec / 3600);
    return hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  })();

  return (
    <div className="result-page">
      <div>
        <div className="title">Practice Results</div>
        <div className="subtitle">Detailed breakdown of your performance.</div>
      </div>
      <div className="score-card">
        <div className="left">
          <div className="overall">
            <div className="overall-info">
              <div className="small-label">Overall Score</div>
              <div className="score-line">
                <div className="big">{correct * 4}</div>
                <div className="outof">/ {total * 4}</div>
              </div>
            </div>
            <ResultGauge percent={score} size={180} />
          </div>
        </div>
        <div className="grid">
          <div className="metric"><div className="label">Correct Answers</div><div className="value">{correct}</div></div>
          <div className="metric"><div className="label">Incorrect Answers</div><div className="value">{total - correct}</div></div>
          <div className="metric"><div className="label">Time Taken</div><div className="value">{timeTaken}</div></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-back" onClick={() => navigate('/practice', { replace: true })}>Back to Practice</button>
          </div>
        </div>
      </div>
    </div>
  );
}


