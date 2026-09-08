"""Neon Rift 1.4 visual-overhaul browser regression coverage."""
from pathlib import Path
import json, os, socket, subprocess, sys, time, uuid
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PORT = 8767
BASE = f'http://127.0.0.1:{PORT}'
SUPABASE = 'https://pjkdwekdtyzoqtrnhwaa.supabase.co'
RESULTS = []


def check(name, condition, detail=None):
    RESULTS.append({'name': name, 'pass': bool(condition), 'detail': detail})
    if not condition:
        raise AssertionError(f'{name}: {detail}')


def wait_port(port, seconds=5):
    end = time.time() + seconds
    while time.time() < end:
        try:
            with socket.create_connection(('127.0.0.1', port), timeout=.2):
                return
        except OSError:
            time.sleep(.05)
    raise RuntimeError('local test server did not start')


html = (ROOT / 'index.html').read_text()
check('Production version is 1.4.0', 'application-version" content="1.4.0"' in html)
check('Premium Canvas 2D visual runtime is present', "renderer: 'canvas2d-premium'" in html and 'const V14_VERSION' in html)
check('Four sector art directions are present', all(name in html for name in ['SIGNAL FRONTIER', 'ION WRECKAGE', 'FRACTURED VEIL', 'SOVEREIGN CORE']))
check('Visual runtime includes parallax/nebula renderer', 'v14DrawBackground' in html and 'createRadialGradient' in html)
check('Visual runtime includes procedural arena/debris renderer', 'v14DrawFloor' in html and 'debrisCount' in html)
check('Player presentation includes motion trails and detailed overlays', 'drawPlayerV14' in html and 'v14DrawShowcaseShip' in html)
check('Enemy and boss presentation layers are present', 'drawEnemyV14' in html and 'drawBossV14' in html)
check('Projectile and particle enhancement layers are present', 'drawProjectilesV14' in html and 'drawEffectsV14' in html)
check('Camera and post-processing feedback are present', 'v14PostFX' in html and 'kickX' in html and 'dashZoom' in html)
check('Cinematic boss sting is present', 'v14BossSting' in html and 'v14-boss-intro' in html)
check('Touch devices use reduced visual budgets', 'function v14Budget(desktop, mobile)' in html and 'coarse ? mobile : desktop' in html)
check('No season model was introduced by visual overhaul', 'season_id' not in html.lower() and 'season pass' not in html.lower())
check('Managed runtime reports current 1.4 release', "const V131_VERSION = '1.4.0';" in html)

server = subprocess.Popen(
    [sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)

try:
    wait_port(PORT)
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=os.environ.get('CHROMIUM') or None,
            headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'],
        )

        # Desktop visual path.
        desktop = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
        desktop.add_init_script("""
          localStorage.setItem('neon-rift-career-v1', JSON.stringify({version:1,pilot:'VISUAL QA',xp:0,totalRuns:0,totalWins:0,totalKills:0,totalSeconds:0,bestCombo:0,winsByRig:{striker:0,ghost:0,bastion:0},achievements:{},history:[]}));
          localStorage.setItem('neon-rift-pilot-confirmed-v1','1');
        """)
        page = desktop.new_page()
        starts, finishes, events = [], [], []
        page_errors = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))

        def fulfill_json(route, body, status=200):
            route.fulfill(
                status=status, content_type='application/json',
                headers={
                    'Access-Control-Allow-Origin': BASE,
                    'Access-Control-Allow-Headers': 'apikey, content-type',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Cache-Control': 'no-store',
                }, body=json.dumps(body),
            )

        def supabase_route(route):
            request = route.request
            if request.method == 'OPTIONS':
                fulfill_json(route, {}, 204); return
            if '/functions/v1/game-session' in request.url:
                payload = request.post_data_json or {}
                action = payload.get('action')
                if action == 'start':
                    starts.append(payload)
                    run_id = str(uuid.uuid4())
                    fulfill_json(route, {'run_id': run_id, 'token': f'visual-token-{run_id}-abcdefghijklmnopqrstuvwxyz', 'seed': 88112233, 'mode': payload.get('mode', 'standard'), 'challenge_date': None}); return
                if action == 'finish':
                    finishes.append(payload); fulfill_json(route, {'accepted': True}); return
                if action == 'event':
                    events.append(payload); fulfill_json(route, {'accepted': True}); return
                fulfill_json(route, {'error': 'invalid_action'}, 400); return
            if '/rest/v1/runs' in request.url:
                fulfill_json(route, []); return
            route.abort()

        page.route(f'{SUPABASE}/**', supabase_route)
        page.goto(f'{BASE}/?test', wait_until='load')
        page.wait_for_function('window.__NEON_RIFT_TEST__ && window.__NEON_RIFT_VISUAL__')

        check('Visual runtime advertises version 1.4.0', page.evaluate('window.__NEON_RIFT_VISUAL__.version') == '1.4.0')
        check('Desktop visual tier is selected on fine pointer', page.evaluate('window.__NEON_RIFT_VISUAL__.mobileTier') == 'desktop')
        check('Premium visual body class is active', page.locator('body').evaluate("el => el.classList.contains('v14-visual')"))
        check('Home screen keeps premium hangar presentation', page.locator('.hangar').is_visible())
        check('Home attract renderer paints a complex frame', page.evaluate("""
          () => {
            render();
            const source=document.querySelector('#game'), sample=document.createElement('canvas'); sample.width=32; sample.height=20;
            const c=sample.getContext('2d'); c.drawImage(source,0,0,32,20); const d=c.getImageData(0,0,32,20).data;
            const unique=new Set(); let lit=0;
            for(let i=0;i<d.length;i+=4){ unique.add(`${d[i]>>3},${d[i+1]>>3},${d[i+2]>>3}`); if(d[i]+d[i+1]+d[i+2]>45) lit++; }
            return unique.size>28 && lit>520;
          }
        """))

        page.locator('#startBtn').click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'playing'")
        check('Managed Standard start identifies 1.4.0', starts and starts[-1].get('game_version') == '1.4.0', starts[-1] if starts else None)
        check('Sector 1 uses Signal Frontier art direction', page.evaluate("v14Palette().name") == 'SIGNAL FRONTIER')
        sector1_metrics = page.evaluate("""
          () => {
            render();
            const source=document.querySelector('#game'), sample=document.createElement('canvas'); sample.width=48; sample.height=30;
            const c=sample.getContext('2d'); c.drawImage(source,0,0,48,30); const d=c.getImageData(0,0,48,30).data;
            const unique=new Set(); let lit=0, signature=2166136261;
            for(let i=0;i<d.length;i+=4){
              unique.add(`${d[i]>>4},${d[i+1]>>4},${d[i+2]>>4}`);
              if(d[i]+d[i+1]+d[i+2]>36) lit++;
              signature ^= d[i]; signature=Math.imul(signature,16777619);
              signature ^= d[i+1]; signature=Math.imul(signature,16777619);
              signature ^= d[i+2]; signature=Math.imul(signature,16777619);
            }
            return {unique:unique.size,lit,signature:signature>>>0};
          }
        """)
        check('Sector 1 gameplay frame is visibly non-flat', sector1_metrics['unique'] >= 8 and sector1_metrics['lit'] >= 120, sector1_metrics)

        page.evaluate('__NEON_RIFT_TEST__.forceWave(5)')
        check('Midgame switches to Ion Wreckage art direction', page.evaluate("v14Palette().name") == 'ION WRECKAGE')
        ion_metrics = page.evaluate("""
          () => {
            render();
            const source=document.querySelector('#game'), sample=document.createElement('canvas'); sample.width=48; sample.height=30;
            const c=sample.getContext('2d'); c.drawImage(source,0,0,48,30); const d=c.getImageData(0,0,48,30).data;
            let signature=2166136261;
            for(let i=0;i<d.length;i+=4){
              signature ^= d[i]; signature=Math.imul(signature,16777619);
              signature ^= d[i+1]; signature=Math.imul(signature,16777619);
              signature ^= d[i+2]; signature=Math.imul(signature,16777619);
            }
            return signature>>>0;
          }
        """)
        check('Biome switch materially changes rendered gameplay frame', ion_metrics != sector1_metrics['signature'], {'sector1': sector1_metrics['signature'], 'ion': ion_metrics})
        page.evaluate('__NEON_RIFT_TEST__.forceWave(8)')
        check('Late game switches to Fractured Veil art direction', page.evaluate("v14Palette().name") == 'FRACTURED VEIL')
        page.evaluate('__NEON_RIFT_TEST__.forceWave(9)')
        check('Final sector switches to Sovereign Core art direction', page.evaluate("v14Palette().name") == 'SOVEREIGN CORE')
        check('Final-sector boss cinematic opens automatically', page.locator('body').evaluate("el => el.classList.contains('v14-boss-intro')"))
        check('Boss cinematic names Rift Sovereign', 'RIFT SOVEREIGN' in page.locator('#v14BossSting strong').inner_text())
        page.evaluate('__NEON_RIFT_TEST__.advance(1.5)')
        boss = page.evaluate('__NEON_RIFT_TEST__.snapshot().boss')
        check('Final boss still spawns after visual wrappers', boss and boss['stage'] >= 3, boss)
        check('Boss HUD enters cinematic live state', page.locator('body').evaluate("el => el.classList.contains('v14-boss-live')"))
        page.evaluate('G.boss.hp = G.boss.maxHp * 0.40; refreshHUD(); render()')
        check('Enraged boss presentation remains wired to gameplay health', 'ENRAGED' in page.locator('#bossName').inner_text())

        page.evaluate('__NEON_RIFT_TEST__.forceWave(1); __NEON_RIFT_TEST__.setPlayer({energy:100})')
        page.keyboard.press('KeyE')
        page.wait_for_timeout(40)
        check('Overdrive activates premium post-FX state', page.locator('body').evaluate("el => el.classList.contains('v14-overdrive')"))
        page.keyboard.press('Space')
        page.wait_for_timeout(30)
        check('Dash triggers visual camera pulse', page.evaluate('v14Visual.dashPulse') > 0)
        check('Gameplay invariants remain valid under visual wrappers', page.evaluate('__NEON_RIFT_TEST__.validate()') == [])
        check('No uncaught JavaScript errors on desktop visual path', not page_errors, page_errors)
        desktop.close()

        # Mobile budget and layout path.
        mobile = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        mobile.add_init_script("""
          localStorage.setItem('neon-rift-career-v1', JSON.stringify({version:1,pilot:'MOBILE QA',xp:0,totalRuns:0,totalWins:0,totalKills:0,totalSeconds:0,bestCombo:0,winsByRig:{striker:0,ghost:0,bastion:0},achievements:{},history:[]}));
          localStorage.setItem('neon-rift-pilot-confirmed-v1','1');
        """)
        mpage = mobile.new_page(); mobile_errors = []
        mpage.on('pageerror', lambda error: mobile_errors.append(str(error)))
        mpage.route(f'{SUPABASE}/**', supabase_route)
        mpage.goto(f'{BASE}/?test', wait_until='load')
        mpage.wait_for_function('window.__NEON_RIFT_TEST__ && window.__NEON_RIFT_VISUAL__')
        check('Mobile visual tier is selected on touch device', mpage.evaluate('window.__NEON_RIFT_VISUAL__.mobileTier') == 'mobile')
        check('Mobile visual budgets reduce expensive particle/background counts', mpage.evaluate('v14Budget(155,82)') == 82 and mpage.evaluate('v14Budget(18,9)') == 9)
        check('Mobile home remains within viewport horizontally', mpage.locator('body').evaluate('el => el.scrollWidth <= innerWidth + 1'))
        mpage.locator('#startBtn').click(); mpage.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'playing'")
        mpage.evaluate('__NEON_RIFT_TEST__.advance(.5)')
        check('Mobile gameplay invariants remain valid', mpage.evaluate('__NEON_RIFT_TEST__.validate()') == [])
        check('Mobile HUD remains visible with premium layer', mpage.locator('#hud').is_visible() and mpage.locator('.hud-top').is_visible())
        check('No uncaught JavaScript errors on mobile visual path', not mobile_errors, mobile_errors)
        mobile.close(); browser.close()
finally:
    server.terminate()
    try: server.wait(timeout=2)
    except subprocess.TimeoutExpired: server.kill()

output = {'build': '1.4.0', 'tests': RESULTS, 'passed': sum(t['pass'] for t in RESULTS), 'total': len(RESULTS)}
(ROOT / 'tests' / 'v14-results.json').write_text(json.dumps(output, indent=2))
print(f'V1.4 VISUAL PASSED: {output["passed"]} / {output["total"]} assertions')