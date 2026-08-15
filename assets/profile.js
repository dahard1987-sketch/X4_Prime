/* ------------------------------------------------------------
 * profile.js — student profile page.
 * 26여름학기 X4 프라임 리포트
 * Reads profile + class stats from sessionStorage (set by app.js login).
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
  sessionStorage.removeItem('canb_admin');
  sessionStorage.removeItem('canb_adminProfiles');
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
  initScrollTopButton();
  initAdminSwitcher(classStats);
  renderProfile(profile, classStats);
}

function getAdminProfiles() {
  const raw = sessionStorage.getItem('canb_adminProfiles');
  if (raw) return JSON.parse(raw);
  return (window.__ADMIN_PROFILES__ && window.__ADMIN_PROFILES__.profiles) || [];
}

function initAdminSwitcher(classStats) {
  if (sessionStorage.getItem('canb_admin') !== '1') return;
  document.body.classList.add('admin-mode');
  updateProfileHeaderCaption();
  const wrap = document.getElementById('admin-switcher');
  const select = document.getElementById('admin-student-select');
  if (!wrap || !select) return;

  const profiles = getAdminProfiles();
  const current = JSON.parse(sessionStorage.getItem('canb_profile'));
  wrap.style.display = 'flex';
  select.innerHTML = profiles.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
  select.value = current.name;
  select.onchange = () => {
    const next = profiles.find(p => p.name === select.value);
    if (!next) return;
    sessionStorage.setItem('canb_profile', JSON.stringify(next));
    renderProfile(next, classStats);
  };
}

function updateProfileHeaderCaption() {
  const caption = document.getElementById('test-caption');
  if (!caption) return;
  const shouldShorten = document.body.classList.contains('admin-mode')
    && window.matchMedia && window.matchMedia('(max-width: 480px)').matches;
  caption.textContent = shouldShorten ? caption.dataset.short : caption.dataset.full;
}

function initScrollTopButton() {
  const button = document.getElementById('scroll-top-button');
  if (!button || button.dataset.ready === '1') return;
  button.dataset.ready = '1';
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function renderProfile(profile, classStats) {
  document.title = `${profile.name} · CANB English X4 프라임 리포트`;
  document.getElementById('sub-title').textContent = `${profile.name} · 성적 분석`;
  if (!profile.grade) profile.grade = scoreToGrade(profile.mainExam.total, classStats.high2.distribution);
  const adminSelect = document.getElementById('admin-student-select');
  if (adminSelect && adminSelect.value !== profile.name) adminSelect.value = profile.name;

  document.getElementById('ph-name').textContent = profile.name;
  document.getElementById('ph-grade').textContent = `${profile.grade}등급`;
  document.getElementById('ph-total').textContent = profile.mainExam.total;
  document.getElementById('ph-reading').textContent = profile.mainExam.reading;
  document.getElementById('ph-listening').textContent = profile.mainExam.listening;

  renderTermComment(profile);
  renderPosition(profile, classStats);
  renderNational(profile, classStats);
  renderListeningDetail(profile);
  renderListeningWrongList(profile, classStats);
  renderReadingTrend(profile, classStats);
  renderStudentReadingHeatmap(document.getElementById('student-reading-heatmap'), window.__READING_HEATMAP__, profile.name);
  renderWrongList(profile, classStats);
}

function renderTermComment(profile) {
  const card = document.getElementById('term-comment-card');
  const nativeEl = document.getElementById('native-comment');
  const koreanEl = document.getElementById('korean-comment');
  const koreanItem = document.getElementById('korean-comment-item');
  if (!card || !nativeEl || !koreanEl) return;

  const comment = profile.termComment;
  if (!comment || (!comment.native && !comment.korean)) {
    card.style.display = 'none';
    return;
  }

  nativeEl.textContent = comment.native || '작성 예정입니다.';
  if (comment.korean) {
    koreanEl.textContent = comment.korean;
    koreanItem.classList.remove('pending');
  } else {
    koreanEl.textContent = '이번 학기 총평은 곧 업데이트됩니다.';
    koreanItem.classList.add('pending');
  }
  card.style.display = 'block';
}

function renderPosition(profile, classStats) {
  const baseScores = classStats.mainExam.scoreDistribution.slice();
  const total = profile.mainExam.total;
  const scores = profile.isDemo ? baseScores.concat([total]).sort((a, b) => b - a) : baseScores;

  const legacyTotal = profile.legacy ? profile.legacy.total : null;
  let highlighted = false;
  const data = scores.map((v, i) => {
    const isMe = (!highlighted && v === total);
    if (isMe) highlighted = true;
    return {
      label: isMe ? profile.name : `#${i + 1}`, value: v, highlight: isMe,
      legacyValue: isMe ? legacyTotal : null,
    };
  });
  renderBarChart(document.getElementById('chart-class-position'), data, { max: 100, mean: classStats.mainExam.mean, height: 320 });

  const compareEl = document.getElementById('position-compare');
  if (compareEl) {
    if (legacyTotal !== null && !profile.isDemo) {
      const delta = total - legacyTotal;
      compareEl.innerHTML = `이번 학기 <strong>${total}점</strong> · 봄학기 <strong>${legacyTotal}점</strong> · <strong style="color:${delta >= 0 ? 'var(--green)' : 'var(--magenta)'}">${delta >= 0 ? '+' : ''}${delta}점</strong>`;
      compareEl.style.display = 'block';
    } else {
      compareEl.style.display = 'none';
    }
  }
}

function renderNational(profile, classStats) {
  const bands = classStats.high2.distribution;
  const total = profile.mainExam.total;
  renderNationalCurve(document.getElementById('chart-national'), bands, total, { height: 340 });

  const sorted = [...bands].sort((a, b) => a.minScore - b.minScore);
  let cum = 0, myPct = 0;
  for (let i = 0; i < sorted.length; i++) {
    const lo = sorted[i].minScore;
    const hi = i < sorted.length - 1 ? sorted[i + 1].minScore : 100;
    if (total >= lo && total <= hi) {
      const within = hi > lo ? (total - lo) / (hi - lo) : 0;
      myPct = cum + within * sorted[i].pct;
      break;
    }
    cum += sorted[i].pct;
  }
  const topPct = 100 - myPct;
  const myGrade = scoreToGrade(total, bands);
  const lead = document.getElementById('national-lead');
  if (lead) lead.textContent = `${myGrade}등급 · 상위 약 ${topPct.toFixed(1)}%`;
}

/* ----------------------------------------------------------------
 * 듣기 상세 — 이번 학기엔 메인 시험(17문항)만 존재. 후반부(8~17)는
 * 별도 표시. 지난 학기 듣기 기록이 있으면 비교 라인으로 함께 보여준다.
 * ---------------------------------------------------------------- */
function renderListeningDetail(profile) {
  const ld = profile.mainExam.listeningDetail;
  const wrongNums = new Set((profile.mainExam.wrong || []).filter(w => w.section === 'listening').map(w => w.num));
  const grid = document.getElementById('round-grid');

  const cells = [];
  for (let n = 1; n <= 17; n++) {
    const wrong = wrongNums.has(n);
    const cls = wrong ? 'round-cell is-wrong' : 'round-cell is-correct';
    cells.push(`<div class="${cls}">
      <div class="rc-label">${n}번</div>
      <div class="rc-value">${wrong ? '오답' : '정답'}</div>
    </div>`);
  }
  grid.innerHTML = cells.join('');

  document.getElementById('lt-totals').textContent = `${ld.totalCorrect} / ${ld.totalAttempted}`;
  document.getElementById('lt-acc').textContent = ld.accuracy !== null ? `${(ld.accuracy * 100).toFixed(1)}%` : '—';
  document.getElementById('lt-score').textContent = `${profile.mainExam.listening} / 37`;

  const legacyNote = document.getElementById('lt-legacy-note');
  if (legacyNote) {
    if (profile.legacy && profile.legacy.listeningDetail) {
      const la = profile.legacy.listeningDetail.accuracy;
      legacyNote.textContent = `지난 학기 듣기 정답률 ${(la * 100).toFixed(1)}% (숙제 기반) → 이번 학기 메인 시험 ${ld.accuracy !== null ? (ld.accuracy * 100).toFixed(1) : '—'}%`;
      legacyNote.style.display = 'block';
    } else {
      legacyNote.style.display = 'none';
    }
  }
}

/* ----------------------------------------------------------------
 * 회차별 정답률 추이 — 고1 미니(형식 비교) + 고2(앵커드 트렌드), 개인화.
 * ---------------------------------------------------------------- */
function renderReadingTrend(profile, classStats) {
  // 고1 모의고사: 지난 학기 풀 모의고사 vs 이번 학기 미니 모의고사 비교
  const legacyRounds = (profile.legacy && profile.legacy.roundHistory) || [];
  const miniRounds = profile.mini ? profile.mini.rounds : [];
  const classLegacyByRound = {};
  (classStats.legacyGrade1Full.roundHistory || []).forEach(r => { classLegacyByRound[r.round] = r.classReadingAvg; });
  const classMiniByRound = {};
  (classStats.grade1Mini.rounds || []).forEach(r => { classMiniByRound[r.round] = r.classAcc; });

  const legacyGrid = document.getElementById('profile-mini-legacy-grid');
  if (legacyGrid) {
    legacyGrid.innerHTML = legacyRounds.length ? legacyRounds.map(r =>
      renderAccCell(r.round, r.readingAcc, classDetail(classLegacyByRound[r.round]))
    ).join('') : '<p class="lead">지난 학기 기록이 없습니다.</p>';
  }
  const miniGrid = document.getElementById('profile-mini-current-grid');
  if (miniGrid) {
    miniGrid.innerHTML = miniRounds.map(r =>
      renderAccCell(r.round, r.acc, classDetail(classMiniByRound[r.round]))
    ).join('');
  }
  const legacyValid = legacyRounds.map(r => r.readingAcc).filter(v => v !== null && v !== undefined);
  const miniValid = miniRounds.map(r => r.acc).filter(v => v !== null && v !== undefined);
  if (legacyValid.length && miniValid.length) {
    const legacyAvg = legacyValid.reduce((s, v) => s + v, 0) / legacyValid.length;
    const miniAvg = miniValid.reduce((s, v) => s + v, 0) / miniValid.length;
    const change = miniAvg - legacyAvg;
    document.getElementById('prd-prev-avg').textContent = `${(legacyAvg * 100).toFixed(1)}%`;
    document.getElementById('prd-current-avg').textContent = `${(miniAvg * 100).toFixed(1)}%`;
    const changeEl = document.getElementById('prd-change');
    changeEl.textContent = `${change >= 0 ? '+' : ''}${(change * 100).toFixed(1)}%p`;
    changeEl.style.color = change >= 0 ? 'var(--green)' : 'var(--magenta)';
  }

  // 고2 모의고사: 지난 학기 최종 학평 → 이번 학기 10회 → 메인 시험 (카드로 표시)
  const baseline = profile.legacy ? profile.legacy.mt2ReadingAcc : null;
  const go2Rounds = profile.go2 ? profile.go2.rounds : [];
  const mainAcc = profile.mainExam.readingAcc;
  const go2Grid = document.getElementById('profile-go2-grid');
  if (go2Grid) {
    const classBaseline = classStats.legacyGo2Baseline.mt2ClassReadingAvg;
    const classGo2ByRound = {};
    (classStats.grade2Go2.rounds || []).forEach(r => { classGo2ByRound[r.round] = r.classAcc; });
    const classMainAcc = classStats.mainExam.readingMean / classStats.mainExam.maxReading;

    const baselineCell = renderAccCell('26봄학기 평가시험(고2)', baseline, classDetail(classBaseline));
    const roundCells = go2Rounds.map(r => renderAccCell(r.round, r.acc, classDetail(classGo2ByRound[r.round]))).join('');
    const mainCell = renderAccCell('메인 시험', mainAcc, classDetail(classMainAcc), 'final-test');
    go2Grid.innerHTML = baselineCell + roundCells + mainCell;
  }
}

function classDetail(classAcc) {
  return classAcc === null || classAcc === undefined ? '반 평균 —' : `반 평균 ${(classAcc * 100).toFixed(0)}%`;
}

/* ----------------------------------------------------------------
 * 오답 분석 — 메인 시험 듣기 + 독해 오답, 실제 문항 텍스트/스크립트 포함.
 * ---------------------------------------------------------------- */
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
    if (esc && escaped.includes(esc)) escaped = escaped.split(esc).join(`<mark class="q-highlight">${esc}</mark>`);
  });
  (item && item.underline || []).forEach(phrase => {
    const esc = escapeHtml(phrase);
    if (esc && escaped.includes(esc)) escaped = escaped.split(esc).join(`<u class="q-underline">${esc}</u>`);
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

function buildWrongCard(w, classStats) {
  const qStat = classStats.mainExam.questionStats[w.num] || {};
  const classAccPct = qStat.classAccuracy !== undefined ? (qStat.classAccuracy * 100).toFixed(0) : '—';
  const item = findExamItem(w.num);
  const passage = item ? resolvePassage(item, w.section) : '';
  const choicesHtml = item && !item.isImageQuestion ? item.choices.map((c, i) => {
    const n = i + 1;
    let cls = '';
    if (n === w.correct) cls += ' is-correct';
    if (n === w.answer) cls += ' is-mine';
    return `<li class="${cls.trim()}"><span class="qc-num">${n}</span><span>${c}</span></li>`;
  }).join('') : '<li style="color:var(--ink-faint);">그림 자료 문제입니다.</li>';

  return `
    <div class="q-card">
      <div class="q-header">
        <div class="q-num">${w.section === 'listening' ? '듣기' : '독해'} ${w.num}번</div>
        <div style="display:flex; gap:12px; align-items:center;">
          <span class="caption">반 정답률 ${classAccPct}%</span>
          <span class="q-points">${w.points}점</span>
        </div>
      </div>
      ${renderInsertSentenceBox(item)}
      <div class="q-passage${w.section === 'listening' ? ' q-script' : ''}">${escapeHtml(item ? item.stem : w.type)}\n\n${formatPassageHtml(passage, item)}</div>
      <ul class="q-choices">${choicesHtml}</ul>
    </div>`;
}

function renderListeningWrongList(profile, classStats) {
  const wrap = document.getElementById('listening-wrong-list');
  if (!wrap) return;
  const wrong = (profile.mainExam.wrong || []).filter(w => w.section === 'listening').sort((a, b) => a.num - b.num);
  if (wrong.length === 0) {
    wrap.innerHTML = '<p class="lead">듣기 오답 없음</p>';
    return;
  }
  wrap.innerHTML = '<div class="q-grid">' + wrong.map(w => buildWrongCard(w, classStats)).join('') + '</div>';
}

function renderWrongList(profile, classStats) {
  const wrap = document.getElementById('wrong-list');
  const wrong = (profile.mainExam.wrong || []).filter(w => w.section !== 'listening').sort((a, b) => a.num - b.num);
  if (wrong.length === 0) {
    wrap.innerHTML = '<p class="lead">오답 없음</p>';
    return;
  }
  wrap.innerHTML = '<div class="q-grid">' + wrong.map(w => buildWrongCard(w, classStats)).join('') + '</div>';
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', updateProfileHeaderCaption);
