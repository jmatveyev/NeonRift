"""Regression tests use real Chromium touch pointers plus opt-in game fixtures.

Run with Python Playwright and an installed Chromium browser. Navigation is
administrator-blocked in this environment, so the HTML is loaded by set_content.
Only the existing test-hook condition is enabled; production has no test export.
"""
from pathlib import Path
import json, math, os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()
TEST_HTML=HTML.replace("if (new URL(location.href).searchParams.has('test'))", 'if (true)')
RESULTS=[];ALL_ERRORS=[]

def check(name,condition,detail=None):
    RESULTS.append({'name':name,'pass':bool(condition),'detail':detail})
    if not condition: raise AssertionError(name+': '+str(detail))

def snap(page): return page.evaluate('__NEON_RIFT_TEST__.snapshot()')
def center(page,selector):
    r=page.locator(selector).bounding_box();return {'x':r['x']+r['width']/2,'y':r['y']+r['height']/2}

class Fingers:
    def __init__(self,context,page):
        self.cdp=context.new_cdp_session(page);self.points={}
    def down(self,id,x,y):
        self.points[id]={'id':id,'x':x,'y':y}
        self.cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':list(self.points.values())})
    def move(self,id,x,y):
        self.points[id]={'id':id,'x':x,'y':y}
        self.cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':list(self.points.values())})
    def up(self,id):
        # This Chromium accepts changed contacts on touchEnd. The pointerup log
        # below verifies which actual pointer is released instead of assuming it.
        contact=self.points.pop(id)
        self.cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[contact]})
    def end(self):
        if self.points: self.cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        self.points={}
    def cancel(self):
        self.cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]});self.points={}

def load(browser,w,h,touch=True,test=True):
    context=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=2 if touch else 1,is_mobile=touch,has_touch=touch)
    page=context.new_page();page.on('pageerror',lambda e:ALL_ERRORS.append(str(e)))
    requests=[];page.on('request',lambda r:requests.append(r.url))
    page.set_content(TEST_HTML if test else HTML,wait_until='load')
    if test:page.wait_for_function('window.__NEON_RIFT_TEST__')
    return context,page,requests

def assert_hit_target(page,selector,name):
    r=page.locator(selector).bounding_box()
    actual=page.locator(selector).evaluate('(el)=>{let r=el.getBoundingClientRect();let hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el===hit||el.contains(hit)}')
    w,h=page.viewport_size['width'],page.viewport_size['height']
    check(name,actual and r['x']>=-1 and r['y']>=-1 and r['x']+r['width']<=w+1 and r['y']+r['height']<=h+1,r)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    context,page,requests=load(browser,390,844)
    check('Touch device automatically enables phone layout',snap(page)['controls']['mobile'])
    check('Thumbstick is hidden in the hangar',not page.locator('#movePad').is_visible())
    page.locator('[data-rig="ghost"]').tap();page.locator('#startBtn').tap()
    check('Tap selects ship and starts run',snap(page)['player']['rig']=='ghost' and snap(page)['state']=='playing')
    for sel in ['#movePad','#dashBtn','#overdriveBtn','#pauseBtn']:assert_hit_target(page,sel,'Visible usable control '+sel)
    check('Phone rendering caps device pixel ratio',snap(page)['controls']['pixelRatio']<=1.5)
    page.evaluate('__NEON_RIFT_TEST__.invulnerable()')
    page.evaluate("window.pointerLog=[];for(let type of ['pointerdown','pointerup','pointercancel'])document.addEventListener(type,e=>pointerLog.push({type,id:e.pointerId,target:e.target.id}),true)")
    fingers=Fingers(context,page);pos=center(page,'#movePad')
    fingers.down(0,**pos);page.wait_for_timeout(80)
    check('Thumbstick center has a dead zone',snap(page)['controls']['amount']==0)
    base=snap(page)['player']['x'];fingers.move(0,pos['x']+43,pos['y']);page.wait_for_timeout(200)
    s=snap(page);pointer=s['controls']['pointerId']
    check('Dragging thumbstick moves the ship',s['player']['x']>base+12)
    check('Steering magnitude is normalized',s['controls']['amount']<=1 and s['controls']['x']>0.8)
    dash=center(page,'#dashBtn');fingers.down(1,**dash);page.wait_for_timeout(70)
    check('Second finger activates dash while steering',snap(page)['player']['dashCooldown']>1 and snap(page)['controls']['pointerId']==pointer)
    fingers.up(1);page.wait_for_timeout(100)
    s=snap(page)
    check('Releasing dash keeps movement finger active',s['controls']['pointerId']==pointer and s['controls']['x']>0.8)
    check('Released dash contact is removed',s['controls']['actionPointers']==0)
    check('Browser pointerup targets dash rather than joystick',page.evaluate("pointerLog.filter(e=>e.type==='pointerup').at(-1).target")=='dashBtn')
    before=s['player']['x'];page.wait_for_timeout(180);check('Movement continues after ability release',snap(page)['player']['x']>before+10)
    page.evaluate('__NEON_RIFT_TEST__.setPlayer({energy:100})')
    over=center(page,'#overdriveBtn');fingers.down(2,**over);page.wait_for_timeout(60)
    check('Overdrive activates while movement continues',snap(page)['player']['overdrive']>0 and snap(page)['controls']['pointerId']==pointer)
    fingers.up(2);page.wait_for_timeout(60)
    check('Overdrive release preserves steering and clears ability pointer',snap(page)['controls']['pointerId']==pointer and snap(page)['controls']['actionPointers']==0)
    fingers.up(0);page.wait_for_timeout(120)
    check('Releasing movement clears all input',snap(page)['controls']['pointerId'] is None and snap(page)['controls']['amount']==0)
    before=snap(page)['player']['x'];page.wait_for_timeout(180);check('No stuck movement after release',abs(snap(page)['player']['x']-before)<.01)
    fingers.end()
    # Ability-first interaction and multi-contact cleanup.
    page.wait_for_timeout(2400);fingers.down(1,**dash);fingers.down(0,**pos);fingers.move(0,pos['x'],pos['y']-42);page.wait_for_timeout(80)
    check('Starting with an ability does not block movement',snap(page)['controls']['y']<-.8)
    fingers.cancel();page.wait_for_timeout(80)
    check('Native touch cancellation clears movement and abilities',snap(page)['controls']['pointerId'] is None and snap(page)['controls']['actionPointers']==0)
    # Legacy anywhere drag remains supported.
    fingers.down(0,195,510);fingers.move(0,170,480);page.wait_for_timeout(80)
    check('Drag-anywhere arena movement remains available',snap(page)['controls']['amount']>.5 and page.locator('#joystick').is_visible())
    fingers.end();page.wait_for_timeout(60)
    # Focus, pause, and rotation cleanup.
    fingers.down(0,**pos);fingers.move(0,pos['x']+42,pos['y']);page.wait_for_timeout(40)
    pause=center(page,'#pauseBtn');fingers.down(3,**pause);fingers.up(3);page.wait_for_timeout(100)
    check('Touch pause works while steering',snap(page)['state']=='paused')
    check('Pause clears captured inputs',snap(page)['controls']['pointerId'] is None and snap(page)['controls']['actionPointers']==0)
    t=snap(page)['elapsed'];page.wait_for_timeout(120);check('Mission clock stops while paused',snap(page)['elapsed']==t)
    fingers.end();page.locator('#resumeBtn').tap();page.wait_for_timeout(80)
    check('Tap resume returns without stale movement',snap(page)['state']=='playing' and snap(page)['controls']['amount']==0)
    page.evaluate("screen.orientation.dispatchEvent(new Event('change'))")
    check('Orientation event pauses safely',snap(page)['state']=='paused' and 'rotated' in page.locator('#pauseDescription').inner_text())
    page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(100)
    page.locator('#resumeBtn').tap();page.wait_for_timeout(80)
    for sel in ['#movePad','#dashBtn','#overdriveBtn','#pauseBtn']:assert_hit_target(page,sel,'Landscape control reachable '+sel)
    page.locator('#pauseBtn').tap();page.locator('#handednessBtn').tap();page.locator('#resumeBtn').tap()
    check('Left-handed setting swaps movement and ability sides',center(page,'#movePad')['x']>center(page,'#dashBtn')['x'])
    page.locator('#pauseBtn').tap();page.locator('#controlsBtn').tap();page.locator('#controlsBtn').tap()
    check('Touch controls can be turned off',not snap(page)['controls']['mobile'])
    page.locator('#controlsBtn').tap();check('Automatic touch detection can be restored',snap(page)['controls']['mobile'])
    page.locator('#resumeBtn').tap();page.evaluate("dispatchEvent(new Event('blur'))")
    check('Loss of focus pauses and releases inputs',snap(page)['state']=='paused' and snap(page)['controls']['pointerId'] is None)
    page.locator('#resumeBtn').tap();page.evaluate("dispatchEvent(new Event('pagehide'))")
    check('Leaving the page pauses the run',snap(page)['state']=='paused')
    page.locator('#resumeBtn').tap();page.evaluate('__NEON_RIFT_TEST__.finishSector()')
    check('Sector completion opens upgrade UI',snap(page)['state']=='upgrade' and page.locator('.upgrade-card').count()==3)
    rolls=snap(page)['rerolls'];page.locator('#rerollBtn').tap();check('Reroll is touch accessible',snap(page)['rerolls']==rolls-1)
    page.locator('.upgrade-card').nth(1).tap();check('Upgrade tap advances to next sector',snap(page)['state']=='playing' and snap(page)['wave']==2)
    page.evaluate('__NEON_RIFT_TEST__.invulnerable(false);__NEON_RIFT_TEST__.hit(10000);if(__NEON_RIFT_TEST__.snapshot().state==="playing")__NEON_RIFT_TEST__.hit(10000)')
    check('Defeat opens results with no active pointers',snap(page)['state']=='dead' and snap(page)['controls']['pointerId'] is None)
    page.locator('#retryBtn').tap();check('Phone retry starts a clean run',snap(page)['state']=='playing' and snap(page)['wave']==1)
    page.locator('#pauseBtn').tap();page.locator('#quitBtn').tap();check('Return to hangar hides game controls',snap(page)['state']=='home' and not page.locator('#movePad').is_visible())
    page.locator('#howBtn').tap();check('Flight manual explains phone inputs', 'thumbstick' in page.locator('#pauseScreen').inner_text())
    check('No network dependency in mobile game',not requests)
    check('Game entity invariants remain valid',page.evaluate('__NEON_RIFT_TEST__.validate()')==[])
    context.close()
    # Layout and touch menu traversal at common portrait/landscape sizes.
    for w,h in [(320,568),(360,640),(375,667),(390,844),(430,932),(568,320),(667,375),(844,390),(932,430),(1024,768)]:
        context,page,requests=load(browser,w,h)
        check(f'{w}x{h}: no horizontal page overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.locator('[data-rig="bastion"]').tap();check(f'{w}x{h}: last ship reachable by scrolling',page.locator('[data-rig="bastion"]').get_attribute('aria-pressed')=='true')
        page.locator('#startBtn').tap()
        for sel in ['#movePad','#dashBtn','#overdriveBtn','#pauseBtn']:assert_hit_target(page,sel,f'{w}x{h}: hit-test '+sel)
        sizes=page.locator('.mobile-controls .ability').evaluate_all('els=>els.map(e=>{let r=e.getBoundingClientRect();return [r.width,r.height]})')
        check(f'{w}x{h}: ability touch targets exceed 44px',all(min(size)>=44 for size in sizes))
        page.evaluate('__NEON_RIFT_TEST__.finishSector()');page.locator('.upgrade-card').nth(2).tap()
        check(f'{w}x{h}: third upgrade reachable by touch',snap(page)['state']=='playing')
        page.locator('#pauseBtn').tap();page.locator('#quitBtn').tap()
        check(f'{w}x{h}: lower pause action reachable',snap(page)['state']=='home')
        context.close()
    context,page,requests=load(browser,1280,800,False)
    check('Desktop has no forced mobile controls',not snap(page)['controls']['mobile'])
    page.locator('#startBtn').click();page.keyboard.down('d');page.wait_for_timeout(180);page.keyboard.up('d')
    check('Desktop keyboard movement retained',snap(page)['player']['x']>1200+5)
    page.keyboard.press('Space');check('Desktop Space dash retained',snap(page)['player']['dashCooldown']>0)
    page.evaluate('__NEON_RIFT_TEST__.setPlayer({energy:100})');page.keyboard.press('e');check('Desktop E Overdrive retained',snap(page)['player']['overdrive']>0)
    page.keyboard.press('Escape');check('Desktop pause retained',snap(page)['state']=='paused')
    page.locator('#resumeBtn').click();page.mouse.move(420,400);page.mouse.down();page.mouse.move(470,400);page.wait_for_timeout(70)
    check('Desktop mouse drag retained',snap(page)['controls']['x']>.5);page.mouse.up()
    check('Mouse release clears steering',snap(page)['controls']['pointerId'] is None)
    context.close()
    # The delivery itself, with no enabled test hook, boots and accepts native taps.
    context,page,requests=load(browser,390,844,True,False)
    check('Production build does not expose test API',page.evaluate('typeof __NEON_RIFT_TEST__')=='undefined')
    page.locator('#startBtn').tap();check('Uninstrumented production game starts',page.locator('#movePad').is_visible())
    page.locator('#pauseBtn').tap();check('Uninstrumented production pause works',page.locator('#pauseScreen').is_visible())
    context.close();browser.close()
check('No uncaught JavaScript exceptions in test sessions',not ALL_ERRORS,ALL_ERRORS)
output={'build':'1.1.0-mobile','base_commit':'f8bbd1d72777c797d347e6f54ffea7ed12e827ec','environment':'Chromium desktop + device/touch emulation; set_content due administrator navigation restrictions','tests':RESULTS,'uncaught_errors':ALL_ERRORS,'physical_devices_tested':False,'webkit_tested':False}
(Path(__file__).resolve().parent/'mobile-results.json').write_text(json.dumps(output,indent=2))
print(f'PASSED: {sum(t["pass"] for t in RESULTS)} / {len(RESULTS)} assertions')
