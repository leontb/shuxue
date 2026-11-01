(function () {
  'use strict';
  const config = window.CoursewareLesson;
  if (!config || !config.steps?.length || config.practice?.length !== 2) throw new Error('Provide lesson steps and exactly two practice questions.');
  const items = [...config.steps, ...config.practice];
  for (const item of items) {
    if (item.options.length !== 4 || item.feedback.length !== 4) throw new Error('Each question needs four choices and four targeted feedback messages.');
  }
  const lessonCount = config.steps.length;
  const $ = id => document.getElementById(id);
  const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const handles = new Map();
  let mainIndex = 0, destroyed = false;
  const escapeText = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  const controller = new window.CoursewareController(items.map(item => ({ answer: item.answer, optionCount: item.options.length })), {
    delay: 600,
    lessonCount,
    isHidden: () => document.hidden,
    onChange: sync,
    onEnter: enter
  });

  function disposeVisual(key) { handles.get(key)?.destroy?.(); handles.delete(key); }
  function mountVisual(key, host, item, autoplay) {
    disposeVisual(key);
    const handle = config.mountVisual(host, item.scene, {
      reducedMotion: reduced(), autoplay,
      onPlayback: playing => {
        if (key === 'main') {
          const button = $('motion-toggle');
          if (button) button.textContent = playing ? '暂停动画' : '播放动画';
        }
      }
    });
    handles.set(key, handle || {});
  }

  function choiceHTML(item, index) {
    return `<div class="choices" role="group" aria-label="${escapeText(item.question || item.title)}">${item.options.map((option, i) => `<button type="button" class="choice" data-item="${index}" data-choice="${i}" aria-pressed="false"><span class="letter">${'ABCD'[i]}</span><span>${escapeText(option)}</span><span class="mark" aria-hidden="true"></span></button>`).join('')}</div><div id="feedback-${index}" class="feedback" role="status" aria-live="polite" hidden></div>`;
  }

  function renderNav(state) {
    $('lesson-nav').style.gridTemplateColumns = `repeat(${Math.min(4, lessonCount)}, minmax(0,1fr))`;
    $('lesson-nav').innerHTML = config.steps.map((item, i) => `<button type="button" data-go="${i}" class="${mainIndex === i ? 'current ' : ''}${state.solved[i] ? 'done' : ''}" ${i > state.unlocked ? 'disabled' : ''} ${i === mainIndex ? 'aria-current="step"' : ''}><span class="number">${state.solved[i] ? '✓' : String(i + 1).padStart(2, '0')}</span>${escapeText(item.label || `第${i + 1}步`)}</button>`).join('');
  }

  function renderLesson(index) {
    disposeVisual('main');
    mainIndex = index;
    const item = config.steps[index];
    $('lesson-stage').innerHTML = `<div class="lesson-header"><p class="eyebrow">第${index + 1}步 / 共${lessonCount}步</p><h2 id="stage-title" tabindex="-1">${escapeText(item.title)}</h2><p class="lead">${escapeText(item.lead)}</p></div><div class="lesson-body"><div id="main-visual" class="visual"></div><div class="visual-controls"><button type="button" class="button" data-action="motion" id="motion-toggle">播放动画</button><button type="button" class="button" data-action="replay">重播本步</button></div><section class="question"><p class="eyebrow">点选答案，选对自动继续</p><h3>${escapeText(item.question)}</h3>${choiceHTML(item, index)}<details class="solution"><summary>查看这一步的解析</summary>${item.explanationHtml}</details></section></div><footer class="lesson-footer"><div class="footer-buttons"><button type="button" class="button" data-go="${index - 1}" ${index === 0 ? 'disabled' : ''}>上一步</button><button type="button" class="button" data-action="reset">从头开始</button></div><span id="advance-status" class="advance-status" role="status">选对后自动继续</span></footer>`;
    mountVisual('main', $('main-visual'), item, !reduced());
    renderNav(controller.snapshot());
    sync(controller.snapshot(), 'render');
  }

  function renderPractice() {
    config.practice.forEach((_, i) => disposeVisual(`practice-${i}`));
    $('practice-list').innerHTML = config.practice.map((item, i) => `<article class="practice-card" id="practice-${i + 1}" aria-labelledby="practice-title-${i}"><p class="eyebrow">${escapeText(item.label)}</p><h3 id="practice-title-${i}" tabindex="-1">${escapeText(item.title)}</h3><p class="lead">${escapeText(item.lead)}</p>${choiceHTML(item, lessonCount + i)}<details class="solution" data-practice-solution="${i}"><summary>查看图解与答案</summary><div id="practice-visual-${i}" class="practice-visual"></div>${item.explanationHtml}</details></article>`).join('');
    $('practice-list').querySelectorAll('details[data-practice-solution]').forEach(details => {
      details.addEventListener('toggle', () => {
        const i = Number(details.dataset.practiceSolution);
        if (details.open && !handles.has(`practice-${i}`)) mountVisual(`practice-${i}`, $(`practice-visual-${i}`), config.practice[i], !reduced());
        if (!details.open) handles.get(`practice-${i}`)?.pause?.();
      });
    });
  }

  function sync(state, reason) {
    if (destroyed) return;
    if (reason !== 'cancel') renderNav(state);
    items.forEach((item, index) => {
      const selected = state.selected[index], correct = selected === item.answer;
      document.querySelectorAll(`button[data-item="${index}"]`).forEach(button => {
        const on = Number(button.dataset.choice) === selected;
        button.classList.toggle('correct', on && correct);
        button.classList.toggle('wrong', on && !correct);
        button.setAttribute('aria-pressed', on ? 'true' : 'false');
        button.querySelector('.mark').textContent = on ? (correct ? '✓' : '×') : '';
      });
      const feedback = $(`feedback-${index}`);
      if (feedback) {
        feedback.hidden = selected === null;
        feedback.className = 'feedback' + (selected !== null && !correct ? ' error' : '');
        feedback.textContent = selected === null ? '' : item.feedback[selected];
        if (correct && index >= lessonCount && state.pending && state.active === index && index < items.length - 1) feedback.textContent += ' 即将进入下一题。';
        if (correct && index === items.length - 1 && state.complete) feedback.textContent += ' 两道训练已完成。';
      }
    });
    handles.get('main')?.setFeedback?.(state.selected[mainIndex] === items[mainIndex].answer);
    if (reason === 'answer' && state.active >= lessonCount) {
      const i = state.active - lessonCount;
      if (state.selected[state.active] === items[state.active].answer) {
        const details = document.querySelector(`details[data-practice-solution="${i}"]`);
        details.open = true;
        if (!handles.has(`practice-${i}`)) mountVisual(`practice-${i}`, $(`practice-visual-${i}`), config.practice[i], !reduced());
      }
    }
    const status = $('advance-status');
    if (status) {
      if (state.active >= lessonCount) status.textContent = state.solved.slice(0, lessonCount).every(Boolean) ? '讲解完成，可继续训练或返回查看' : '正在查看训练，仍可返回讲解';
      else if (state.pending) status.textContent = mainIndex === lessonCount - 1 ? '答对了，自动进入训练…' : '答对了，自动继续…';
      else status.textContent = state.selected[mainIndex] === items[mainIndex].answer ? '已答对；点选答案可继续' : '选对后自动继续';
    }
  }

  function enter(index, reason) {
    if (index < lessonCount) {
      renderLesson(index);
      if (reason !== 'initial') {
        $('lesson-stage').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
        $('stage-title').focus({ preventScroll: true });
      }
    } else {
      handles.get('main')?.pause?.();
      const i = index - lessonCount;
      $(`practice-${i + 1}`).scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      $(`practice-title-${i}`).focus({ preventScroll: true });
    }
  }

  function reset() {
    [...handles.keys()].forEach(disposeVisual);
    renderPractice();
    controller.reset();
  }

  // Capture runs before delegated choices, so a new timer is never cancelled by its own click.
  const captureClick = () => controller.cancel();
  const click = event => {
    const button = event.target.closest('button');
    if (!button || !$('courseware-app').contains(button)) return;
    if (button.hasAttribute('data-choice')) { controller.choose(Number(button.dataset.item), Number(button.dataset.choice)); return; }
    if (button.hasAttribute('data-go')) { controller.go(Number(button.dataset.go)); return; }
    if (button.dataset.action === 'reset') reset();
    if (button.dataset.action === 'replay') handles.get('main')?.replay?.();
    if (button.dataset.action === 'motion') {
      const handle = handles.get('main');
      if (handle?.isPlaying?.()) handle.pause?.(); else handle?.replay?.();
    }
  };
  const hidden = () => {
    if (document.hidden) { controller.cancel(); handles.forEach(handle => handle.pause?.()); }
  };
  const pagehide = () => { controller.cancel(); handles.forEach(handle => handle.pause?.()); };
  document.addEventListener('click', captureClick, true);
  document.addEventListener('click', click);
  document.addEventListener('visibilitychange', hidden);
  window.addEventListener('pagehide', pagehide);

  document.title = config.title;
  $('lesson-title').textContent = config.title;
  $('lesson-subtitle').textContent = config.subtitle;
  $('problem-content').innerHTML = config.problemHtml;
  $('summary-title').textContent = config.summaryTitle;
  $('summary-content').innerHTML = config.summaryHtml;
  renderPractice();
  renderLesson(0);

  window.Courseware = {
    reset,
    getState: () => controller.snapshot(),
    destroy() {
      destroyed = true; controller.destroy(); [...handles.keys()].forEach(disposeVisual);
      document.removeEventListener('click', captureClick, true);
      document.removeEventListener('click', click);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', pagehide);
    }
  };
})();
