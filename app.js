// Data is embedded so this works even via file:// (no fetch, no local server needed).
const DATA = {
  "title": "Amazon Connect Optimization Scorecard",
  "scale": {
    "min": 1,
    "max": 5,
    "labels": {
      "1": "Not in Place",
      "2": "Limited",
      "3": "Partially Adopted",
      "4": "Fully Adopted",
      "5": "Optimized / Continuous Improvement"
    }
  },
  "yesThreshold": 4,
  "sections": [
    {
      "title": "Channels & Customer Experience",
      "questions": [
        {
          "id": "q001",
          "text": "Are all your contact channels are enabled and routed based on availability or preferences?"
        },
        {
          "id": "q002",
          "text": "Are customers able to self-serve through Lex bots or conversational IVR?"
        },
        {
          "id": "q003",
          "text": "Do contact flows personalize experiences using CRM data, history, or context?"
        },
        {
          "id": "q004",
          "text": "Are callback and queue management features actively used?"
        }
      ]
    },
    {
      "title": "AI & Automation",
      "questions": [
        {
          "id": "q005",
          "text": "Is Contact Lens enabled for sentiment analysis, transcripts, and compliance monitoring?"
        },
        {
          "id": "q006",
          "text": "Do agents use real-time AI assistance (Amazon Q in Connect) for guidance or knowledge?"
        },
        {
          "id": "q007",
          "text": "Are your post-contact summaries and sentiment analysis integrated with your CRM?"
        },
        {
          "id": "q008",
          "text": "Is automated contact categorization or tagging used to reduce manual work?"
        }
      ]
    },
    {
      "title": "Agent Experience & Efficiency",
      "questions": [
        {
          "id": "q009",
          "text": "Are agents using the unified workspace (threaded views, screen pops, unified profiles)?"
        },
        {
          "id": "q010",
          "text": "Do agents use screen recording and screen sharing appropriately?"
        },
        {
          "id": "q011",
          "text": "Are tasks automated and managed via Amazon Connect Tasks?"
        },
        {
          "id": "q012",
          "text": "Are you using agent evaluations?"
        }
      ]
    },
    {
      "title": "Integrations & Workflow Automation",
      "questions": [
        {
          "id": "q013",
          "text": "Is Connect integrated with CRM, ticketing, WFM, or internal systems?"
        },
        {
          "id": "q014",
          "text": "Are customer records or cases automatically updated using APIs/Lambdas?"
        },
        {
          "id": "q015",
          "text": "Is contextual data passed into contact flows (identity, case history, app session info)?"
        },
        {
          "id": "q016",
          "text": "Are automated workflows (Lambda/EventBridge/APIs) used to remove manual steps?"
        }
      ]
    },
    {
      "title": "Reporting, Analytics & Compliance",
      "questions": [
        {
          "id": "q017",
          "text": "Do standard Connect reports meet your needs?"
        },
        {
          "id": "q018",
          "text": "Do you have the ability to review historical interactions?"
        },
        {
          "id": "q019",
          "text": "Is Lex bot performance evaluated regularly to improve containment and CX?"
        },
        {
          "id": "q020",
          "text": "Are contact flow analytics reviewed often to identify friction and optimize journeys?"
        }
      ]
    }
  ]
};

const state = {
  data: DATA,
  answers: new Map(), // questionId -> number (1..5)
  minPerQuestion: DATA?.scale?.min ?? 1,
  maxPerQuestion: DATA?.scale?.max ?? 5
};

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) node.appendChild(child);
  return node;
}

function clampInt(n, min, max) {
  const x = Number.parseInt(n, 10);
  if (Number.isNaN(x)) return null;
  return Math.max(min, Math.min(max, x));
}

function renderLegend() {
  const host = document.getElementById('legendGrid');
  host.innerHTML = '';
  const labels = state.data?.scale?.labels ?? {};
  for (let v = state.minPerQuestion; v <= state.maxPerQuestion; v++) {
    host.appendChild(el('div', { class: 'legend-item' }, [
      el('div', { class: 'legend-score' }, [document.createTextNode(String(v))]),
      el('div', { class: 'legend-label' }, [document.createTextNode(labels[String(v)] ?? '')]),
    ]));
  }
  document.getElementById('yesNoHint').textContent = `Counts a score of ${state.yesThreshold}+ as "yes".`;
}

function renderQuestions() {
  const root = document.getElementById('questionsRoot');
  root.innerHTML = '';

  const sections = state.data.sections || [];
  let globalIndex = 0;

  for (const section of sections) {
    const sectionCard = el('section', { class: 'card section' });

    const meta = `${section.questions.length} questions`;
    sectionCard.appendChild(
      el('div', { class: 'section-header' }, [
        el('h3', { class: 'section-title' }, [document.createTextNode(section.title)]),
        el('div', { class: 'section-meta' }, [document.createTextNode(meta)])
      ])
    );

    const body = el('div', { class: 'section-body' });

    for (const q of section.questions) {
      globalIndex += 1;
      body.appendChild(renderQuestion(q, globalIndex));
    }

    sectionCard.appendChild(body);
    root.appendChild(sectionCard);
  }
}

function renderQuestion(q, index) {
  const wrap = el('div', { class: 'question' });
  const labelText = `${index}. ${q.text}`;
  wrap.appendChild(el('p', { class: 'q-text' }, [document.createTextNode(labelText)]));

  const scale = el('div', { class: 'scale', role: 'radiogroup', 'aria-label': `Score for: ${q.text}` });
  const labels = state.data?.scale?.labels ?? {};

  for (let v = state.minPerQuestion; v <= state.maxPerQuestion; v++) {
    const id = `${q.id}_${v}`;
    const input = el('input', { type: 'radio', id, name: q.id, value: String(v) });
    input.addEventListener('change', (e) => {
      const val = clampInt(e.target.value, state.minPerQuestion, state.maxPerQuestion);
      if (val === null) return;
      state.answers.set(q.id, val);
    });

    // default to 1 (Not in Place)
    if (v === state.minPerQuestion) {
      input.checked = true;
      state.answers.set(q.id, state.minPerQuestion);
    }

    const title = labels[String(v)] ? `${v} - ${labels[String(v)]}` : String(v);
    const label = el('label', { for: id, title }, [document.createTextNode(String(v))]);

    scale.appendChild(input);
    scale.appendChild(label);
  }

  wrap.appendChild(scale);
  return wrap;
}

function compute() {
  const allQuestions = (state.data.sections || []).flatMap(s => s.questions || []);
  const totalQuestions = allQuestions.length;

  const maxTotal = totalQuestions * state.maxPerQuestion;
  const minTotal = totalQuestions * state.minPerQuestion;

  let sum = 0;
  
  // Overall % is percent of the maximum possible (max = 5).
  const percent = maxTotal === 0 ? 0 : Math.round((sum / maxTotal) * 100);
  
  return { sum, maxTotal, minTotal, totalQuestions, percent };
}

function renderResults() {
  const r = compute();

  document.getElementById('results').classList.remove('hidden');
  document.getElementById('badgePercent').textContent = `${r.percent}%`;
  
  document.getElementById('overallScore').textContent = `${r.sum} / ${r.maxTotal}`;
  document.getElementById('overallHint').textContent = `Overall utilization is ${r.percent}% based on your total score.`;
  
  renderBreakdown();
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderBreakdown() {
  const host = document.getElementById('breakdownRoot');
  host.innerHTML = '';

  const table = el('table');
  table.appendChild(el('thead', {}, [
    el('tr', {}, [
      el('th', {}, [document.createTextNode('Section')]),
      el('th', {}, [document.createTextNode('Score')]),
      el('th', {}, [document.createTextNode('Percent')])
    ])
  ]));

  const tbody = el('tbody');

  for (const s of state.data.sections || []) {
    const qs = s.questions || [];
    const max = qs.length * state.maxPerQuestion;
    let sum = 0;
    for (const q of qs) sum += (state.answers.get(q.id) ?? state.minPerQuestion);
    const pct = max === 0 ? 0 : Math.round((sum / max) * 100);

    tbody.appendChild(el('tr', {}, [
      el('td', {}, [document.createTextNode(s.title)]),
      el('td', {}, [document.createTextNode(`${sum} / ${max}`)]),
      el('td', {}, [document.createTextNode(`${pct}%`)])
    ]));
  }

  table.appendChild(tbody);
  host.appendChild(table);
}

function resetAll() {
  state.answers.clear();
  document.querySelectorAll('input[type="radio"]').forEach((input) => {
    if (input.value === String(state.minPerQuestion)) input.checked = true;
  });

  // rebuild defaults (min score for each question)
  const allQuestions = (state.data.sections || []).flatMap(s => s.questions || []);
  for (const q of allQuestions) state.answers.set(q.id, state.minPerQuestion);

  document.getElementById('results').classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function copySummary() {
  const r = compute();
  const lines = [
    `${state.data.title}`,
    `Overall: ${r.percent}% (${r.sum}/${r.maxTotal})`,
    `Yes/No (${state.yesThreshold}+ is yes): ${r.yesPercent}% yes (${r.yes} yes, ${r.no} no)`
  ];
  const text = lines.join('\n');
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
  document.getElementById('btnResults').addEventListener('click', renderResults);
  document.getElementById('btnReset').addEventListener('click', resetAll);
  document.getElementById('btnCopy').addEventListener('click', copySummary);

  renderLegend();
  renderQuestions();
});
