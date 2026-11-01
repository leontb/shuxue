(function () {
  'use strict';

  // Edit this file for a new problem. Keep mathematical data separate from engine state.
  const total = 120, first = total / 3, extra = first / 4, second = first + extra;
  if (first !== 40 || extra !== 10 || second !== 50) throw new Error('Sample arithmetic is inconsistent.');
  const units = (count, kind, text = '10', offset = 0) => Array.from({ length: count }, (_, i) => `<span class="unit ${kind}" style="--i:${i + offset}">${text}</span>`).join('');
  const bar = (parts, cells) => `<div class="bar" style="--parts:${parts}">${cells}</div>`;

  function visualHTML(name) {
    if (name === 'third') return `<p class="visual-caption">把<strong>整本书120页</strong>平均分成3份，第一天读其中1份。</p><div class="bar-row"><div class="bar-heading"><span>整本书：120页</span><span>3份一样多</span></div>${bar(3, units(1, 'active', '40页') + units(2, '', '40页', 1))}<p class="bar-note">蓝色1份＝第一天读的页数。</p></div><p class="visual-equation">120 ÷ 3 ＝ 40（页）</p>`;
    if (name === 'base') return `<p class="visual-caption">“比<strong>第一天</strong>多1/4”，这次把<strong>第一天的40页</strong>看作整体。</p><div class="bar-row"><div class="bar-heading"><span>第一天：40页</span><span>放大看，分成4份</span></div>${bar(4, units(4, 'base'))}<p class="bar-note">这条条形代表40页，每格10页；它不再代表整本120页。</p></div><div class="identity-change"><span>读全书的1/3 → 标准是<strong>120页</strong></span><span>比第一天多1/4 → 标准换成<strong>40页</strong></span></div><p class="visual-equation">多出的1份：40 ÷ 4 ＝ 10（页）</p>`;
    if (name === 'more') return `<p class="visual-caption">第一天是<strong>4份</strong>；第二天多1/4，就是再加<strong>1份</strong>。</p><div class="bar-row"><div class="bar-heading"><span>第一天：4份</span><span>40页</span></div>${bar(5, units(4, 'base') + units(1, 'empty', '', 4))}</div><div class="bar-row"><div class="bar-heading"><span>第二天：4份＋1份</span><span>每份10页</span></div>${bar(5, units(4, 'base') + units(1, 'extra', '10', 4))}</div><p class="bar-note">绿色是原来的40页；橙色是多出的10页。</p><p class="visual-equation">40 ＋ 10 ＝ 50（页）</p>`;
    if (name === 'less') return `<p class="visual-caption">少1/4：原来的4份去掉1份，剩下<strong>3份</strong>。</p><div class="bar-row">${bar(4, units(3, 'base') + units(1, 'removed', '10', 3))}</div><p class="bar-note">每份10页，去掉的部分也是10页。</p><p class="visual-equation">40 − 10 ＝ 30（页）</p>`;
    if (name === 'total') return `<p class="visual-caption">两天合起来：第一天4份，第二天5份，一共<strong>9份</strong>。</p><div class="bar-row nine-parts">${bar(9, units(4, 'base') + units(5, 'extra', '10', 4))}</div><p class="bar-note">绿色4份是第一天，橙色5份是第二天，每份都代表10页。</p><p class="visual-equation">40 ＋ 50 ＝ 90（页）</p>`;
    throw new Error(`Unknown scene: ${name}`);
  }

  function mountVisual(host, scene, context) {
    host.innerHTML = visualHTML(scene);
    host.classList.add('visual');
    let playing = false, disposed = false;
    const maxIndex = Math.max(...Array.from(host.querySelectorAll('.unit')).map(el => Number(el.style.getPropertyValue('--i'))));
    const notify = value => { playing = value; context.onPlayback?.(value); };
    function play() {
      if (disposed || context.reducedMotion) return;
      host.classList.remove('is-paused');
      host.classList.add('is-animating');
      notify(true);
    }
    function pause() { if (disposed) return; host.classList.add('is-paused'); notify(false); }
    function replay() {
      if (disposed) return;
      host.classList.remove('is-paused', 'is-animating');
      if (context.reducedMotion) { notify(false); return; }
      // Restart a short CSS animation; no delayed navigation is coupled to it.
      void host.offsetWidth;
      play();
    }
    const ended = event => {
      if (event.target.matches('.unit') && Number(event.target.style.getPropertyValue('--i')) === maxIndex) notify(false);
    };
    host.addEventListener('animationend', ended);
    if (context.autoplay && !context.reducedMotion) play();
    return {
      play, pause, replay,
      isPlaying: () => playing,
      setFeedback: correct => host.classList.toggle('is-correct', !!correct),
      destroy() { disposed = true; host.removeEventListener('animationend', ended); host.classList.remove('is-animating', 'is-paused'); notify(false); }
    };
  }

  window.CoursewareLesson = {
    title: '分数题：每次以谁为标准？',
    subtitle: '先找比较的标准，再把分数画成份数。',
    downloadName: 'fraction-reference-lesson.html',
    problemHtml: '<p>一本书有120页。第一天读了全书的1/3，第二天比第一天多读1/4。第二天读了多少页？</p>',
    summaryTitle: '一图看清：比较标准从120变成40',
    summaryHtml: `<div class="summary-map"><div class="summary-flow"><div class="summary-node"><small>整本书</small><strong>120页</strong></div><div class="summary-arrow">÷3<br><span class="horizontal">→</span><span class="vertical">↓</span></div><div class="summary-node base"><small>第一天</small><strong>40页</strong></div><div class="summary-arrow">÷4<br><span class="horizontal">→</span><span class="vertical">↓</span></div><div class="summary-node extra"><small>多出的部分</small><strong>10页</strong></div></div><div class="summary-answer"><span>第二天</span><strong>40 ＋ 10 ＝ 50页</strong></div><p class="summary-caption">先问“谁的几分之几”，再决定把哪个数分成几份。</p></div>`,
    steps: [
      { id: 'first-day', label: '全书分3份', title: '第一天读了全书的哪一份？', lead: '把120页平均分成3份，第一天读其中1份。', scene: 'third', question: '第一天读了多少页？', options: ['120页', '40页', '80页', '30页'], answer: 1, feedback: ['120是整本书的页数；第一天只读了3份中的1份。', '正确。120÷3＝40，第一天读了40页。', '80是剩下的2份；题目问第一天读的1份。', '30是把120分成4份。这一步说的是1/3，要分成3份。'], explanationHtml: '<p>“全书的1/3”以整本书120页为标准。平均分成3份，取1份：<strong>120÷3＝40页</strong>。</p>' },
      { id: 'reference', label: '换比较标准', title: '“比第一天多1/4”，要把谁分成4份？', lead: '这次比较的是第二天和第一天，标准换成了第一天的40页。', scene: 'base', question: '计算“多出的1/4”时，应该把哪个数分成4份？', options: ['第一天的40页', '全书的120页', '剩下的80页', '已经多出的10页'], answer: 0, feedback: ['正确。“比第一天多”，就把第一天的40页作为标准。', '1/4前面的比较对象是“第一天”，所以标准是40页，不是全书120页。', '题目没有说“剩下页数的1/4”，80页不是这次的比较标准。', '10页是40÷4算出来的结果，不能先把结果当作标准。'], explanationHtml: '<p>“比第一天多1/4”的意思是：多出的页数占第一天页数的1/4。<strong>多出的页数＝40÷4＝10页</strong>。</p>' },
      { id: 'second-day', label: '4份加1份', title: '多1/4，就是原来的4份再加1份', lead: '每份10页。第二天包含原来的40页，还要加上多出的10页。', scene: 'more', question: '第二天一共读了多少页？', options: ['10页', '30页', '50页', '70页'], answer: 2, feedback: ['10页只是多出的部分，还要加上原来的40页。', '30页是少1/4的结果；题目说多1/4。', '正确。40＋10＝50，第二天读了50页。', '70来自40＋120÷4；增加的1/4应该以40页为标准。'], explanationHtml: '<p>多出的1份是40÷4＝10页；第二天是4份＋1份：<strong>40＋10＝50页</strong>。</p>' }
    ],
    practice: [
      { id: 'practice-less', label: '训练一 · 多改成少', title: '第二天比第一天少读1/4呢？', lead: '仍是一本120页的书，第一天读全书的1/3。只把第二天改成“比第一天少读1/4”，第二天读多少页？', scene: 'less', options: ['10页', '30页', '40页', '50页'], answer: 1, feedback: ['10页是少读的部分，不是第二天剩下的页数。', '正确。第一天40页，少读40÷4＝10页，所以第二天30页。', '40页是第一天的页数，还要减去它的1/4。', '50页是“多1/4”的结果；这次改成“少1/4”。'], explanationHtml: '<p>第一天：120÷3＝40页。少读的部分：40÷4＝10页。第二天：<strong>40−10＝30页</strong>。</p>' },
      { id: 'practice-total', label: '训练二 · 求两天的合计', title: '回到原题，两天一共读了多少页？', lead: '恢复原题条件：第一天读全书的1/3，第二天比第一天多读1/4。这次问两天一共读了多少页。', scene: 'total', options: ['50页', '80页', '90页', '170页'], answer: 2, feedback: ['50页只是第二天，还要加上第一天的40页。', '两天读的页数不一样：第一天40页，第二天比它多10页。', '正确。40＋50＝90，两天一共读了90页。', '120页是全书总页数，不是第一天读的页数。'], explanationHtml: '<p>第一天40页，第二天50页。求两天合计，就把两天读的页数相加：<strong>40＋50＝90页</strong>。</p>' }
    ],
    mountVisual
  };
})();
