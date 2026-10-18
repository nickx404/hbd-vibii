(() => {
  'use strict';
  const content = window.MISSION_CONTENT;
  const $ = s => document.querySelector(s);
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let current = Math.max(0, content.chapters.findIndex(c => c.id === location.hash.slice(1)));
  let connected = false, hugged = false, candlesBlown = false, busy = false, style = 'cartoon';
  let memoryMode = 'cluster', memoryPage = 0, activeModalMemoryIndex = -1;
  const face = 'assets/adhi-face.png';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let changeTimer, finishTimer;
  let micStream=null, micContext=null, micFrame=null, micPending=false, micRequest=0;
  const ACCESS_CODE='9524';
  const ACCESS_SESSION_KEY='birthday-mission-cleared';
  const music = new Audio('assets/song.mp3');
  music.id='background-music';music.hidden=true;document.body.append(music);
  music.loop=true;music.preload='none';music.volume=.55;
  let musicAllowed=false, musicHeld=false, musicFade=null, musicResumeTimer;

  function fadeMusic(target, duration=700){
    if(musicFade){cancelAnimationFrame(musicFade.frame);musicFade.resolve();musicFade=null;}
    const volume=music.volume, start=performance.now();
    return new Promise(resolve=>{
      const fade={resolve,frame:null};musicFade=fade;
      function step(now){
        const progress=Math.min(1,(now-start)/duration);
        music.volume=volume+(target-volume)*progress;
        if(progress<1)fade.frame=requestAnimationFrame(step);
        else{musicFade=null;resolve();}
      }
      fade.frame=requestAnimationFrame(step);
    });
  }
  function startMusic(){
    if(!musicAllowed||musicHeld||document.hidden||!music.paused)return;
    music.play().catch(()=>{});
  }
  function resumeMusic(){
    clearTimeout(musicResumeTimer);musicHeld=false;
    startMusic();fadeMusic(.55);
  }
  // A fresh gesture also retries playback when a browser blocks autoplay after refresh.
  document.addEventListener('pointerdown',startMusic);
  document.addEventListener('keydown',startMusic);

  function setupPasswordGate(){
    const gate=$('#password-gate'),form=$('#password-form'),input=$('#password-input');
    const dots=[...document.querySelectorAll('.code-dots span')];
    const surfaces=[...document.querySelectorAll('body > header, body > main, body > dialog, #warp')];
    const status=$('#password-status');
    try{
      if(sessionStorage.getItem(ACCESS_SESSION_KEY)==='yes'){
        gate.hidden=true;
        document.body.classList.remove('site-locked');
        musicAllowed=true;startMusic();
        return;
      }
    }catch{}
    surfaces.forEach(surface=>{surface.inert=true;surface.setAttribute('aria-hidden','true');});

    function updateCode(value){
      input.value=value.replace(/\D/g,'').slice(0,4);
      dots.forEach((dot,index)=>dot.classList.toggle('filled',index<input.value.length));
      status.textContent='Awaiting four-digit code.';
      gate.classList.remove('wrong');
    }
    function rejectCode(message){
      gate.classList.remove('wrong');
      void gate.offsetWidth;
      gate.classList.add('wrong');
      status.textContent=message;
      updateCode('');
      status.textContent=message;
      input.focus();
    }
    document.querySelectorAll('[data-lock-digit]').forEach(button=>button.addEventListener('click',()=>{
      if(input.value.length<4)updateCode(input.value+button.dataset.lockDigit);
      input.focus();
    }));
    $('.key-delete').addEventListener('click',()=>{updateCode(input.value.slice(0,-1));input.focus();});
    input.addEventListener('input',()=>updateCode(input.value));
    form.addEventListener('submit',event=>{
      event.preventDefault();
      if(input.value.length!==4){rejectCode('The launch code needs four numbers.');return;}
      if(input.value!==ACCESS_CODE){rejectCode('That code missed its orbit. Try again.');return;}
      musicAllowed=true;startMusic();
      try{sessionStorage.setItem(ACCESS_SESSION_KEY,'yes');}catch{}
      status.textContent='Clearance confirmed.';
      document.body.classList.add('site-unlocking');
      setTimeout(()=>{
        gate.hidden=true;
        document.body.classList.remove('site-locked','site-unlocking');
        surfaces.forEach(surface=>{surface.inert=false;surface.removeAttribute('aria-hidden');});
        window.scrollTo({top:0,behavior:'instant'});
        $('#chapter-title').setAttribute('tabindex','-1');
        $('#chapter-title').focus({preventScroll:true});
      },850);
    });
    requestAnimationFrame(()=>input.focus());
  }
  const starfield = $('#starfield');
  for (let i = 0; i < 220; i++) {
    const star = document.createElement('span');
    star.className = i % 43 === 0 ? 'star cross-star' : 'star';
    if (i % 43 === 0) star.textContent = '+';
    star.style.cssText = `left:${(i * 47.31) % 100}%;top:${(i * i * 13.73 + i * 29.73) % 100}%;width:${i % 9 === 0 ? 4 : i % 3 === 0 ? 2.5 : 1.5}px;height:${i % 9 === 0 ? 4 : i % 3 === 0 ? 2.5 : 1.5}px;--brightness:${.65 + (i % 6) * .07};--star-color:${i % 7 === 0 ? "#f9dfb7" : "#e6edff"};--duration:${1.4 + (i % 5) * .4}s;animation-delay:-${i % 7}s`;
    starfield.append(star);
  }
  const defs = `<defs><radialGradient id="planet"><stop stop-color="#8eb7ab"/><stop offset=".7" stop-color="#62998d"/><stop offset="1" stop-color="#35645f"/></radialGradient><radialGradient id="halo"><stop stop-color="#7cb8ac" stop-opacity=".22"/><stop offset="1" stop-color="#7cb8ac" stop-opacity="0"/></radialGradient><radialGradient id="nebula"><stop stop-color="#d08a9d" stop-opacity=".55"/><stop offset=".5" stop-color="#b4769c" stop-opacity=".18"/><stop offset="1" stop-color="#b4769c" stop-opacity="0"/></radialGradient><linearGradient id="visor" x2="1" y2="1"><stop stop-color="#304957"/><stop offset="1" stop-color="#10252f"/></linearGradient><clipPath id="face-clip"><ellipse cx="0" cy="-50" rx="32" ry="30"/></clipPath></defs>`;
  function astronautBase(x, y, scale, wife, sleeping = false) {
    const suit = wife ? '#ed947e' : '#e6debd';
    return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="${wife ? 'float' : 'float-other'}"><rect x="-49" y="-12" width="21" height="64" rx="9" fill="#537c79" stroke="#172f38" stroke-width="3"/><path d="M-23 41 L-32 89 Q-28 101-13 96 L2 51M15 44 L26 90 Q40 100 47 88 L39 36" fill="${suit}" stroke="#233c43" stroke-width="4"/><path d="M-28 3 Q-50 9-60 32 L-70 23 Q-72 15-66 11 L-61 19 Q-45-9-23-12M28-7 Q51-13 60-40 L72-37 Q70-10 40 17" fill="${suit}" stroke="#233c43" stroke-width="4" stroke-linejoin="round"/><path d="M-30-12 Q0-29 30-12 L38 47 Q1 66-35 44Z" fill="${suit}" stroke="#233c43" stroke-width="4"/><rect x="-15" y="12" width="30" height="24" rx="5" fill="#f8edcf" stroke="#314a4d" stroke-width="2"/><circle cx="-6" cy="21" r="3" fill="#ed947e"/><path d="M2 20h7m-16 9h17" stroke="#537c79" stroke-width="2"/><path d="M-31 71l20 5M28 72l16-3" stroke="#344c50" stroke-width="6"/><ellipse cy="-49" rx="46" ry="43" fill="#f4ebcf" stroke="#253e45" stroke-width="4"/><ellipse cy="-50" rx="35" ry="32" fill="url(#visor)" stroke="#729595" stroke-width="3"/>${wife && style === 'photo' && face ? `<image href="${escape(face)}" x="-34" y="-82" width="68" height="65" preserveAspectRatio="xMidYMid slice" clip-path="url(#face-clip)"/>` : `<path d="M-26-43 Q-31-75 0-77 Q30-72 26-40" fill="${wife ? '#3b292b' : '#563c32'}"/><ellipse cy="-45" rx="23" ry="24" fill="#d9a583"/>${wife ? '<path d="M-25-46Q-23-80 7-73L26-51Q2-57-5-68Q-10-49-25-46" fill="#35272c"/>' : '<path d="M-25-55Q-16-78 6-72L22-59Q-3-62-25-55" fill="#493129"/>'}${sleeping ? '<path d="M-15-45q5 5 9 0m12 0q5 5 9 0" fill="none" stroke="#402e2b" stroke-width="2.4"/><ellipse cy="-32" rx="5" ry="6" fill="#6b3c35"/>' : '<circle cx="-10" cy="-45" r="2" fill="#302e30"/><circle cx="10" cy="-45" r="2" fill="#302e30"/><path d="M-7-34q7 7 14 0" fill="none" stroke="#733f38" stroke-width="2"/>'}${wife ? '<ellipse cx="-15" cy="-36" rx="5" ry="3" fill="#d27c70"/><ellipse cx="15" cy="-36" rx="5" ry="3" fill="#d27c70"/>' : ''}`}<path d="M-27-63q5-10 16-12" fill="none" stroke="#fff8e5" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/><path d="M-40-23q40 13 80-1" fill="none" stroke="#9bada0" stroke-width="3"/><text y="6" text-anchor="middle" fill="#203c44" font-size="7" font-weight="bold">${wife ? 'ADHI' : 'BIRTHDAY BOY'}</text></g></g>`;
  }
  function astronaut(x, y, scale, wife, sleeping = false) {
    const art = astronautBase(x, y, scale, wife, sleeping);
    if (wife || style !== 'photo') return art;
    return art.replace(
      '<path d="M-27-63q5-10 16-12"',
      '<image href="assets/birthday-boy-face.png" x="-34" y="-82" width="68" height="65" preserveAspectRatio="xMidYMid slice" clip-path="url(#face-clip)"/><path d="M-27-63q5-10 16-12"'
    );
  }
  function sparkle(x,y,size=12,color='#f7ce76') { return `<path d="M${x} ${y-size}Q${x+2} ${y-2} ${x+size} ${y}Q${x+2} ${y+2} ${x} ${y+size}Q${x-2} ${y+2} ${x-size} ${y}Q${x-2} ${y-2} ${x} ${y-size}" fill="${color}"/>`; }
  function bubble(text,x=350,y=80){const lines=text.split('<br>');return `<g class="float-other"><path d="M${x-85} ${y-29}q0-12 14-12h143q14 0 14 12v43q0 12-14 12h-100l-21 20 4-20h-26q-14 0-14-12Z" class="speech"/>${lines.map((line,i)=>`<text x="${x}" y="${y-8+i*18}" class="speech-text">${escape(line)}</text>`).join('')}</g>`;}
  function landscape(){return `<rect width="400" height="260" fill="#23474b"/><path d="M0 130L70 50 140 140 230 50 400 140V260H0" fill="#315f59"/><path d="M0 170L95 90 145 150 235 95 400 175V260H0" fill="#48796b"/><path d="M175 107Q200 100 226 110L243 229H153Z" fill="#b7e0d0"/><path d="M185 112l-15 112m30-113-3 120m17-117 12 113" stroke="#e0f4dd" stroke-width="5" stroke-dasharray="15 15" class="water"/><ellipse cx="200" cy="237" rx="94" ry="16" fill="#76b2a8"/>${sparkle(328,52,15)}<path d="M0 244Q50 204 120 250M288 260q30-65 112-45" stroke="#193a39" stroke-width="35" fill="none"/>`;}
  function rocket(){return `<g transform="translate(118 194) rotate(-28)" class="rocket"><path d="M-13 49L0 85 13 49" fill="#f7ce76" class="pulse"/><path d="M-19 3Q-50 20-32 54L-12 43M19 3Q50 20 32 54L12 43" fill="#df806e" stroke="#233c43" stroke-width="3"/><path d="M0-60Q-32-25-21 45H21Q32-25 0-60Z" fill="#f4ead1" stroke="#233c43" stroke-width="3"/><path d="M-17-35Q0-66 17-35" fill="#ed947e"/><circle cy="-8" r="13" fill="#4b777c" stroke="#ed947e" stroke-width="5"/><path d="M-13 33h26" stroke="#7c9c94" stroke-width="3"/></g>`;}
  function frame(i,x,y,angle){const p=content.photos[i];return `<g transform="translate(${x} ${y}) rotate(${angle})" class="hotspot" tabindex="0" role="button" aria-label="Open memory: ${escape(p.title)}" data-action="photo-${i}"><rect class="hit-area" x="-56" y="-58" width="112" height="129" rx="3" fill="#f0e5cc"/>${p.src ? `<image href="${escape(p.src)}" x="-49" y="-51" width="98" height="89" preserveAspectRatio="${escape(p.position || 'xMidYMid')} slice"/>` : `<svg x="-49" y="-51" width="98" height="89" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">${landscape()}</svg>`}<text x="0" y="53" text-anchor="middle" fill="#355152" font-size="7">${escape(p.title)}</text>${!p.src ? '<text x="0" y="64" text-anchor="middle" fill="#8c7161" font-size="5">PHOTO PLACEHOLDER</text>' : ''}</g>`;}
  function memoryFrame(i,x,y,angle=0,scale=1){
    const p=content.memoriesPhotos?.[i];
    if(!p)return '';
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})" class="hotspot" tabindex="0" role="button" aria-label="Open memory: ${escape(p.title)}" data-action="memory-${i}"><rect class="hit-area" x="-50" y="-53" width="100" height="116" rx="4" fill="#f0e5cc"/><image href="${escape(p.src)}" x="-44" y="-47" width="88" height="80" preserveAspectRatio="xMidYMid slice"/><text x="0" y="44" text-anchor="middle" fill="#355152" font-size="6.5" font-weight="bold">${escape(p.title)}</text><text x="0" y="53" text-anchor="middle" fill="#8c7161" font-size="5">${i+1} / ${content.memoriesPhotos.length}</text></g>`;
  }
  function petAstronaut(x, y, scale) {
    return `<g transform="translate(${x} ${y}) scale(${scale})" role="img" aria-label="Mac, our pet astronaut"><g class="float-other"><path d="M28 13q35-15 28-35" fill="none" stroke="#ed947e" stroke-width="13" stroke-linecap="round"/><rect x="-37" y="-13" width="20" height="40" rx="8" fill="#537c79" stroke="#253e45" stroke-width="3"/><path d="M-29 6q29-15 58 0l7 31h-72Z" fill="#e6debd" stroke="#253e45" stroke-width="3"/><path d="M-28 29v18h17V28M10 28v19h18V29" fill="#ed947e" stroke="#253e45" stroke-width="3" stroke-linejoin="round"/><ellipse cy="-36" rx="43" ry="40" fill="#f4ebcf" stroke="#253e45" stroke-width="4"/><ellipse cy="-36" rx="34" ry="32" fill="url(#visor)" stroke="#729595" stroke-width="3"/><clipPath id="mac-face-clip"><ellipse cy="-36" rx="31" ry="29"/></clipPath><image href="assets/mac-face.png" x="-35" y="-73" width="70" height="70" preserveAspectRatio="xMidYMid slice" clip-path="url(#mac-face-clip)"/><path d="M-25-53q5-10 15-12" fill="none" stroke="#fff8e5" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/><rect x="-19" y="8" width="38" height="17" rx="4" fill="#f8edcf" stroke="#314a4d" stroke-width="2"/><text y="20" text-anchor="middle" fill="#203c44" font-size="11" font-weight="bold">MAC</text></g></g>`;
  }
  function sceneArt(c){
    let art='';
    if(c.id==='launch') art=`<circle cx="300" cy="270" r="245" fill="url(#halo)"/><g transform="rotate(-22 300 270)"><ellipse cx="300" cy="275" rx="245" ry="85" fill="none" stroke="#648580" stroke-width="1" stroke-dasharray="4 7"/><ellipse cx="300" cy="275" rx="218" ry="68" fill="none" stroke="#648580" stroke-opacity=".3"/></g><circle cx="302" cy="294" r="150" fill="url(#planet)"/><path d="M185 239q34-47 64-16t35 4q30-30 67-4t78 5M160 300q60-15 89 26t93 0q50-18 100 13M220 398q20-40 70-23t84 8" fill="none" stroke="#a2c2a3" stroke-width="13" opacity=".23"/><ellipse cx="300" cy="437" rx="140" ry="15" fill="#071722" opacity=".5"/>${rocket()}<g transform="rotate(-12 245 290)">${astronaut(240,288,1.08,true)}</g><g transform="rotate(14 380 320)">${astronaut(376,318,.85,false)}</g>${bubble(c.speech,376,105)}${sparkle(115,99,20)}${sparkle(484,269,15)}${sparkle(415,433,9)}<g class="orbit"><circle cx="90" cy="280" r="9" fill="#ed947e"/><circle cx="492" cy="276" r="5" fill="#f7ce76"/></g><path d="M80 390q30 25 55 6" fill="none" stroke="#b9a884" stroke-dasharray="3 5"/><text x="92" y="429" fill="#a7b7b4" font-size="11" transform="rotate(-8 92 429)">you + me + infinity</text>`;
    if(c.id==='cinema') art=`<circle cx="300" cy="310" r="220" fill="url(#halo)"/><ellipse cx="300" cy="400" rx="218" ry="63" fill="#558376"/><path d="M105 409q195 65 390-1" fill="none" stroke="#85a18a" stroke-width="3"/><path d="M180 132v171m244-171v171" stroke="#6e8d89" stroke-width="7"/><rect x="158" y="106" width="288" height="161" rx="6" fill="#e9ddbe" stroke="#668b85" stroke-width="8"/><rect x="170" y="118" width="264" height="136" fill="#233d48"/><circle cx="302" cy="177" r="32" fill="#ed947e" class="pulse"/>${sparkle(230,155,13)}${sparkle(367,194,10)}<text x="302" y="234" text-anchor="middle" fill="#e9ddbe" font-size="10" letter-spacing="3">THE MOVIE IS STILL PLAYING</text>${astronaut(203,334,.7,true)}<g class="hotspot" tabindex="0" role="button" aria-label="Wake the sleeping birthday boy" data-action="sleep"><rect class="hit-area" x="307" y="261" width="112" height="150" fill="transparent" rx="25"/>${astronaut(361,340,.8,false,true)}<g class="snore" fill="#f7ce76" font-weight="bold"><text x="409" y="276" font-size="17">z</text><text x="430" y="255" font-size="25">z</text><text x="455" y="227" font-size="32">Z</text></g></g><g class="float-other hotspot" tabindex="0" role="button" aria-label="Investigate the snacks" data-action="snacks"><rect class="hit-area" x="63" y="171" width="80" height="95" fill="transparent" rx="20"/><path d="M77 205h53l-9 50H86Z" fill="#ed947e" stroke="#293d43" stroke-width="3"/><path d="M88 209l4 40m12-40v40m12-40-4 40" stroke="#f8e9ca" stroke-width="6"/><path d="M77 204q-8-17 6-19-2-19 15-12 10-19 20-1 20-3 14 16 15 12-2 18" fill="#f7ce76" stroke="#293d43" stroke-width="3"/></g>${bubble(c.speech,337,49)}${sparkle(88,334,13)}`;
    if(c.id==='stars') art=`<circle cx="300" cy="270" r="225" fill="url(#halo)"/><path d="M143 190L433 172 304 346Z" fill="${connected?'#f7ce760d':'none'}" stroke="${connected?'#f7ce76':'#59736c'}" stroke-width="${connected?3:1}" stroke-dasharray="${connected?'0':'4 8'}" class="pulse"/>${[ [143,190,'Jalubulu'],[433,172,'Galubulu'],[304,346,'Jingalanji']].map(([x,y,label],i)=>`<g class="hotspot float${i===1?'-other':''}" tabindex="0" role="button" aria-label="Discover ${label}" data-action="star-${i}"><circle class="hit-area" cx="${x}" cy="${y}" r="48" fill="transparent"/>${sparkle(x,y,36)}<text x="${x}" y="${y+66}" class="name-label">${label}</text></g>`).join('')}${astronaut(218,285,.43,true)}${astronaut(280,280,.43,false)}${bubble(c.speech,323,59)}<text x="300" y="449" class="small-label">${connected?'OFFICIALLY CONNECTED. ALWAYS OURS.':'THREE LITTLE STARS. OUR LITTLE SECRET.'}</text>${sparkle(76,354,9)}${sparkle(501,334,12)}`;
    if(c.id==='galaxy') art=`<circle cx="300" cy="270" r="250" fill="url(#halo)"/><g class="spin" fill="none" stroke="#8eb6a0"><ellipse cx="300" cy="270" rx="235" ry="112" transform="rotate(-25 300 270)" opacity=".2" stroke-width="25"/><ellipse cx="300" cy="270" rx="195" ry="82" transform="rotate(35 300 270)" opacity=".2" stroke-width="15"/><ellipse cx="300" cy="270" rx="150" ry="60" transform="rotate(-25 300 270)" opacity=".3" stroke-width="8"/></g><svg x="200" y="184" width="200" height="160" viewBox="0 0 400 260" style="border-radius:50%">${landscape()}</svg>${frame(0,138,188,-12)}${frame(1,443,205,12)}${frame(2,165,376,-7)}${frame(3,425,380,9)}${astronaut(300,445,.34,true)}${bubble(c.speech,345,65)}${sparkle(80,320,14)}${sparkle(460,104,10)}`;
    if(c.id==='memories'){
      const list=content.memoriesPhotos||[];
      const total=list.length;
      let framesArt='';
      if(memoryMode==='cluster'){
        const start=(memoryPage*5)%total;
        const slots=[[145,175,-8,1.02],[455,175,8,1.02],[300,240,0,1.14],[160,355,6,0.98],[440,360,-7,0.98]];
        framesArt=slots.map((pos,idx)=>{const pIdx=(start+idx)%total;return memoryFrame(pIdx,pos[0],pos[1],pos[2],pos[3]);}).join('');
      } else if(memoryMode==='orbit'){
        const orbitPhotos=Math.min(8,total);
        const start=(memoryPage*8)%total;
        const angleStep=(2*Math.PI)/orbitPhotos;
        framesArt=`<g class="orbit-slow">`;
        for(let j=0;j<orbitPhotos;j++){
          const angle=j*angleStep;
          const ox=300+Math.cos(angle)*195;
          const oy=255+Math.sin(angle)*125;
          const pIdx=(start+j)%total;
          framesArt+=memoryFrame(pIdx,Math.round(ox),Math.round(oy),Math.round((angle*180)/Math.PI*0.3),0.78);
        }
        framesArt+=`</g>`;
      } else if(memoryMode==='grid'){
        const start=(memoryPage*6)%total;
        const gridSlots=[[140,165,0,0.86],[300,165,0,0.86],[460,165,0,0.86],[140,325,0,0.86],[300,325,0,0.86],[460,325,0,0.86]];
        framesArt=gridSlots.map((pos,idx)=>{const pIdx=(start+idx)%total;return memoryFrame(pIdx,pos[0],pos[1],pos[2],pos[3]);}).join('');
      }
      art=`<circle cx="300" cy="270" r="245" fill="url(#halo)"/><ellipse cx="300" cy="255" rx="230" ry="145" fill="none" stroke="#ed947e" stroke-width="1.5" stroke-dasharray="4 8" opacity=".35"/><ellipse cx="300" cy="255" rx="175" ry="95" fill="none" stroke="#7cb8ac" stroke-width="1" stroke-dasharray="2 6" opacity=".3"/><circle cx="300" cy="255" r="32" fill="url(#planet)" opacity=".6"/><circle cx="300" cy="255" r="20" fill="#f7ce76" class="pulse" opacity=".7"/>${framesArt}${astronaut(70,255,0.48,true)}${astronaut(530,255,0.48,false)}${bubble(c.speech,345,65)}${sparkle(95,115,16)}${sparkle(505,375,14)}${sparkle(215,445,12)}`;
    }
    if(c.id==='nebula') art=`<g class="pulse"><ellipse cx="300" cy="260" rx="270" ry="220" fill="url(#nebula)"/><ellipse cx="250" cy="305" rx="210" ry="125" fill="url(#halo)"/></g><g class="orbit" fill="none" stroke="#bd99a0" stroke-opacity=".25"><ellipse cx="300" cy="270" rx="240" ry="123" transform="rotate(-30 300 270)"/><ellipse cx="300" cy="270" rx="205" ry="160" transform="rotate(30 300 270)"/></g><g id="adhi">${astronaut(205,280,.9,true)}</g><g id="husband">${astronaut(397,285,.9,false)}</g>${hugged?'<text x="305" y="210" fill="#ed947e" font-size="42" text-anchor="middle" class="pulse">♡</text>':''}${bubble(c.speech,319,83)}${sparkle(96,272,20,'#ed947e')}${sparkle(461,361,21)}${sparkle(231,419,12)}<text x="300" y="459" class="small-label">DISTANCE BETWEEN US: ${hugged?'ZERO. JUST RIGHT.':'ONE LITTLE HUG.'}</text>`;
    if(c.id==='birthday') art=`<circle cx="300" cy="270" r="233" fill="url(#halo)"/><ellipse cx="300" cy="399" rx="211" ry="67" fill="#528578"/><path d="M101 410q205 52 399-2" fill="none" stroke="#9eb192" stroke-width="3"/>${astronaut(161,322,.7,true)}${astronaut(438,322,.7,false)}<g class="float-other"><g id="birthday-cake" class="hotspot" tabindex="0" role="button" aria-label="Enable microphone to blow the candles" aria-disabled="${candlesBlown}" data-action="blow-candles"><rect class="hit-area" x="218" y="235" width="164" height="172" rx="24" fill="transparent"/><ellipse cx="300" cy="393" rx="77" ry="15" fill="#294f4d"/><path d="M239 327h122v53q-61 27-122 0Z" fill="#ed947e" stroke="#203c43" stroke-width="3"/><ellipse cx="300" cy="327" rx="61" ry="17" fill="#f8e5c0" stroke="#203c43" stroke-width="3"/><path d="M240 333q8 27 17 8 11 28 22 4 10 23 21 1 11 24 21-2 11 21 20-3 10 15 18-8" fill="#f8e5c0"/><path d="M275 319v-35m25 32v-39m25 42v-35" stroke="#f7ce76" stroke-width="7"/><g class="candle-flames pulse" fill="#ed947e"><path d="M275 278q-12-9 0-24 12 15 0 24M300 271q-12-9 0-24 12 15 0 24M325 278q-12-9 0-24 12 15 0 24"/></g><g class="candle-smoke" fill="none" stroke="#dfdce3" stroke-width="2.5" stroke-linecap="round"><path d="M275 280q-12-12 0-22t0-20M300 273q-12-12 0-22t0-20M325 280q-12-12 0-22t0-20"/></g></g></g><text class="cake-prompt" x="300" y="455" text-anchor="middle" fill="#f7ce76" font-size="14" letter-spacing="2">TAP CAKE TO START</text><path d="M95 163q205 90 410 0" fill="none" stroke="#a5af8d"/>${[130,180,230,280,330,380,430].map((x,i)=>`<path d="M${x} ${177+Math.sin(i/2)*30}l12 26 12-22Z" fill="${i%2?'#ed947e':'#f7ce76'}"/>`).join('')}${bubble(c.speech,319,65)}${sparkle(95,278,18)}${sparkle(485,285,16)}${sparkle(300,144,14)}`;
    const macPosition = {launch:[475,401,.65], cinema:[283,414,.65], galaxy:[300,375,.62], memories:[300,435,.55], birthday:[78,410,.62]}[c.id];
    if (macPosition) art += petAstronaut(...macPosition);
    return `<svg viewBox="0 0 600 510" role="group" aria-label="${escape(c.caption)}">${defs}${art}</svg>`;
  }
  function say(message){$('#discovery').textContent=message;}
  function render(){
    const c=content.chapters[current];
    $('.mic-controls')?.remove();
    $('#eyebrow').textContent=c.kicker;$('#chapter-title').innerHTML=c.title;$('#chapter-copy').innerHTML=c.copy;$('#aside').textContent=c.aside;$('#scene-caption').textContent=c.caption;
    $('#coordinates').textContent=`TRANSMISSION ${String(current+1).padStart(3,'0')} / ${String(content.chapters.length).padStart(3,'0')}`;
    $('#progress-label').textContent=`${String(current+1).padStart(2,'0')} — ${String(content.chapters.length).padStart(2,'0')}`;
    const offscreen=$('#scene').classList.contains('offscreen');
    $('#scene').innerHTML=sceneArt(c);$('#scene').dataset.chapter=c.id;$('#scene').className=`scene scene-enter${hugged&&c.id==='nebula'?' hugging':''}${offscreen?' offscreen':''}${candlesBlown&&c.id==='birthday'?' candles-out':''}`;
    if(c.id==='birthday'){
      const wish=document.createElement('div');wish.className='wish-card';wish.setAttribute('role','status');wish.setAttribute('aria-live','polite');
      if(candlesBlown)wish.innerHTML='<strong>Make a wish.</strong><span>Keep it close. Let the universe do its thing.</span>';
      $('#scene').append(wish);
      if(candlesBlown)$('#birthday-cake').setAttribute('aria-label','Candles blown. Your wish is on its way.');
    }
    $('#actions').replaceChildren();
    const primary=document.createElement('button');primary.className='primary-button';primary.innerHTML=`${escape(c.id==='stars'&&connected?'To the memory galaxy':c.id==='nebula'&&hugged?'Ready for your birthday?':c.action)} <span aria-hidden="true">${c.id==='nebula'&&!hugged?'♡':'↗'}</span>`;
    primary.addEventListener('click',()=>{
      if(c.id==='stars'&&!connected){connected=true;render();say('Three names. One constellation. My favourite human, in every corner of the sky.');}
      else if(c.id==='nebula'&&!hugged){hugged=true;render();say('Hug delivered. I think I’ll stay here a little longer.');}
      else if(c.id==='birthday'){stopMicrophone();$('#letter-dialog').showModal();}
      else navigate(current+1);
    });$('#actions').append(primary);
    if(c.id==='stars'||c.id==='nebula'||c.id==='memories'){const skip=document.createElement('button');skip.className='text-button';skip.textContent='Next stop →';skip.onclick=()=>navigate(current+1);$('#actions').append(skip);}
    if(c.id==='birthday'&&!candlesBlown){
      const controls=document.createElement('div');controls.className='mic-controls';
      controls.innerHTML='<p id="mic-hint" role="status">Tap the cake, allow microphone access, then blow gently.</p><div class="blow-meter" aria-hidden="true" hidden><i></i></div><button id="mic-toggle" class="text-button" type="button" hidden>Stop microphone</button>';
      controls.querySelector('button').onclick=()=>stopMicrophone();
      $('#scene').after(controls);
    }
    if(c.id==='birthday'){const replay=document.createElement('button');replay.className='secondary-button';replay.textContent='Explore our universe again';replay.onclick=()=>{connected=false;hugged=false;candlesBlown=false;navigate(0);};$('#actions').append(replay);}
    if(c.id==='launch'){
      const picker=document.createElement('div');picker.className='style-picker';picker.setAttribute('aria-label','Preview astronaut styles');
      for(const [id,label] of [['cartoon','Cartoon Adhi'],['photo','Photo-face Adhi']]){const button=document.createElement('button');button.textContent=label;button.className=style===id?'selected':'';button.setAttribute('aria-pressed',String(style===id));button.onclick=()=>{style=id;render();};picker.append(button);}$('#scene').append(picker);
    }
    if(c.id==='memories'){
      const picker=document.createElement('div');picker.className='style-picker';picker.setAttribute('aria-label','Choose memory view layout');
      for(const [id,label] of [['cluster','Polaroids'],['orbit','Orbit Ring'],['grid','Cosmic Grid']]){
        const button=document.createElement('button');button.textContent=label;button.className=memoryMode===id?'selected':'';button.setAttribute('aria-pressed',String(memoryMode===id));button.onclick=()=>{memoryMode=id;memoryPage=0;render();};picker.append(button);
      }
      $('#scene').append(picker);
      const pageSize=memoryMode==='cluster'?5:memoryMode==='orbit'?8:6;
      const totalPages=Math.ceil((content.memoriesPhotos||[]).length/pageSize);
      if(totalPages>1){
        const paging=document.createElement('div');paging.className='memories-paging';
        paging.innerHTML=`<button type="button" class="mem-prev" aria-label="Previous photos">◀</button><span>${memoryPage+1} / ${totalPages}</span><button type="button" class="mem-next" aria-label="Next photos">▶</button>`;
        paging.querySelector('.mem-prev').onclick=()=>{memoryPage=(memoryPage-1+totalPages)%totalPages;render();};
        paging.querySelector('.mem-next').onclick=()=>{memoryPage=(memoryPage+1)%totalPages;render();};
        $('#scene').append(paging);
      }
    }
    $('#stops').replaceChildren(...content.chapters.map((chapter,i)=>{const b=document.createElement('button');b.className=`stop${i===current?' active':i<current?' completed':''}`;if(i===current)b.setAttribute('aria-current','step');b.innerHTML=`<span class="stop-number">${String(i+1).padStart(2,'0')}</span><span class="stop-label">${escape(chapter.label)}</span>`;b.onclick=()=>navigate(i);return b;}));
    $('#back').disabled=current===0;
  }
  function navigate(index,fromHash=false){
    if(index<0||index>=content.chapters.length||busy||index===current)return;
    stopMicrophone();
    busy=true;const warp=$('#warp');warp.className=`warp travelling travel-${content.chapters[index].id}`;
    changeTimer=setTimeout(()=>{current=index;say('');render();if(!fromHash)history.replaceState(null,'',`#${content.chapters[current].id}`);$('#chapter-title').setAttribute('tabindex','-1');$('#chapter-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});},paused?0:350);
    finishTimer=setTimeout(()=>{warp.className='warp';busy=false;},paused?0:850);
  }
  function stopMicrophone(message='Tap the cake, allow microphone access, then blow gently.', keepMusicQuiet=false){
    const wasListening=micPending||micStream||micContext;
    micRequest++;micPending=false;
    if(micFrame!==null)cancelAnimationFrame(micFrame);
    micFrame=null;
    micStream?.getTracks().forEach(track=>track.stop());micStream=null;
    if(micContext){micContext.close().catch(()=>{});micContext=null;}
    const button=$('#mic-toggle');if(button)button.hidden=true;
    const meterWrap=$('.blow-meter');if(meterWrap)meterWrap.hidden=true;
    if(!candlesBlown){
      $('#birthday-cake')?.setAttribute('aria-label','Enable microphone to blow the candles');
      if($('.cake-prompt'))$('.cake-prompt').textContent='TAP CAKE TO START';
    }
    const hint=$('#mic-hint');if(hint)hint.textContent=message;
    const meter=$('.blow-meter i');if(meter)meter.style.width='0%';
    $('.candle-flames')?.style.removeProperty('transform');
    if(wasListening&&!keepMusicQuiet)resumeMusic();
  }
  async function enableMicrophone(){
    if(candlesBlown||content.chapters[current].id!=='birthday'||micPending||micStream)return;
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia||!AudioContext){
      stopMicrophone('Microphone unavailable. Open this page over HTTPS on a supported device to blow the candles.');return;
    }
    const request=++micRequest;
    clearTimeout(musicResumeTimer);musicHeld=true;
    const quiet=fadeMusic(0).then(()=>{if(musicHeld)music.pause();});
    micPending=true;$('#mic-toggle').hidden=false;$('#mic-toggle').textContent='Cancel microphone';
    $('#mic-hint').textContent='Allow microphone access to blow the candles.';
    try{
      const context=new AudioContext();micContext=context;
      if(context.state==='suspended')await context.resume();
      if(request!==micRequest)return;
      // Keep the reference card's unprocessed input and volume threshold.
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      if(request!==micRequest){stream.getTracks().forEach(track=>track.stop());return;}
      micStream=stream;micPending=false;
      await quiet;
      if(request!==micRequest)return;
      const analyser=context.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.55;
      context.createMediaStreamSource(stream).connect(analyser);
      stream.getAudioTracks().forEach(track=>track.addEventListener('ended',()=>stopMicrophone('Microphone disconnected. Tap the cake to reconnect.'),{once:true}));
      const samples=new Uint8Array(analyser.fftSize);
      const threshold=.11, needed=500;
      let level=0, blowMs=0, lastTime=performance.now();
      $('#mic-toggle').textContent='Stop microphone';
      $('.blow-meter').hidden=false;
      $('#birthday-cake').setAttribute('aria-label','Microphone listening. Blow to extinguish the candles.');
      $('.cake-prompt').textContent='BLOW THE CANDLES';
      $('#mic-hint').textContent='Blow gently into your microphone for half a second.';
      function listen(now){
        if(request!==micRequest)return;
        const dt=Math.min(now-lastTime,100);lastTime=now;
        analyser.getByteTimeDomainData(samples);
        let sum=0;
        for(const sample of samples){const value=(sample-128)/128;sum+=value*value;}
        level+=(Math.min(1,Math.sqrt(sum/samples.length)*3.2)-level)*.4;
        const blowing=level>threshold;
        blowMs=blowing?blowMs+dt:Math.max(0,blowMs-dt*.9);
        $('.blow-meter i').style.width=Math.min(100,level*140)+'%';
        const hint=blowing?'Keep blowing…':'Blow gently into your microphone for half a second.';
        if($('#mic-hint').textContent!==hint)$('#mic-hint').textContent=hint;
        if(!paused)$('.candle-flames').style.transform=`rotate(${blowing?Math.min(30,(level-threshold)*100):0}deg)`;
        if(blowMs>=needed){blowCandles();return;}
        micFrame=requestAnimationFrame(listen);
      }
      micFrame=requestAnimationFrame(listen);
    }catch(error){
      if(request!==micRequest)return;
      stopMicrophone(error.name==='NotAllowedError'?'Microphone access was not allowed. Allow it in your browser settings, then tap the cake to retry.':'Could not start the microphone. Tap the cake to try again.');
    }
  }
  function blowCandles(){
    if(candlesBlown)return;
    candlesBlown=true;
    stopMicrophone(undefined,true);
    $('.mic-controls')?.remove();
    $('#scene').classList.add('candles-out');
    $('#birthday-cake').setAttribute('aria-disabled','true');
    $('#birthday-cake').setAttribute('aria-label','Candles blown. Your wish is on its way.');
    $('.wish-card').innerHTML='<strong>Make a wish.</strong><span>Keep it close. Let the universe do its thing.</span>';
    if(!paused)confetti();
    musicResumeTimer=setTimeout(resumeMusic,paused?0:3000);
  }
  function confetti(){const layer=document.createElement('div');layer.className='confetti';layer.setAttribute('aria-hidden','true');for(let i=0;i<20;i++){const piece=document.createElement('span');piece.textContent=i%2?'✦':'·';piece.style.cssText=`--x:${Math.cos(i)*230}px;--y:${Math.sin(i)*200}px;animation-delay:${i*.025}s;color:${i%2?'#f7ce76':'#ed947e'}`;layer.append(piece);}$('#scene').append(layer);setTimeout(()=>layer.remove(),3000);}
  function openPhoto(index){activeModalMemoryIndex=-1;const p=content.photos[index];$('#photo-detail').innerHTML=`<div class="photo-art">${p.src?`<img src="${escape(p.src)}" alt="${escape(p.caption)}">`:`<svg viewBox="0 0 400 260" role="img" aria-label="Illustrated Athirapally waterfall, photo placeholder">${landscape()}</svg>`}</div><h2>${escape(p.title)}</h2><p>${escape(p.caption)}</p>${!p.src?`<p class="placeholder-note">${escape(p.placeholder)}</p>`:''}`;$('#photo-dialog').showModal();}
  function openMemoryPhoto(index){
    const list=content.memoriesPhotos||[];
    if(!list.length)return;
    const total=list.length;
    activeModalMemoryIndex=((index%total)+total)%total;
    const p=list[activeModalMemoryIndex];
    $('#photo-detail').innerHTML=`<div class="photo-art"><img src="${escape(p.src)}" alt="${escape(p.caption)}"></div><div class="modal-nav-bar"><span class="modal-counter">MEMORY ${String(activeModalMemoryIndex+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}</span><div class="modal-arrows"><button type="button" class="modal-nav-btn prev-memory" aria-label="Previous memory">← Prev</button><button type="button" class="modal-nav-btn next-memory" aria-label="Next memory">Next →</button></div></div><h2>${escape(p.title)}</h2><p>${escape(p.caption)}</p>`;
    $('#photo-detail .prev-memory').onclick=()=>openMemoryPhoto(activeModalMemoryIndex-1);
    $('#photo-detail .next-memory').onclick=()=>openMemoryPhoto(activeModalMemoryIndex+1);
    if(!$('#photo-dialog').open)$('#photo-dialog').showModal();
  }
  $('#scene').addEventListener('click',e=>{const hit=e.target.closest('[data-action]');if(!hit)return;const action=hit.dataset.action;if(action==='blow-candles')enableMicrophone();else if(action==='sleep')say('Please don’t disturb him. Watching me watch a movie is exhausting.');else if(action==='snacks')say('The only part of movie night that reliably keeps you awake. Five stars for the snacks. Zero for the stamina.');else if(action.startsWith('star-'))say(content.starMessages[Number(action.slice(5))]);else if(action.startsWith('photo-'))openPhoto(Number(action.slice(6)));else if(action.startsWith('memory-'))openMemoryPhoto(Number(action.slice(7)));});
  $('#scene').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-action]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
  window.addEventListener('keydown',e=>{
    if(!$('#photo-dialog')?.open||activeModalMemoryIndex<0)return;
    if(e.key==='ArrowLeft'){e.preventDefault();openMemoryPhoto(activeModalMemoryIndex-1);}
    else if(e.key==='ArrowRight'){e.preventDefault();openMemoryPhoto(activeModalMemoryIndex+1);}
  });
  $('#photo-dialog').addEventListener('close',()=>{activeModalMemoryIndex=-1;});
  function updateMotion(){paused=reduced.matches;document.body.classList.toggle('reduce-motion',paused);document.body.classList.toggle('motion-enabled',!paused);if(paused){clearTimeout(changeTimer);clearTimeout(finishTimer);$('#warp').className='warp';busy=false;}}
  reduced.addEventListener('change',updateMotion);
  document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('hidden-tab',document.hidden);if(document.hidden){stopMicrophone();music.pause();}else startMusic();});
  window.addEventListener('pagehide',()=>{stopMicrophone();music.pause();});
  new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle('offscreen',!entry.isIntersecting);},{threshold:0}).observe($('#scene'));
  $('#back').onclick=()=>navigate(current-1);$('.brand').onclick=e=>{e.preventDefault();navigate(0);};
  window.addEventListener('hashchange',()=>{const index=content.chapters.findIndex(c=>c.id===location.hash.slice(1));if(index>=0)navigate(index,true);});
  for(const dialog of document.querySelectorAll('dialog')){dialog.querySelector('.dialog-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();}});}
  $('#letter-body').innerHTML=content.letter.map(p=>`<p>${escape(p)}</p>`).join('');
  updateMotion();render();setupPasswordGate();
})();
