"""Neon Rift 1.7 cinematic-travel, native-showcase and controller UAT.
All online endpoints are mocked. WebGL checks run in a real Chromium WebGL2 context.
"""
from pathlib import Path
import argparse,functools,http.server,threading,json,os,io,time
from playwright.sync_api import sync_playwright
from PIL import Image,ImageChops,ImageStat
P=argparse.ArgumentParser();P.add_argument('--inline',action='store_true');args=P.parse_args()
ROOT=Path(__file__).resolve().parents[1];HTML=Path(os.environ.get('GAME_HTML',str(ROOT/'index.html')));OUT=ROOT/'artifacts/v17';OUT.mkdir(parents=True,exist_ok=True)
text=HTML.read_text();results=[];server=None
if args.inline: URL='about:blank?test=1'
else:
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(HTML.parent)))
 threading.Thread(target=server.serve_forever,daemon=True).start();URL=f'http://127.0.0.1:{server.server_port}/{HTML.name}?test=1'
INIT="""(()=>{localStorage.setItem('neon-rift-save-v1',JSON.stringify({sound:false,music:false}));localStorage.setItem('neon-rift-career-v1',JSON.stringify({version:1,pilot:'UAT PILOT'}));})();"""
def check(name,ok,detail=None):
 results.append({'name':name,'pass':bool(ok),'detail':detail});print(('PASS' if ok else 'FAIL'),name,detail if not ok else '',flush=True)
 if not ok: raise AssertionError(name)
def net(route):
 req=route.request;h={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'apikey,content-type,authorization'}
 if req.method=='OPTIONS':route.fulfill(status=204,headers=h);return
 body=[] if '/rest/v1/' in req.url else {'accepted':True}
 if '/functions/v1/' in req.url and req.method=='POST':
  d=req.post_data_json or {};body={'run_id':'00000000-0000-4000-8000-000000000017','token':'uat-v17','seed':171717,'mode':d.get('mode','standard')} if d.get('action')=='start' else {'accepted':True}
 route.fulfill(status=200,content_type='application/json',body=json.dumps(body),headers=h)
def make(browser,w,h,dpr=1,mobile=False):
 c=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr,is_mobile=mobile,has_touch=mobile);c.route('https://*.supabase.co/**',net);pg=c.new_page();errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
 if args.inline:
  patched=text.replace("new URLSearchParams(location.search).has('test')","true").replace("new URL(location.href).searchParams.has('test')","true").replace("window.NEON_RIFT_ONLINE = {\n  enabled: true,","window.NEON_RIFT_ONLINE = {\n  enabled: false,")
  pg.goto(URL);pg.set_content(patched,wait_until='load')
 else:
  c.add_init_script(INIT);pg.goto(URL,wait_until='load')
 pg.wait_for_function('window.__NR17_QA && window.__NR16_QA && window.__NR15_QA && window.__NEON_RIFT_TEST__',timeout=15000);pg.wait_for_timeout(450);return c,pg,errors
def rect_inside(r,w,h,pad=0):return r['left']>=-pad and r['top']>=-pad and r['right']<=w+pad and r['bottom']<=h+pad
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM') or '/usr/bin/chromium',headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader'])
  c,pg,errors=make(b,1920,1080,2);pg.evaluate('__NR17_QA.forceRender()');pg.wait_for_timeout(120)
  check('Home uses WebGL2',pg.evaluate('__NEON_RIFT_VISUAL__.renderer')=='webgl2')
  check('Desktop 2x showcase allocates true 3840x2160',pg.evaluate('__NR17_QA.showcaseSize()')==[3840,2160],pg.evaluate('__NR17_QA.showcaseSize()'))
  check('Showcase explicitly reports native render','3840×2160 / NATIVE SHOWCASE' in pg.locator('#nrShowcaseResolution').inner_text())
  counts={k:pg.evaluate(f"__NR17_QA.showcaseVertices('{k}')") for k in ['striker','ghost','bastion']};check('All three display ships use high-detail showcase meshes',all(v>3500 for v in counts.values()),counts)
  check('4K menu has no horizontal overflow',pg.evaluate('document.documentElement.scrollWidth===document.documentElement.clientWidth'))
  before=pg.evaluate('JSON.stringify(__NEON_RIFT_TEST__.snapshot())');rng=pg.evaluate('__NR15_QA.rng');pg.evaluate('for(let i=0;i<3;i++)__NR17_QA.forceRender()');check('Native showcase rendering does not consume gameplay state/RNG',before==pg.evaluate('JSON.stringify(__NEON_RIFT_TEST__.snapshot())') and rng==pg.evaluate('__NR15_QA.rng'))
  check('4K showcase has no uncaught exceptions',not errors,errors);c.close()

  c,pg,errors=make(b,1280,720);pg.evaluate("__NR16_QA.setSeed(17);__NR17_QA.startTravel('PHASE LATTICE')")
  frames=[];expected=[('launch',.10,'CLEARING DOCK'),('warp',.50,'RIFT TRANSIT'),('arrival',.90,'FINAL APPROACH')]
  for name,f,phase in expected:
   pg.evaluate(f'__NR17_QA.setTravelProgress({f})');pg.wait_for_timeout(90);actual=pg.locator('#travelPhase').inner_text();check(f'{name}: correct cinematic phase',actual==phase,actual)
   check(f'{name}: normal top bar is suppressed',pg.locator('.topbar').evaluate("e=>getComputedStyle(e).opacity")=='0')
   r=pg.locator('.travel-card').evaluate('e=>e.getBoundingClientRect().toJSON()');check(f'{name}: flight-computer HUD stays inside desktop viewport',rect_inside(r,1280,720),r)
   st=pg.evaluate('__NR15_QA.status');check(f'{name}: animated travel renders real 3D geometry',st['mode']=='webgl2' and st['triangles']>2000,st)
   img=Image.open(io.BytesIO(pg.locator('#nrScene').screenshot())).convert('RGB');img.save(OUT/f'travel-{name}.png');frames.append(img.resize((160,90)))
  diffs=[sum(ImageStat.Stat(ImageChops.difference(frames[a],frames[b])).mean)/3 for a,b in [(0,1),(1,2)]]
  check('Departure, rift and approach are materially different rendered scenes',all(v>4 for v in diffs),diffs)
  check('Travel scene has no WebGL errors',pg.evaluate('__NR15_QA.error()')==0)
  check('Travel scene has no uncaught exceptions',not errors,errors)
  pg.evaluate("""()=>{__NR16_QA.arrive();window.__pad={connected:true,axes:[0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__pad]});__NR17_QA.pollGamepad();__NEON_RIFT_TEST__.start();__NEON_RIFT_TEST__.invulnerable();}""")
  check('Controller connection is surfaced in UI',pg.locator('#nrControllerStatus').inner_text()=='CONTROLLER READY' and pg.locator('body').evaluate("e=>e.classList.contains('nr-gamepad')"))
  pg.evaluate('__pad.axes=[.84,0];__NR17_QA.pollGamepad()');move=pg.evaluate('__NR17_QA.movement()');check('Gamepad left stick produces dead-zone-normalized movement',move['x']>.75 and abs(move['y'])<.01,move)
  pg.evaluate('__pad.buttons[0]={pressed:true,value:1};__NR17_QA.pollGamepad()');check('Gamepad A triggers dash',pg.evaluate('__NEON_RIFT_TEST__.snapshot().player.dashCooldown')>0)
  pg.evaluate('__pad.buttons[0]={pressed:false,value:0};__NR17_QA.pollGamepad();__NEON_RIFT_TEST__.setPlayer({energy:100});__pad.buttons[2]={pressed:true,value:1};__NR17_QA.pollGamepad()');check('Gamepad X triggers Overdrive',pg.evaluate('__NEON_RIFT_TEST__.snapshot().player.overdrive')>0)
  pg.evaluate('__pad.buttons[2]={pressed:false,value:0};__NR17_QA.pollGamepad();__pad.buttons[9]={pressed:true,value:1};__NR17_QA.pollGamepad()');check('Gamepad Menu/Start pauses active run',pg.evaluate('__NEON_RIFT_TEST__.snapshot().state')=='paused')
  check('Gamepad UAT has no uncaught exceptions',not errors,errors);c.close()

  c,pg,errors=make(b,393,852,3,True);pg.evaluate("__NR16_QA.setSeed(71);__NR17_QA.startTravel('ION LATTICE');__NR17_QA.setTravelProgress(.5)");pg.wait_for_timeout(100)
  size=pg.evaluate('__NR17_QA.showcaseSize()');check('Phone Auto does not force a 4K workload',size[0]*size[1]<2000000,size)
  r=pg.locator('.travel-card').evaluate('e=>e.getBoundingClientRect().toJSON()');check('Phone transit HUD stays inside safe viewport',rect_inside(r,393,852),r)
  check('Phone transit has no horizontal overflow',pg.evaluate('document.documentElement.scrollWidth===document.documentElement.clientWidth'))
  buttons=pg.locator('.travel-actions button:not([hidden])');check('Phone travel controls remain fully visible',all(rect_inside(buttons.nth(i).evaluate('e=>e.getBoundingClientRect().toJSON()'),393,852) for i in range(buttons.count())))
  check('Phone travel hides top bar and footer',pg.locator('.topbar').evaluate("e=>getComputedStyle(e).opacity")=='0' and pg.locator('.footer-note').evaluate("e=>getComputedStyle(e).opacity")=='0')
  pg.screenshot(path=str(OUT/'travel-phone.png'));check('Phone travel has no uncaught exceptions',not errors,errors);c.close();b.close()
finally:
 if server:server.shutdown()
out={'version':'1.7.0','backend':'mocked, no live writes','passed':sum(x['pass'] for x in results),'total':len(results),'checks':results};(OUT/'results.json').write_text(json.dumps(out,indent=2));print('V1.7 UAT',out['passed'],'/',out['total'],flush=True)
