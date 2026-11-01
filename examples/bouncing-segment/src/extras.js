(() => {
  'use strict';
  const root=document.getElementById('practice');
  if(!root)return;
  const answers=[1,2],chosen=[null,null];
  const handledClicks=new WeakSet();
  let advanceTimer=null,advanceToken=0;
  const reduceMotion=()=>window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const feedback=[
    [
      '14.4 秒是相遇前的一次。相遇后，两点还会从距离 0 分开到 2，再找另一个时刻。',
      '<strong>正确。</strong>相遇前：11＋17÷5＝14.4；相遇后：11＋21÷5＝15.2。自动进入训练二…',
      '3.4 秒和 4.2 秒是从第 11 秒开始又经过的时间。题目中的 t 从 P 出发时算起，要分别加上 11。',
      '14.8 秒是两点相遇的时刻，此时距离为 0。相距 2 会发生在相遇前、后。'
    ],
    [
      '−1 是左端点 M 的坐标。题目问右端点 N，要在 M 的坐标上加上线段长 6。',
      '2 是中点 Q 的坐标。右端点 N 还在 Q 的右边 3 个单位。',
      '<strong>正确，本题已完成。</strong>从第 17 秒起又向右走 3 秒，N＝−4＋3×3＝5。',
      '14 是右侧折返点，N 要到第 23 秒才到达那里。第 20 秒还没到折返点。'
    ]
  ];
  function cancelAdvance(){
    advanceToken++;
    if(advanceTimer!==null){clearTimeout(advanceTimer);advanceTimer=null;}
    if(chosen[0]===answers[0]){
      document.getElementById('bx-feedback-0').innerHTML='<strong>正确。</strong>全部答案是 14.4 秒和 15.2 秒。';
    }
  }
  function renderQuestion(q){
    root.querySelectorAll('[data-bx-question="'+q+'"]').forEach(button=>{
      const selected=Number(button.dataset.bxOption)===chosen[q];
      const correct=selected&&chosen[q]===answers[q];
      button.setAttribute('aria-pressed',String(selected));
      button.classList.toggle('bx-correct',correct);
      button.classList.toggle('bx-wrong',selected&&!correct);
      button.querySelector('.bx-mark').textContent=selected?(correct?'✓':'×'):'';
    });
    const box=document.getElementById('bx-feedback-'+q);
    box.hidden=chosen[q]===null;
    box.classList.toggle('bx-correct',chosen[q]===answers[q]);
    box.innerHTML=chosen[q]===null?'':feedback[q][chosen[q]];
  }
  function choose(q,option){
    cancelAdvance();
    chosen[q]=option;
    renderQuestion(q);
    if(q!==0||option!==answers[0])return;
    const token=advanceToken;
    advanceTimer=setTimeout(()=>{
      advanceTimer=null;
      if(token!==advanceToken||chosen[0]!==answers[0]||document.hidden)return;
      const box=document.getElementById('bx-feedback-0');
      box.innerHTML='<strong>正确。</strong>全部答案是 14.4 秒和 15.2 秒。';
      const card=document.getElementById('practice-2');
      card.scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'start'});
      document.getElementById('bx-p2-title').focus({preventScroll:true});
    },600);
  }
  root.addEventListener('click',event=>{
    handledClicks.add(event);
    const button=event.target.closest('[data-bx-question][data-bx-option]');
    if(button&&root.contains(button)){
      const q=Number(button.dataset.bxQuestion),option=Number(button.dataset.bxOption);
      if((q===0||q===1)&&Number.isInteger(option)&&option>=0&&option<4)choose(q,option);
    }else if(event.target.closest('button,summary,a'))cancelAdvance();
  });
  document.addEventListener('click',event=>{
    if(handledClicks.has(event))return;
    if(event.target.closest('button,summary,a'))cancelAdvance();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAdvance();});
  function reset(){
    cancelAdvance();chosen[0]=chosen[1]=null;
    renderQuestion(0);renderQuestion(1);
    root.querySelectorAll('details').forEach(detail=>{detail.open=false;});
  }
  window.BounceExtras={reset,cancelAdvance};
  reset();
})();
