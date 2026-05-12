/* ------------------------------------------------------------
 * profile.js — student profile page.
 * Reads profile + class stats from sessionStorage (set by app.js login).
 * If missing, shows the auth wall.
 * ------------------------------------------------------------ */

function scoreToGrade(score, bands) {
  for (const b of bands) {
    if (score >= b.minScore) return b.grade;
  }
  return 9;
}

function logout() {
  sessionStorage.removeItem('canb_profile');
  sessionStorage.removeItem('canb_classStats');
  window.location.href = 'index.html';
}

function init() {
  const profileRaw = sessionStorage.getItem('canb_profile');
  const classRaw = sessionStorage.getItem('canb_classStats');
  if (!profileRaw || !classRaw) {
    document.getElementById('auth-wall').style.display = 'block';
    return;
  }
  const profile = JSON.parse(profileRaw);
  const classStats = JSON.parse(classRaw);
  document.getElementById('profile-content').style.display = 'block';
  renderProfile(profile, classStats);
}

function renderProfile(profile, classStats) {
  document.title = `${profile.name} · CANB English X4 Prime Term Test`;
  document.getElementById('sub-title').textContent = `${profile.name} · 성적 분석`;

  // Hero
  document.getElementById('ph-name').textContent = profile.name;
  document.getElementById('ph-grade').textContent = `${profile.grade}등급`;
  document.getElementById('ph-total').textContent = profile.total;
  document.getElementById('ph-reading').textContent = profile.reading;
  document.getElementById('ph-listening').textContent = profile.listening;

  renderPosition(profile, classStats);
  renderNational(profile, classStats);
  renderListeningDetail(profile);
  renderReadingDetail(profile, classStats);
  renderTrend(profile, classStats);
  renderWrongList(profile, classStats);
}

function renderPosition(profile, classStats) {
  const baseScores = classStats.scoreDistribution.slice();
  const scores = profile.isDemo ? baseScores.concat([profile.total]).sort((a, b) => b - a) : baseScores;
  const rank = scores.findIndex(s => s === profile.total) + 1;
  const n = baseScores.length;

  // Build chart data with student highlighted
  // Since there may be duplicate scores, we use position-by-rank: highlight the first match
  let highlighted = false;
  const data = scores.map((v, i) => {
    const isMe = (!highlighted && v === profile.total);
    if (isMe) highlighted = true;
    return { label: `S${String(i + 1).padStart(2, '0')}`, value: v, highlight: isMe };
  });
  renderBarChart(
    document.getElementById('chart-class-position'),
    data,
    { max: 100, mean: classStats.mean, height: 320 }
  );

  // Lead text
  const above = scores.filter(s => s > profile.total).length;
  const equal = scores.filter(s => s === profile.total).length;
  const diffFromMean = profile.total - classStats.mean;
  let msg = '';
  if (profile.isDemo) {
    msg = `예시 계정입니다. 이 학생은 실제 반 통계와 전체 평균에는 포함되지 않습니다. 표시 위치만 참고용으로 보여줍니다.`;
  } else
  if (above === 0) {
    msg = `반에서 가장 높은 점수입니다. (총 ${n}명)`;
  } else {
    msg = `반에서 ${above + 1}위`;
    if (equal > 1) msg += ` (동점 ${equal}명)`;
    msg += ` · 평균 ${classStats.mean.toFixed(1)}점 대비 ${diffFromMean >= 0 ? '+' : ''}${diffFromMean.toFixed(1)}점`;
  }
  document.getElementById('position-lead').textContent = msg;
}

function renderNational(profile, classStats) {
  const bands = classStats.high2.distribution;
  renderNationalCurve(
    document.getElementById('chart-national'),
    bands,
    profile.total,
    { height: 340 }
  );

  // Interpret position
  // Cumulative % at student's score
  const sorted = [...bands].sort((a, b) => a.minScore - b.minScore);
  let cum = 0;
  let myPct = 0;
  for (let i = 0; i < sorted.length; i++) {
    const lo = sorted[i].minScore;
    const hi = i < sorted.length - 1 ? sorted[i + 1].minScore : 100;
    if (profile.total >= lo && profile.total <= hi) {
      const within = hi > lo ? (profile.total - lo) / (hi - lo) : 0;
      myPct = cum + within * sorted[i].pct;
      break;
    }
    cum += sorted[i].pct;
  }
  const topPct = 100 - myPct;
  const myGrade = scoreToGrade(profile.total, bands);
  const totalHigh2 = bands.reduce((s, b) => s + b.count, 0);
  const lead = document.getElementById('national-lead');
  if (lead) lead.textContent = `${myGrade}등급 · 상위 약 ${topPct.toFixed(1)}%`; 
}

function renderListeningDetail(profile) {
  const ld = profile.listeningDetail;
  const allRounds = ['1회', '2회', '3회', '4회', '5회', '6회', '7회', '8회', '9회', '10회'];
  const roundMap = {};
  (ld.rounds || []).forEach(r => { roundMap[r.round] = r; });

  // Identify which rounds this student missed entirely. The history has all 10 rounds;
  // a "missed" round is one where the round simply isn't in ld.rounds.
  const histMap = {};
  (profile.roundHistory || []).forEach(r => { histMap[r.round] = r; });

  const grid = document.getElementById('round-grid');
  grid.innerHTML = allRounds.map(rn => {
    const r = roundMap[rn];
    if (r) {
      const acc = r.attempted > 0 ? r.correct / r.attempted : 0;
      const allBlank = r.blank === 17;
      const someBlank = r.blank > 0 && r.blank < 17;
      let cellCls = 'round-cell';
      let detail;
      if (allBlank || r.excluded || r.attempted === 0) {
        // 17/17 blank — excluded from the listening adjustment average.
        cellCls += ' miss';
        detail = '<span style="color:var(--magenta-deep);">전체 공란 · 평균 제외</span>';
        return `<div class="${cellCls}">
          <div class="rc-label">${rn}</div>
          <div class="rc-value">—</div>
          <div class="rc-detail">${detail}</div>
        </div>`;
      } else if (someBlank) {
        detail = `${r.correct}/${r.attempted} <span style="color:var(--magenta);">· 공란 ${r.blank}</span>`;
      } else {
        detail = `${r.correct}/${r.attempted}`;
      }
      return `<div class="${cellCls}">
        <div class="rc-label">${rn}</div>
        <div class="rc-value">${(acc * 100).toFixed(0)}<span style="font-size:14px; color:var(--ink-mute);">%</span></div>
        <div class="rc-detail">${detail}</div>
      </div>`;
    } else {
      return `<div class="round-cell miss">
        <div class="rc-label">${rn}</div>
        <div class="rc-value">—</div>
        <div class="rc-detail">미응시</div>
      </div>`;
    }
  }).join('');

  document.getElementById('lt-totals').textContent = `${ld.totalCorrect} / ${ld.totalAttempted}`;
  document.getElementById('lt-acc').textContent = `${(ld.accuracy * 100).toFixed(2)}%`;
  document.getElementById('lt-score').textContent = `${ld.score37} / 37`;
}

function renderReadingDetail(profile, classStats) {
  const studentHist = profile.roundHistory || [];
  const classHist = classStats.roundHistory || [];
  const sMap = {};
  studentHist.forEach(r => { sMap[r.round] = r; });

  const grid = document.getElementById('profile-reading-grid');
  if (!grid) return;

  const currentReadingAcc = profile.mt2ReadingAcc !== undefined
    ? profile.mt2ReadingAcc
    : profile.reading / classStats.maxReading;

  grid.innerHTML = classHist.map(cr => {
    const sr = sMap[cr.round];
    const pct = sr && sr.readingAcc !== null && sr.readingAcc !== undefined ? sr.readingAcc * 100 : null;
    return `<div class="round-cell${pct === null ? ' miss' : ''}">
      <div class="rc-label">${cr.round}</div>
      <div class="rc-value">${pct === null ? '—' : pct.toFixed(0) + '<span style="font-size:14px; color:var(--ink-mute);">%</span>'}</div>
      <div class="rc-detail">${pct === null ? '미응시' : '18-45 기준'}</div>
    </div>`;
  }).join('') + `<div class="round-cell">
    <div class="rc-label">이번 시험</div>
    <div class="rc-value">${(currentReadingAcc * 100).toFixed(0)}<span style="font-size:14px; color:var(--ink-mute);">%</span></div>
    <div class="rc-detail">${profile.reading} / ${classStats.maxReading}</div>
  </div>`;

  const valid = studentHist
    .map(r => r.readingAcc)
    .filter(v => v !== null && v !== undefined);
  const prevAvg = valid.length ? valid.reduce((sum, v) => sum + v, 0) / valid.length : null;
  const current = currentReadingAcc;
  const change = prevAvg === null ? null : current - prevAvg;

  document.getElementById('prd-prev-avg').textContent = prevAvg === null ? '—' : `${(prevAvg * 100).toFixed(1)}%`;
  document.getElementById('prd-current-avg').textContent = `${(current * 100).toFixed(1)}%`;
  document.getElementById('prd-change').textContent = change === null ? '—' : `${change >= 0 ? '+' : ''}${(change * 100).toFixed(1)}%p`;
}

function renderTrend(profile, classStats) {
  const studentHist = profile.roundHistory || [];
  const classHist = classStats.roundHistory || [];

  const labels = classHist.map(r => r.round).concat(['X4 Prime Term Test']);

  // Per-round lookup
  const sMap = {}, cMap = {};
  studentHist.forEach(r => { sMap[r.round] = r; });
  classHist.forEach(r => { cMap[r.round] = r; });

  const studentReading = [];
  const studentListening = [];
  const classReading = [];
  const classListening = [];

  classHist.forEach((cr, i) => {
    const sr = sMap[cr.round];
    studentReading.push({ x: i, y: sr && sr.readingAcc !== null ? +(sr.readingAcc * 100).toFixed(1) : null });
    studentListening.push({ x: i, y: sr && sr.listeningAcc !== null ? +(sr.listeningAcc * 100).toFixed(1) : null });
    classReading.push({ x: i, y: cr.classReadingAvg !== null ? +(cr.classReadingAvg * 100).toFixed(1) : null });
    classListening.push({ x: i, y: cr.classListeningAvg !== null ? +(cr.classListeningAvg * 100).toFixed(1) : null });
  });
  // Append X4 Prime Term Test (this test)
  const mt2X = classHist.length;
  const mt2StudentListening = classStats.maxListening
    ? +(profile.listening / classStats.maxListening * 100).toFixed(1)
    : null;
  const mt2ClassListening = classStats.maxListening
    ? +(classStats.listeningMean / classStats.maxListening * 100).toFixed(1)
    : null;
  studentReading.push({ x: mt2X, y: profile.mt2ReadingAcc !== undefined ? +(profile.mt2ReadingAcc * 100).toFixed(1) : null });
  studentListening.push({ x: mt2X, y: mt2StudentListening });
  classReading.push({ x: mt2X, y: classStats.mt2ClassReadingAvg ? +(classStats.mt2ClassReadingAvg * 100).toFixed(1) : null });
  classListening.push({ x: mt2X, y: mt2ClassListening });

  renderLineChart(
    document.getElementById('chart-trend'),
    [
      { name: '본인 독해', color: CHART_COLORS.magenta, thick: true, data: studentReading },
      { name: '반 평균 독해', color: CHART_COLORS.inkFaint, data: classReading },
      { name: '본인 듣기', color: CHART_COLORS.purple, thick: true, data: studentListening },
      { name: '반 평균 듣기', color: CHART_COLORS.inkFaint, dashed: true, legendDashed: true, data: classListening },
    ],
    { xLabels: labels, yMin: 0, yMax: 100, height: 360 }
  );
}

function renderWrongList(profile, classStats) {
  const wrap = document.getElementById('wrong-list');
  if (!profile.wrong || profile.wrong.length === 0) {
    wrap.innerHTML = `<p class="lead">틀린 문제가 없습니다. 완벽한 결과예요!</p>`;
    return;
  }

  // Sort by question number
  const wrong = [...profile.wrong].sort((a, b) => a.q - b.q);

  wrap.innerHTML = wrong.map(w => {
    const qStat = classStats.questionStats[w.q] || {};
    const classAccPct = qStat.classAccuracy !== undefined ? (qStat.classAccuracy * 100).toFixed(0) : '—';
    return `
      <div class="q-card">
        <div class="q-header">
          <div class="q-num">문항 ${w.q}</div>
          <div style="display:flex; gap:12px; align-items:center;">
            <span class="caption">반 정답률 ${classAccPct}%</span>
            <span class="q-points">${w.points}점</span>
          </div>
        </div>
        <div class="q-image">
          <img src="images/questions/q${w.q}.jpg" alt="문항 ${w.q}" loading="lazy">
        </div>
        <div class="q-answers">
          <div class="q-answer-box your">
            <div class="qa-label">본인 답</div>
            <div class="qa-value">${w.answer}</div>
          </div>
          <div class="q-answer-box correct">
            <div class="qa-label">정답</div>
            <div class="qa-value">${w.correct}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', init);
