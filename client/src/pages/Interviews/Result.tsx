import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../config';
import ResultGauge from '../../components/ResultGauge';
import './Result.css';

export default function Result() {
  const { id, topicId } = useParams<{ id: string; topicId: string }>();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { score?: number; correct?: number; total?: number; durationSec?: number } };
  const [correct, setCorrect] = useState<number>(state?.correct ?? 0);
  const [total, setTotal] = useState<number>(state?.total ?? 0);
  const score = total ? Math.round((correct / total) * 100) : (state?.score ?? 0);
  const [durationSec, setDurationSec] = useState<number>(state?.durationSec ?? 0);

  const feedback = (() => {
    if (score >= 90) return { title: 'Excellent Work!', tagline: "You're in the top tier of performers." };
    if (score >= 80) return { title: 'Great Job!', tagline: 'Strong performance. Keep the momentum going.' };
    if (score >= 70) return { title: 'Good Effort!', tagline: 'Solid attempt. A bit more practice will push you higher.' };
    if (score >= 50) return { title: 'Keep Practicing', tagline: 'You’re on the right track. Focus on weak areas.' };
    return { title: 'Needs Improvement', tagline: 'Review fundamentals and try again to improve your score.' };
  })();

  // grab the latest result if we didn't get it from navigation state
  useEffect(() => {
    if (state?.total != null && state?.correct != null) return;
    (async () => {
      const res = await fetch(`${API_URL}/api/interviews/${id}`, { credentials: 'include' });
      const data = await res.json();
      const results = (data.item?.results || []).filter((r: any) => String(r.topicId) === String(topicId));
      if (results.length) {
        const last = results[results.length - 1];
        setCorrect(last.correct || 0);
        setTotal(last.total || 0);
        setDurationSec(last.durationSec || 0);
      } else {
        const topic = (data.item?.topics || []).find((t: any) => String(t._id) === String(topicId));
        setTotal(topic?.totalQuestions || topic?.questions?.length || 0);
        setCorrect(Math.round(((topic?.lastScore || 0) / 100) * (topic?.totalQuestions || topic?.questions?.length || 0)));
      }
    })();
  }, [id, topicId]);

  const timeTaken = (() => {
    const sec = Math.max(0, Number(durationSec || 0));
    const mm = String(Math.floor(sec / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    const hh = Math.floor(sec / 3600);
    return hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  })();
  const retake = async () => {
    await fetch(`${API_URL}/api/interviews/${id}/retake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ topicId }),
    });
    // wipe the timer from storage
    localStorage.removeItem(`mockTimer:${id}:${topicId}`);
    navigate(`/interviews/${id}/mock/${topicId}`, { replace: true });
  };
  return (
    <div className="result-page">
      <div>
        <div className="title">Test Results</div>
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
              <div className="cta">{feedback.title}</div>
              <div className="tagline">{feedback.tagline}</div>
            </div>
            <ResultGauge percent={score} size={180} />
          </div>
        </div>
        <div className="grid">
          <div className="metric"><div className="label">Correct Answers</div><div className="value">{correct}</div></div>
          <div className="metric"><div className="label">Incorrect Answers</div><div className="value">{total - correct}</div></div>
          <div className="metric"><div className="label">Time Taken</div><div className="value">{timeTaken}</div></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-retake" onClick={retake}>Retake Test</button>
            <button className="btn-back" onClick={() => navigate(`/interviews/${id}`, { replace: true })}>Back to Interview</button>
          </div>
        </div>
      </div>
      <div className="analysis">
        <div className="analysis-tabs">
          <button className="tab active">Analysis<div className="underline" /></button>
          <button className="tab">Solutions<div className="underline" /></button>
        </div>
        <div className="analysis-grid">
          <div className="col">
            <div className="a-card">
              <div className="a-title">Your Strengths</div>
              <div className="a-row">
                <span>Percentages</span>
                <div className="bar green"><span style={{ width: '90%' }} /></div>
                <span className="a-per">90%</span>
              </div>
              <div className="a-row">
                <span>Profit & Loss</span>
                <div className="bar green"><span style={{ width: '85%' }} /></div>
                <span className="a-per">85%</span>
              </div>
              <div className="a-row">
                <span>Time & Work</span>
                <div className="bar green"><span style={{ width: '80%' }} /></div>
                <span className="a-per">80%</span>
              </div>
            </div>

            <div className="a-card">
              <div className="a-title">Areas for Improvement</div>
              <div className="a-row">
                <span>Permutation & Combination</span>
                <div className="bar red"><span style={{ width: '30%' }} /></div>
                <span className="a-per">30%</span>
              </div>
              <div className="a-row">
                <span>Probability</span>
                <div className="bar red"><span style={{ width: '40%' }} /></div>
                <span className="a-per">40%</span>
              </div>
              <div className="a-row">
                <span>Mixtures & Allegations</span>
                <div className="bar red"><span style={{ width: '50%' }} /></div>
                <span className="a-per">50%</span>
              </div>
              <button className="btn-gradient weak">Practice Weak Topics</button>
            </div>
          </div>

          <div className="col">
            <div className="a-card">
              <div className="a-title">Recommended Learning Path</div>
              <div className="lp-item">
                <div className="thumb" />
                <div>
                  <div className="lp-title">Mastering Permutations</div>
                  <div className="lp-sub">Learn the fundamental concepts and solve common problems.</div>
                </div>
              </div>
              <div className="lp-item">
                <div className="thumb" />
                <div>
                  <div className="lp-title">Introduction to Probability</div>
                  <div className="lp-sub">A deep dive into probability theory with practical examples.</div>
                </div>
              </div>
              <button className="btn-gradient full">Watch Suggested Videos</button>
            </div>

            <div className="a-card">
              <div className="a-title">Next Practice Steps</div>
              <div className="np-item">
                <div>
                  <div className="np-title">Topic Test: Permutations</div>
                  <div className="np-sub">15 Questions • 20 Mins</div>
                </div>
                <span className="badge medium">MEDIUM</span>
              </div>
              <div className="np-item">
                <div>
                  <div className="np-title">Mixed Quiz: P&C, Probability</div>
                  <div className="np-sub">20 Questions • 30 Mins</div>
                </div>
                <span className="badge hard">HARD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}