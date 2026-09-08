from pathlib import Path
import subprocess,os,json,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; results=[]
(ROOT/'artifacts/v15').mkdir(parents=True,exist_ok=True)
import threading,http.server,functools,io
from PIL import Image,ImageChops,ImageStat
server=http.server.ThreadingHTTPServer(('127.0.0.1',8771),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
def test(name,c,detail=None):
 results.append({'name':name,'pass':bool(c),'detail':detail});print(('PASS ' if c else 'FAIL ')+name,detail or '',flush=True)
 if not c:raise AssertionError(name)
def prepare(context):
 context.add_init_script("""localStorage.setItem('neon-rift-career-v1',JSON.stringify({version:1,pilot:'VISUAL QA'}));localStorage.setItem('neon-rift-save-v1',JSON.stringify({sound:false,music:false}));""")
 def network(route):
  if route.request.method=='OPTIONS':route.fulfill(status=204,headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey,content-type','Access-Control-Allow-Methods':'POST,GET,OPTIONS'});return
  if '/rest/v1/' in route.request.url:route.fulfill(status=200,content_type='application/json',body='[]',headers={'Access-Control-Allow-Origin':'*'});return
  # Keep managed actions off production in visual/input tests.
  route.fulfill(status=503,content_type='application/json',body='{"error":"visual-test-offline"}',headers={'Access-Control-Allow-Origin':'*'})
 context.route('https://*.supabase.co/**',network)
def load(page):page.goto('http://127.0.0.1:8771/index.html?test=1',wait_until='load')
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM') or None,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  for mobile in [False,True]:
   context=b.new_context(viewport={'width':390,'height':844} if mobile else {'width':1440,'height':900},has_touch=mobile,is_mobile=mobile,device_scale_factor=1)
   prepare(context);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page);page.wait_for_function('window.__NR15_QA && __NR15_QA.status.frames>0',timeout=30000)
   prefix='mobile' if mobile else 'desktop'
   page.screenshot(path=str(ROOT/'artifacts/v15'/f'{prefix}-menu.png'))
   zone_images=[]
   test(prefix+' uses real WebGL2',page.evaluate('__NR15_QA.status.mode')=='webgl2')
   test(prefix+' game canvas accepts input, scene canvas does not',page.evaluate('getComputedStyle(document.getElementById("nrScene")).pointerEvents')=='none')
   test(prefix+' visible version label',page.locator('#nrBuild').is_visible())
   for rig in ['striker','ghost','bastion']:
    page.locator(f'[data-rig="{rig}"]').click();test(prefix+' selects '+rig,page.locator('#nrShipName').inner_text()==rig.upper())
    test(prefix+' '+rig+' has substantive mesh',page.evaluate(f'__NR15_QA.rawModel("{rig}")')>400)
   page.evaluate('__NEON_RIFT_TEST__.start();__NEON_RIFT_TEST__.invulnerable();__NEON_RIFT_TEST__.advance(.5,false)')
   for sec in [1,4,7,9]:
    page.evaluate(f'__NEON_RIFT_TEST__.forceWave({sec});__NR15_QA.render()');status=page.evaluate('__NR15_QA.status')
    test(prefix+f' sector {sec} renders geometry',status['triangles']>1500,status['triangles'])
    test(prefix+f' sector {sec} bounded draw calls',status['drawCalls']<30,status['drawCalls'])
    test(prefix+f' sector {sec} no GL errors',page.evaluate('__NR15_QA.error()')==0)
    zone_images.append(Image.open(io.BytesIO(page.locator('#nrScene').screenshot())).convert('RGB').resize((80,80)))
   for i in range(1,len(zone_images)):
    diff=ImageStat.Stat(ImageChops.difference(zone_images[0],zone_images[i]));test(prefix+f' environment {i} produces different scene pixels',sum(diff.mean)>8,diff.mean)
   # Frozen in-frame series catches any renderer mutation of authoritative game state/RNG.
   invariant=page.evaluate('''()=>{const a=__NEON_RIFT_TEST__.snapshot(),r=__NR15_QA.rng;for(let i=0;i<5;i++)__NR15_QA.render();return {same:JSON.stringify(a)===JSON.stringify(__NEON_RIFT_TEST__.snapshot()),rng:r===__NR15_QA.rng};}''')
   test(prefix+' renderer leaves simulation unchanged',invariant['same']);test(prefix+' renderer consumes no gameplay RNG',invariant['rng'])
   page.evaluate('__NEON_RIFT_TEST__.forceWave(1);__NEON_RIFT_TEST__.setPlayer({energy:100})');page.locator('#overdriveBtn').click();page.wait_for_timeout(100);test(prefix+' overdrive works',page.evaluate('__NEON_RIFT_TEST__.snapshot().player.overdrive')>0)
   if mobile:
    cdp=context.new_cdp_session(page);r=page.locator('#movePad').bounding_box();bx=r['x']+r['width']/2;by=r['y']+r['height']/2
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':bx,'y':by,'id':0}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':bx+43,'y':by,'id':0}]});before=page.evaluate('__NEON_RIFT_TEST__.snapshot().player.x');page.evaluate('__NEON_RIFT_TEST__.advance(.25,false)');test('Real phone thumbstick moves',page.evaluate('__NEON_RIFT_TEST__.snapshot().player.x')>before+20)
    r=page.locator('#dashBtn').bounding_box();dx=r['x']+r['width']/2;dy=r['y']+r['height']/2;cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':bx+43,'y':by,'id':0},{'x':dx,'y':dy,'id':1}]});test('Second-finger dash preserves steering',page.evaluate('__NEON_RIFT_TEST__.snapshot().controls.pointerId!==null && __NEON_RIFT_TEST__.snapshot().player.dashCooldown>0'));cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   else:
    before=page.evaluate('__NEON_RIFT_TEST__.snapshot().player.x');page.keyboard.down('d');page.evaluate('__NEON_RIFT_TEST__.advance(.5,false)');page.keyboard.up('d');test('Desktop keyboard movement preserved',page.evaluate('__NEON_RIFT_TEST__.snapshot().player.x')>before+50)
   page.locator('#pauseBtn').click();test(prefix+' pause works',page.evaluate('__NEON_RIFT_TEST__.snapshot().state')=='paused')
   page.locator('#graphicsBtn').click();test(prefix+' performance graphics selection',page.locator('#graphicsBtn').inner_text()=='PERFORMANCE');page.locator('#resumeBtn').click();page.evaluate('__NR15_QA.render()');test(prefix+' low graphics renders',page.evaluate('__NR15_QA.error()')==0)
   page.locator('#pauseBtn').click();page.locator('#graphicsBtn').click();page.locator('#resumeBtn').click();page.wait_for_timeout(100);test(prefix+' compatibility selection falls back',page.evaluate('__NEON_RIFT_VISUAL__.renderer')=='compatibility')
   test(prefix+' no game invariants broken',page.evaluate('__NEON_RIFT_TEST__.validate()')==[])
   test(prefix+' no uncaught exceptions',not errors,errors)
   # Back to title for layout checks, without altering the existing control handlers.
   page.locator('#pauseBtn').click();page.locator('#quitBtn').click()
   for ww,hh in ([(320,568),(390,844),(430,932),(844,390)] if mobile else [(1280,720),(1920,1080),(3440,1440)]):
    page.set_viewport_size({'width':ww,'height':hh});page.wait_for_timeout(60)
    for selector in ['#startBtn','#endlessRunBtn','#dailyRunBtn','[data-rig="ghost"]','#profileBtn']:
     el=page.locator(selector);el.scroll_into_view_if_needed();box=el.bounding_box();test(prefix+f' {ww}x{hh} {selector} fits width',box['x']>=-1 and box['x']+box['width']<=ww+1,box)
   context.close()
  # A blocked WebGL context must not prevent the game or controls from starting.
  context=b.new_context();prepare(context);context.add_init_script("(()=>{const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...a){return type==='webgl2'?null:orig.call(this,type,...a)}})()")
  page=context.new_page();load(page);page.wait_for_function('window.__NR15_QA');page.wait_for_timeout(100);test('WebGL-unavailable fallback is automatic',page.evaluate('__NEON_RIFT_VISUAL__.renderer')=='compatibility');page.evaluate('__NEON_RIFT_TEST__.start();__NEON_RIFT_TEST__.advance(1)');test('Missing WebGL does not stop gameplay',page.evaluate('__NEON_RIFT_TEST__.snapshot().elapsed')>0);page.close()
  b.close()
finally:
 server.shutdown();(ROOT/'artifacts/v15/results.json').write_text(json.dumps(results,indent=2))
print('TOTAL',len(results),'PASS',sum(r['pass'] for r in results))
