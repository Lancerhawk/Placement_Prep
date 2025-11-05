import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../config';
import './PracticeTest.css';

type Question = { prompt: string; options: string[]; answer?: string; explanation?: string };

export default function PracticeTest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [remaining, setRemaining] = useState(20 * 60);
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [locked, setLocked] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<Record<number, boolean>>({});

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_URL}/api/practice/${id}`, { credentials: 'include' });
      const data = await res.json();
      const qs = data.item?.questions || [];
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(-1));
    })();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const progress = useMemo(() => {
    const answered = answers.filter((a) => a !== -1).length;
    return { answered, total: questions.length };
  }, [answers, questions.length]);

  const submit = async () => {
    const res = await fetch(`${API_URL}/api/practice/${id}/submit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ answers, durationSec: 20 * 60 - remaining }),
    });
    const data = await res.json();
    navigate(`/practice/${id}/result`, { state: data, replace: true });
  };

  const submitCurrentAnswer = () => {
    const selectedIdx = answers[current];
    if (selectedIdx === -1) return;
    const isCorrect = questions[current]?.options?.[selectedIdx] === questions[current]?.answer
      || String(selectedIdx) === String(questions[current]?.answer);
    setResults((r) => ({ ...r, [current]: !!isCorrect }));
    setLocked((s) => new Set(s).add(current));
  };

  return (
    <div className="pt-layout">
      <aside className="pt-aside">
        <div className="pt-qgrid">
          {answers.map((ans, idx) => (
            <button
              key={idx}
              className={`pt-qcell ${idx === current ? 'current' : ''} ${ans !== -1 ? 'answered' : ''} ${flags.has(idx) ? 'flag' : ''} ${locked.has(idx) ? (results[idx] ? 'correct' : 'wrong') : ''}`}
              onClick={() => setCurrent(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        <div className="pt-legend">
          <div><span className="pt-dot current" /> Current</div>
          <div><span className="pt-dot answered" /> Answered</div>
          <div><span className="pt-dot correct" /> Correct</div>
          <div><span className="pt-dot wrong" /> Wrong</div>
          <div><span className="pt-dot flag" /> Flagged</div>
        </div>
      </aside>
      <main className="pt-main">
        <div className="pt-top">
          <div className="pt-progress">Question {current + 1} of {progress.total}</div>
          <div className="pt-timer">{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</div>
        </div>
        <div className="pt-card">
          <div className="pt-prompt">{questions[current]?.prompt}</div>
          <div className="pt-options">
            {(questions[current]?.options || []).map((opt, idx) => (
              <button key={idx} className={`pt-option ${answers[current] === idx ? 'selected' : ''} ${locked.has(current) ? (results[current] && answers[current] === idx ? 'correct' : (!results[current] && answers[current] === idx ? 'wrong' : '')) : ''}`} onClick={() => setAnswers((a) => { const n = [...a]; n[current] = idx; return n; })}>{opt}</button>
            ))}
          </div>
          <div className="pt-actions">
            <button className="pt-btn primary" onClick={submitCurrentAnswer} disabled={locked.has(current) || answers[current] === -1}>Submit Answer</button>
            <div className="pt-nav">
              <button className="pt-btn" onClick={() => setCurrent((c) => Math.max(0, c - 1))}>Previous</button>
              <button className="pt-btn" onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>Next</button>
            </div>
          </div>
        </div>
      </main>
      <aside className="pt-right">
        <div className="pt-timerbox">
          <div className="pt-time">{String(Math.floor(remaining / 3600)).padStart(2, '0')}</div>
          <div className="pt-time">{String(Math.floor((remaining % 3600) / 60)).padStart(2, '0')}</div>
          <div className="pt-time">{String(remaining % 60).padStart(2, '0')}</div>
        </div>
        <button className="pt-btn outline" onClick={() => setFlags((s) => new Set(s).add(current))}>Flag for Review</button>
        <button className="pt-btn gradient" onClick={submit}>Submit Test</button>
      </aside>
    </div>
  );
}


