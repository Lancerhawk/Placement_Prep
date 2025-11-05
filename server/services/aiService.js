const fetchAny = async (...args) => {
  if (typeof global.fetch === 'function') {
    return await global.fetch(...args);
  }
  const mod = await import('node-fetch');
  return mod.default(...args);
};

function buildPrompt({ company, role, type, techStack, rounds, perRound, numQuestions }) {
  return `You are a helpful assistant generating interview preparation content.
Return STRICT JSON only. Do not include backticks.

Input:
- Company: ${company}
- Role: ${role}
- Type: ${type}
- Tech stack: ${techStack.join(', ')}
- Rounds: ${rounds}
- Questions per round: ${perRound} (min 5, max 10)
- Total questions desired overall: approximately ${numQuestions}

Task:
1) Produce exactly ${rounds} topics relevant to the role and type.
2) For each topic, produce ${perRound} multiple-choice questions.
3) Each question must have: prompt (short), options (array of 4 strings), answer (one of the options exactly), explanation (1-2 sentences).

Return JSON with this schema:
{
  "topics": [
    {
      "name": string,
      "questions": [ { "prompt": string, "options": [string, string, string, string], "answer": string, "explanation": string } ]
    }
  ]
}`;
}

async function generateTopicsQuestions(input) {
  const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!API_KEY) throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY');

  const prompt = buildPrompt(input);
  const model = 'gemini-2.0-flash-001';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  const res = await fetchAny(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Gemini API error: ' + txt);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // sometimes the api wraps json in markdown, so extract just the json part
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    json = JSON.parse(text.slice(first, last + 1));
  }
  return json;
}

module.exports = { generateTopicsQuestions };

function buildPracticePrompt({ language, topic, numQuestions }) {
  return `You are a helpful assistant that creates practice quizzes.
Return STRICT JSON only. Do not include backticks.

Input:
- Language/Context: ${language}
- Topic: ${topic}
- Number of questions: ${numQuestions}

Task:
Produce ${numQuestions} multiple-choice questions for the topic. Each question must have:
- prompt (short)
- options (array of 4 strings)
- answer (MUST be exactly one of the options)
- explanation (1-2 concise sentences)

Return JSON with this schema:
{
  "questions": [ { "prompt": string, "options": [string,string,string,string], "answer": string, "explanation": string } ]
}`;
}

async function generatePracticeQuestions({ language, topic, numQuestions = 20 }) {
  const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!API_KEY) throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY');

  const prompt = buildPracticePrompt({ language, topic, numQuestions });
  const model = 'gemini-2.0-flash-001';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  const res = await fetchAny(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Gemini API error: ' + txt);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    json = JSON.parse(text.slice(first, last + 1));
  }
  return json;
}

module.exports.generatePracticeQuestions = generatePracticeQuestions;


