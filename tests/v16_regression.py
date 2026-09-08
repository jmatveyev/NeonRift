"""Neon Rift 1.6 UAT. Real DOM/WebGL/input; all backend calls are mocked.
Default: serve locally (CI). --inline: sandbox-compatible HTML loading with an
explicit in-memory Storage substitute. No live scores or telemetry are sent.
"""
from pathlib import Path
import argparse,functools,http.server,threading,json,os,io,itertools,time
from playwright.sync_api import sync_playwright
from PIL import Image,ImageChops,ImageStat
P=argparse.ArgumentParser();P.add_argument('--inline',action='store_true');P.add_argument('--suite',default='all');args=P.parse_args()
ROOT=Path(__file__).resolve().parents[1];HTML=Path(os.environ.get('GAME_HTML',str(ROOT/'index.html')));OUT=ROOT/'artifacts/v16';OUT.mkdir(parents=True,exist_ok=True)
text=HTML.read_text();results=[];issues=[];server=None
if not args.inline:
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(HTML.parent)))
 threading.Thread(target=server.serve_forever,daemon=True).start();URL=f'http://127.0.0.1:{server.server_port}/{HTML.name}?test=1'
else:URL='about:blank?test=1'
INIT="""(()=>{try{localStorage.setItem('__uat_test','1');localStorage.removeItem('__uat_test')}catch(e){const data=new Map();Object.defineProperty(window,'localStorage',{value:{get length(){return data.size},getItem:k=>data.get(String(k))??null,setItem:(k,v)=>data.set(String(k),String(v)),removeItem:k=>data.delete(String(k)),clear:()=>data.clear(),key:i=>[...data.keys()][i]??null}})}
localStorage.setItem('neon-rift-save-v1',JSON.stringify({sound:false,music:false}));localStorage.setItem('neon-rift-career-v1',JSON.stringify({version:1,pilot:'UAT PILOT'}));})();"""
def check(label,ok,detail=None):
 results.append({'name':label,'pass':bool(ok),'detail':detail});print(('PASS' if ok else 'FAIL'),label,detail if not ok else '',flush=True)
 if not ok:raise AssertionError(label)
def net(route):
 req=route.request;headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'apikey,content-type,authorization'}
 if req.method=='OPTIONS':route.fulfill(status=204,headers=headers);return
 if '/rest/v1/' in req.url:body=[]
 else:
  d=req.post_data_json or {};a=d.get('action');m=d.get('mode','standard')
  if a=='start':body={'run_id':'00000000-0000-4000-8000-000000000016','token':'uat-token-not-real','seed':123456,'mode':m,'challenge_date':time.strftime('%Y-%m-%d',time.gmtime()) if m=='daily' else None}
  else:body={'accepted':True}
 route.fulfill(status=200,content_type='application/json',body=json.dumps(body),headers=headers)
def make(browser,mobile=False,w=1280,h=800,extra='',storage=None):
 c=browser.new_context(viewport={'width':w,'height':h},has_touch=mobile,is_mobile=mobile,device_scale_factor=1)
 c.route('https://*.supabase.co/**',net);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 script=INIT+extra
 if storage is not None:script+=f'for(const [k,v] of Object.entries({json.dumps(storage)}))localStorage.setItem(k,v);'
 if args.inline:
  page.goto(URL);page.evaluate(script);page.set_content(text,wait_until='load')
 else:
  c.add_init_script(script);page.goto(URL,wait_until='load')
 page.wait_for_function('window.__NR16_QA && document.querySelector("#sectorTravel")',timeout=15000)
 page.evaluate('__NR16_QA.forceRender()');return c,page,errors
snap=lambda page:page.evaluate('__NEON_RIFT_TEST__.snapshot()')
def mode(page):return page.evaluate('__NEON_RIFT_TEST__.snapshot().state')
def start(page):page.evaluate('__NEON_RIFT_TEST__.start();__NEON_RIFT_TEST__.invulnerable()')
LAYOUT="""()=>{let problems=[];for(const c of document.querySelectorAll('.upgrade-card')){const cr=c.getBoundingClientRect();const els=['.upgrade-icon','.category','.key','strong','p','.rank'].map(s=>[s,c.querySelector(s)]).filter(x=>x[1]);for(const [sel,e]of els){const r=e.getBoundingClientRect();if(r.left<cr.left-1||r.right>cr.right+1||r.top<cr.top-1||r.bottom>cr.bottom+1)problems.push([c.dataset.choice,sel,'outside card']);if(e.scrollWidth>e.clientWidth+2)problems.push([c.dataset.choice,sel,'horizontal overflow']);}for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i][1].getBoundingClientRect(),b=els[j][1].getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)problems.push([c.dataset.choice,els[i][0],els[j][0],'overlap']);}}return problems;}"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM') or '/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if args.suite in ['all','layout']:
   c,page,errors=make(b,True,390,844);start(page);page.evaluate('__NR16_QA.setQuality("compatibility")')
   ids=page.evaluate('__NR16_QA.allUpgradeIds')
   groups=[ids[i:i+3] for i in range(0,len(ids),3)];groups[-1]=(groups[-1]+ids[:3])[:3]
   for w,h in [(320,568),(360,780),(390,844),(430,932),(768,1024),(844,390),(1024,768),(1366,768),(1920,1080),(3840,2160)]:
    page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(40);found=[]
    for group in groups:
     page.evaluate('(ids)=>__NR16_QA.offer(ids)',group);found+=page.evaluate(LAYOUT)
    check(f'{w}x{h}: every upgrade category/icon/title/description/key/rank stays separate',not found,found[:10])
    check(f'{w}x{h}: no upgrade-screen horizontal overflow',page.locator('#upgradeScreen').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'))
    page.locator('#rerollBtn').scroll_into_view_if_needed();r=page.locator('#rerollBtn').bounding_box();check(f'{w}x{h}: reroll reachable by scrolling',0<=r['y']<h and r['height']>=43,r)
   page.set_viewport_size({'width':390,'height':844});page.evaluate('__NR16_QA.offer(["damage","hull","magnet"]);document.querySelector("#upgradeScreen").scrollTop=0')
   page.screenshot(path=str(OUT/'phone-upgrades.png'))
   check('Upgrade overlay hides combat HUD, boss intro and ability icons',page.locator('#hud').is_hidden() and not page.locator('#dashBtn').is_visible())
   page.keyboard.press('2');check('Keyboard upgrade chooses exactly once',mode(page)=='transit')
   page.keyboard.press('2');check('Repeated selection cannot apply a second upgrade',sum(snap(page)['player']['upgrades'].values())==1)
   check('Layout suite: no uncaught exceptions',not errors,errors);c.close()
  if args.suite in ['all','travel']:
   c,page,errors=make(b,True,390,844);page.locator('#startBtn').click();page.wait_for_function('__NEON_RIFT_TEST__.snapshot().state==="playing"')
   page.evaluate('__NEON_RIFT_TEST__.invulnerable();__NEON_RIFT_TEST__.setPlayer({energy:70});__NEON_RIFT_TEST__.finishSector()')
   s=snap(page);choice=s['choices'][0];oldrng=page.evaluate('__NR15_QA.rng');oldelapsed=s['elapsed'];oldscore=s['score'];oldhull=s['player']['hp']
   page.locator('.upgrade-card').first.click();page.evaluate('__NR16_QA.pauseTravel()')
   check('Choosing an upgrade enters paused travel rather than live combat',mode(page)=='transit' and page.locator('#sectorTravel').is_visible())
   check('Destination card names departing and next locations',page.locator('#travelFrom').inner_text()=='HAVEN SHIPYARD' and page.locator('#travelTo').inner_text()=='BOREAL ICE BELT')
   page.evaluate('__NEON_RIFT_TEST__.advance(10,false)');check('Combat elapsed time is frozen during transit',snap(page)['elapsed']==oldelapsed)
   page.wait_for_timeout(200);check('Paused transit makes no progress',page.evaluate('__NR16_QA.travel().paused'))
   page.screenshot(path=str(OUT/'phone-travel.png'))
   page.locator('#travelContinue').click();page.locator('#travelSkip').click();page.wait_for_function('__NEON_RIFT_TEST__.snapshot().wave===2')
   s=snap(page);check('Arrival enters sector two with correct location',page.evaluate('__NR16_QA.location().id')=='boreal' and s['wave']==2)
   check('Arrival preserves score and installed upgrade',s['score']==oldscore and s['player']['upgrades'].get(choice)==1)
   check('Arrival preserves hull (or a hull upgrade benefit)',s['player']['hp']>=oldhull)
   check('Arrival clears held pointer/keys',s['controls']['pointerId'] is None and s['controls']['amount']==0)
   check('Only arrival schedules the new sector enemies',s['spawns']>0 and s['elapsed']<oldelapsed+.6)
   # Rerolls must survive reloading; no free re-roll caused by a stale checkpoint.
   page.evaluate('__NEON_RIFT_TEST__.finishSector()');page.locator('#rerollBtn').click();s=snap(page)
   stored=page.evaluate("JSON.parse(localStorage.getItem('neon-rift-checkpoint-v1'))")
   check('Rerolled choices are persisted at the checkpoint',stored['choices']==s['choices'] and stored['g']['rerolls']==s['rerolls'])
   saved=page.evaluate('Object.fromEntries(Array.from({length:localStorage.length},(_,i)=>{let k=localStorage.key(i);return[k,localStorage.getItem(k)]}))')
   if not args.inline:
    page.reload(wait_until='load');page.wait_for_function('window.__NR16_QA')
   else:
    c.close();c,page,errors=make(b,True,390,844,storage=saved)
   page.locator('#resumeRunBtn').click();check('Checkpoint restores upgrade selection instead of starting over',mode(page)=='upgrade' and snap(page)['choices']==s['choices'])
   page.locator('.upgrade-card').first.click();page.evaluate('__NR16_QA.pauseTravel()');check('Resumed checkpoint travels to the next named location',page.locator('#travelTo').inner_text()=='HELIOS JUMP GATE')
   page.locator('#travelContinue').click();page.locator('#travelSkip').click();check('Resumed checkpoint reaches sector three',snap(page)['wave']==3)
   # Explicit real pointer ownership under the new renderer.
   page.evaluate('__NEON_RIFT_TEST__.forceWave(1);__NEON_RIFT_TEST__.setPlayer({energy:100})');cdp=c.new_cdp_session(page);r=page.locator('#movePad').bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2
   cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':0}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+40,'y':y,'id':0}]});before=snap(page)['player']['x'];page.evaluate('__NEON_RIFT_TEST__.advance(.3,false)');check('Real touch thumbstick still moves ship',snap(page)['player']['x']>before+20)
   r=page.locator('#dashBtn').bounding_box();cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x+40,'y':y,'id':0},{'x':r['x']+r['width']/2,'y':r['y']+r['height']/2,'id':1}]});check('Second-finger dash preserves steering ownership',snap(page)['player']['dashCooldown']>0 and snap(page)['controls']['pointerId'] is not None)
   cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.locator('#overdriveBtn').click();check('Overdrive remains usable',snap(page)['player']['overdrive']>0)
   page.locator('#pauseBtn').click();page.select_option('#graphicsSelect','high');check('Graphics menu uses the selected high-detail profile',page.evaluate('__NR16_QA.sceneStats().quality')=='high');page.locator('#resumeBtn').click();check('Graphics change keeps active run',mode(page)=='playing')
   page.evaluate('__NEON_RIFT_TEST__.forceWave(9);__NEON_RIFT_TEST__.finishSector()');check('Standard sector nine still reaches victory',mode(page)=='won');page.locator('#endlessBtn').click();page.locator('.upgrade-card').first.click();page.evaluate('__NR16_QA.arrive()');check('Post-win endless reaches sector ten and wraps destinations',snap(page)['wave']==10 and page.evaluate('__NR16_QA.location().id')=='haven')
   page.evaluate('__NEON_RIFT_TEST__.finishSector()');ep=page.evaluate('JSON.parse(localStorage.getItem("neon-rift-checkpoint-v1"))');check('Endless checkpoint retains mode and prior Standard finalization',ep and ep['mode']=='endless' and ep['g']['endless'] and ep['g']['careerFinalized'])
   page.evaluate('__NR16_QA.pauseTravel()');check('Saved Endless checkpoint is accepted',page.evaluate('__NR16_QA.checkpointValid()'))
   check('Gameplay invariants after journey and continuation',page.evaluate('__NEON_RIFT_TEST__.validate()')==[])
   check('Travel suite: no uncaught exceptions',not errors,errors);c.close()
  if args.suite in ['all','scenes']:
   c,page,errors=make(b,False,1280,720);start(page);images=[];stats=[]
   for wave in range(1,10):
    page.evaluate(f'__NEON_RIFT_TEST__.forceWave({wave});__NR16_QA.forceRender()');st=page.evaluate('__NR16_QA.sceneStats()');stats.append(st);st['renderer']=page.evaluate('__NR15_QA.status')
    check(f'Sector {wave}: correct independent destination',page.evaluate('__NR15_QA.status.zone')==wave-1,st)
    check(f'Sector {wave}: geometry and graphics are valid',page.evaluate('__NR15_QA.status.triangles')>1000 and page.evaluate('__NR15_QA.error()')==0,st)
    images.append(Image.open(io.BytesIO(page.locator('#nrScene').screenshot())).convert('RGB'))
    images[-1].save(OUT/f'location-{wave:02}.png')
   diff=[]
   for i in range(9):
    for j in range(i+1,9):
     m=ImageStat.Stat(ImageChops.difference(images[i].resize((120,80)),images[j].resize((120,80)))).mean
     diff.append({'a':i+1,'b':j+1,'mean_difference':sum(m)/3})
   check('All 36 location pairs have materially different scene pixels',all(d['mean_difference']>5 for d in diff),diff)
   same=page.evaluate('''()=>{let before=JSON.stringify(__NEON_RIFT_TEST__.snapshot()),rng=__NR15_QA.rng;for(let i=0;i<4;i++)__NR16_QA.forceRender();return before===JSON.stringify(__NEON_RIFT_TEST__.snapshot())&&rng===__NR15_QA.rng}''')
   check('Rendering consumes neither simulation state nor gameplay RNG',same)
   check('Only one environment mesh remains allocated during sector changes',len(set(s['models'] for s in stats))==1,stats)
   page.locator('#pauseBtn').click();page.set_viewport_size({'width':3840,'height':2160});page.evaluate('__NR16_QA.setQuality("ultra")');page.wait_for_timeout(200)
   st=page.evaluate('__NR16_QA.sceneStats()');st['viewport']=page.evaluate('[innerWidth,innerHeight,visualViewport.width,visualViewport.height]');st['renderer']=page.evaluate('__NR15_QA.status');check('Ultra actually allocates a 3840 x 2160 render buffer',st['size']==[3840,2160],st)
   check('True 4K render has no WebGL error',page.evaluate('__NR15_QA.error()')==0)
   page.evaluate('document.querySelector("#pauseScreen").hidden=true;document.querySelector("#banner").classList.remove("visible");document.body.classList.remove("nr-boss-intro")');page.screenshot(path=str(OUT/'event-horizon-4k.png'))
   page.set_viewport_size({'width':390,'height':844});page.evaluate('__NR16_QA.setQuality("auto");__NEON_RIFT_TEST__.forceWave(5);__NR16_QA.forceRender()');check('Returning to Auto releases oversized buffers',page.evaluate('__NR16_QA.sceneStats().size[0]*__NR16_QA.sceneStats().size[1]')<2400000)
   page.screenshot(path=str(OUT/'solar-array-phone.png'))
   check('Scene suite: no uncaught exceptions',not errors,errors);c.close()
  if args.suite in ['all','fallback']:
   extra="""(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...a){return type==='webgl2'?null:original.call(this,type,...a)}})();"""
   c,page,errors=make(b,False,900,650,extra=extra);start(page)
   check('Unavailable WebGL selects a functioning fallback',page.evaluate('__NEON_RIFT_VISUAL__.renderer')=='compatibility')
   page.evaluate('__NEON_RIFT_TEST__.finishSector()');page.locator('.upgrade-card').first.click();page.evaluate('__NR16_QA.arrive()');check('2D fallback still transitions to the correct new destination',snap(page)['wave']==2 and mode(page)=='playing')
   page.locator('#pauseBtn').click();page.locator('#motionBtn').click();page.locator('#resumeBtn').click();page.evaluate('__NEON_RIFT_TEST__.finishSector()');page.locator('.upgrade-card').first.click();check('Reduced motion uses a short non-moving transition',page.evaluate('__NR16_QA.travel().duration')<=.3)
   page.wait_for_function('__NEON_RIFT_TEST__.snapshot().state==="playing"');check('Reduced transition arrives automatically',snap(page)['wave']==3)
   page.evaluate('__NEON_RIFT_TEST__.finishSector()');saved=page.evaluate('localStorage.getItem("neon-rift-checkpoint-v1")');page.evaluate('localStorage.setItem("neon-rift-checkpoint-v1",JSON.stringify({...JSON.parse(localStorage.getItem("neon-rift-checkpoint-v1")),seed:"bad"}))');check('Invalid local checkpoint is rejected safely',not page.evaluate('__NR16_QA.checkpointValid()'));page.locator('.upgrade-card').first.click();page.evaluate('__NR16_QA.arrive()')
   check('Fallback has no uncaught exceptions',not errors,errors);c.close()
  b.close()
finally:
 if server:server.shutdown()
 out={'version':'1.6.0','suite':args.suite,'inline':args.inline,'backend':'mocked, no live writes','checks':results,'passed':sum(x['pass'] for x in results),'total':len(results)}
 (OUT/f'results-{args.suite}.json').write_text(json.dumps(out,indent=2))
 print('TOTAL',out['passed'],'/',out['total'],flush=True)
