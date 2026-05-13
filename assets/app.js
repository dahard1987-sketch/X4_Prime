/* ------------------------------------------------------------
 * app.js — index page (class overview + login).
 * ------------------------------------------------------------ */

let CLASS_STATS = null;
let ENC_PROFILES = null;

const DEMO_PROFILE = {
  isDemo: true,
  name: '김캔비',
  grade: 3,
  total: 74,
  reading: 38,
  listening: 36,
  mt2ReadingAcc: 38 / 63,
  listeningDetail: {
    totalCorrect: 162,
    totalAttempted: 170,
    accuracy: 162 / 170,
    score37: 36,
    rounds: [
      { round: '1회', correct: 16, attempted: 17, blank: 0 },
      { round: '2회', correct: 17, attempted: 17, blank: 0 },
      { round: '3회', correct: 16, attempted: 17, blank: 0 },
      { round: '4회', correct: 17, attempted: 17, blank: 0 },
      { round: '5회', correct: 16, attempted: 17, blank: 0 },
      { round: '6회', correct: 15, attempted: 17, blank: 0 },
      { round: '7회', correct: 17, attempted: 17, blank: 0 },
      { round: '8회', correct: 16, attempted: 17, blank: 0 },
      { round: '9회', correct: 16, attempted: 17, blank: 0 },
      { round: '10회', correct: 16, attempted: 17, blank: 0 },
    ],
  },
  roundHistory: [
    { round: '1회', readingAcc: 0.64, listeningAcc: 16 / 17 },
    { round: '2회', readingAcc: 0.71, listeningAcc: 1 },
    { round: '3회', readingAcc: 0.75, listeningAcc: 16 / 17 },
    { round: '4회', readingAcc: 0.79, listeningAcc: 1 },
    { round: '5회', readingAcc: 0.82, listeningAcc: 16 / 17 },
    { round: '6회', readingAcc: 0.75, listeningAcc: 15 / 17 },
    { round: '7회', readingAcc: 0.86, listeningAcc: 1 },
    { round: '8회', readingAcc: 0.79, listeningAcc: 16 / 17 },
    { round: '9회', readingAcc: 0.82, listeningAcc: 16 / 17 },
    { round: '10회', readingAcc: 0.86, listeningAcc: 16 / 17 },
  ],
  wrong: [
    { q: 21, answer: 5, correct: 4, points: 2 },
    { q: 24, answer: 2, correct: 3, points: 2 },
    { q: 30, answer: 2, correct: 4, points: 3 },
    { q: 32, answer: 4, correct: 1, points: 2 },
    { q: 33, answer: 3, correct: 2, points: 3 },
    { q: 36, answer: 1, correct: 2, points: 2 },
    { q: 37, answer: 3, correct: 5, points: 3 },
    { q: 39, answer: 2, correct: 5, points: 2 },
    { q: 40, answer: 5, correct: 1, points: 3 },
    { q: 41, answer: 4, correct: 5, points: 2 },
    { q: 42, answer: 5, correct: 4, points: 3 },
    { q: 45, answer: 4, correct: 2, points: 2 },
  ],
};


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

async function bootstrap() {
  // Load class stats
  try {
    const res = await fetch('data/class_stats.json');
    CLASS_STATS = await res.json();
  } catch (e) {
    console.warn('Fetch failed for class_stats.json, falling back to embedded data', e);
    if (window.__CLASS_STATS__) {
      CLASS_STATS = window.__CLASS_STATS__;
    } else {
      showDataLoadError('데이터를 불러오지 못했습니다. 가능하면 run_local_server.bat 또는 run_local_server.command로 실행해 주세요.');
      return;
    }
  }
  renderKPIs();
  renderDistribution();
  renderGrades();
  renderListeningTrend();
  renderReadingRounds();
  renderClassReadingHeatmap(
    document.getElementById('class-reading-heatmap'),
    window.__READING_HEATMAP__
  );
  renderHardQuestions();

  // Pre-fetch encrypted profiles (small, ~60 KB)
  try {
    const res = await fetch('data/profiles.enc.json');
    ENC_PROFILES = await res.json();
  } catch (e) {
    console.warn('Fetch failed for profiles.enc.json, falling back to embedded data', e);
    ENC_PROFILES = window.__ENC_PROFILES__ || null;
  }
}

function renderKPIs() {
  const s = CLASS_STATS;
  document.getElementById('kpi-mean').textContent = s.mean.toFixed(1);
  document.getElementById('kpi-range').textContent = `${s.max} / ${s.min}`;
  document.getElementById('kpi-spread').textContent = `격차 ${s.max - s.min}점 · 표준편차 ${s.stdev}`;
  document.getElementById('kpi-reading').textContent = s.readingMean.toFixed(1);
  document.getElementById('kpi-reading-pct').textContent = `정답률 ${(s.readingMean / s.maxReading * 100).toFixed(1)}%`;
  document.getElementById('kpi-listening').textContent = s.listeningMean.toFixed(1);
}

function renderDistribution() {
  const scores = CLASS_STATS.scoreDistribution;
  const data = scores.map((v, i) => ({ label: `S${String(i + 1).padStart(2, '0')}`, value: v }));
  renderBarChart(
    document.getElementById('chart-distribution'),
    data,
    { max: 100, mean: CLASS_STATS.mean, height: 320, valueSuffix: '' }
  );
}

function renderGrades() {
  const classCounts = CLASS_STATS.classGradeCounts || {};
  const n = CLASS_STATS.numStudents;
  const dist = CLASS_STATS.high2.distribution;
  // Build groups in grade order 1..9
  const groups = dist.map(d => {
    const classPct = ((classCounts[d.grade] || 0) / n) * 100;
    return { label: `${d.grade}등급`, values: [classPct, d.pct] };
  });
  renderGroupedBars(
    document.getElementById('chart-grades'),
    groups,
    [
      { name: '26SP X4 (12명)', color: CHART_COLORS.magenta },
      { name: '2024 고2 전국', color: CHART_COLORS.inkFaint },
    ],
    { yMax: null, yFormat: v => v + '%' }
  );

  // Table summary (placed inside chart-card so uses ink colors, not on-dark)
  const wrap = document.getElementById('grade-table');
  let html = `<table style="width:100%; border-collapse:collapse; color:var(--ink); font-size:14px;">
    <thead>
      <tr style="border-bottom:1px solid var(--hairline);">
        <th style="text-align:left; padding:12px 8px; font-weight:500; color:var(--ink-mute); font-size:12px; letter-spacing:0.06em; text-transform:uppercase;">등급</th>
        <th style="text-align:right; padding:12px 8px; font-weight:500; color:var(--ink-mute); font-size:12px; letter-spacing:0.06em; text-transform:uppercase;">점수 컷</th>
        <th style="text-align:right; padding:12px 8px; font-weight:500; color:var(--ink-mute); font-size:12px; letter-spacing:0.06em; text-transform:uppercase;">26SP X4</th>
        <th style="text-align:right; padding:12px 8px; font-weight:500; color:var(--ink-mute); font-size:12px; letter-spacing:0.06em; text-transform:uppercase;">고2 전국</th>
      </tr>
    </thead>
    <tbody>`;
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

function renderListeningTrend() {
  const rounds = CLASS_STATS.roundHistory;
  const labels = rounds.map(r => r.round);
  labels.push("'24 고2 학평");

  const readingSeries = {
    name: '독해 (반 평균)',
    color: CHART_COLORS.magenta,
    thick: true,
    data: rounds.map((r, i) => ({ x: i, y: r.classReadingAvg !== null ? +(r.classReadingAvg * 100).toFixed(1) : null })),
  };
  readingSeries.data.push({ x: rounds.length, y: CLASS_STATS.mt2ClassReadingAvg ? +(CLASS_STATS.mt2ClassReadingAvg * 100).toFixed(1) : null });

  const listeningRoundData = rounds.map((r, i) => ({ x: i, y: r.classListeningAvg !== null ? +(r.classListeningAvg * 100).toFixed(1) : null }));
  const finalListeningPct = CLASS_STATS.maxListening ? +((CLASS_STATS.listeningMean / CLASS_STATS.maxListening) * 100).toFixed(1) : null;

  const listeningSeries = {
    name: '듣기 (반 평균)',
    color: CHART_COLORS.purple,
    data: listeningRoundData.concat([{ x: rounds.length, y: null }]),
  };

  const lastListening = listeningRoundData.length ? listeningRoundData[listeningRoundData.length - 1].y : null;
  const listeningBridge = {
    name: '듣기 (반 평균)',
    color: CHART_COLORS.purple,
    data: Array.from({ length: rounds.length - 1 }, (_, i) => ({ x: i, y: null }))
      .concat([{ x: rounds.length - 1, y: lastListening }, { x: rounds.length, y: finalListeningPct }]),
    dashedSegments: [{ from: rounds.length - 1, to: rounds.length }],
    showInLegend: false,
  };

  renderLineChart(
    document.getElementById('chart-class-trend'),
    [listeningSeries, listeningBridge, readingSeries],
    { xLabels: labels, yMin: 0, yMax: 100, height: 320 }
  );
}

function renderReadingRounds() {
  const rounds = CLASS_STATS.roundHistory || [];
  const grid = document.getElementById('reading-grid');
  if (!grid) return;

  const current = CLASS_STATS.mt2ClassReadingAvg !== undefined
    ? CLASS_STATS.mt2ClassReadingAvg
    : CLASS_STATS.readingMean / CLASS_STATS.maxReading;

  grid.innerHTML = rounds.map(r => {
    const pct = r.classReadingAvg !== null && r.classReadingAvg !== undefined ? r.classReadingAvg * 100 : null;
    return `<div class="round-cell">
      <div class="rc-label">${r.round}</div>
      <div class="rc-value">${pct === null ? '—' : pct.toFixed(0) + '<span style="font-size:14px; color:var(--ink-mute);">%</span>'}</div>
      <div class="rc-detail">${r.numReadingContrib || 0}명 반영</div>
    </div>`;
  }).join('') + `<div class="round-cell final-test">
    <div class="rc-label">'24 고2 학평</div>
    <div class="rc-value">${(current * 100).toFixed(0)}<span style="font-size:14px; color:var(--ink-mute);">%</span></div>
    <div class="rc-detail">18-45 기준</div>
  </div>`;

  const valid = rounds
    .map(r => r.classReadingAvg)
    .filter(v => v !== null && v !== undefined);
  const prevAvg = valid.reduce((sum, v) => sum + v, 0) / valid.length;
  const change = current - prevAvg;

  document.getElementById('rd-prev-avg').textContent = `${(prevAvg * 100).toFixed(1)}%`;
  document.getElementById('rd-current-avg').textContent = `${(current * 100).toFixed(1)}%`;
  document.getElementById('rd-change').textContent = `${change >= 0 ? '+' : ''}${(change * 100).toFixed(1)}%p`;
}

function renderHardQuestions() {
  const stats = CLASS_STATS.questionStats;
  const items = Object.keys(stats).map(q => ({
    q: parseInt(q),
    ...stats[q],
  }));
  // Sort by accuracy ascending → hardest first
  items.sort((a, b) => a.classAccuracy - b.classAccuracy);
  const top = items.slice(0, 5);

  const wrap = document.getElementById('hard-questions');
  wrap.innerHTML = top.map(item => {
    const distEntries = Object.entries(item.answerDistribution)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    const distBar = distEntries.map(([ans, count]) => {
      const isCorrect = parseInt(ans) === item.correctAnswer;
      const pct = (count / CLASS_STATS.numStudents) * 100;
      return `
        <div style="flex:1; text-align:center;">
          <div style="height:80px; display:flex; flex-direction:column-reverse;">
            <div style="height:${pct}%; background:${isCorrect ? 'var(--magenta)' : 'rgba(0,0,0,0.12)'}; border-radius:2px 2px 0 0; min-height:2px;" title="${count}명"></div>
          </div>
          <div style="margin-top:6px; font-size:13px; color:${isCorrect ? 'var(--magenta)' : 'var(--ink-mute)'}; font-weight:${isCorrect ? '600' : '400'};">${ans}</div>
          <div style="font-size:11px; color:var(--ink-faint);">${count}명</div>
        </div>`;
    }).join('');

    return `
      <details class="q-card" style="margin-bottom:16px;">
        <summary style="list-style:none; cursor:pointer; padding:24px 32px; display:flex; align-items:center; justify-content:space-between; background:var(--canvas);">
          <div style="display:flex; align-items:baseline; gap:24px;">
            <div style="font-family:var(--font-display); font-size:42px; line-height:1; color:var(--magenta);">${item.q}</div>
            <div>
              <div style="font-size:13px; color:var(--ink-mute); letter-spacing:0.04em; text-transform:uppercase; margin-bottom:4px;">반 정답률</div>
              <div style="font-family:var(--font-display); font-size:28px; line-height:1;">${(item.classAccuracy * 100).toFixed(0)}<span style="font-family:var(--font-body); font-size:16px; color:var(--ink-mute);">%</span></div>
            </div>
            <div>
              <div style="font-size:13px; color:var(--ink-mute); letter-spacing:0.04em; text-transform:uppercase; margin-bottom:4px;">정답</div>
              <div style="font-family:var(--font-display); font-size:28px; line-height:1; color:var(--magenta);">${item.correctAnswer}</div>
            </div>
            <div>
              <div style="font-size:13px; color:var(--ink-mute); letter-spacing:0.04em; text-transform:uppercase; margin-bottom:4px;">배점</div>
              <div style="font-family:var(--font-display); font-size:28px; line-height:1;">${item.points}<span style="font-family:var(--font-body); font-size:16px; color:var(--ink-mute);">점</span></div>
            </div>
          </div>
          <div style="font-size:13px; color:var(--ink-mute);">펼치기 ▾</div>
        </summary>
        <div style="padding:0 32px 32px 32px;">
          <div style="margin-bottom:24px;">
            <div style="font-size:13px; color:var(--ink-mute); letter-spacing:0.04em; text-transform:uppercase; margin-bottom:12px;">반 응답 분포</div>
            <div style="display:flex; gap:8px; align-items:flex-end;">${distBar}</div>
          </div>
          <div>
            <div style="font-size:13px; color:var(--ink-mute); letter-spacing:0.04em; text-transform:uppercase; margin-bottom:12px;">문항</div>
            <img src="images/questions/q${item.q}.jpg" alt="문항 ${item.q}" style="width:100%; max-width:680px; border-radius:8px; box-shadow:var(--shadow-product);">
          </div>
        </div>
      </details>`;
  }).join('');
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

    const profile = isDemoLogin
      ? DEMO_PROFILE
      : await unlockProfile(ENC_PROFILES, name, cred);
    // Stash in sessionStorage, then navigate
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

// Enter key submits
document.addEventListener('DOMContentLoaded', () => {
  ['login-name', 'login-cred'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });
  });
  bootstrap();
});
