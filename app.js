// Embedded questions so the site works on GitHub Pages AND via file:// without fetch().
const DATA = {"title": "Amazon Connect Optimization Scorecard", "scale": {"min": 1, "max": 5, "labels": {"1": "Not in Place", "2": "Limited", "3": "Partially Adopted", "4": "Fully Adopted", "5": "Optimized / Continuous Improvement"}}, "sections": [{"title": "Channels & Customer Experience", "questions": [{"id": "q001", "text": "Are all your contact channels are enabled and routed based on availability or preferences?"}, {"id": "q002", "text": "Are customers able to self-serve through Lex bots or conversational IVR?"}, {"id": "q003", "text": "Do contact flows personalize experiences using CRM data, history, or context?"}, {"id": "q004", "text": "Are callback and queue management features actively used?"}]}, {"title": "AI & Automation", "questions": [{"id": "q005", "text": "Is Contact Lens enabled for sentiment analysis, transcripts, and compliance monitoring?"}, {"id": "q006", "text": "Do agents use real-time AI assistance (Amazon Q in Connect) for guidance or knowledge?"}, {"id": "q007", "text": "Are your post-contact summaries and sentiment analysis integrated with your CRM?"}, {"id": "q008", "text": "Is automated contact categorization or tagging used to reduce manual work?"}]}, {"title": "Agent Experience & Efficiency", "questions": [{"id": "q009", "text": "Are agents using the unified workspace (threaded views, screen pops, unified profiles)?"}, {"id": "q010", "text": "Do agents use screen recording and screen sharing appropriately?"}, {"id": "q011", "text": "Are tasks automated and managed via Amazon Connect Tasks?"}, {"id": "q012", "text": "Are you using agent evaluations?"}]}, {"title": "Integrations & Workflow Automation", "questions": [{"id": "q013", "text": "Is Connect integrated with CRM, ticketing, WFM, or internal systems?"}, {"id": "q014", "text": "Are customer records or cases automatically updated using APIs/Lambdas?"}, {"id": "q015", "text": "Is contextual data passed into contact flows (identity, case history, app session info)?"}, {"id": "q016", "text": "Are automated workflows (Lambda/EventBridge/APIs) used to remove manual steps?"}]}, {"title": "Reporting, Analytics & Compliance", "questions": [{"id": "q017", "text": "Do standard Connect reports meet your needs?"}, {"id": "q018", "text": "Do you have the ability to review historical interactions?"}, {"id": "q019", "text": "Is Lex bot performance evaluated regularly to improve containment and CX?"}, {"id": "q020", "text": "Are contact flow analytics reviewed often to identify friction and optimize journeys?"}]}]};

const state = {
  data: DATA,
  answers: new Map(), // questionId -> number (1..5)
  min: DATA.scale?.min ?? 1,
  max: DATA.scale?.max ?? 5
};

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) node.appendChild(child);
  return node;
}

function renderLegend() {
  const host = document.getElementById('legendGrid');
  host.innerHTML = '';
  const labels = state.data.scale?.labels ?? {};

  for (let v = state.min; v <= state.max; v++) {
    host.appendChild(el('div', { class: 'legend-item' }, [
      el('div', { class: 'legend-score' }, [document.createTextNode(String(v))]),
      el('div', { class: 'legend-label' }, [document.createTextNode(labels[String(v)] ?? '')]),
    ]));
  }
}

function renderQuestions() {
  const root = document.getElementById('questionsRoot');
  root.innerHTML = '';

  const sections = state.data.sections || [];
  let idx = 0;

  for (const section of sections) {
    const sectionCard = el('section', { class: 'card section' });
    sectionCard.appendChild(el('div', { class: 'section-header' }, [
      el('h3', { class: 'section-title' }, [document.createTextNode(section.title)]),
      el('div', { class: 'section-meta' }, [document.createTextNode(`${section.questions.length} questions`)])
    ]));

    const body = el('div', { class: 'section-body' });
    for (const q of section.questions) {
      idx += 1;
      body.appendChild(renderQuestion(q, idx));
      // default answer is min (1)
      if (!state.answers.has(q.id)) state.answers.set(q.id, state.min);
    }

    sectionCard.appendChild(body);
    root.appendChild(sectionCard);
  }
}

function renderQuestion(q, idx) {
  const wrap = el('div', { class: 'question' });
  wrap.appendChild(el('p', { class: 'q-text' }, [document.createTextNode(`${idx}. ${q.text}`)]));

  const scale = el('div', { class: 'scale', role: 'radiogroup', 'aria-label': `Score for: ${q.text}` });

  for (let v = state.min; v <= state.max; v++) {
    const id = `${q.id}_${v}`;

    const input = el('input', { type: 'radio', id, name: q.id, value: String(v) });
    input.addEventListener('change', (e) => {
      const val = Number.parseInt(e.target.value, 10);
      if (!Number.isFinite(val)) return;
      state.answers.set(q.id, val);
    });

    // default selection is min (1)
    if (v === state.min) input.checked = true;

    const label = el('label', { for: id, title: `${v}` }, [document.createTextNode(String(v))]);

    scale.appendChild(input);
    scale.appendChild(label);
  }

  wrap.appendChild(scale);
  return wrap;
}

function computeTotals() {
  const all = (state.data.sections || []).flatMap(s => s.questions || []);
  const totalQuestions = all.length;
  const maxTotal = totalQuestions * state.max;

  let sum = 0;
  for (const q of all) {
    const v = state.answers.get(q.id);
    sum += (typeof v === 'number' ? v : state.min);
  }

  const percent = maxTotal === 0 ? 0 : Math.round((sum / maxTotal) * 100);
  return { sum, maxTotal, percent };
}

function renderBreakdown() {
  const host = document.getElementById('breakdownRoot');
  host.innerHTML = '';

  const table = el('table');
  table.appendChild(el('thead', {}, [
    el('tr', {}, [
      el('th', {}, [document.createTextNode('Section')]),
      el('th', {}, [document.createTextNode('Score')]),
      el('th', {}, [document.createTextNode('Utilization')]),
    ])
  ]));

  const tbody = el('tbody');

  for (const s of state.data.sections || []) {
    const qs = s.questions || [];
    const max = qs.length * state.max;

    let sum = 0;
    for (const q of qs) sum += (state.answers.get(q.id) ?? state.min);

    const pct = max === 0 ? 0 : Math.round((sum / max) * 100);

    tbody.appendChild(el('tr', {}, [
      el('td', {}, [document.createTextNode(s.title)]),
      el('td', {}, [document.createTextNode(`${sum} / ${max}`)]),
      el('td', {}, [document.createTextNode(`${pct}%`)]),
    ]));
  }

  table.appendChild(tbody);
  host.appendChild(table);
}

function showResults() {
  const r = computeTotals();
  document.getElementById('results').classList.remove('hidden');

  document.getElementById('badgePercent').textContent = `${r.percent}%`;
  document.getElementById('overallScore').textContent = `${r.sum} / ${r.maxTotal}`;
  document.getElementById('overallHint').textContent = `Utilization is ${r.percent}% of the maximum possible score.`;

  renderBreakdown();
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetAll() {
  state.answers.clear();

  // Reset all radios to min (1)
  document.querySelectorAll('input[type="radio"]').forEach((input) => {
    if (input.value === String(state.min)) input.checked = true;
  });

  // Restore default answers map
  const all = (state.data.sections || []).flatMap(s => s.questions || []);
  for (const q of all) state.answers.set(q.id, state.min);

  document.getElementById('results').classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function copySummary() {
  const r = computeTotals();
  const text = [
    state.data.title,
    `Utilization: ${r.percent}% (${r.sum}/${r.maxTotal})`,
  ].join('\n');

  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById('btnCopy');
    const old = btn.textContent;
    btn.textContent = 'Copied';
    setTimeout(() => (btn.textContent = old), 1200);
  } catch {
    alert(text);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderLegend();
  renderQuestions();

  document.getElementById('btnResults').addEventListener('click', showResults);
  document.getElementById('btnReset').addEventListener('click', resetAll);
  document.getElementById('btnCopy').addEventListener('click', copySummary);
});
