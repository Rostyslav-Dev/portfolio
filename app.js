(()=>{'use strict';
 const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
 const EN=document.documentElement.lang==='en',BASE=EN?'../':'',tx=(uk,en)=>EN?en:uk;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),journey=$('.journey'),stage=$('.stage'),work=$('#work'),copies=$$('[data-scene]'),chapterButtons=$$('[data-progress]');
 const clamp=v=>Math.max(0,Math.min(1,v)),smooth=(a,b,x)=>{const v=clamp((x-a)/(b-a));return v*v*(3-2*v);};
 const windows=[[0,0,.07,.105],[.12,.145,.21,.255],[.29,.32,.36,.395],[.475,.495,.53,.55],[.555,.575,.64,.685],[.725,.75,.83,.87],[.9,.925,1,1.02]];
 let target=0,current=0,raf=0,time=0,last=0,visible=true,renderer=null,workVisible=false,introClock=0;
 try{renderer=new window.Cosmos($('#space'),$('#objects'));renderer.onReady=schedule;}catch(error){console.info('Space image fallback enabled.');$('#space').hidden=true;}
 let lastPaint=0;
 function measure(){const r=journey.getBoundingClientRect();target=clamp(-r.top/Math.max(1,journey.offsetHeight-stage.offsetHeight));visible=r.bottom>0&&r.top<innerHeight;const wr=work.getBoundingClientRect();workVisible=wr.bottom>0&&wr.top<innerHeight;$('.header').classList.toggle('scrolled',scrollY>60);schedule();}
 function draw(now){raf=0;if(document.hidden){last=0;return;}if(innerWidth<768&&now-lastPaint<32&&lastPaint){raf=requestAnimationFrame(draw);return;}lastPaint=now;const delta=last?Math.min(100,now-last):16;last=now;time+=delta/1000;introClock+=delta/1000;
  current=current+(target-current)*.12;if(Math.abs(current-target)<.0001)current=target;
  const p=current;let selected=chapterButtons.reduce((best,b,i)=>Math.abs(Number(b.dataset.progress)-p)<Math.abs(Number(chapterButtons[best].dataset.progress)-p)?i:best,0),highest=0;
  copies.forEach((copy,i)=>{const [a,b,c,d]=windows[i];let opacity=(i===0?1:smooth(a,b,p))*(1-smooth(c,d,p));if(i===0)opacity*=smooth(.25,1.6,introClock);copy.style.opacity=opacity;copy.style.transform=`translateY(calc(-40% + ${(1-opacity)*23}px))`;copy.inert=opacity<.3;copy.setAttribute('aria-hidden',String(opacity<.3));copy.classList.toggle('active',opacity>=.3);if(opacity>highest){highest=opacity;selected=i;}});
  chapterButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));$('#sector').textContent=String(selected+1).padStart(2,'0');$('.flight-progress span').style.transform=`scaleX(${p})`;
  if(renderer&&visible)renderer.render(p,time,false);
  if(workVisible){
   const r=work.getBoundingClientRect(),v=clamp((innerHeight-r.top)/(innerHeight+r.height));
   const flight=.5+.5*Math.sin(time*.28+v*6.28),ship=$('.ufo-flight');
   const shipWidth=ship.offsetWidth||(innerWidth<680?155:210);
   const x=258+flight*Math.max(0,innerWidth-shipWidth-36);
   const band=Math.max(35,Math.min(r.height-170,120-r.top));
   ship.style.transform=`translate(${x}px,${band+Math.sin(time*.5+v*6.28)*28}px) rotate(${Math.cos(time*.28+v*6.28)*-9}deg)`;
  }
  if(visible||workVisible)raf=requestAnimationFrame(draw);
 }
 function schedule(){if(!raf)raf=requestAnimationFrame(draw);}
 addEventListener('scroll',measure,{passive:true});addEventListener('resize',measure,{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden){last=0;measure();}});$('#space').addEventListener('webglcontextlost',e=>{e.preventDefault();renderer?.useFallback();measure();});
 $('#space').addEventListener('webglcontextrestored',()=>{renderer?.initGL();measure();});addEventListener('pageshow',measure);
 chapterButtons.forEach(b=>b.addEventListener('click',()=>{scrollTo({top:journey.offsetTop+Number(b.dataset.progress)*(journey.offsetHeight-stage.offsetHeight),behavior:reduced.matches?'instant':'smooth'});}));
 const menu=$('#mobile-nav'),toggle=$('.menu-toggle');function closeMenu(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label',tx('Відкрити меню','Open menu'));toggle.textContent='☰';}
 toggle.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?tx('Закрити меню','Close menu'):tx('Відкрити меню','Open menu'));toggle.textContent=open?'×':'☰';});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.06});$$('.reveal').forEach(el=>observer.observe(el));document.documentElement.classList.add('enhanced');}
 $$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const filter=button.dataset.filter;$$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$$('.project').forEach(card=>{card.hidden=filter!=='all'&&card.dataset.category!==filter;if(!card.hidden)card.classList.add('visible');});measure();}));
 const projects={
  massage:{title:'МАСАЖ ТА ВІДНОВЛЕННЯ',type:'САЙТ / ІНТЕРАКТИВНИЙ КОНЦЕПТ',image:'assets/massage.webp',description:'Інтерактивний концепт масажної студії. Карта тіла, конструктор сеансу, вибір майстра, демонстраційний запис і персональна подарункова картка. Власні AI-зображення та адаптивна верстка. Це демо без реального бронювання чи оплати.',tags:['Інтерактивний UX','Конструктор сеансу','Адаптивність'],link:'projects/massage/index.html',linkText:'Дивитися демо сайту'},
  aurea:{title:'AURÉA',type:'САЙТ / АВТОРСЬКА КОНЦЕПЦІЯ',image:'assets/aurea.webp',description:'Концепція преміального масажного простору. Теплі фактури, стримана типографіка та подорож між сценами, керована прокруткою. Структура, тексти, візуальна система й адаптивний сайт.',tags:['Вебдизайн','Scroll-анімація','Адаптивність'],link:'projects/aurea/index.html',linkText:'Дивитися сайт'},
  lunar:{title:'LUNAR OBSERVATORY',type:'АВТОРСЬКИЙ AI-КОНЦЕПТ / АРХІТЕКТУРА',image:'assets/lunar.webp',description:'Уявна місячна обсерваторія: монументальна форма, метал, тепле світло та безмежний горизонт. Візуальна історія, створена спеціально для цього портфоліо. Демонструє роботу з композицією, атмосферою й AI-інструментами.',tags:['Art direction','AI-візуал','Архітектурна фантазія']},
  ion:{title:'SOUND / BEYOND',type:'АВТОРСЬКИЙ AI-КОНЦЕПТ / ПРЕДМЕТНА РЕКЛАМА',image:'assets/ion.webp',description:'Рекламна сцена з уявними навушниками без бренду. Графіт, мідне світло та плавний рух металу формують виразний образ продукту. Створено спеціально для портфоліо як демонстрацію предметної візуалізації.',tags:['Продуктова сцена','AI-креатив','Світло та матеріали']}
 };

 if(EN){
  Object.assign(projects.massage,{title:'MASSAGE & RECOVERY',type:'WEBSITE / INTERACTIVE CONCEPT',description:'An interactive massage studio concept with a body map, session builder, therapist selection, demo booking and a personalised gift card. Original AI imagery and responsive development. A portfolio demo without real bookings or payments.',tags:['Interactive UX','Session builder','Responsive layout'],linkText:'View website demo (Ukrainian)'});
  Object.assign(projects.aurea,{type:'WEBSITE / ORIGINAL CONCEPT',description:'A premium massage studio concept. Warm textures, restrained typography and a scroll-driven journey between spaces. Structure, copy, visual identity and responsive development.',tags:['Web design','Scroll animation','Responsive layout'],linkText:'View website demo (Ukrainian)'});
  Object.assign(projects.lunar,{type:'ORIGINAL AI CONCEPT / ARCHITECTURE',description:'An imagined lunar observatory: monumental form, metal, warm light and an endless horizon. Created specifically for this portfolio to explore composition, atmosphere and AI-assisted art direction.',tags:['Art direction','AI visual','Architectural concept']});
  Object.assign(projects.ion,{type:'ORIGINAL AI CONCEPT / PRODUCT ADVERTISING',description:'An advertising scene featuring fictional, unbranded headphones. Graphite surfaces, copper light and flowing metal create a distinctive product image. Made specifically for this portfolio.',tags:['Product scene','AI creative','Light and materials']});
 }
 $$('a[hreflang]').filter(a=>a.closest('.language-switch')).forEach(a=>a.addEventListener('click',()=>{if(location.hash){const url=new URL(a.href);url.hash=location.hash;a.href=url.href;}}));
 addEventListener('resize',()=>{if(innerWidth>680)closeMenu();},{passive:true});
 const dialog=$('#project-dialog');let opener=null;
 $$('[data-project]').forEach(button=>button.addEventListener('click',()=>{const data=projects[button.dataset.project];if(!data)return;opener=button;$('#dialog-image').src=BASE+data.image;$('#dialog-image').alt=data.title;$('#dialog-title').textContent=data.title;$('#dialog-type').textContent=data.type;$('#dialog-description').textContent=data.description;$('#dialog-tags').replaceChildren(...data.tags.map(t=>{const span=document.createElement('span');span.textContent=t;return span;}));const link=$('#dialog-link');link.hidden=!data.link;if(data.link){link.href=BASE+data.link;link.textContent=data.linkText+' ↗';}dialog.showModal();document.body.classList.add('modal-open');}));
 $('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');opener?.focus();});
 $('#year').textContent=new Date().getFullYear();measure();
})();
