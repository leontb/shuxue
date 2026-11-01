(function(){
 'use strict';
 function at(t){
   t=Math.max(0,Number(t)||0);
   const p=2*t-30;
   let q=-7,dir=0;
   if(t>=5){const r=(t-5)%12;dir=r<6?1:-1;q=r<=6?-7+3*r:29-3*r;}
   return {t,p,q,m:q-3,n:q+3,gap:Math.abs(p-q),dir};
 }
 function fmt(n){const v=Math.abs(n)<1e-8?0:n;return Number(v.toFixed(2)).toString().replace('-','−');}
 window.BounceMath={at,fmt};
})();
