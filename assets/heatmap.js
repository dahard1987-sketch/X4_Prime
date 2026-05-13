function heatPct(value) {
  return value === null || value === undefined ? '-' : `${Math.round(value * 100)}%`;
}

function heatClass(value) {
  if (value === null || value === undefined) return 'hm-empty';
  if (value >= 0.8) return 'hm-good';
  if (value >= 0.6) return 'hm-watch';
  if (value >= 0.4) return 'hm-risk';
  return 'hm-danger';
}

function displayType(type) {
  return type === '함의' ? '함의 추론' : type;
}

function roundHeader(round) {
  if (round === 'Term Test') return '<span>Term Test</span><small>\'24 고2 학평</small>';
  return round;
}

function buildWeakTypes(typeSummary) {
  return new Set(Object.entries(typeSummary || {})
    .filter(([, v]) => v.attempted >= 3 && v.accuracy !== null && v.accuracy < 0.65)
    .map(([type]) => type));
}

function renderTypeSummary(typeSummary) {
  const entries = Object.entries(typeSummary || {})
    .sort((a, b) => (a[1].accuracy ?? 1) - (b[1].accuracy ?? 1));
  return entries.map(([type, v]) => `
    <div class="hm-type-chip${v.accuracy !== null && v.accuracy < 0.65 ? ' weak' : ''}">
      <span>${displayType(type)}</span>
      <strong>${heatPct(v.accuracy)}</strong>
      <small>${v.correct}/${v.attempted}</small>
    </div>
  `).join('');
}

function isTypeGroupStart(heatmap, index) {
  if (index === 0) return true;
  const current = heatmap.questionMeta[String(heatmap.questions[index])].area;
  const previous = heatmap.questionMeta[String(heatmap.questions[index - 1])].area;
  return current !== previous;
}

function typeGroupSpan(heatmap, index) {
  const current = heatmap.questionMeta[String(heatmap.questions[index])].area;
  let span = 1;
  for (let i = index + 1; i < heatmap.questions.length; i++) {
    if (heatmap.questionMeta[String(heatmap.questions[i])].area !== current) break;
    span++;
  }
  return span;
}

function renderClassReadingHeatmap(target, heatmap) {
  if (!target || !heatmap) return;
  const weakTypes = buildWeakTypes(heatmap.classTypeSummary);

  target.innerHTML = `
    <div class="hm-type-row">${renderTypeSummary(heatmap.classTypeSummary)}</div>
    <div class="hm-scroll">
      <table class="hm-table">
        <thead>
          <tr>
            <th class="hm-sticky-col">문항</th>
            <th>유형</th>
            ${heatmap.rounds.map(r => `<th class="${r === 'Term Test' ? 'hm-term-col' : ''}">${roundHeader(r)}</th>`).join('')}
            <th class="hm-total-col">누적 정답률</th>
          </tr>
        </thead>
        <tbody>
          ${heatmap.questions.map((q, index) => {
            const meta = heatmap.questionMeta[String(q)];
            const summary = heatmap.classQuestionSummary[String(q)];
            const isGroupStart = isTypeGroupStart(heatmap, index);
            return `
              <tr class="${meta.hard ? 'hm-hard-row' : ''}">
                <th class="hm-q hm-sticky-col">
                  <span>${q}</span>
                  ${meta.hard ? '<small>(고난도)</small>' : ''}
                </th>
                ${isGroupStart ? `<td class="hm-type${weakTypes.has(meta.area) ? ' weak' : ''}" rowspan="${typeGroupSpan(heatmap, index)}"><strong>${displayType(meta.area)}</strong></td>` : ''}
                ${heatmap.rounds.map(r => {
                  const cell = heatmap.classCells[r][String(q)];
                  const acc = cell.accuracy;
                  return `<td class="${r === 'Term Test' ? 'hm-term-col' : ''}"><span class="hm-cell ${heatClass(acc)}" title="${r} ${q}번: ${heatPct(acc)} (${cell.correct}/${cell.attempted})">${heatPct(acc)}</span></td>`;
                }).join('')}
                <td class="hm-total-col"><span class="hm-rate ${heatClass(summary.accuracy)}">${heatPct(summary.accuracy)}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function studentCellClass(value, typeStats) {
  if (value === null || value === undefined) return 'hm-empty';
  if (value) return 'hm-correct';
  const wrongRate = typeStats && typeStats.attempted ? typeStats.wrong / typeStats.attempted : 0.5;
  if (wrongRate >= 0.5) return 'hm-wrong-strong';
  if (wrongRate >= 0.3) return 'hm-wrong-mid';
  return 'hm-wrong-soft';
}

function isMissingRound(student, round) {
  return Array.isArray(student.missingRounds) && student.missingRounds.includes(round);
}

function renderStudentReadingHeatmap(target, heatmap, studentName) {
  if (!target || !heatmap) return;
  const student = heatmap.students[studentName];
  if (!student) {
    target.innerHTML = '<p class="lead">문항별 히트맵 데이터를 찾지 못했습니다.</p>';
    return;
  }
  const weakTypes = buildWeakTypes(student.typeSummary);

  target.innerHTML = `
    <div class="hm-type-row">${renderTypeSummary(student.typeSummary)}</div>
    <div class="hm-scroll">
      <table class="hm-table">
        <thead>
          <tr>
            <th class="hm-sticky-col">문항</th>
            <th>유형</th>
            ${heatmap.rounds.map(r => `<th class="${r === 'Term Test' ? 'hm-term-col' : ''}">${roundHeader(r)}</th>`).join('')}
            <th class="hm-total-col">본인 정답률</th>
          </tr>
        </thead>
        <tbody>
          ${heatmap.questions.map((q, index) => {
            const meta = heatmap.questionMeta[String(q)];
            const summary = student.questionSummary[String(q)];
            const typeStats = student.typeSummary[meta.area];
            const isGroupStart = isTypeGroupStart(heatmap, index);
            return `
              <tr class="${meta.hard ? 'hm-hard-row' : ''}">
                <th class="hm-q hm-sticky-col">
                  <span>${q}</span>
                  ${meta.hard ? '<small>(고난도)</small>' : ''}
                </th>
                ${isGroupStart ? `<td class="hm-type${weakTypes.has(meta.area) ? ' weak' : ''}" rowspan="${typeGroupSpan(heatmap, index)}"><strong>${displayType(meta.area)}</strong></td>` : ''}
                ${heatmap.rounds.map(r => {
                  const value = student.cells[r][String(q)];
                  const missing = isMissingRound(student, r);
                  const label = missing ? '미제출' : (value === null || value === undefined ? '-' : (value ? '정' : '오'));
                  const cls = missing ? 'hm-missing' : studentCellClass(value, typeStats);
                  return `<td class="${r === 'Term Test' ? 'hm-term-col' : ''}"><span class="hm-cell ${cls}" title="${r} ${q}번: ${label}">${label}</span></td>`;
                }).join('')}
                <td class="hm-total-col"><span class="hm-rate ${heatClass(summary.accuracy)}">${heatPct(summary.accuracy)}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}
