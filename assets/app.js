/* ------------------------------------------------------------
 * app.js — index page (class overview + login).
 * 26여름학기 X4 프라임 리포트
 * ------------------------------------------------------------ */

let CLASS_STATS = null;
let ENC_PROFILES = null;

const TYPE_LABELS = {
  '대의 추론': '대의 추론', '심경 추론': '심경 추론', '함의 추론': '함의 추론', '내용 일치': '내용 일치',
  '어법': '어법', '빈칸 추론': '빈칸 추론', '흐름 무관': '흐름 무관', '순서 추론': '순서 추론',
  '문장 삽입': '문장 삽입', '요약': '요약', '장문 독해': '장문 독해',
};

const DEMO_PROFILE = {
  isDemo: true,
  name: '김캔비',
  grade: 3,
  mainExam: {
    total: 74, reading: 38, listening: 36, readingAcc: 38 / 56,
    listeningDetail: { totalCorrect: 15, totalAttempted: 17, blank: 0, accuracy: 15 / 17 },
    wrong: [
      { num: 8, section: 'listening', type: '(듣기) 언급 여부', points: 2, answer: 5, correct: 3 },
      { num: 13, section: 'listening', type: '(듣기) 응답 추론', points: 3, answer: 3, correct: 1 },
      { num: 21, section: 'reading', type: '함의 추론*', points: 3, answer: 5, correct: 1 },
      { num: 29, section: 'reading', type: '어법*', points: 3, answer: 4, correct: 2 },
      { num: 32, section: 'reading', type: '빈칸 추론*', points: 2, answer: 4, correct: 2 },
      { num: 38, section: 'reading', type: '문장 삽입*', points: 2, answer: 3, correct: 5 },
    ],
  },
  mini: {
    rounds: [
      { round: '2회', acc: 0.67 }, { round: '3회', acc: 0.75 }, { round: '4회', acc: 0.83 },
      { round: '5회', acc: 0.75 }, { round: '6회', acc: 0.83 }, { round: '7회', acc: 0.92 },
      { round: '8회', acc: 0.83 }, { round: '9회', acc: 0.75 }, { round: '10회', acc: 0.83 }, { round: '11회', acc: 0.83 },
    ],
  },
  go2: {
    rounds: [
      { round: '1회', acc: 0.61 }, { round: '2회', acc: 0.68 }, { round: '3회', acc: 0.71 },
      { round: '4회', acc: 0.64 }, { round: '5회', acc: 0.71 }, { round: '6회', acc: 0.75 },
      { round: '7회', acc: 0.71 }, { round: '8회', acc: 0.79 }, { round: '9회', acc: 0.75 }, { round: '10회', acc: 0.71 },
    ],
  },
  legacy: {
    total: 71, reading: 34, listening: 37, mt2ReadingAcc: 0.54,
    roundHistory: [
      { round: '1회', readingAcc: 0.54, listeningAcc: 1 }, { round: '2회', readingAcc: 0.61, listeningAcc: 0.94 },
      { round: '3회', readingAcc: 0.68, listeningAcc: 1 }, { round: '4회', readingAcc: 0.64, listeningAcc: 1 },
      { round: '5회', readingAcc: 0.71, listeningAcc: 0.94 }, { round: '6회', readingAcc: 0.68, listeningAcc: 1 },
      { round: '7회', readingAcc: 0.75, listeningAcc: 1 }, { round: '8회', readingAcc: 0.71, listeningAcc: 0.94 },
      { round: '9회', readingAcc: 0.79, listeningAcc: 1 },
    ],
    listeningDetail: { totalCorrect: 130, totalAttempted: 136, accuracy: 130 / 136 },
  },
  termComment: {
    native: '(예시 계정입니다. 실제 원어민 선생님 총평은 로그인 후 확인할 수 있습니다.)',
    korean: '(예시 계정입니다. 실제 총평은 로그인 후 확인할 수 있습니다.)',
  },
};

const grade1Series = [
  { session: "'16.3",  pct: 12.89 }, { session: "'16.6",  pct: 5.36 }, { session: "'16.9",  pct: 4.49 },
  { session: "'16.11", pct: 5.53 }, { session: "'17.3",  pct: 10.66 }, { session: "'17.6",  pct: 7.34 },
  { session: "'17.9",  pct: 8.42 }, { session: "'17.11", pct: 6.98 }, { session: "'18.3",  pct: 6.08 },
  { session: "'18.6",  pct: 5.78 }, { session: "'18.9",  pct: 8.36 }, { session: "'18.11", pct: 3.03 },
  { session: "'19.3",  pct: 6.72 }, { session: "'19.6",  pct: 5.27 }, { session: "'19.9",  pct: 5.40 },
  { session: "'19.11", pct: 11.68 }, { session: "'20.3", pct: null, note: "성적 미산출" }, { session: "'20.6", pct: 7.63 },
  { session: "'20.9",  pct: 6.00 }, { session: "'20.11", pct: 8.32 }, { session: "'21.3",  pct: 5.06 },
  { session: "'21.6",  pct: 10.11 }, { session: "'21.9", pct: 8.19 }, { session: "'21.11", pct: 7.76 },
  { session: "'22.3",  pct: 4.38 }, { session: "'22.6",  pct: 7.49 }, { session: "'22.9",  pct: 9.43 },
  { session: "'22.11", pct: 3.71 }, { session: "'23.3",  pct: 5.64 }, { session: "'23.6",  pct: 3.95 },
  { session: "'23.9",  pct: 5.18 }, { session: "'23.11", pct: 5.84 }, { session: "'24.3",  pct: 3.79 },
  { session: "'24.6",  pct: 7.16 }, { session: "'24.9",  pct: 10.72 }, { session: "'24.10", pct: 2.31 },
  { session: "'25.3",  pct: 4.57 }, { session: "'25.6",  pct: 7.81 }, { session: "'25.9",  pct: 6.01 },
  { session: "'25.10", pct: 6.78 }, { session: "'26.3",  pct: 3.48 }, { session: "'26.6", pct: 7.48 },
];

function findExamItem(num) {
  const c = window.__MAIN_EXAM_CONTENT__;
  if (!c) return null;
  return c.listening.find(i => i.num === num) || c.reading.find(i => i.num === num) || null;
}

function resolvePassage(item, section) {
  const list = section === 'listening' ? window.__MAIN_EXAM_CONTENT__.listening : window.__MAIN_EXAM_CONTENT__.reading;
  const key = section === 'listening' ? 'script' : 'passage';
  let text = item[key] || '';
  if (text.includes('위 참고') && item.groupId) {
    const primary = list.find(i => i.groupId === item.groupId);
    if (primary) text = primary[key];
  }
  return text;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getExamAnnotation(item) {
  if (!item || !window.__MAIN_EXAM_ANNOTATIONS__) return {};
  return window.__MAIN_EXAM_ANNOTATIONS__.reading[String(item.num)] || {};
}

/* Auto-underline circled-number (①-⑤) and lettered ((a)-(e)) inline markers
 * used by 어법/문맥 낱말/장문독해 밑줄 문제, plus any manual highlight phrases
 * supplied for a given item (the sentence that actually answers the question). */
function formatPassageHtml(text, item) {
  let escaped = escapeHtml(text);
  const annotation = getExamAnnotation(item);
  const correctionTokens = [];

  (annotation.corrections || []).forEach((correction, index) => {
    const from = escapeHtml(correction.from);
    if (!from || !escaped.includes(from)) return;
    const token = `@@QCORRECTION${index}@@`;
    const corrected = escapeHtml(correction.to);
    correctionTokens.push({
      token,
      html: `<ruby class="q-correction"><del>${from}</del><rt>${corrected}</rt></ruby>`,
    });
    escaped = escaped.split(from).join(token);
  });

  [...(item && item.highlights || []), ...(annotation.highlights || [])].forEach(phrase => {
    const esc = escapeHtml(phrase);
    if (esc && escaped.includes(esc)) {
      escaped = escaped.split(esc).join(`<mark class="q-highlight">${esc}</mark>`);
    }
  });
  (item && item.underline || []).forEach(phrase => {
    const esc = escapeHtml(phrase);
    if (esc && escaped.includes(esc)) {
      escaped = escaped.split(esc).join(`<u class="q-underline">${esc}</u>`);
    }
  });
  escaped = escaped.replace(/([①②③④⑤])(\s?)([A-Za-z][A-Za-z''-]*)/g, '<u class="q-underline">$1$2$3</u>');
  escaped = escaped.replace(/(\([a-e]\))([A-Za-z][A-Za-z''-]*)/g, '<u class="q-underline">$1$2</u>');
  correctionTokens.forEach(({ token, html }) => {
    escaped = escaped.split(token).join(html);
  });
  return escaped;
}

function renderInsertSentenceBox(item) {
  if (!item || !item.insertSentence) return '';
  return `<div class="q-insert-sentence"><div class="qi-label">주어진 문장</div><p>"${escapeHtml(item.insertSentence)}"</p></div>`;
}

function showDataLoadError(message) {
  ['kpi-mean', 'kpi-range', 'kpi-reading', 'kpi-listening'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '불러오기 실패';
  });
  const hard = document.getElementById('hard-questions');
  if (hard) {
    hard.innerHTML = `<div class="chart-card"><div class="chart-title">데이터를 불러오지 못했습니다</div><p style="margin-top:12px; color:var(--ink-soft); line-height:1.7;">${message}</p></div>`;
  }
}

function renderExamIntro() {
  const isCompact = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  const validGrade1 = grade1Series.filter(d => d.pct !== null && d.pct !== undefined);
  const historicalAverage = validGrade1.reduce((sum, d) => sum + d.pct, 0) / validGrade1.length;
  renderGrade1TrendChart(
    document.getElementById('chart-grade1-trend'),
    grade1Series,
    { height: isCompact ? 260 : 320, yMax: 14, refLine: 4, average: historicalAverage }
  );
}

async function bootstrap() {
  try {
    const res = await fetch('data/class_stats.json');
    CLASS_STATS = await res.json();
  } catch (e) {
    console.warn('Fetch failed for class_stats.json, falling back to embedded data', e);
    if (window.__CLASS_STATS__) {
      CLASS_STATS = window.__CLASS_STATS__;
    } else {
      showDataLoadError('데이터를 불러오지 못했습니다. 가능하면 로컬 서버로 실행해 주세요.');
      return;
    }
  }
  renderHeroStats();
  renderDistribution();
  renderGrades();
  renderMiniSection();
  renderGo2Section();
  renderTypeTrendSection();
  renderListeningSection();
  renderClassReadingHeatmap(document.getElementById('class-reading-heatmap'), window.__READING_HEATMAP__);
  renderHardQuestions();

  try {
    const res = await fetch('data/profiles.enc.json');
    ENC_PROFILES = await res.json();
  } catch (e) {
    console.warn('Fetch failed for profiles.enc.json, falling back to embedded data', e);
    ENC_PROFILES = window.__ENC_PROFILES__ || null;
  }
}

function renderHeroStats() {
  const m = CLASS_STATS.mainExam;
  document.getElementById('kpi-mean').textContent = m.mean.toFixed(1);
  document.getElementById('kpi-range').textContent = `${m.max} / ${m.min}`;
  document.getElementById('kpi-spread').textContent = `편차 ${m.stdev}`;
  document.getElementById('kpi-reading').textContent = m.readingMean.toFixed(1);
  document.getElementById('kpi-reading-pct').textContent = `정답률 ${(m.readingMean / m.maxReading * 100).toFixed(1)}%`;
  document.getElementById('kpi-listening').textContent = m.listeningMean.toFixed(1);
  document.getElementById('kpi-listening-pct').textContent = `정답률 ${(m.listeningMean / m.maxListening * 100).toFixed(1)}%`;
}

function renderDistribution() {
  const scores = CLASS_STATS.mainExam.scoreDistribution;
  const data = scores.map((v, i) => ({ label: `#${i + 1}`, value: v }));
  renderBarChart(document.getElementById('chart-distribution'), data, { max: 100, mean: CLASS_STATS.mainExam.mean, height: 320, valueSuffix: '' });
}

function renderGrades() {
  const classCounts = CLASS_STATS.mainExam.classGradeCounts;
  const n = CLASS_STATS.numStudents;
  const dist = CLASS_STATS.high2.distribution;
  const groups = dist.map(d => {
    const classPct = ((classCounts[d.grade] || 0) / n) * 100;
    return { label: `${d.grade}등급`, values: [classPct, d.pct] };
  });
  renderGroupedBars(
    document.getElementById('chart-grades'), groups,
    [
      { name: `26여름 X4 (${n}명)`, color: CHART_COLORS.magenta },
      { name: '고2 전국 (2026.6)', color: CHART_COLORS.inkFaint },
    ],
    { yMax: null, yFormat: v => v + '%' }
  );

  const wrap = document.getElementById('grade-table');
  let html = `<table style="width:100%; border-collapse:collapse; color:var(--ink); font-size:14px;">
    <thead><tr style="border-bottom:1px solid var(--hairline);">
      <th style="text-align:left; padding:12px 8px; font-weight:500; color:var(--ink-mute); font-size:12px; letter-spacing:0.06em; text-transform:uppercase;">등급</th>
      <th style="text-align:right; padding:12px 8px; font-weight:500; color:var(--ink-mute); font-size:12px; letter-spacing:0.06em; text-transform:uppercase;">점수 컷</th>
      <th style="text-align:right; padding:12px 8px; font-weight:500; color:var(--ink-mute); font-size:12px; letter-spacing:0.06em; text-transform:uppercase;">26여름 X4</th>
      <th style="text-align:right; padding:12px 8px; font-weight:500; color:var(--ink-mute); font-size:12px; letter-spacing:0.06em; text-transform:uppercase;">고2 전국(2026.6)</th>
    </tr></thead><tbody>`;
  dist.forEach(d => {
    const c = classCounts[d.grade] || 0;
    html += `<tr style="border-bottom:1px solid var(--divider);">
      <td style="padding:14px 8px; color:var(--ink); font-weight:500;">${d.grade}등급</td>
      <td style="padding:14px 8px; text-align:right; color:var(--ink-soft);" class="mono">${d.minScore === 0 ? '0–19' : `${d.minScore}+`}</td>
      <td style="padding:14px 8px; text-align:right; color:${c > 0 ? 'var(--magenta)' : 'var(--ink-faint)'}; font-weight:${c > 0 ? '600' : '400'};" class="mono">${c}명 (${((c / n) * 100).toFixed(1)}%)</td>
      <td style="padding:14px 8px; text-align:right; color:var(--ink-mute);" class="mono">${d.pct}%</td>
    </tr>`;
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

/* ----------------------------------------------------------------
 * 고1 모의고사 (노란 책) — 이번 학기만 미니 형식(28문항 → 12문항),
 * so we compare accuracy (%) side by side rather than one continuous line.
 * ---------------------------------------------------------------- */
function renderMiniSection() {
  const legacyRounds = CLASS_STATS.legacyGrade1Full.roundHistory;
  const miniRounds = CLASS_STATS.grade1Mini.rounds;

  const legacyGrid = document.getElementById('mini-legacy-grid');
  legacyGrid.innerHTML = legacyRounds.map(r =>
    renderAccCell(r.round, r.classReadingAvg, `${r.numReadingContrib || 0}명 · 28문항`)
  ).join('');

  const miniGrid = document.getElementById('mini-current-grid');
  miniGrid.innerHTML = miniRounds.map(r =>
    renderAccCell(r.round, r.classAcc, `${r.numContrib}명 · 12문항`)
  ).join('');

  const legacyValid = legacyRounds.map(r => r.classReadingAvg).filter(v => v !== null && v !== undefined);
  const miniValid = miniRounds.map(r => r.classAcc).filter(v => v !== null && v !== undefined);
  const legacyAvg = legacyValid.reduce((s, v) => s + v, 0) / legacyValid.length;
  const miniAvg = miniValid.reduce((s, v) => s + v, 0) / miniValid.length;
  const change = miniAvg - legacyAvg;

  document.getElementById('mini-prev-avg').textContent = `${(legacyAvg * 100).toFixed(1)}%`;
  document.getElementById('mini-current-avg').textContent = `${(miniAvg * 100).toFixed(1)}%`;
  const changeEl = document.getElementById('mini-change');
  changeEl.textContent = `${change >= 0 ? '+' : ''}${(change * 100).toFixed(1)}%p`;
  changeEl.style.color = change >= 0 ? '#0a7a3d' : 'var(--magenta)';
}

/* ----------------------------------------------------------------
 * 고2 모의고사 (빨간 책) — one continuous story: 지난학기 최종 학평 →
 * 이번 학기 10회 연습 → 메인 시험(헤드라인).
 * ---------------------------------------------------------------- */
function renderGo2Section() {
  const baseline = CLASS_STATS.legacyGo2Baseline.mt2ClassReadingAvg;
  const rounds = CLASS_STATS.grade2Go2.rounds;
  const mainAcc = CLASS_STATS.mainExam.readingMean / CLASS_STATS.mainExam.maxReading;

  const grid = document.getElementById('go2-grid');
  const baselineCell = renderAccCell('26봄학기 평가시험(고2)', baseline, '고2 학평 기준');
  const roundCells = rounds.map(r => renderAccCell(r.round, r.classAcc, `${r.numContrib}명`)).join('');
  const mainCell = renderAccCell('메인 시험', mainAcc, '6월 고2 학평', 'final-test');
  grid.innerHTML = baselineCell + roundCells + mainCell;

  const labels = ['26봄학기 평가시험(고2)'].concat(rounds.map(r => r.round)).concat(['메인 시험']);
  const series = [{
    name: '반 평균 독해 정답률', color: CHART_COLORS.magenta, thick: true,
    data: [baseline].concat(rounds.map(r => r.classAcc)).concat([mainAcc]).map((v, i) => ({ x: i, y: v === null || v === undefined ? null : +(v * 100).toFixed(1) })),
  }];
  renderLineChart(document.getElementById('chart-go2-trend'), series, { xLabels: labels, yMin: 0, yMax: 100, height: 320 });
}

function renderTypeTrendSection() {
  renderTypeTrend(document.getElementById('type-trend-table'), CLASS_STATS.typeTrend);
}

/* ----------------------------------------------------------------
 * 듣기 — 메인 시험(6월 고2 학평)에서만 다룸. 후반부(8~17번) 고난도 문항 위주.
 * ---------------------------------------------------------------- */
function renderListeningSection() {
  const stats = CLASS_STATS.mainExam.questionStats;
  const items = Object.keys(stats).map(k => parseInt(k)).filter(n => n <= 17).sort((a, b) => a - b);
  const grid = document.getElementById('listening-grid');
  grid.innerHTML = items.map(n => {
    const s = stats[n];
    return `<div class="round-cell${s.classAccuracy < 0.7 ? ' miss' : ''}">
      <div class="rc-label">${n}번</div>
      <div class="rc-value">${(s.classAccuracy * 100).toFixed(0)}<span style="font-size:14px; color:var(--ink-mute);">%</span></div>
      <div class="rc-detail">${s.classCorrectCount}/${CLASS_STATS.numStudents}명</div>
    </div>`;
  }).join('');

  const wrongItems = items
    .filter(n => stats[n].classCorrectCount < CLASS_STATS.numStudents)
    .sort((a, b) => stats[a].classAccuracy - stats[b].classAccuracy);
  const wrap = document.getElementById('listening-wrong-list');
  if (wrap) {
    wrap.className = 'hard-question-grid';
    wrap.innerHTML = wrongItems.map(n => renderQuestionTextCard(stats[n], n)).join('');
  }
}

/* ----------------------------------------------------------------
 * 메인 시험 문항 분석 — 텍스트 기반 카드 (스크린샷 대신 실제 문항 텍스트)
 * ---------------------------------------------------------------- */

function renderQuestionTextCard(qStat, num) {
  const section = qStat.section;
  const item = findExamItem(num);
  if (!item) return '';
  const passage = resolvePassage(item, section);
  const dist = qStat.answerDistribution || {};
  const total = CLASS_STATS.numStudents;
  const choicesHtml = item.isImageQuestion
    ? '<li style="color:var(--ink-faint);">이미지 문항</li>'
    : item.choices.map((c, i) => {
        const n = i + 1;
        const isCorrect = n === qStat.correctAnswer;
        const count = dist[String(n)] || 0;
        const pct = total ? (count / total) * 100 : 0;
        const cls = (isCorrect ? ' is-correct' : '') + (!isCorrect && count > 0 ? ' was-picked' : '');
        return `<li class="${cls.trim()}" style="--qc-pct:${pct}%">
          <span class="qc-num">${n}</span>
          <span class="qc-text">${c}</span>
          <span class="qc-count">${count}명</span>
        </li>`;
      }).join('');

  return `
    <article class="q-card q-card-expanded">
      <div class="q-summary q-summary-compact">
        <div class="q-summary-grid">
          <div style="font-family:var(--font-display); font-size:42px; line-height:1; color:var(--magenta);">${num}</div>
          <div>
            <div style="font-size:13px; color:var(--ink-mute); letter-spacing:0.04em; text-transform:uppercase; margin-bottom:4px;">반 정답률</div>
            <div style="font-family:var(--font-display); font-size:28px; line-height:1;">${(qStat.classAccuracy * 100).toFixed(0)}<span style="font-family:var(--font-body); font-size:16px; color:var(--ink-mute);">%</span></div>
          </div>
          <div>
            <div style="font-size:13px; color:var(--ink-mute); letter-spacing:0.04em; text-transform:uppercase; margin-bottom:4px;">정답</div>
            <div style="font-family:var(--font-display); font-size:28px; line-height:1; color:var(--magenta);">${circleNum(qStat.correctAnswer)}</div>
          </div>
          <div>
            <div style="font-size:13px; color:var(--ink-mute); letter-spacing:0.04em; text-transform:uppercase; margin-bottom:4px;">배점</div>
            <div style="font-family:var(--font-display); font-size:28px; line-height:1;">${qStat.points}<span style="font-family:var(--font-body); font-size:16px; color:var(--ink-mute);">점</span></div>
          </div>
        </div>
      </div>
      <div class="q-tag-row"><span class="tag">${section === 'listening' ? '듣기' : '독해'} · ${qStat.type}</span></div>
      ${renderInsertSentenceBox(item)}
      <div class="q-passage${section === 'listening' ? ' q-script' : ''}">${escapeHtml(item.stem)}\n\n${formatPassageHtml(passage, item)}</div>
      <ul class="q-choices">${choicesHtml}</ul>
    </article>`;
}

function renderHardQuestions() {
  const stats = CLASS_STATS.mainExam.questionStats;
  const items = Object.keys(stats).map(q => ({ q: parseInt(q), ...stats[q] }));
  items.sort((a, b) => a.classAccuracy - b.classAccuracy);
  const top = items.slice(0, 6);
  const wrap = document.getElementById('hard-questions');
  wrap.className = 'hard-question-grid';
  wrap.innerHTML = top.map(item => renderQuestionTextCard(item, item.q)).join('');
}

/* ----------------------------------------------------------------
 * Login
 * ---------------------------------------------------------------- */
async function handleLogin() {
  const nameEl = document.getElementById('login-name');
  const credEl = document.getElementById('login-cred');
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  errEl.classList.remove('show');

  const name = nameEl.value.trim();
  const cred = credEl.value.trim();
  if (!name || !cred) {
    errEl.textContent = '이름과 인증 문구를 모두 입력해 주세요.';
    errEl.classList.add('show');
    return;
  }
  const isAdminLogin = name === 'yj11' && cred === 'qwer1234!';
  const isDemoLogin = name === '김캔비' && cred === '빠른 선인장';
  if (!ENC_PROFILES && !isDemoLogin && !isAdminLogin) {
    errEl.textContent = '데이터를 아직 불러오는 중입니다. 잠시 후 다시 시도해 주세요.';
    errEl.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = '확인 중…';

  try {
    if (isAdminLogin) {
      const adminProfiles = window.__ADMIN_PROFILES__ && window.__ADMIN_PROFILES__.profiles;
      if (!adminProfiles || adminProfiles.length === 0) throw new Error('admin_profiles_missing');
      sessionStorage.setItem('canb_admin', '1');
      sessionStorage.setItem('canb_adminProfiles', JSON.stringify(adminProfiles));
      sessionStorage.setItem('canb_profile', JSON.stringify(adminProfiles[0]));
      sessionStorage.setItem('canb_classStats', JSON.stringify(CLASS_STATS));
      window.location.href = 'profile.html';
      return;
    }

    const profile = isDemoLogin ? DEMO_PROFILE : await unlockProfile(ENC_PROFILES, name, cred);
    sessionStorage.removeItem('canb_admin');
    sessionStorage.removeItem('canb_adminProfiles');
    sessionStorage.setItem('canb_profile', JSON.stringify(profile));
    sessionStorage.setItem('canb_classStats', JSON.stringify(CLASS_STATS));
    window.location.href = 'profile.html';
  } catch (e) {
    errEl.textContent = '이름 또는 인증 문구가 맞지 않습니다.';
    errEl.classList.add('show');
    btn.disabled = false;
    btn.textContent = '진입하기 →';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ['login-name', 'login-cred'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });
  });
  renderExamIntro();
  window.addEventListener('resize', renderExamIntro);
  bootstrap();
});
