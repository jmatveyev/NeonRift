// 1.6 navigation, responsive upgrade cards and bounded transitions.
const nr16Travel={active:false,elapsed:0,duration:1.45,paused:false,from:1,to:2,upgrade:'',interrupted:false};
function nr16GraphicsStatus(){const el=$('graphicsResolution');if(!el)return;const e=nr15State.engine;el.textContent=nr15State.mode==='webgl2'&&e?.w?`${e.w} x ${e.h} rendered pixels${nr15State.quality==='ultra'?' / up to 3840 x 2160':''}`:'2D compatibility renderer';}
function nr16SetQuality(value){if(!['auto','low','high','ultra','compatibility'].includes(value))return;nr15State.quality=value;resize();nr15Measure();try{localStorage.setItem('neon-rift-graphics-v1',value);}catch(_){}
 if(value==='compatibility')nr15Fallback('Player selected compatibility');else if(!nr15State.engine||nr15State.engine.gl.isContextLost())nr15Init();else{nr15State.mode='webgl2';nr15Canvas.hidden=false;document.body.classList.add('nr3d');$('nrBuild').textContent='1.6.0 / 3D VISUAL EDITION';$('nrRenderNote').textContent='';}
 nr15ApplyQuality();nr15State.staticKey='';queueMicrotask(()=>{nr15Render(true);nr16GraphicsStatus();});}
function nr16TripLabels(){const from=NR16World.info(nr16Travel.from),to=NR16World.info(nr16Travel.to);$('travelFrom').textContent=from.name;$('travelTo').textContent=to.name;$('travelSub').textContent=to.sub;$('travelCoordinate').textContent=to.coordinate;$('travelNumber').textContent=`SECTOR ${String(nr16Travel.to).padStart(2,'0')}`;$('travelUpgrade').textContent=nr16Travel.upgrade?`${nr16Travel.upgrade.toUpperCase()} INSTALLED`:'';document.documentElement.style.setProperty('--travel-accent',to.accent);$('travelMap').replaceChildren(...NR16World.destinations.map((loc,i)=>{const dot=document.createElement('span');dot.textContent=String(i+1).padStart(2,'0');dot.className=i===NR16World.index(nr16Travel.to)?'next':i<NR16World.index(nr16Travel.to)?'visited':'';dot.title=loc.name;return dot;}));}
function nr16TravelToNext(upgrade=''){
 if(nr16Travel.active||!G||!player)return;
 Object.assign(nr16Travel,{active:true,elapsed:0,duration:save.motion?.28:1.65,paused:false,from:G.wave,to:G.wave+1,upgrade,interrupted:false});
 state='transit';showScreen(null);clearInput();$('hud').hidden=true;$('banner').classList.remove('visible');$('toast').classList.remove('visible');bannerTime=toastTime=0;document.body.classList.remove('nr-boss-intro');clearTimeout(nr15State.bossIntro);
 nr16TripLabels();$('sectorTravel').hidden=false;document.body.classList.add('nr-travelling');$('travelPause').textContent='PAUSE TRANSIT';$('travelContinue').hidden=true;$('travelSkip').hidden=false;$('travelPhase').textContent='JUMP DRIVE ENGAGED';$('travelProgress').style.width='0%';
 nr15State.staticKey='';queueMicrotask(()=>$('travelSkip').focus({preventScroll:true}));
}
function nr16Arrive(){if(!nr16Travel.active||!G||document.hidden)return;nr16Travel.active=false;nr16Travel.paused=false;$('sectorTravel').hidden=true;document.body.classList.remove('nr-travelling','nr-transit-paused');nextSector();clearInput();canvas.tabIndex=0;canvas.focus({preventScroll:true});nr15State.staticKey='';const c=NR16World.info(G.wave);banner(`ARRIVED / SECTOR ${String(G.wave).padStart(2,'0')}`,c.name,1.7);}
function nr16PauseTransit(){if(!nr16Travel.active)return;nr16Travel.paused=true;clearInput();document.body.classList.add('nr-transit-paused');$('travelPhase').textContent='TRANSIT PAUSED';$('travelContinue').hidden=false;$('travelSkip').hidden=true;$('travelPause').textContent='RESUME TRANSIT';}
function nr16ContinueTransit(){if(!nr16Travel.active||document.hidden)return;nr16Travel.paused=false;lastFrame=performance.now();document.body.classList.remove('nr-transit-paused');$('travelContinue').hidden=true;$('travelSkip').hidden=false;$('travelPhase').textContent='JUMP DRIVE ENGAGED';$('travelPause').textContent='PAUSE TRANSIT';}
function nr16Tick(dt){if(!nr16Travel.active||nr16Travel.paused||document.hidden||state!=='transit')return;nr16Travel.elapsed+=Math.min(.05,Math.max(0,dt));const f=Math.min(1,nr16Travel.elapsed/nr16Travel.duration);$('travelProgress').style.width=`${f*100}%`;$('travelPhase').textContent=f<.58?'LEAVING ORBIT':'APPROACHING DESTINATION';if(f>=1)nr16Arrive();}
function nr16AbortTransit(){nr16Travel.active=false;nr16Travel.paused=false;if($('sectorTravel'))$('sectorTravel').hidden=true;document.body.classList.remove('nr-travelling','nr-transit-paused');}
// Central state change also controls all game-only layers. Nothing bleeds into cards.
const nr16ShowScreenBase=showScreen;
showScreen=function(name){nr16ShowScreenBase(name);document.body.classList.toggle('in-game',['playing','paused'].includes(state));document.body.classList.toggle('nr-upgrading',state==='upgrade');document.body.classList.toggle('nr-dialog-open',['upgrade','paused','manual','career','won','dead','transit'].includes(state));if(!['playing','paused'].includes(state))$('hud').hidden=true;if(state!=='playing'){$('banner').classList.remove('visible');bannerTime=0;document.body.classList.remove('nr-boss-intro');clearTimeout(nr15State.bossIntro);}document.body.classList.toggle('nr-reduced',!!save.motion);};
const nr16ChoiceRenderBase=renderUpgradeCards;
renderUpgradeCards=function(){nr16ChoiceRenderBase();document.querySelectorAll('.upgrade-card').forEach((b,i)=>{b.dataset.choice=String(i+1);b.querySelector('.category')?.setAttribute('aria-hidden','true');});if(G){const next=NR16World.info(G.wave+1);$('upgradeDestination').textContent=`NEXT DESTINATION / ${next.name}`;$('upgradeTag').textContent=`SECTOR ${String(G.wave).padStart(2,'0')} COMPLETE`;$('upgradeRouteDescription').textContent=next.sub;}}
sectorName=function(){return NR16World.info(G?.wave||1).name;};
const nr16BaseHUD=refreshHUD;
refreshHUD=function(){nr16BaseHUD();if(G){$('sectorName').textContent=NR16World.info(G.wave).name;$('sectorName').title=NR16World.info(G.wave).coordinate;}if(state!=='playing'&&state!=='paused')$('hud').hidden=true;};
const nr16BaseStart=startRun;
startRun=function(...args){nr16AbortTransit();const v=nr16BaseStart(...args);nr15State.zone=-1;nr15State.staticKey='';return v;};
const nr16BaseHome=returnHome;
returnHome=function(...args){nr16AbortTransit();return nr16BaseHome(...args);};
const nr16BaseSettings=syncSettings;
syncSettings=function(){nr16BaseSettings();document.body.classList.toggle('nr-reduced',!!save.motion);nr15State.staticKey='';nr16GraphicsStatus();};
// The existing reroll handler changes the cards but did not persist the new choices.
$('rerollBtn').addEventListener('click',()=>{if(state==='upgrade')saveCheckpoint();});
// Editing text must never fire the global M/F sound and fullscreen shortcuts.

// Escape cannot leak through into the original pause handler during a jump.
document.addEventListener('keydown',event=>{if(!nr16Travel.active)return;if(event.code==='Escape'||event.code==='KeyP'){event.preventDefault();event.stopImmediatePropagation();nr16Travel.paused?nr16ContinueTransit():nr16PauseTransit();}else if(['KeyR','Digit1','Digit2','Digit3','Space','KeyE'].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();}},true);
window.addEventListener('blur',()=>{if(nr16Travel.active)nr16PauseTransit();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&nr16Travel.active)nr16PauseTransit();});
function nr16InitUI(){document.body.classList.add('nr16');
 const graphics=$('graphicsBtn')?.closest('.setting');if(graphics&&!$('graphicsSelect')){graphics.classList.add('nr-graphics-setting');const label=graphics.querySelector('span');label.id='graphicsLabel';const sel=document.createElement('select');sel.id='graphicsSelect';sel.setAttribute('aria-labelledby','graphicsLabel');for(const [val,text]of[['auto','Auto / balanced'],['low','Performance'],['high','High detail'],['ultra','Ultra / up to 4K'],['compatibility','2D compatibility']]){const opt=document.createElement('option');opt.value=val;opt.textContent=text;sel.appendChild(opt);}sel.onchange=()=>nr16SetQuality(sel.value);graphics.appendChild(sel);$('graphicsBtn').hidden=true;const status=document.createElement('p');status.id='graphicsResolution';status.setAttribute('aria-live','polite');graphics.after(status);const note=document.createElement('p');note.className='nr-graphics-note';note.textContent='Ultra uses up to 8.3 million rendered pixels. Actual resolution depends on display size, pixel density and device limits. Auto is recommended on phones.';status.after(note);}
 const route=document.createElement('div');route.id='upgradeRoute';route.innerHTML='<div id="upgradeDestination"></div><p id="upgradeRouteDescription"></p>';document.querySelector('.upgrade-header').after(route);$('upgradeScreen').querySelector('h2').textContent='Refit before the jump.';document.querySelector('.upgrade-header p').textContent='Choose one upgrade. Your hull, build and score travel with you.';
 const travel=document.createElement('section');travel.id='sectorTravel';travel.hidden=true;travel.setAttribute('role','dialog');travel.setAttribute('aria-modal','true');travel.setAttribute('aria-labelledby','travelTo');travel.innerHTML='<div class="travel-tunnel" aria-hidden="true"></div><div class="travel-card"><div class="travel-kicker" id="travelNumber"></div><p class="travel-departure">DEPARTING <span id="travelFrom"></span></p><div id="travelMap" aria-hidden="true"></div><h2 id="travelTo"></h2><p id="travelCoordinate"></p><p id="travelSub"></p><div class="travel-track"><div id="travelProgress"></div></div><div id="travelPhase" role="status"></div><p id="travelUpgrade"></p><div class="travel-actions"><button id="travelSkip" class="primary">ARRIVE NOW</button><button id="travelContinue" class="primary" hidden>RESUME TRANSIT</button><button id="travelPause" class="secondary">PAUSE TRANSIT</button></div></div>';
 document.body.appendChild(travel);$('travelSkip').onclick=nr16Arrive;$('travelContinue').onclick=nr16ContinueTransit;$('travelPause').onclick=()=>nr16Travel.paused?nr16ContinueTransit():nr16PauseTransit();
 nr15ApplyQuality();showScreen(['home','manual','paused','career','upgrade','dead','won'].includes(state)?{home:'homeScreen',manual:'pauseScreen',paused:'pauseScreen',career:'careerScreen',upgrade:'upgradeScreen',dead:'resultScreen',won:'resultScreen'}[state]:null);
}
queueMicrotask(nr16InitUI);
// A small diagnostic surface is opt-in; production does not expose game mutation.
if(new URLSearchParams(location.search).has('test'))window.__NR16_QA={location:()=>NR16World.info(G?.wave||1),locations:NR16World.destinations.map(x=>({id:x.id,name:x.name})),travel:()=>({...nr16Travel}),arrive:nr16Arrive,pauseTravel:nr16PauseTransit,resumeTravel:nr16ContinueTransit,stepTravel:nr16Tick,setQuality:nr16SetQuality,forceRender:()=>nr15Render(true),checkpointValid:()=>!!loadCheckpoint(),allUpgradeIds:ALL_UPGRADES.map(x=>x.id),offer(ids){if(!G)startRun(123,true);state='upgrade';choices=ids.map(id=>ALL_UPGRADES.find(x=>x.id===id)).filter(Boolean);showScreen('upgradeScreen');renderUpgradeCards();},sceneStats:()=>({quality:nr15State.quality,location:NR16World.info(G?.wave||1).id,size:[nr15State.engine?.w,nr15State.engine?.h],models:nr15State.engine?.models.size,drawCalls:nr15State.engine?.drawCalls}),setSeed(seed){startRun(seed);},data:()=>({G:JSON.parse(JSON.stringify({...G,boss:null})),player:JSON.parse(JSON.stringify(player))})};

const nr16CheckpointBase=cleanCheckpoint;
cleanCheckpoint=function(raw){const c=nr16CheckpointBase(raw);if(!c)return null;
 const integer=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi;
 if(!Number.isFinite(c.savedAt)||c.savedAt>Date.now()+60000||!integer(c.seed,0,4294967295)||!integer(c.g.wave,1,9999)||!integer(c.g.rngCalls||0,0,2000000))return null;
 for(const k of['elapsed','score','kills','completed','rerolls','damageTaken','dashes','overdrives'])if(c.g[k]!==undefined&&(!Number.isFinite(c.g[k])||c.g[k]<0))return null;
 if(!Number.isFinite(c.player.hp)||c.player.hp<=0||!Number.isFinite(c.player.energy)||c.player.energy<0||c.player.energy>100)return null;
 if(!c.player.upgrades||typeof c.player.upgrades!=='object'||Array.isArray(c.player.upgrades))return null;
 for(const [id,value]of Object.entries(c.player.upgrades)){const u=ALL_UPGRADES.find(x=>x.id===id);if(!u||!integer(value,0,u.max))return null;}
 if(c.choices.length!==3||new Set(c.choices).size!==3||c.choices.some(id=>!ALL_UPGRADES.some(u=>u.id===id)))return null;
 return c;
};
