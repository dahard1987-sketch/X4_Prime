/* ------------------------------------------------------------
 * charts.js — small SVG chart helpers.
 * No deps. All return SVG strings; callers inject into a container.
 * Uses CSS variables so colors stay in sync with the design system.
 * ------------------------------------------------------------ */

const CHART_COLORS = {
  magenta: '#b91170',
  magentaBright: '#d11782',
  magentaSoft: 'rgba(185, 17, 112, 0.18)',
  magentaFaint: 'rgba(185, 17, 112, 0.08)',
  ink: '#1d1d1f',
  inkMute: '#4f5562',
  inkFaint: '#707783',
  hairline: '#e0e0e0',
  divider: 'rgba(0, 0, 0, 0.06)',
  purple: '#7b2da4',
  amber: '#c87a00',
};

function svgEl(tag, attrs, children) {
  const parts = [`<${tag}`];
  for (const k in attrs) {
    if (attrs[k] === null || attrs[k] === undefined) continue;
    parts.push(` ${k}="${String(attrs[k]).replace(/"/g, '&quot;')}"`);
  }
  if (children === undefined) {
    parts.push(' />');
  } else {
    parts.push('>');
    parts.push(children);
    parts.push(`</${tag}>`);
  }
  return parts.join('');
}

/* ----------------------------------------------------------------
   Bar chart — anonymous class score distribution.
     data: [{label, value, highlight?}]
     options: { max, mean, height, valueSuffix }
 ---------------------------------------------------------------- */
function renderBarChart(container, data, options = {}) {
  const {
    max = Math.max(...data.map(d => d.value)) * 1.1,
    mean = null,
    height = 320,
    valueSuffix = '',
    showValueLabels = true,
  } = options;

  const width = 1000;
  const padTop = 30, padBottom = 50, padLeft = 50, padRight = 30;
  const chartH = height - padTop - padBottom;
  const chartW = width - padLeft - padRight;
  const barW = chartW / data.length * 0.62;
  const gap = chartW / data.length - barW;

  // Y-axis ticks
  const tickCount = 5;
  const yTicks = [];
  for (let i = 0; i <= tickCount; i++) {
    const v = (max / tickCount) * i;
    yTicks.push({ value: Math.round(v), y: padTop + chartH - (v / max) * chartH });
  }

  // Bars
  let bars = '';
  data.forEach((d, i) => {
    const x = padLeft + i * (barW + gap) + gap / 2;
    const h = (d.value / max) * chartH;
    const y = padTop + chartH - h;
    const fill = d.highlight ? CHART_COLORS.magenta : CHART_COLORS.magentaSoft;
    const stroke = d.highlight ? CHART_COLORS.magenta : 'transparent';
    bars += svgEl('rect', {
      x: x.toFixed(1), y: y.toFixed(1), width: barW.toFixed(1), height: h.toFixed(1),
      rx: 3, fill, stroke, 'stroke-width': 1,
    });
    if (showValueLabels) {
      bars += svgEl('text', {
        x: (x + barW / 2).toFixed(1), y: (y - 8).toFixed(1),
        'text-anchor': 'middle',
        'font-size': 13, 'font-weight': d.highlight ? 600 : 400,
        fill: d.highlight ? CHART_COLORS.magenta : CHART_COLORS.inkMute,
        'font-family': "var(--font-body)",
      }, `${d.value}${valueSuffix}`);
    }
    // X-label
    bars += svgEl('text', {
      x: (x + barW / 2).toFixed(1), y: padTop + chartH + 22,
      'text-anchor': 'middle',
      'font-size': 13,
      fill: d.highlight ? CHART_COLORS.magenta : CHART_COLORS.inkFaint,
      'font-weight': d.highlight ? 600 : 400,
      'font-family': "var(--font-body)",
    }, d.label);
  });

  // Y ticks + gridlines
  let yAxis = '';
  yTicks.forEach(t => {
    yAxis += svgEl('line', {
      x1: padLeft, x2: padLeft + chartW, y1: t.y, y2: t.y,
      stroke: CHART_COLORS.divider, 'stroke-width': 1,
    });
    yAxis += svgEl('text', {
      x: padLeft - 10, y: t.y + 4, 'text-anchor': 'end',
      'font-size': 13, fill: CHART_COLORS.inkFaint,
      'font-family': "var(--font-body)",
    }, t.value);
  });

  // Mean line
  let meanLine = '';
  if (mean !== null) {
    const y = padTop + chartH - (mean / max) * chartH;
    meanLine = svgEl('line', {
      x1: padLeft, x2: padLeft + chartW, y1: y, y2: y,
      stroke: CHART_COLORS.ink, 'stroke-width': 1.2, 'stroke-dasharray': '4 4',
    });
    meanLine += svgEl('text', {
      x: padLeft + chartW + 2, y: y + 4,
      'font-size': 13, fill: CHART_COLORS.ink, 'font-weight': 500,
      'font-family': "var(--font-body)",
    }, '');
    meanLine += svgEl('text', {
      x: padLeft + chartW - 6, y: y - 6, 'text-anchor': 'end',
      'font-size': 13, fill: CHART_COLORS.ink, 'font-weight': 500,
      'font-family': "var(--font-body)",
    }, `평균 ${mean}`);
  }

  const svg = svgEl('svg', {
    viewBox: `0 0 ${width} ${height}`,
    xmlns: 'http://www.w3.org/2000/svg',
    style: 'width:100%; height:auto; display:block;',
  }, yAxis + meanLine + bars);

  container.innerHTML = svg;
}

/* ----------------------------------------------------------------
   Historical 1등급 percentage bar chart for the exam intro.
     data: [{session, pct, note?, highlight?}]
 ---------------------------------------------------------------- */
function renderGrade1TrendChart(container, data, options = {}) {
  const {
    height = 320,
    yMax = 12,
    refLine = 4,
    average = null,
  } = options;

  if (!container) return;

  const width = 1000;
  const padTop = 28, padBottom = 66, padLeft = 54, padRight = 58;
  const chartH = height - padTop - padBottom;
  const chartW = width - padLeft - padRight;
  const groupW = chartW / data.length;
  const barW = Math.max(10, groupW * 0.56);
  const yToPx = v => padTop + chartH - (v / yMax) * chartH;
  const fmtTooltip = d => {
    const cleaned = d.session.replace("'", '');
    const [yy, mm] = cleaned.split('.');
    const year = 2000 + parseInt(yy, 10);
    const month = parseInt(mm, 10);
    if (d.pct === null || d.pct === undefined) return `${year}년 ${month}월 · ${d.note || '성적 미산출'}`;
    return `${year}년 ${month}월 · 1등급 ${d.pct.toFixed(2)}%`;
  };

  let grid = '';
  for (let v = 0; v <= yMax; v += 2) {
    const y = yToPx(v);
    grid += svgEl('line', {
      x1: padLeft, x2: padLeft + chartW, y1: y.toFixed(1), y2: y.toFixed(1),
      stroke: 'rgba(255,255,255,0.10)', 'stroke-width': 1,
    });
    grid += svgEl('text', {
      x: padLeft - 12, y: (y + 4).toFixed(1), 'text-anchor': 'end',
      'font-size': 12, fill: 'rgba(255,255,255,0.62)',
      'font-family': "var(--font-body)",
    }, v);
  }

  const refY = yToPx(refLine);
  let reference = svgEl('line', {
    x1: padLeft, x2: padLeft + chartW, y1: refY.toFixed(1), y2: refY.toFixed(1),
    stroke: 'rgba(255,255,255,0.35)', 'stroke-width': 1,
    'stroke-dasharray': '5 5',
  });
  reference += svgEl('text', {
    x: (padLeft + chartW - 4).toFixed(1), y: (refY - 7).toFixed(1),
    'text-anchor': 'end', 'font-size': 12, fill: 'rgba(255,255,255,0.78)',
    'font-weight': 600, 'font-family': "var(--font-body)",
  }, '이론값 4%');
  reference += svgEl('text', {
    x: 12, y: 15,
    'font-size': 12, fill: 'rgba(255,255,255,0.62)',
    'font-family': "var(--font-body)",
  }, '1등급 비율 (%)');

  let averageLine = '';
  if (average !== null && average !== undefined) {
    const avgY = yToPx(average);
    averageLine += svgEl('line', {
      x1: padLeft, x2: padLeft + chartW, y1: avgY.toFixed(1), y2: avgY.toFixed(1),
      stroke: '#38bdf8', 'stroke-width': 1.2,
      'stroke-dasharray': '6 4',
    });
    averageLine += svgEl('text', {
      x: (padLeft + chartW - 4).toFixed(1), y: (avgY - 7).toFixed(1),
      'text-anchor': 'end', 'font-size': 12, fill: '#7dd3fc',
      'font-weight': 700, 'font-family': "var(--font-body)",
    }, `역대 1등급 평균 ${average.toFixed(2)}%*`);
  }

  let bars = '';
  data.forEach((d, i) => {
    const value = d.pct || 0;
    const x = padLeft + i * groupW + (groupW - barW) / 2;
    const h = Math.max(d.pct ? (value / yMax) * chartH : 3, 3);
    const y = d.pct ? yToPx(value) : padTop + chartH - h;
    const fill = d.highlight ? '#f97316' : (d.pct ? '#475569' : 'transparent');
    const stroke = d.highlight ? '#fb923c' : (d.pct ? 'transparent' : 'rgba(255,255,255,0.38)');
    const labelFill = d.highlight ? '#fdba74' : 'rgba(255,255,255,0.62)';

    bars += svgEl('rect', {
      x: x.toFixed(1), y: y.toFixed(1), width: barW.toFixed(1), height: h.toFixed(1),
      rx: 3, fill, stroke, 'stroke-width': d.pct ? 0 : 1.4,
      'data-tooltip': fmtTooltip(d),
      tabindex: 0,
    });
    if (d.highlight || d.pct === null) {
      bars += svgEl('text', {
        x: (x + barW / 2).toFixed(1), y: (y - 8).toFixed(1),
        'text-anchor': 'middle',
        'font-size': 12, 'font-weight': 700,
        fill: d.highlight ? '#fdba74' : 'rgba(255,255,255,0.54)',
        'font-family': "var(--font-body)",
      }, d.pct === null ? '0' : d.pct.toFixed(2) + '%');
    }
    bars += svgEl('text', {
      x: (x + barW / 2).toFixed(1), y: padTop + chartH + 24,
      'text-anchor': 'end',
      transform: `rotate(-35 ${(x + barW / 2).toFixed(1)} ${padTop + chartH + 24})`,
      'font-size': 12,
      fill: d.highlight ? '#fdba74' : labelFill,
      'font-weight': d.highlight ? 700 : 500,
      'font-family': "var(--font-body)",
    }, d.session);
    if (d.note) {
      bars += svgEl('text', {
        x: (x + barW / 2).toFixed(1), y: (padTop + chartH - 9).toFixed(1),
        'text-anchor': 'middle',
        'font-size': 12, fill: 'rgba(255,255,255,0.54)',
        'font-family': "var(--font-body)",
      }, '*');
    }
  });

  const svg = svgEl('svg', {
    viewBox: `0 0 ${width} ${height}`,
    xmlns: 'http://www.w3.org/2000/svg',
    style: 'width:100%; height:auto; display:block;',
    role: 'img',
    'aria-label': '1등급 비율 추이 2016년부터 2026년까지',
  }, grid + reference + averageLine + bars);

  container.innerHTML = svg;

  let tooltip = document.querySelector('.exam-chart-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'exam-chart-tooltip';
    document.body.appendChild(tooltip);
  }
  const moveTooltip = e => {
    const target = e.currentTarget;
    tooltip.textContent = target.getAttribute('data-tooltip');
    tooltip.style.left = `${e.clientX}px`;
    tooltip.style.top = `${e.clientY - 12}px`;
    tooltip.classList.add('show');
  };
  container.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mousemove', moveTooltip);
    el.addEventListener('mouseenter', moveTooltip);
    el.addEventListener('focus', e => {
      const rect = e.currentTarget.getBoundingClientRect();
      tooltip.textContent = e.currentTarget.getAttribute('data-tooltip');
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top - 8}px`;
      tooltip.classList.add('show');
    });
    el.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
    el.addEventListener('blur', () => tooltip.classList.remove('show'));
  });
}

/* ----------------------------------------------------------------
   Multi-line chart — used for trends across rounds.
     series: [{ name, color, data: [{x, y}] }]
     options: { xLabels, yMin, yMax, height, yFormat, refLine }
 ---------------------------------------------------------------- */
function renderLineChart(container, series, options = {}) {
  const {
    xLabels = [],
    yMin = 0,
    yMax = 100,
    height = 320,
    yFormat = v => v + '%',
    legend = true,
  } = options;

  const width = 1000;
  const padTop = 24, padBottom = 50, padLeft = 50, padRight = 30;
  const chartH = height - padTop - padBottom;
  const chartW = width - padLeft - padRight;
  const n = xLabels.length;
  const xStep = n > 1 ? chartW / (n - 1) : chartW / 2;

  const xToPx = i => padLeft + i * xStep;
  const yToPx = v => padTop + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  let grid = '';
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const v = yMin + ((yMax - yMin) / tickCount) * i;
    const y = yToPx(v);
    grid += svgEl('line', {
      x1: padLeft, x2: padLeft + chartW, y1: y, y2: y,
      stroke: CHART_COLORS.divider, 'stroke-width': 1,
    });
    grid += svgEl('text', {
      x: padLeft - 10, y: y + 4, 'text-anchor': 'end',
      'font-size': 13, fill: CHART_COLORS.inkFaint,
      'font-family': "var(--font-body)",
    }, yFormat(Math.round(v)));
  }
  xLabels.forEach((lab, i) => {
    grid += svgEl('text', {
      x: xToPx(i), y: padTop + chartH + 22, 'text-anchor': 'middle',
      'font-size': 13, fill: CHART_COLORS.inkMute,
      'font-family': "var(--font-body)",
    }, lab);
  });

  const segDashed = (s, fromX, toX) => {
    if (s.dashed) return true;
    if (!s.dashedSegments) return false;
    return s.dashedSegments.some(seg => seg.from === fromX && seg.to === toX);
  };

  let lines = '';
  series.forEach(s => {
    const pts = s.data || [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if (!a || !b || a.y === null || a.y === undefined || b.y === null || b.y === undefined) continue;
      lines += svgEl('line', {
        x1: xToPx(a.x).toFixed(1), y1: yToPx(a.y).toFixed(1),
        x2: xToPx(b.x).toFixed(1), y2: yToPx(b.y).toFixed(1),
        stroke: s.color,
        'stroke-width': s.thick ? 2.5 : 2,
        'stroke-linecap': 'round',
        'stroke-dasharray': segDashed(s, a.x, b.x) ? '5 4' : null,
      });
    }
    pts.filter(p => p && p.y !== null && p.y !== undefined).forEach(p => {
      lines += svgEl('circle', {
        cx: xToPx(p.x).toFixed(1), cy: yToPx(p.y).toFixed(1),
        r: s.thick ? 4 : 3, fill: s.color, stroke: '#fff', 'stroke-width': 1.5,
      });
    });
  });

  let legendEl = '';
  if (legend) {
    let lx = padLeft;
    const ly = 4;
    series.filter(s => s.showInLegend !== false).forEach((s) => {
      legendEl += svgEl('line', {
        x1: lx, x2: lx + 22, y1: ly + 8, y2: ly + 8,
        stroke: s.color, 'stroke-width': s.thick ? 2.5 : 2,
        'stroke-linecap': 'round',
        'stroke-dasharray': s.legendDashed || s.dashed ? '5 4' : null,
      });
      legendEl += svgEl('circle', { cx: lx + 11, cy: ly + 8, r: s.thick ? 4 : 3, fill: s.color, stroke: '#fff', 'stroke-width': 1.2 });
      legendEl += svgEl('text', {
        x: lx + 30, y: ly + 12,
        'font-size': 14, fill: CHART_COLORS.ink, 'font-weight': 500,
        'font-family': "var(--font-body)",
      }, s.name);
      lx += 30 + s.name.length * 8 + 38;
    });
  }

  const svg = svgEl('svg', {
    viewBox: `0 0 ${width} ${height + 24}`,
    xmlns: 'http://www.w3.org/2000/svg',
    style: 'width:100%; height:auto; display:block;',
  }, legendEl + `<g transform="translate(0,24)">` + grid + lines + `</g>`);
  container.innerHTML = svg;
}

/* ----------------------------------------------------------------
   Side-by-side grouped bars — class vs national grade distribution
     groups: [{label, values:[v1, v2]}]
     series: [{name, color}]
 ---------------------------------------------------------------- */
function renderGroupedBars(container, groups, seriesMeta, options = {}) {
  const {
    height = 320,
    yFormat = v => v + '%',
    yMax = null,
  } = options;
  const width = 1000;
  const padTop = 50, padBottom = 50, padLeft = 50, padRight = 30;
  const chartH = height - padTop - padBottom;
  const chartW = width - padLeft - padRight;
  const groupW = chartW / groups.length;
  const barCount = seriesMeta.length;
  const barW = (groupW * 0.66) / barCount;
  const groupPad = (groupW - barW * barCount) / 2;

  // Determine max
  let max = yMax;
  if (max === null) {
    max = 0;
    groups.forEach(g => g.values.forEach(v => { if (v > max) max = v; }));
    max = Math.ceil(max / 5) * 5 + 5;
  }

  const yToPx = v => padTop + chartH - (v / max) * chartH;

  // Grid
  let grid = '';
  for (let i = 0; i <= 5; i++) {
    const v = (max / 5) * i;
    const y = yToPx(v);
    grid += svgEl('line', {
      x1: padLeft, x2: padLeft + chartW, y1: y, y2: y,
      stroke: CHART_COLORS.divider, 'stroke-width': 1,
    });
    grid += svgEl('text', {
      x: padLeft - 10, y: y + 4, 'text-anchor': 'end',
      'font-size': 13, fill: CHART_COLORS.inkFaint,
      'font-family': "var(--font-body)",
    }, yFormat(parseFloat(v.toFixed(1))));
  }

  // Bars
  let bars = '';
  groups.forEach((g, gi) => {
    const gx = padLeft + gi * groupW;
    g.values.forEach((v, si) => {
      const x = gx + groupPad + si * barW;
      const h = (v / max) * chartH;
      const y = yToPx(v);
      bars += svgEl('rect', {
        x: x.toFixed(1), y: y.toFixed(1),
        width: (barW - 2).toFixed(1), height: h.toFixed(1),
        rx: 2, fill: seriesMeta[si].color,
      });
      if (si === 0 && v > 0) {
        bars += svgEl('text', {
          x: (x + barW / 2 - 1).toFixed(1), y: (y - 6).toFixed(1),
          'text-anchor': 'middle',
          'font-size': 13, fill: CHART_COLORS.magenta, 'font-weight': 600,
          'font-family': "var(--font-body)",
        }, v.toFixed(1) + '%');
      }
    });
    // X-label
    bars += svgEl('text', {
      x: (gx + groupW / 2).toFixed(1), y: padTop + chartH + 22,
      'text-anchor': 'middle',
      'font-size': 14, fill: CHART_COLORS.inkMute,
      'font-family': "var(--font-body)",
    }, g.label);
  });

  // Legend
  let legend = '';
  let lx = padLeft;
  const ly = 16;
  seriesMeta.forEach((s) => {
    legend += svgEl('rect', { x: lx, y: ly, width: 14, height: 14, rx: 2, fill: s.color });
    legend += svgEl('text', {
      x: lx + 20, y: ly + 11,
      'font-size': 14, fill: CHART_COLORS.ink, 'font-weight': 500,
      'font-family': "var(--font-body)",
    }, s.name);
    lx += 20 + s.name.length * 8 + 28;
  });

  const svg = svgEl('svg', {
    viewBox: `0 0 ${width} ${height}`,
    xmlns: 'http://www.w3.org/2000/svg',
    style: 'width:100%; height:auto; display:block;',
  }, legend + grid + bars);

  container.innerHTML = svg;
}

/* ----------------------------------------------------------------
   National 고2 cumulative-distribution curve with the student's marker.
     bands: high2.distribution (already sorted by descending grade)
     studentScore: the student's score
 ---------------------------------------------------------------- */
function renderNationalCurve(container, bands, studentScore, options = {}) {
  const { height = 320 } = options;
  const width = 1000;
  const padTop = 30, padBottom = 78, padLeft = 50, padRight = 50;
  const chartH = height - padTop - padBottom;
  const chartW = width - padLeft - padRight;

  // Bands: sorted by descending grade in input. Each band's minScore is the
  // floor of the score range. We treat each band as a uniform block.
  // Build a "score → percentile" mapping for the curve.
  // Sort bands ascending by minScore so the lowest grade comes first.
  const sortedBands = [...bands].sort((a, b) => a.minScore - b.minScore);
  // Cumulative pct
  let cum = 0;
  const points = [];
  // Each band spans from minScore to (next band's minScore or 100).
  sortedBands.forEach((b, i) => {
    const lo = b.minScore;
    const hi = i < sortedBands.length - 1 ? sortedBands[i + 1].minScore : 100;
    points.push({ score: lo, cum });
    cum += b.pct;
    points.push({ score: hi, cum });
  });
  points.push({ score: 100, cum: 100 });

  const xToPx = s => padLeft + (s / 100) * chartW;
  const yToPx = c => padTop + chartH - (c / 100) * chartH;

  // Curve
  let curve = 'M ' + points.map(p => `${xToPx(p.score).toFixed(1)},${yToPx(p.cum).toFixed(1)}`).join(' L ');
  // Area below curve (filled)
  let area = `M ${xToPx(0).toFixed(1)},${yToPx(0).toFixed(1)} ` +
             'L ' + points.map(p => `${xToPx(p.score).toFixed(1)},${yToPx(p.cum).toFixed(1)}`).join(' L ') +
             ` L ${xToPx(100).toFixed(1)},${yToPx(0).toFixed(1)} Z`;

  // Grid (x: score ticks at 10s, y: 0-100%)
  let grid = '';
  for (let s = 0; s <= 100; s += 10) {
    grid += svgEl('line', {
      x1: xToPx(s), x2: xToPx(s), y1: padTop, y2: padTop + chartH,
      stroke: CHART_COLORS.divider, 'stroke-width': 1,
    });
    grid += svgEl('text', {
      x: xToPx(s), y: padTop + chartH + 22, 'text-anchor': 'middle',
      'font-size': 13, fill: CHART_COLORS.inkFaint,
      'font-family': "var(--font-body)",
    }, s);
  }
  const gradeBands = [
    { label: '9등급', lo: 0, hi: 20 },
    { label: '8등급', lo: 20, hi: 30 },
    { label: '7등급', lo: 30, hi: 40 },
    { label: '6등급', lo: 40, hi: 50 },
    { label: '5등급', lo: 50, hi: 60 },
    { label: '4등급', lo: 60, hi: 70 },
    { label: '3등급', lo: 70, hi: 80 },
    { label: '2등급', lo: 80, hi: 90 },
    { label: '1등급', lo: 90, hi: 100 },
  ];
  gradeBands.forEach(g => {
    const cx = xToPx((g.lo + g.hi) / 2);
    grid += svgEl('text', {
      x: cx, y: padTop + chartH + 40, 'text-anchor': 'middle',
      'font-size': 14, fill: CHART_COLORS.inkMute,
      'font-family': "var(--font-body)",
    }, g.label);
  });

  for (let p = 0; p <= 100; p += 20) {
    grid += svgEl('line', {
      x1: padLeft, x2: padLeft + chartW, y1: yToPx(p), y2: yToPx(p),
      stroke: CHART_COLORS.divider, 'stroke-width': 1,
    });
    grid += svgEl('text', {
      x: padLeft - 10, y: yToPx(p) + 4, 'text-anchor': 'end',
      'font-size': 13, fill: CHART_COLORS.inkFaint,
      'font-family': "var(--font-body)",
    }, p + '%');
  }

  // Student marker line
  let marker = '';
  if (studentScore !== null && studentScore !== undefined) {
    const mx = xToPx(studentScore);
    // Interpolate cumulative percentile at student's score
    let pct = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      if (studentScore >= a.score && studentScore <= b.score) {
        if (b.score === a.score) pct = b.cum;
        else pct = a.cum + ((studentScore - a.score) / (b.score - a.score)) * (b.cum - a.cum);
        break;
      }
    }
    const my = yToPx(pct);
    marker += svgEl('line', {
      x1: mx, x2: mx, y1: padTop, y2: padTop + chartH,
      stroke: CHART_COLORS.magenta, 'stroke-width': 2, 'stroke-dasharray': '5 4',
    });
    marker += svgEl('circle', {
      cx: mx, cy: my, r: 8, fill: CHART_COLORS.magenta, stroke: '#fff', 'stroke-width': 3,
    });
    // Label
    const labelX = mx > padLeft + chartW - 120 ? mx - 12 : mx + 12;
    const labelAnchor = mx > padLeft + chartW - 120 ? 'end' : 'start';
    marker += svgEl('text', {
      x: labelX, y: my - 14,
      'text-anchor': labelAnchor,
      'font-size': 14, fill: CHART_COLORS.magenta, 'font-weight': 600,
      'font-family': "var(--font-body)",
    }, `점수 ${studentScore}점`);
    marker += svgEl('text', {
      x: labelX, y: my + 4,
      'text-anchor': labelAnchor,
      'font-size': 14, fill: CHART_COLORS.magenta,
      'font-family': "var(--font-body)",
    }, `상위 약 ${(100 - pct).toFixed(1)}%`);
  }

  const svg = svgEl('svg', {
    viewBox: `0 0 ${width} ${height}`,
    xmlns: 'http://www.w3.org/2000/svg',
    style: 'width:100%; height:auto; display:block;',
  },
    svgEl('path', { d: area, fill: CHART_COLORS.magentaFaint }) +
    grid +
    svgEl('path', { d: curve, fill: 'none', stroke: CHART_COLORS.magenta, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }) +
    marker
  );
  container.innerHTML = svg;
}
