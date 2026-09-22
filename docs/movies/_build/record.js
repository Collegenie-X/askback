const {chromium}=require('playwright-core');
const URL='https://askback-omega.vercel.app/';
const VP={width:1920,height:1080};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function clip(name, fn){
  const b=await chromium.launch({channel:'chrome',headless:true});
  const ctx=await b.newContext({viewport:VP,recordVideo:{dir:'rec',size:VP},deviceScaleFactor:1});
  const p=await ctx.newPage(); const T0=Date.now(); p.mark=(l)=>console.log(name,'@',((Date.now()-T0)/1000).toFixed(1),l);
  try{ await fn(p); }catch(e){ console.error(name,'ERR',e.message.split('\n')[0]); await p.screenshot({path:`rec/${name}-err.png`}); }
  const v=p.video(); await ctx.close(); await v.saveAs(`rec/${name}.webm`); await b.close(); console.log('saved',name);
}
async function drift(p, sel, px, ms){ const steps=Math.round(ms/40); for(let i=0;i<steps;i++){ await p.evaluate(([s,d])=>{const e=s?document.querySelector(s):document.scrollingElement; e.scrollBy(0,d)},[sel,px/steps]); await sleep(40);} }
// 섹션 id 로 부드럽게 이동 (상단 sticky nav 만큼 여유)
async function go(p, id, off=70){ await p.evaluate(([id,off])=>{const e=document.getElementById(id); const y=e.getBoundingClientRect().top+window.scrollY-off; window.scrollTo({top:y,behavior:'smooth'})},[id,off]); await sleep(1400); }
async function goEl(p, sel, off=90){ await p.evaluate(([s,off])=>{const e=document.querySelector(s); const y=e.getBoundingClientRect().top+window.scrollY-off; window.scrollTo({top:y,behavior:'smooth'})},[sel,off]); await sleep(1400); }
async function about(p){ await p.goto(URL+'about',{waitUntil:'networkidle'}); await sleep(1200); }
async function tabs(p, sectionId, n, gap, from=1){ const sec=p.locator(`#${sectionId}`); for(let i=from;i<n;i++){ await sec.locator('[role=tab]').nth(i).click(); p.mark('tab'+i); await sleep(gap);} }
async function toChat(p){
  await p.goto(URL,{waitUntil:'networkidle'}); await sleep(1500);
  await p.getByText('건너뛰기').click(); await sleep(600);
  await p.getByText('예시 프로젝트 먼저 보기').click(); await sleep(600);
  await p.getByRole('button',{name:/🌱 스마트 화분/}).click(); await sleep(2500);
}
(async()=>{
 await clip('hero', async p=>{ await about(p); p.mark('show'); await sleep(9000); });
 await clip('gate', async p=>{ await about(p); await go(p,'gate'); p.mark('top'); await sleep(3500); await goEl(p,'#gate [role=tablist]',260); p.mark('tabs'); await sleep(1200); await tabs(p,'gate',4,2200); await sleep(1500); });
 await clip('problem', async p=>{ await about(p); await go(p,'problem'); p.mark('top'); await sleep(4500); await goEl(p,'#problem [role=tablist]',200); p.mark('tabs'); await sleep(1000); await tabs(p,'problem',4,2000); await sleep(1500); });
 await clip('gap', async p=>{ await about(p); await go(p,'gap'); p.mark('top'); await sleep(3000); await drift(p,null,320,3500); p.mark('axes'); await sleep(4000); });
 await clip('who', async p=>{ await about(p); await go(p,'who'); p.mark('top'); await sleep(3200); await tabs(p,'who',4,3200); await sleep(1500); });
 await clip('rules', async p=>{ await about(p); await go(p,'rules'); p.mark('top'); await sleep(9000); });
 await clip('how', async p=>{ await about(p); await go(p,'how'); p.mark('top'); await sleep(4000); await goEl(p,'#how h3',110); p.mark('cycle'); await sleep(1200); await tabs(p,'how',6,1900); await sleep(1500); });
 await clip('askback', async p=>{ await about(p); await go(p,'askback'); p.mark('top'); await sleep(4000); await drift(p,null,520,4500); p.mark('cards'); await sleep(4500); });
 await clip('formats', async p=>{ await about(p); await go(p,'formats'); p.mark('top'); await sleep(2500); await tabs(p,'formats',5,2200); await sleep(1000); });
 await clip('output', async p=>{ await about(p); await go(p,'output'); p.mark('top'); await sleep(5000); await drift(p,null,560,4000); p.mark('report'); await sleep(4000); });
 await clip('weeks', async p=>{ await about(p); await go(p,'weeks'); p.mark('top'); await sleep(5000); await goEl(p,'#weeks h3',110); p.mark('stairs'); await sleep(1200); for(let i=1;i<6;i++){ await p.locator('#weeks button[aria-label^="'+(i+1)+'단계"]').click(); p.mark('step'+i); await sleep(1500);} await sleep(1500); });
 await clip('position', async p=>{ await about(p); await go(p,'position'); p.mark('top'); await sleep(5000); await drift(p,null,420,3500); p.mark('mandate'); await sleep(4500); });
 await clip('closing', async p=>{ await about(p); await p.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})); await sleep(1600); p.mark('banner'); await sleep(8000); });
 // 실제 앱 시연
 await clip('ask', async p=>{ await toChat(p); await drift(p,'.stage .scroll',60000,1200); await sleep(600);
   const box=p.locator('.stage textarea, .stage input[type=text]').last(); await box.click(); p.mark('type');
   for(const ch of '흙 센서값이 400 밑이면 펌프 3초 켜는 코드 짜줘'){ await box.type(ch); await sleep(60); }
   await sleep(600); p.mark('send'); await p.locator('.stage button[aria-label="보내기"]').last().click(); await sleep(6500); p.mark('answered');
   await drift(p,'.stage .scroll',60000,3000); p.mark('bottom'); await sleep(4000); });
 await clip('rq', async p=>{ await toChat(p);
   const ok=await p.evaluate(()=>{const el=[...document.querySelectorAll('.stage .scroll *')].find(e=>e.children.length===0&&/320/.test(e.textContent)&&/610/.test(e.textContent)); if(!el) return false; el.scrollIntoView({block:'center'}); return el.textContent.slice(0,60)}); console.log('found320',ok);
   p.mark('measure'); await sleep(3500);
   const ok2=await p.evaluate(()=>{const el=[...document.querySelectorAll('.stage .scroll *')].find(e=>e.children.length===0&&/센서 선이 빠져서/.test(e.textContent)); if(!el) return false; el.scrollIntoView({block:'center',behavior:'smooth'}); return el.textContent.slice(0,60)}); console.log('foundRQ',ok2);
   await sleep(1200); p.mark('rq'); await sleep(4000); });
 await clip('report', async p=>{ await toChat(p); await p.locator('button[title^="다음 리포트까지"]').click(); p.mark('list'); await sleep(2500);
   await p.getByRole('button',{name:/센서에서 공유까지/}).first().click(); await sleep(2500); p.mark('detail'); await drift(p,'[role=dialog] .scroll',900,6000); await sleep(1500); });
 // 로고 SVG → PNG (타이틀·엔딩 카드용)
 { const b=await chromium.launch({channel:'chrome',headless:true}); const ctx=await b.newContext({viewport:{width:1400,height:900}}); const p=await ctx.newPage(); await p.goto(URL+'about',{waitUntil:'networkidle'}); await sleep(1500);
   const svgs=await p.evaluate(()=>{const pick=(sel)=>document.querySelector(sel)?.outerHTML; return {logo:pick('.banner svg'), hero:pick('.about h1')?null:null}});
   for(const [k,svg] of Object.entries(svgs)){ if(!svg){console.log('no',k);continue;} const q=await ctx.newPage(); await q.setContent(`<html><body style="margin:0;background:transparent">${svg.replace(/width="\d+"/,'width="600"').replace(/height="\d+"/,'height="600"')}</body></html>`); await q.locator('svg').screenshot({path:`svg/${k}.png`,omitBackground:true}); console.log('png',k); }
   await b.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
