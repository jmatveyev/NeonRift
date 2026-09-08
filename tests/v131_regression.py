"""Neon Rift 1.3.1 regression coverage for audio, callsign onboarding and Endless mode."""
from pathlib import Path
import json, os, socket, subprocess, sys, time, uuid
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PORT = 8766
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
check('Patch version is 1.3.1', 'application-version" content="1.3.1"' in html)
check('Mobile master mix is raised substantially', 'coarse ? 0.78 : 0.42' in html)
check('Audio path includes dynamics compression', 'createDynamicsCompressor' in html and 'v131Limiter.threshold.value = -10' in html)
check('Mobile music lifts sub-75Hz notes an octave', 'musical && adjustedFreq < 75' in html and 'adjustedFreq *= 2' in html)
check('First-run callsign prompt is present', 'pilotPrompt' in html and 'Choose your callsign.' in html)
check('Endless is a first-class run mode', "['standard', 'endless', 'daily']" in html and 'endlessRunBtn' in html)
check('Endless continuation is explicitly unranked', 'KEEP YOUR BUILD / UNRANKED CONTINUATION' in html)
check('No season system was introduced', 'season_id' not in html.lower() and 'season pass' not in html.lower())

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
        context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        context.add_init_script("""
          localStorage.setItem('neon-rift-career-v1', JSON.stringify({
            version:1,pilot:'PILOT',xp:100,totalRuns:1,totalWins:1,totalKills:10,totalSeconds:60,bestCombo:5,
            winsByRig:{striker:1,ghost:0,bastion:0},achievements:{},
            history:[{id:'old-pilot-run',playedAt:'2026-09-08T01:00:00Z',pilot:'PILOT',score:1000,kills:10,sectors:9,seconds:60,rig:'striker',maxCombo:5,damageTaken:0,dashes:0,overdrives:0,won:true,cause:'',xpGained:100,upgrades:[]}]
          }));
          localStorage.removeItem('neon-rift-pilot-confirmed-v1');
        """)
        page = context.new_page()
        starts, finishes, events, leaderboard_urls = [], [], [], []
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
                    mode = payload.get('mode', 'standard')
                    run_id = str(uuid.uuid4())
                    fulfill_json(route, {
                        'run_id': run_id,
                        'token': f'test-token-{run_id}-abcdefghijklmnopqrstuvwxyz',
                        'seed': 55667788 if mode != 'daily' else 424242,
                        'mode': mode,
                        'challenge_date': time.strftime('%Y-%m-%d', time.gmtime()) if mode == 'daily' else None,
                    }); return
                if action == 'finish':
                    finishes.append(payload); fulfill_json(route, {'accepted': True}); return
                if action == 'event':
                    events.append(payload); fulfill_json(route, {'accepted': True}); return
                fulfill_json(route, {'error': 'invalid_action'}, 400); return
            if '/rest/v1/runs' in request.url:
                leaderboard_urls.append(request.url)
                endless = 'mode=eq.endless' in request.url
                daily = 'mode=eq.daily' in request.url
                row = {
                    'pilot': 'ENDLESS ACE' if endless else 'DAILY ACE' if daily else 'RIFT ACE',
                    'score': 200000 if endless else 50000 if daily else 100000,
                    'kills': 100, 'sectors': 14 if endless else 9, 'seconds': 300, 'rig': 'striker', 'max_combo': 30,
                    'won': not endless, 'played_at': '2026-09-08T01:00:00Z',
                    'mode': 'endless' if endless else 'daily' if daily else 'standard',
                    'challenge_date': time.strftime('%Y-%m-%d', time.gmtime()) if daily else None,
                }
                fulfill_json(route, [row]); return
            route.abort()

        page.route(f'{SUPABASE}/**', supabase_route)
        page.goto(f'{BASE}/?v131test', wait_until='load')
        page.wait_for_function('window.__NEON_RIFT_TEST__')

        check('Standard Run is visible on home screen', page.locator('#startBtn').is_visible() and 'STANDARD RUN' in page.locator('#startBtn').inner_text())
        check('Endless Run is visible on home screen', page.locator('#endlessRunBtn').is_visible() and 'ENDLESS RUN' in page.locator('#endlessRunBtn').inner_text())
        check('Daily Signal remains visible on home screen', page.locator('#dailyRunBtn').is_visible())

        page.locator('#startBtn').click()
        check('Unnamed pilot is prompted before network run start', page.locator('#pilotPrompt').is_visible() and len(starts) == 0)
        page.locator('#pilotPromptConfirm').click()
        check('Blank callsign is rejected', 'ENTER A CALLSIGN' in page.locator('#pilotPromptError').inner_text() and len(starts) == 0)
        page.locator('#pilotPromptInput').fill('Joe Rift')
        page.locator('#pilotPromptConfirm').click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'playing'")
        check('Callsign is normalized and sent on first managed start', starts[-1]['pilot'] == 'JOE RIFT', starts[-1])
        check('First managed start remains Standard', starts[-1]['mode'] == 'standard', starts[-1])
        check('1.3.1 version is sent to backend', starts[-1]['game_version'] == '1.3.1', starts[-1])
        local_career = page.evaluate("JSON.parse(localStorage.getItem('neon-rift-career-v1'))")
        check('Existing local PILOT history adopts first real callsign', local_career['history'][0]['pilot'] == 'JOE RIFT', local_career['history'][0])
        check('Pilot confirmation persists', page.evaluate("localStorage.getItem('neon-rift-pilot-confirmed-v1')") == '1')

        page.evaluate('__NEON_RIFT_TEST__.invulnerable(false); __NEON_RIFT_TEST__.hit(10000)')
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'dead'")
        page.locator('#hangarBtn').click()
        check('Returning home preserves callsign without another prompt', page.locator('#pilotHome').inner_text() == 'JOE RIFT')

        starts_before_endless = len(starts)
        page.locator('#endlessRunBtn').click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'playing'")
        endless_snap = page.evaluate('__NEON_RIFT_TEST__.snapshot()')
        check('Endless starts a fresh managed Endless session', len(starts) == starts_before_endless + 1 and starts[-1]['mode'] == 'endless', starts[-1])
        check('Endless snapshot uses separate mode', endless_snap.get('mode') == 'endless', endless_snap)
        check('Endless HUD is explicit', page.locator('#runModeHud').inner_text().startswith('ENDLESS /'))
        check('Calls sign prompt does not repeat after confirmation', page.locator('#pilotPrompt').is_hidden())

        page.evaluate('__NEON_RIFT_TEST__.forceWave(9); __NEON_RIFT_TEST__.finishSector()')
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'upgrade'")
        check('Ranked Endless does not terminate at sector nine', page.evaluate('__NEON_RIFT_TEST__.snapshot().state') == 'upgrade')
        page.locator('.upgrade-card').first.click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'playing'")
        page.evaluate('__NEON_RIFT_TEST__.invulnerable(false); __NEON_RIFT_TEST__.hit(10000)')
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'dead'")
        page.wait_for_timeout(120)
        check('Endless submission is recorded as a loss/survival result', finishes and finishes[-1]['won'] is False, finishes[-1] if finishes else None)
        check('Endless submission uses 1.3.1 backend version', finishes[-1]['game_version'] == '1.3.1', finishes[-1] if finishes else None)

        page.locator('#resultCareerBtn').click()
        page.wait_for_timeout(120)
        check('Career screen requests Endless leaderboard separately', any('mode=eq.endless' in url for url in leaderboard_urls), leaderboard_urls)
        check('Endless leaderboard renders verified result', page.locator('#endlessLeaderboard .career-run').count() == 1)
        page.locator('#careerBackBtn').click(); page.locator('#hangarBtn').click()

        page.locator('#startBtn').click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'playing'")
        page.evaluate('__NEON_RIFT_TEST__.forceWave(9); __NEON_RIFT_TEST__.finishSector()')
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'won'")
        check('Standard victory prominently exposes Endless continuation', page.locator('#endlessBtn').is_visible() and page.locator('#endlessBtn').inner_text() == 'CONTINUE INTO ENDLESS')
        check('Post-win Endless is labeled unranked', page.locator('#postWinEndlessNote').is_visible() and 'UNRANKED' in page.locator('#postWinEndlessNote').inner_text())
        check('Endless continuation receives first focus after victory', page.evaluate('document.activeElement && document.activeElement.id') == 'endlessBtn')
        finish_count_after_standard_win = len(finishes)
        page.locator('#endlessBtn').click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'upgrade'")
        page.locator('.upgrade-card').first.click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'playing'")
        check('Post-win continuation HUD switches to Endless', page.locator('#runModeHud').inner_text().startswith('ENDLESS /'))
        page.evaluate('__NEON_RIFT_TEST__.invulnerable(false); __NEON_RIFT_TEST__.hit(10000)')
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'dead'")
        page.wait_for_timeout(120)
        check('Post-win continuation does not create a second ranked submission', len(finishes) == finish_count_after_standard_win, finishes)

        check('No uncaught JavaScript errors in 1.3.1 flows', not page_errors, page_errors)
        context.close(); browser.close()
finally:
    server.terminate()
    try: server.wait(timeout=2)
    except subprocess.TimeoutExpired: server.kill()

output = {'build': '1.3.1', 'tests': RESULTS, 'passed': sum(t['pass'] for t in RESULTS), 'total': len(RESULTS)}
(ROOT / 'tests' / 'v131-results.json').write_text(json.dumps(output, indent=2))
print(f'V1.3.1 PASSED: {output["passed"]} / {output["total"]} assertions')
