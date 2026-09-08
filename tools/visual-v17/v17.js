// Neon Rift 1.7 - cinematic travel, native-resolution showcase rendering and display-only ship detail.
const NR17_VERSION='1.7.0';
const nr17State={lastMenuPaint:0,travelFrom:-1,travelTo:-1,showcaseBuilt:false,travelBuilt:false,travelCue:0,padButtons:[],padSeen:false,padMoveAt:0};

function nr17Ease(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);}
function nr17TravelF(){return nr16Travel?.active?Math.max(0,Math.min(1,nr16Travel.elapsed/Math.max(.001,nr16Travel.duration))):0;}

function nr17DetailedShip(id){
 const b=NR15Art.ship(id),M=NR15Art.M;
 const box=(x,y,z,w,l,h,c,yaw=0)=>b.box(x,y,z,w,l,h,c,.35,yaw);
 const glow=(x,y,z,w,l,c,e=1.1,yaw=0)=>b.glow(x,y,z,w,l,c,e,yaw);
 // Display-only paneling. Combat still uses the lighter original mesh.
 for(let s of[-1,1]){
   for(let i=0;i<6;i++){const y=-15+i*6.3;box(s*(id==='ghost'?13+i*1.6:id==='bastion'?14.2:10+i*1.7),y,12.7,1.05,4.1,.55,M.black,s*.07);}
   for(let i=0;i<4;i++){const y=2+i*5.2;glow(s*(id==='bastion'?21:17),y,13.5,.55,2.6,id==='ghost'?M.lilac:id==='bastion'?M.amber:M.cyan,.55);}
   box(s*(id==='ghost'?27: id==='bastion'?22:23),12,9.8,2.2,15,1.1,M.edge,s*.05);
   box(s*(id==='ghost'?18:12),22,9.4,5.2,3.0,2.0,M.black);
   b.ring(s*(id==='ghost'?15:13),23,7.2,id==='bastion'?4.7:3.6,.72,1.2,id==='bastion'?M.amber:id==='ghost'?M.lilac:M.cyan,24,0,Math.PI*2,1.2);
 }
 for(let y=-20;y<=11;y+=5.2){box(-2.9,y,15.8,.55,2.4,.45,M.black);box(2.9,y,15.8,.55,2.4,.45,M.black);}
 box(0,-25,13.8,2.2,5.3,1.5,M.steel);glow(0,-27.3,15.5,.7,1.7,id==='bastion'?M.amber:M.cyan,1.5);
 if(id==='striker'){
   for(let s of[-1,1]){box(s*18,-4,12.2,8.5,1.3,.7,M.black,s*.18);box(s*20,9,11.6,7.5,1.2,.7,M.ivory,s*.1);glow(s*26,18,9.8,1.2,4,M.red,1.2);}
   b.ring(0,-7,17,5.2,.65,.55,M.cyan,32,0,Math.PI*2,.8);
 }else if(id==='ghost'){
   for(let s of[-1,1]){for(let i=0;i<4;i++)box(s*(17+i*3.5),8+i*2.2,9.8,2.6,7.2,.55,i%2?M.black:M.steel,s*.35);glow(s*31,18,7.8,1.1,7,M.lilac,1.35,s*.45);}
   b.ring(0,-8,17.2,4.8,.55,.5,M.lilac,32,0,Math.PI*2,.95);
 }else{
   for(let s of[-1,1]){for(let i=0;i<5;i++)box(s*17,-7+i*6,18.2,6.8,1.4,.7,i%2?M.black:M.steel);box(s*21,-16,16.5,4.5,10,2,M.dark);glow(s*21,-20,18.8,1.2,3,M.amber,1.25);}
   b.ring(0,-5,20.2,6.6,.8,.7,M.amber,36,0,Math.PI*2,1.05);
 }
 return b;
}

function nr17TravelMeshes(E){
 if(nr17State.travelBuilt)return;
 const M=NR15Art.M;
 let ring=new NR15.Model();ring.ring(0,0,0,1,.045,.025,M.cyan,64,0,Math.PI*2,2.4);E.mesh('nr17WarpRing',ring);
 let ring2=new NR15.Model();ring2.ring(0,0,0,1,.035,.02,M.lilac,64,0,Math.PI*2,2.1);E.mesh('nr17WarpRingB',ring2);
 let streak=new NR15.Model();streak.box(0,0,0,1.2,56,1.0,M.cyan,.25);streak.glow(0,0,1.1,.75,50,M.cyan,2.8);E.mesh('nr17WarpStreak',streak);
 let streakB=new NR15.Model();streakB.box(0,0,0,1.0,42,.8,M.lilac,.2);streakB.glow(0,0,.9,.65,38,M.lilac,2.5);E.mesh('nr17WarpStreakB',streakB);
 let flare=new NR15.Model();flare.box(0,0,0,4,48,1.2,M.black,.5);flare.glow(0,0,1.4,2.4,47,M.cyan,3.2);E.mesh('nr17EngineFlare',flare);
 nr17State.travelBuilt=true;
}

function nr17ShowcaseMeshes(E){
 if(nr17State.showcaseBuilt)return;
 for(const id of['striker','ghost','bastion'])E.mesh('display_'+id,nr17DetailedShip(id));
 let bay=new NR15.Model(),M=NR15Art.M;
 for(let s of[-1,1]){for(let i=0;i<5;i++){const x=s*(92+i*19);bay.box(x,0,-14,5,196,12,M.dark,1);bay.glow(x,0,-7.6,1.2,174,i%2?M.cyan:M.amber,.55);}bay.box(s*122,-28,-8,54,8,9,M.steel,1);bay.box(s*122,34,-8,54,8,9,M.steel,1);}
 for(let i=0;i<7;i++){const y=-86+i*28;bay.box(0,y,-19,212,2.3,3,M.black,.4);}
 bay.ring(0,0,-8,139,2.2,1,M.cyan,80,0,Math.PI*2,.8);bay.ring(0,0,-9,151,1.2,.6,M.amber,80,0,Math.PI*2,.45);
 E.mesh('nr17ShowcaseBay',bay);nr17State.showcaseBuilt=true;
}

const nr17InitBase=nr15Init;
nr15Init=function(){nr17InitBase();if(nr15State.engine&&nr15State.mode==='webgl2'){nr17State.showcaseBuilt=false;nr17State.travelBuilt=false;nr17ShowcaseMeshes(nr15State.engine);nr17TravelMeshes(nr15State.engine);}};

// Auto remains balanced in gameplay, but the static hangar preview is allowed the Ultra pixel budget on desktop.
const nr17ResizeBase=NR15.Engine.prototype.resize;
NR15.Engine.prototype.resize=function(w,h,mobile){
 const q=this.quality,showcase=!!this.nr17Showcase&&!mobile&&q!=='compatibility';
 if(showcase)this.quality='ultra';
 try{return nr17ResizeBase.call(this,w,h,mobile);}finally{this.quality=q;}
};

const nr17EngineRenderBase=NR15.Engine.prototype.render;
NR15.Engine.prototype.render=function(opts){const f=this.nr17TravelMode||0;if(f>.26&&f<.74){opts={...opts,zone:6.4,accent:'#b58cff',location:{sky:[.095,.025,.17],planet:[.12,.04,.20],position:[12,12,.01]}};}return nr17EngineRenderBase.call(this,opts);};

const nr17ZoneBase=nr15Zone;
nr15Zone=function(){if(state==='transit'&&nr16Travel?.active){return NR16World.index(nr17TravelF()<.68?nr16Travel.from:nr16Travel.to);}return nr17ZoneBase();};

function nr17EnsureTransitEnvironment(E,index,key){
 const stateKey=key==='from'?'travelFrom':'travelTo';
 if(nr17State[stateKey]===index&&E.models.has('nr17Env_'+key))return;
 E.destroyMesh('nr17Env_'+key);E.mesh('nr17Env_'+key,NR16World.build(index));nr17State[stateKey]=index;
}

function nr17PrepareTravel(time){
 const E=nr15State.engine,f=nr17TravelF(),from=NR16World.index(nr16Travel.from),to=NR16World.index(nr16Travel.to),cx=1200,cy=900;
 E.begin();E.nr17Showcase=false;E.nr17TravelMode=f;nr17TravelMeshes(E);nr17ShowcaseMeshes(E);nr17EnsureTransitEnvironment(E,from,'from');nr17EnsureTransitEnvironment(E,to,'to');
 const launch=nr17Ease(Math.min(1,f/.24)),arrival=nr17Ease(Math.max(0,(f-.70)/.30));
 if(f<.29){E.add('nr17Env_from',0,0,-30-launch*90,0,1-launch*.08);NR16World.dynamics(E,from,time,save.motion);}
 if(f>.69){E.add('nr17Env_to',0,0,-105+arrival*105,0,.88+arrival*.12);NR16World.dynamics(E,to,time,save.motion);}
 const shipY=cy+88-launch*86-arrival*18,shipZ=54+Math.sin(f*Math.PI)*18,bank=save.motion?-.05:Math.sin(f*Math.PI*3.1)*.09;
 E.add('display_'+selectedRig,cx,shipY,shipZ,-.06+bank,2.45,0,f>.2&&f<.8?1:0,1,2.45,2.45,-.19);
 // Twin emissive exhaust plumes stretch during the jump.
 const jetX=selectedRig==='ghost'?18:selectedRig==='bastion'?15:12;
 for(const s of[-1,1])E.add('nr17EngineFlare',cx+s*jetX*2.45,shipY+70,shipZ-7,0,1.1+2.2*Math.sin(Math.PI*Math.min(1,f/.35)),0,1,.82,1.15,1.15);
 if(!save.motion&&f>.15&&f<.86){
   const warp=Math.sin(Math.PI*Math.min(1,(f-.15)/.71));
   for(let i=0;i<(coarse?18:34);i++){
     const seed=(i*2.3999632297)%6.28318,rad=150+(i%9)*38,flow=(f*1650+i*113)%980;
     const x=cx+Math.cos(seed)*rad,y=cy+Math.sin(seed)*rad-flow+480;
     E.add(i%3?'nr17WarpStreak':'nr17WarpStreakB',x,y,-20+(i%5)*8,seed*.05,1+warp*1.9,0,warp,.22+warp*.62,1.0,1.0);
   }
   for(let i=0;i<9;i++){
     const phase=(f*2.1+i/9)%1,scale=90+phase*720,alpha=(1-phase)*warp*.58;
     E.add(i%2?'nr17WarpRing':'nr17WarpRingB',cx,cy-10,-15,0,scale,0,warp,alpha,scale,2.5);
   }
 }
 if(f>.76){for(let i=0;i<5;i++){const phase=Math.max(0,Math.min(1,(f-.76)*4-i*.06)),r=185+i*58;E.add(i%2?'nr17WarpRingB':'nr17WarpRing',cx,cy,-24,0,r*(.75+phase*.25),0,phase,.25*(1-phase),r*(.75+phase*.25),2);}}
 const zoom=1.04+launch*.20-arrival*.08+(!save.motion?Math.sin(f*Math.PI)*.09:0);
 return{cx,cy:cy+24-launch*18,zoom};
}

const nr17PrepareBase=nr15Prepare;
nr15Prepare=function(time){
 const E=nr15State.engine;if(E){E.nr17Showcase=false;E.nr17TravelMode=0;}
 if(state==='transit'&&nr16Travel?.active)return nr17PrepareTravel(time);
 const view=nr17PrepareBase(time);
 if(E&&(!player||state==='home')){
   E.nr17Showcase=true;nr17ShowcaseMeshes(E);
   // Replace the combat mesh with the display-only high-detail model without touching gameplay.
   E.batches.delete(selectedRig);
   const b=nr15State.shipPreview;if(!b.w)nr15Measure();const sx=b.x+b.w*.5,sy=b.y+b.h*.55,showScale=Math.min(b.w/255,b.h/168),wx=1200+(sx-W/2),wy=900+(sy-H/2),yaw=save.motion?-.52:-.52+Math.sin(ambientTime*.22)*.10;
   E.add('nr17ShowcaseBay',wx,wy+32,-3,0,showScale*.62,0,0,1,showScale*.48,showScale*.55);
   E.add('display_'+selectedRig,wx,wy,40,yaw,showScale*2.12,0,0,1,showScale*2.12,showScale*2.12,-.17);
 }
 return view;
};

// Prevent a full-resolution static hangar from needlessly running at 60 fps.
const nr17OverlayBase=nr15Overlay;
nr15Overlay=function(time,view){if(state==='transit'){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);return;}return nr17OverlayBase(time,view);};

const nr17RenderBase=nr15Render;
nr15Render=function(force=false){
 nr17PollGamepad();
 const now=performance.now();
 if(!force&&state==='home'&&!coarse&&nr15State.mode==='webgl2'&&now-nr17State.lastMenuPaint<32)return;
 if(state==='home')nr17State.lastMenuPaint=now;
 const out=nr17RenderBase(force);
 if(state==='home')nr17UpdateShowcaseResolution();
 return out;
};
render=nr15Render;

const nr17GraphicsBase=nr16GraphicsStatus;
nr16GraphicsStatus=function(){nr17GraphicsBase();nr17UpdateShowcaseResolution();};
function nr17UpdateShowcaseResolution(){
 const el=$('nrShowcaseResolution'),e=nr15State.engine;if(!el)return;
 if(nr15State.mode==='webgl2'&&e?.w){const native=(e.w>=3840&&e.h>=2160)||(e.w>=5000&&e.h>=1400);el.textContent=`${e.w}×${e.h}${native?' / NATIVE SHOWCASE':' / SHOWCASE'}`;}else el.textContent='2D COMPATIBILITY';
}

const nr17TravelStartBase=nr16TravelToNext;
nr16TravelToNext=function(upgrade=''){nr17TravelStartBase(upgrade);if(!nr16Travel.active)return;nr16Travel.duration=save.motion?.28:(coarse?3.0:3.45);nr17State.travelCue=0;unlockAudio();tone(86,.55,'sawtooth',.035,220);document.body.classList.add('nr-transit-launch');if($('travelPause'))$('travelPause').textContent='PAUSE';nr15State.staticKey='';};

const nr17TravelTickBase=nr16Tick;
nr16Tick=function(dt){
 nr17TravelTickBase(dt);if(!nr16Travel.active)return;const f=nr17TravelF();
 document.documentElement.style.setProperty('--nr17-travel',String(f));
 document.body.classList.toggle('nr-transit-warp',f>=.18&&f<.76);document.body.classList.toggle('nr-transit-arrival',f>=.76);
 const phase=f<.12?'CLEARING DOCK':f<.24?'CHARGING RIFT DRIVE':f<.70?'RIFT TRANSIT':f<.88?'DESTINATION LOCK':'FINAL APPROACH';
 if(!save.motion&&nr17State.travelCue<1&&f>=.24){nr17State.travelCue=1;tone(180,.48,'triangle',.035,920);}if(!save.motion&&nr17State.travelCue<2&&f>=.74){nr17State.travelCue=2;tone(720,.42,'sine',.032,210);}
 $('travelPhase').textContent=phase;nr15State.staticKey='';
};
const nr17TravelAbortBase=nr16AbortTransit;
nr16AbortTransit=function(){nr17TravelAbortBase();document.body.classList.remove('nr-transit-launch','nr-transit-warp','nr-transit-arrival');};
function nr17DisposeTransitMeshes(){const E=nr15State.engine;if(!E)return;E.destroyMesh('nr17Env_from');E.destroyMesh('nr17Env_to');nr17State.travelFrom=nr17State.travelTo=-1;E.nr17TravelMode=0;}
const nr17ArriveBase=nr16Arrive;
nr16Arrive=function(){nr17ArriveBase();if(!nr16Travel.active){document.body.classList.remove('nr-transit-launch','nr-transit-warp','nr-transit-arrival');nr17DisposeTransitMeshes();}};


// Standard gamepads are first-class input: left stick/D-pad steer, A dashes, X overdrives,
// Menu/Start pauses, and upgrade cards can be chosen without touching the screen.
function nr17Gamepad(){try{return [...(navigator.getGamepads?.()||[])].find(p=>p&&p.connected)||null;}catch(_){return null;}}
function nr17PadPressed(p,i){return !!p?.buttons?.[i]?.pressed;}
function nr17PadAxis(value){const v=Number(value)||0,a=Math.abs(v);return a<.18?0:Math.sign(v)*Math.min(1,(a-.18)/.82);}
const nr17MovementBase=movement;
movement=function(){const base=nr17MovementBase();if(Math.hypot(base.x,base.y)>.05)return base;const p=nr17Gamepad();if(!p)return base;let x=nr17PadAxis(p.axes?.[0]),y=nr17PadAxis(p.axes?.[1]);if(nr17PadPressed(p,14))x=-1;if(nr17PadPressed(p,15))x=1;if(nr17PadPressed(p,12))y=-1;if(nr17PadPressed(p,13))y=1;const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}return{x,y};};
function nr17Focusable(){return [...document.querySelectorAll('button:not([hidden]):not(:disabled),select:not([hidden]),.upgrade-card:not([hidden])')].filter(el=>el.offsetParent!==null&&!el.closest('[hidden]'));}
function nr17MoveFocus(step){const els=nr17Focusable();if(!els.length)return;let i=els.indexOf(document.activeElement);i=i<0?(step>0?-1:0):i;els[(i+step+els.length)%els.length].focus({preventScroll:true});}
function nr17ActivateFocused(){let el=document.activeElement;if(!el||!nr17Focusable().includes(el)){if(state==='home')el=$('startBtn');else if(state==='upgrade')el=document.querySelector('.upgrade-card');}el?.click?.();}
function nr17PollGamepad(){const p=nr17Gamepad();if(!p){if(nr17State.padSeen){nr17State.padSeen=false;document.body.classList.remove('nr-gamepad');}nr17State.padButtons=[];return;}if(!nr17State.padSeen){nr17State.padSeen=true;document.body.classList.add('nr-gamepad');if($('nrControllerStatus'))$('nrControllerStatus').textContent='CONTROLLER READY';}
 const pressed=Array.from({length:Math.max(18,p.buttons?.length||0)},(_,i)=>nr17PadPressed(p,i));const edge=i=>pressed[i]&&!nr17State.padButtons[i];
 if(edge(9)){if(nr16Travel?.active){nr16Travel.paused?nr16ContinueTransit():nr16PauseTransit();}else if(state==='playing')pauseGame();else if(['paused','manual'].includes(state))resumeGame();}
 if(state==='playing'){if(edge(0))tryDash();if(edge(2))tryOverdrive();}
 else if(state==='upgrade'){if(edge(0))applyChoice(0);else if(edge(2))applyChoice(1);else if(edge(3))applyChoice(2);}
 else if(!nr16Travel?.active){if(edge(12))nr17MoveFocus(-1);if(edge(13))nr17MoveFocus(1);if(edge(0))nr17ActivateFocused();}
 nr17State.padButtons=pressed;
}
window.addEventListener('gamepadconnected',()=>{nr17State.padSeen=false;nr17PollGamepad();});
window.addEventListener('gamepaddisconnected',()=>nr17PollGamepad());

function nr17EnhanceUI(){document.body.classList.add('nr17');
 const label=document.querySelector('.nr-preview-label');if(label&&!$('nrShowcaseResolution')){const status=document.createElement('span');status.id='nrShowcaseResolution';status.setAttribute('aria-live','polite');label.appendChild(status);}
 if($('nrBuild'))$('nrBuild').textContent=nr15State.mode==='webgl2'?'1.7.0 / 3D CINEMATIC BUILD':'1.7.0 / 2D COMPATIBILITY';
 if($('travelSkip'))$('travelSkip').textContent='SKIP JUMP';if($('travelPause'))$('travelPause').textContent='PAUSE';if(!$('nrControllerStatus')){const el=document.createElement('span');el.id='nrControllerStatus';el.textContent='KEYBOARD / TOUCH';document.querySelector('.nr-preview-caption')?.appendChild(el);}nr17UpdateShowcaseResolution();}
queueMicrotask(nr17EnhanceUI);

window.NEON_RIFT_VERSION=NR17_VERSION;
window.__NEON_RIFT_VISUAL__=Object.freeze({version:NR17_VERSION,get renderer(){return nr15State.mode;},get profile(){return nr15State.quality;},get showcase(){const e=nr15State.engine;return e?[e.w,e.h]:null;}});
if(new URLSearchParams(location.search).has('test'))window.__NR17_QA={travelProgress:nr17TravelF,forceRender:()=>nr15Render(true),showcaseVertices:id=>nr15State.engine?.models.get('display_'+id)?.count||0,showcaseSize:()=>[nr15State.engine?.w||0,nr15State.engine?.h||0],pollGamepad:nr17PollGamepad,movement:()=>movement(),startTravel:up=>nr16TravelToNext(up||'QA UPGRADE'),setTravelProgress(f){if(!nr16Travel.active)return false;nr16Travel.elapsed=Math.max(0,Math.min(1,Number(f)||0))*nr16Travel.duration;nr16Tick(0);nr15State.staticKey='';nr15Render(true);return true;}};
