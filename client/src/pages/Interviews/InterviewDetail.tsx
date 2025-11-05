import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_URL } from '../../config';
import './InterviewDetail.css';
type Topic = { _id: string; name: string; completed?: boolean; lastScore?: number; questions?: any[] };
type Interview = { _id: string; company: string; role: string; salary?: string; topics: Topic[] };

export default function InterviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('topics');
  const [item, setItem] = useState<Interview | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_URL}/api/interviews/${id}`, { credentials: 'include' });
      const data = await res.json();
      setItem(data.item);
    })();
  }, [id]);

  // removed overall result view

  const startFullMock = () => {
    const first = (item?.topics || []).find((t: any) => !t.completed);
    if (first) navigate(`/interviews/${id}/mock/${first._id}`);
  };

  const retakeTopic = async (topicId: string) => {
    await fetch(`${API_URL}/api/interviews/${id}/retake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ topicId }),
    });
    // refresh the data
    const res = await fetch(`${API_URL}/api/interviews/${id}`, { credentials: 'include' });
    const data = await res.json();
    setItem(data.item);
  };

  return (
    <div className="interview-detail">
      <div className="breadcrumb">
        <Link to="/interviews">All Interviews</Link> / <span>{item?.company} {item?.role} Interview</span>
      </div>

      <div className="detail-card">
        <div className="detail-left">
          <div className="company-logo" style={{ background: 'linear-gradient(135deg,#1f2937,#111827)' }}>
            <span>{item?.company}</span>
          </div>
        </div>
        <div className="detail-right">
          <div className="detail-meta">Generated plan</div>
          <h1 className="detail-title">{item?.company} - {item?.role}</h1>
          <div className="detail-package">Package: {item?.salary || '—'}</div>
          <div className="paq-box">
            Complete your Placement Assessment Questionnaire (PAQ) for tailored tips.
          </div>
          <div className="action-buttons">
            <button className="btn-gradientInterview" onClick={startFullMock}>Start Full Mock</button>
            <button className="btn-purple" disabled>Practice Rounds</button>
            <button className="btn-gray" disabled>Add Note</button>
          </div>
        </div>
      </div>

      <div className="tabs-section">
        <div className="tabs">
          <button className={`tab ${activeTab === 'topics' ? 'active' : ''}`} onClick={() => setActiveTab('topics')}>Topics Required</button>
          <button className={`tab ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>Past Questions</button>
          <button className={`tab ${activeTab === 'tips' ? 'active' : ''}`} onClick={() => setActiveTab('tips')}>Candidate Tips</button>
        </div>

        {activeTab === 'topics' && (
          <div className="tab-content">
            {(item?.topics || []).map((topic: any) => {
              const total = topic.questions?.length || topic.totalQuestions || 0;
              const attempted = Array.isArray(topic.progress?.answers)
                ? topic.progress.answers.filter((a: number) => a !== -1).length
                : (topic.completed ? total : 0);
              const remRaw = Number(topic.progress?.remainingSec || 0);
              const showTime = remRaw > 0;
              const mm = String(Math.floor(remRaw / 60)).padStart(2, '0');
              const ss = String(remRaw % 60).padStart(2, '0');
              return (
                <div
                  key={topic._id}
                  className="topic-item"
                  onClick={() => !topic.completed && navigate(`/interviews/${id}/mock/${topic._id}`)}
                  style={{ cursor: topic.completed ? 'default' : 'pointer' }}
                >
                  <div className="topic-checkbox">
                    <input type="checkbox" readOnly checked={!!topic.completed} />
                    <span className="topic-name">{topic.name}</span>
                    <span className="topic-label">{topic.completed ? `${topic.lastScore || 0}%` : (total ? `${attempted}/${total}${showTime ? ` • ${mm}:${ss}` : ''}` : 'New')}</span>
                    {topic.completed && (
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button className="btn-outline small" onClick={(e) => { e.stopPropagation(); retakeTopic(topic._id); }}>Retake</button>
                        <button className="btn small" onClick={(e) => { e.stopPropagation(); navigate(`/interviews/${id}/result/${topic._id}`); }}>View Result</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="tab-content">
            <p className="muted">Past questions will appear here.</p>
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="tab-content">
            <p className="muted">Candidate tips will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
