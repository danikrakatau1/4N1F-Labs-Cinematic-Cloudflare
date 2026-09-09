(()=>{
  'use strict';
  const presets={
    quick:['fetch','xray','dna'],
    deep:['fetch','xray','dna','components','responsive','assets','behavior','routes'],
    twin:['fetch','xray','dna','components','responsive','assets','behavior','routes','diff','twin']
  };
  const labels={fetch:'Fetch Engine',xray:'Source X-Ray',dna:'Design DNA',components:'Components',responsive:'Responsive DNA',assets:'Asset Intelligence',behavior:'Behavior Map',routes:'Route Graph',diff:'Visual Diff',twin:'Twin Mode'};
  const modules=[...document.querySelectorAll('.module')],presetButtons=[...document.querySelectorAll('.preset')],count=document.getElementById('moduleCount'),presetLabel=document.getElementById('presetLabel'),depthScore=document.getElementById('depthScore'),depthFill=document.getElementById('depthFill'),stack=document.getElementById('stackList'),plan=document.getElementById('planOutput'),target=document.getElementById('targetUrl'),planBtn=document.getElementById('planBtn');
  let activePreset='quick';
  const enabled=()=>modules.filter(m=>m.classList.contains('enabled')).map(m=>m.dataset.module);
  function render(){
    const list=enabled();
    const pct=Math.round(list.length/modules.length*100);
    count.textContent=`${list.length} / ${modules.length} selected`;
    depthScore.textContent=`${pct}%`;depthFill.style.width=`${pct}%`;
    stack.innerHTML=list.map((id,i)=>`<div class="stack-item"><span>${String(i+1).padStart(2,'0')} · ${labels[id]}</span><code>${id==='fetch'?'CORE':'MODULE'}</code></div>`).join('');
    presetLabel.textContent=`${activePreset.toUpperCase()} GENOME`;
  }
  function applyPreset(name){activePreset=name;presetButtons.forEach(b=>b.classList.toggle('active',b.dataset.preset===name));modules.forEach(m=>m.classList.toggle('enabled',presets[name].includes(m.dataset.module)));plan.textContent=`${name.toUpperCase()} pipeline staged · ${presets[name].map(id=>labels[id]).join(' → ')}`;render()}
  presetButtons.forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.preset)));
  modules.forEach(m=>m.addEventListener('click',()=>{if(m.dataset.module==='fetch')return;m.classList.toggle('enabled');activePreset='custom';presetButtons.forEach(b=>b.classList.remove('active'));plan.textContent='CUSTOM pipeline staged · shell only, no network request.';render()}));
  planBtn.addEventListener('click',()=>{const host=String(target.value||'').trim()||'website-authorized.com';plan.textContent=`PLAN READY · ${host} · ${enabled().map(id=>labels[id]).join(' → ')} · execution disabled in Shell V1.`});
  target.addEventListener('keydown',e=>{if(e.key==='Enter')planBtn.click()});
  render();
})();
