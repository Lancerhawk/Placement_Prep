import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../config';
import './MockTest.css';

type Question = { prompt: string; options: string[]; answer?: string; explanation?: string };

export default function MockTest() {
  const { id, topicId } = useParams<{ id: string; topicId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [remaining, setRemaining] = useState(60 * 60); // 1 hour default
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [locked, setLocked] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<Record<number, boolean>>({});

  // fetch questions and bounce if they already finished
  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_URL}/api/interviews/${id}`, { credentials: 'include' });
      const data = await res.json();
      const topic = data.item?.topics?.find((t: any) => t._id === topicId);
      if (!topic) return;
      if (topic.completed) {
        navigate(`/interviews/${id}`, { replace: true });
        return;
      }
      setQuestions(topic.questions || []);
      const len = (topic.questions || []).length;
      const savedAnswers = Array.isArray(topic.progress?.answers) && topic.progress.answers.length === len
        ? topic.progress.answers
        : new Array(len).fill(-1);
      setAnswers(savedAnswers);
      if (Array.isArray(topic.progress?.locked)) setLocked(new Set(topic.progress.locked));
      if (Array.isArray(topic.progress?.flags)) setFlags(new Set(topic.progress.flags));
      // rebuild the results map from what we locked earlier
      const initialResults: Record<number, boolean> = {};
      (topic.progress?.locked || []).forEach((idx: number) => {
        const sel = savedAnswers[idx];
        const isCorrect = topic.questions?.[idx]?.options?.[sel] === topic.questions?.[idx]?.answer
          || String(sel) === String(topic.questions?.[idx]?.answer);
        initialResults[idx] = !!isCorrect;
      });
      setResults(initialResults);
      // get timer from db first, then localStorage, otherwise use default
      const key = `mockTimer:${id}:${topicId}`;
      const dbRem = Number(topic.progress?.remainingSec || 0);
      const lsRem = Number(localStorage.getItem(key) || '');
      if (dbRem > 0) setRemaining(dbRem);
      else if (!Number.isNaN(lsRem) && lsRem > 0) setRemaining(lsRem);
    })();
  }, [id, topicId, navigate]);

  useEffect(() => {
    const key = `mockTimer:${id}:${topicId}`;
    const tick = setInterval(() => {
      setRemaining((s) => {
        const next = s > 0 ? s - 1 : 0;
        localStorage.setItem(key, String(next));
        return next;
      });
    }, 1000);
    const persist = () => localStorage.setItem(key, String(remaining));
    window.addEventListener('beforeunload', persist);
    document.addEventListener('visibilitychange', persist);
    return () => {
      clearInterval(tick);
      window.removeEventListener('beforeunload', persist);
      document.removeEventListener('visibilitychange', persist);
      localStorage.setItem(key, String(remaining));
      // try to save progress when leaving the page
      try {
        navigator.sendBeacon?.(
          `${API_URL}/api/interviews/${id}/progress`,
          new Blob([
            JSON.stringify({ topicId, answers, remainingSec: remaining, locked: Array.from(locked), flags: Array.from(flags) })
          ], { type: 'application/json' })
        );
      } catch {}
    };
  }, [id, topicId, remaining]);

  const progress = useMemo(() => {
    const answered = answers.filter((a) => a !== -1).length;
    return { answered, total: questions.length };
  }, [answers, questions.length]);

  const submit = async () => {
    const res = await fetch(`${API_URL}/api/interviews/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ topicId, answers, durationSec: 60 * 60 - remaining }),
    });
    const data = await res.json();
    // clean up timer and go to results
    localStorage.removeItem(`mockTimer:${id}:${topicId}`);
    navigate(`/interviews/${id}/result/${topicId}`, { state: data, replace: true });
  };

  const submitCurrentAnswer = () => {
    const selectedIdx = answers[current];
    if (selectedIdx === -1) return;
    const isCorrect = questions[current]?.options?.[selectedIdx] === questions[current]?.answer
      || String(selectedIdx) === String(questions[current]?.answer);
    setResults((r) => ({ ...r, [current]: !!isCorrect }));
    setLocked((s) => new Set(s).add(current));
  };

  // auto-save progress every so often
  useEffect(() => {
    if (!questions.length) return;
    const ctrl = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/api/interviews/${id}/progress`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            topicId,
            answers,
            remainingSec: remaining,
            locked: Array.from(locked),
            flags: Array.from(flags),
          }),
          signal: ctrl.signal,
        });
      } catch {}
    }, 600); // wait a bit before saving
    return () => {
      clearTimeout(timeout);
      ctrl.abort();
    };
  }, [answers, remaining, locked, flags, id, topicId, questions.length]);

  return (
    <div className="mock-layout">
      <aside className="mock-aside">
        <div className="q-grid">
          {answers.map((ans, idx) => (
            <button
              key={idx}
              className={`q-cell ${idx === current ? 'current' : ''} ${ans !== -1 ? 'answered' : ''} ${flags.has(idx) ? 'flag' : ''} ${locked.has(idx) ? (results[idx] ? 'correct' : 'wrong') : ''}`}
              onClick={() => setCurrent(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        <div className="legend">
          <div><span className="dot current" /> Current</div>
          <div><span className="dot answered" /> Answered</div>
          <div><span className="dot correct" /> Correct</div>
          <div><span className="dot wrong" /> Wrong</div>
          <div><span className="dot flag" /> Flagged</div>
        </div>
      </aside>
      <section className="mock-main">
        <div className="question-title">Question {current + 1} of {questions.length}</div>
        <div className="question-text">{questions[current]?.prompt}</div>
        <div className="options">
          {questions[current]?.options?.map((opt, i) => (
            <label key={i} className={`option ${answers[current] === i ? 'selected' : ''} ${locked.has(current) ? 'disabled' : ''}`}>
              <input
                type="radio"
                name={`q-${current}`}
                checked={answers[current] === i}
                disabled={locked.has(current)}
                onChange={() => setAnswers((arr) => arr.map((a, idx) => (idx === current ? i : a)))}
              />
              <span className="opt-text">{opt}</span>
            </label>
          ))}
        </div>
        <div className="nav column">
          <button className="btn-primary full" onClick={submitCurrentAnswer} disabled={locked.has(current) || answers[current] === -1}>Submit Answer</button>
          <button className="btn full" onClick={() => setCurrent((c) => Math.max(0, c - 1))}>Previous</button>
          <button className="btn full" onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>Next</button>
        </div>
        <div className="autosave"><span className="ok" /> Your answer is autosaved.</div>
      </section>
      <aside className="mock-side">
        <div className="time-boxes center">
          <div className="box"><div className="num">{String(Math.floor(remaining / 3600)).padStart(2, '0')}</div><div className="lbl">Hours</div></div>
          <div className="box"><div className="num">{String(Math.floor((remaining % 3600) / 60)).padStart(2, '0')}</div><div className="lbl">Minutes</div></div>
          <div className="box"><div className="num">{String(remaining % 60).padStart(2, '0')}</div><div className="lbl">Seconds</div></div>
        </div>
        <div className="progress-bar"><div className="fill" style={{ width: `${progress.total ? (progress.answered / progress.total) * 100 : 0}%` }} /></div>
        <div className="progress-text">{progress.answered}/{progress.total}</div>
        <button className="btn-outlineFlag" onClick={() => setFlags((f) => (f.has(current) ? new Set([...Array.from(f)].filter(x => x !== current)) : new Set(f).add(current)))}>Flag for Review</button>
        <button className="btn-gradient" onClick={submit}>Submit Test</button>
      </aside>
    </div>
  );
}


