"""Neon Rift managed-play browser regression coverage.

Runs the generated production page over localhost, mocks the Supabase network edge,
and verifies managed run sessions, daily mode, checkpoint resume, telemetry, boss
identity, leaderboard reads, cosmetic progression, and standard-mode fallback.
"""
from pathlib import Path
import json, os, socket, subprocess, sys, time, uuid
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PORT = 8765
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
config = html.split('window.NEON_RIFT_ONLINE = {', 1)[1].split('};', 1)[0]
check('Production version is 1.3.1', 'application-version" content="1.3.1"' in html)
check('Modern Supabase publishable key is used', 'sb_publishable_' in config and 'publishableKey:' in config)
check('Legacy anonymous JWT is no longer configured', 'anonKey:' not in config)
check('No Supabase server secret is shipped', 'sb_secret_' not in html and "'service_role'" not in html and '"service_role"' not in html)
check('Managed game-session Edge Function is configured', "function: 'game-session'" in config)
check('No seasonal progression model is present', 'season_id' not in html.lower() and 'currentseason' not in html.lower())

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
        page = context.new_page()
        starts, finishes, events, leaderboard_urls = [], [], [], []
        page_errors = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))

        def fulfill_json(route, body, status=200):
            route.fulfill(
                status=status,
                content_type='application/json',
                headers={
                    'Access-Control-Allow-Origin': BASE,
                    'Access-Control-Allow-Headers': 'apikey, content-type',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Cache-Control': 'no-store',
                },
                body=json.dumps(body),
            )

        def supabase_route(route):
            request = route.request
            if request.method == 'OPTIONS':
                fulfill_json(route, {}, 204)
                return
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
                        'seed': 424242 if mode == 'daily' else 11223344,
                        'mode': mode,
                        'challenge_date': time.strftime('%Y-%m-%d', time.gmtime()) if mode == 'daily' else None,
                    })
                    return
                if action == 'finish':
                    finishes.append(payload); fulfill_json(route, {'accepted': True}); return
                if action == 'event':
                    events.append(payload); fulfill_json(route, {'accepted': True}); return
                fulfill_json(route, {'error': 'invalid_action'}, 400); return
            if '/rest/v1/runs' in request.url:
                leaderboard_urls.append(request.url)
                daily = 'mode=eq.daily' in request.url
                endless = 'mode=eq.endless' in request.url
                row = {
                    'pilot': 'ENDLESS ACE' if endless else 'DAILY ACE' if daily else 'RIFT ACE',
                    'score': 123456 if endless else 54321 if daily else 98765,
                    'kills': 88, 'sectors': 12 if endless else 9, 'seconds': 302, 'rig': 'striker', 'max_combo': 27,
                    'won': False if endless else True, 'played_at': '2026-09-08T01:00:00Z',
                    'mode': 'endless' if endless else 'daily' if daily else 'standard',
                    'challenge_date': time.strftime('%Y-%m-%d', time.gmtime()) if daily else None,
                }
                fulfill_json(route, [row]); return
            route.abort()

        page.route(f'{SUPABASE}/**', supabase_route)
        page.goto(f'{BASE}/?test', wait_until='load')
        page.wait_for_function('window.__NEON_RIFT_TEST__')

        check('Daily challenge action is visible', page.locator('#dailyRunBtn').is_visible())
        check('Checkpoint action starts hidden', not page.locator('#resumeRunBtn').is_visible())
        page.locator('#profileBtn').click()
        check('Career screen hides in-run HUD', page.locator('#hud').is_hidden())
        check('Anonymous player signal is displayed', 'PLAYER SIGNAL' in page.locator('#careerIdentity').inner_text())
        check('Four cosmetic signal themes are defined', page.locator('#careerTheme option').count() == 4)
        page.locator('#careerPilotInput').fill('QA PILOT')
        page.locator('#careerPilotInput').press('Enter')
        page.keyboard.press('Escape')
        check('Escape closes pilot career', page.locator('#homeScreen').is_visible())

        page.locator('#dailyRunBtn').click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'playing'")
        snap = page.evaluate('__NEON_RIFT_TEST__.snapshot()')
        check('Daily start uses managed daily session', starts and starts[-1]['mode'] == 'daily', starts[-1] if starts else None)
        check('Daily run is reflected in QA snapshot', snap.get('mode') == 'daily', snap)
        check('Daily run receives UTC challenge date', bool(snap.get('challengeDate')), snap)
        check('Sector modifier is active', snap.get('modifier') in {'clear','ion','hunter','night','repair'}, snap)
        check('Daily mode HUD is visible', page.locator('#runModeHud').inner_text().startswith('DAILY /'))

        page.evaluate('__NEON_RIFT_TEST__.finishSector()')
        snap = page.evaluate('__NEON_RIFT_TEST__.snapshot()')
        check('Sector clear reaches upgrade screen', snap['state'] == 'upgrade')
        before_choices = snap['choices']
        checkpoint = page.evaluate("JSON.parse(localStorage.getItem('neon-rift-checkpoint-v1'))")
        check('Sector boundary creates local checkpoint', checkpoint and checkpoint['g']['wave'] == 1, checkpoint)
        page.wait_for_timeout(100)
        check('Sector-clear telemetry is emitted', any(e.get('event_name') == 'sector_clear' for e in events), events)

        page.reload(wait_until='load')
        page.wait_for_function('window.__NEON_RIFT_TEST__')
        check('Checkpoint survives page reload', page.locator('#resumeRunBtn').is_visible())
        page.locator('#resumeRunBtn').click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'upgrade'")
        resumed = page.evaluate('__NEON_RIFT_TEST__.snapshot()')
        check('Checkpoint resumes at secured sector', resumed['wave'] == 1 and resumed['completed'] == 1, resumed)
        check('Checkpoint restores deterministic upgrade choices', resumed['choices'] == before_choices, (before_choices, resumed['choices']))
        page.wait_for_timeout(100)
        check('Resume telemetry is emitted', any(e.get('event_name') == 'run_resume' for e in events), events)
        page.locator('.upgrade-card').first.click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'playing'")
        check('Resumed upgrade advances to sector two', page.evaluate('__NEON_RIFT_TEST__.snapshot().wave') == 2)

        page.evaluate('__NEON_RIFT_TEST__.forceWave(3)')
        page.evaluate('__NEON_RIFT_TEST__.advance(2)')
        boss = page.evaluate('__NEON_RIFT_TEST__.snapshot().boss')
        check('Sector three still spawns first boss', boss and boss['stage'] == 1, boss)
        check('First boss has distinct identity', 'THE GATEKEEPER' in page.locator('#bossName').inner_text())

        page.evaluate('__NEON_RIFT_TEST__.invulnerable(false); __NEON_RIFT_TEST__.hit(10000)')
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'dead'")
        page.wait_for_timeout(150)
        check('Managed run submits through finish action', bool(finishes), finishes)
        check('Finish uses server-issued run session', finishes[-1]['run_id'] == checkpoint['session']['runId'], finishes[-1] if finishes else None)
        check('Checkpoint clears when run ends', page.evaluate("localStorage.getItem('neon-rift-checkpoint-v1')") is None)

        page.locator('#resultCareerBtn').click()
        page.wait_for_timeout(150)
        check('All-time leaderboard requests standard runs only', any('mode=eq.standard' in u for u in leaderboard_urls), leaderboard_urls)
        check('Daily leaderboard requests today only', any('mode=eq.daily' in u and 'challenge_date=eq.' in u for u in leaderboard_urls), leaderboard_urls)
        check('Daily leaderboard renders verified row', page.locator('#dailyLeaderboard .career-run').count() == 1)
        page.locator('#careerBackBtn').click()
        page.locator('#hangarBtn').click()

        page.locator('#dailyRunBtn').click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'playing'")
        page.evaluate('__NEON_RIFT_TEST__.forceWave(9); __NEON_RIFT_TEST__.finishSector()')
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'won'")
        check('Daily victory does not offer endless continuation', page.locator('#endlessBtn').is_hidden())
        daily_starts_before_retry = len(starts)
        page.keyboard.press('KeyR')
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'playing'")
        check('Keyboard R retry opens a fresh verified daily session', len(starts) == daily_starts_before_retry + 1 and starts[-1]['mode'] == 'daily', starts[-1] if starts else None)
        page.evaluate('__NEON_RIFT_TEST__.invulnerable(false); __NEON_RIFT_TEST__.hit(10000)')
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'dead'")
        page.locator('#hangarBtn').click()

        page.locator('#startBtn').click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'playing'")
        standard = page.evaluate('__NEON_RIFT_TEST__.snapshot()')
        check('Standard Run uses standard managed session', starts[-1]['mode'] == 'standard', starts[-1])
        check('Standard run keeps permanent all-time mode', standard.get('mode') == 'standard', standard)
        check('Standard mode HUD is visible', page.locator('#runModeHud').inner_text().startswith('STANDARD /'))
        event_count_before_quit = len(events)
        page.locator('#pauseBtn').click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'paused'")
        page.locator('#quitBtn').click()
        page.wait_for_function("__NEON_RIFT_TEST__.snapshot().state === 'home'")
        page.wait_for_timeout(150)
        check('Quit records anonymous run-abandon telemetry', any(e.get('event_name') == 'run_abandon' for e in events[event_count_before_quit:]), events[event_count_before_quit:])
        check('No uncaught JavaScript errors', not page_errors, page_errors)

        context.close(); browser.close()
finally:
    server.terminate()
    try: server.wait(timeout=2)
    except subprocess.TimeoutExpired: server.kill()

output = {'build': '1.3.1', 'tests': RESULTS, 'passed': sum(t['pass'] for t in RESULTS), 'total': len(RESULTS)}
(ROOT / 'tests' / 'v13-results.json').write_text(json.dumps(output, indent=2))
print(f'MANAGED PLAY PASSED: {output["passed"]} / {output["total"]} assertions')
