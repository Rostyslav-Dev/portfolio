(()=>{
'use strict';
const SceneRenderer=window.SceneRenderer;

const journey=document.querySelector('.journey');
const stage=document.querySelector('.stage');
const copies=[...document.querySelectorAll('[data-copy]')];
const chapterLinks=[...document.querySelectorAll('.chapters a')];
const fallback=[...document.querySelectorAll('.scene-fallback img')];
const progressBar=document.querySelector('.journey-progress span');
const sceneNumber=document.querySelector('#scene-number');
const closingImage=document.querySelector('.editorial-closing > img');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const stops=[0,.47,.9];
let renderer=null, current=0, target=0, frame=0, rendererGeneration=0;
const clamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};

function paint(p){
 if(closingImage){
  const rect=closingImage.parentElement.getBoundingClientRect();
  if(rect.top<innerHeight&&rect.bottom>0){
   const travel=clamp((innerHeight-rect.top)/(innerHeight+rect.height));
   closingImage.style.transform=`translateY(${(travel-.5)*7}%)`;
  }
 }
 const weights=[
  1-smooth(.12,.23,p),smooth(.32,.40,p)*(1-smooth(.55,.65,p)),smooth(.75,.83,p)
 ];
 const active=p<.31?0:p<.72?1:2;
 copies.forEach((copy,i)=>{
  const w=weights[i];copy.style.opacity=w;copy.style.transform=`translateY(calc(-50% + ${(1-w)*18}px))`;
  const usable=w>.45;copy.inert=!usable;copy.style.pointerEvents=usable?'auto':'none';
  copy.setAttribute('aria-hidden',String(!usable));
 });
 chapterLinks.forEach((link,i)=>{if(i===active)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');});
 sceneNumber.textContent=String(active+1).padStart(2,'0');
 progressBar.style.transform=`scaleX(${p})`;
 if(renderer)renderer.render(p);
 else{
  const first=smooth(.20,.38,p);
  const second=smooth(.62,.79,p);
  fallback[1].style.opacity=first;fallback[2].style.opacity=second;
  fallback.forEach((image,i)=>image.style.transform=`scale(${[1+1.75*smooth(0,.4,p),1+1.05*smooth(.36,.81,p),1.24-.24*smooth(.69,1,p)][i]})`);
 }
}
function animate(){
 frame=0;if(document.hidden)return;
 current=current+(target-current)*.105;
 if(Math.abs(target-current)<.00005)current=target;
 paint(current);
 if(current!==target)frame=requestAnimationFrame(animate);
}
function schedule(){if(!frame)frame=requestAnimationFrame(animate);}
function update(){
 {const header=document.querySelector('.header').offsetHeight;const start=journey.getBoundingClientRect().top+scrollY-header;target=clamp((scrollY-start)/Math.max(1,journey.offsetHeight-stage.offsetHeight));}
 schedule();
}
function goToChapter(index){
 const header=document.querySelector('.header').offsetHeight;
 const top=journey.getBoundingClientRect().top+scrollY-header+stops[index]*(journey.offsetHeight-stage.offsetHeight);
 window.scrollTo({top,behavior:reduced.matches?'auto':'smooth'});
}
document.querySelectorAll('[data-chapter]').forEach(link=>link.addEventListener('click',event=>{
 event.preventDefault();goToChapter(Number(link.dataset.chapter));
}));
window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update,{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
const canvas=document.querySelector('#journey-canvas');
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();rendererGeneration++;renderer=null;document.documentElement.classList.remove('has-webgl');update();});

canvas.addEventListener('webglcontextrestored',initRenderer);
window.addEventListener('pageshow',update);

// Native scrolling owns the timeline. No wheel interception or scroll hijacking.
update();

// Editorial reveals are progressive enhancement; all content is visible without JS.
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});
 },{threshold:.1,rootMargin:'0px 0px -20px 0px'});
 document.querySelectorAll('.reveal').forEach(element=>observer.observe(element));
 document.documentElement.classList.add('motion-ready');
}
const ritualCaptions=['Дозвольте собі сповільнитися','Поверніть увагу до себе','Відчуйте тепло природи'];
document.querySelectorAll('.ritual-list details').forEach(item=>item.addEventListener('toggle',()=>{
 if(!item.open)return;
 document.querySelectorAll('.ritual-list details').forEach(other=>{if(other!==item)other.open=false;});
 const index=Number(item.dataset.ritual);
 document.querySelectorAll('[data-ritual-visual]').forEach(visual=>{
  const active=Number(visual.dataset.ritualVisual)===index;
  visual.classList.toggle('active',active);visual.setAttribute('aria-hidden',String(!active));
 });
 document.querySelector('#ritual-image-number').textContent=`0${index+1} / 03`;
 document.querySelector('#ritual-image-caption').textContent=ritualCaptions[index];
}));
async function initRenderer(){
 const generation=++rendererGeneration;
 try{
  const candidate=new SceneRenderer(canvas);
  await candidate.load(['assets/stone.webp','assets/lounge.webp','assets/treatment.webp']);
  if(generation!==rendererGeneration)return;
  renderer=candidate;renderer.render(current);document.documentElement.classList.add('has-webgl');update();
 }catch(error){
  if(generation!==rendererGeneration)return;
  renderer=null;document.documentElement.classList.remove('has-webgl');update();
  console.info('AURÉA: using animated image transitions.');
 }
}
initRenderer();
})();
