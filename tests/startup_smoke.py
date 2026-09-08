from pathlib import Path
import os
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text()
html=html.replace("if (new URL(location.href).searchParams.has('test'))", 'if (true)')
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM') or None,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    page=context.new_page()
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='load')
    page.wait_for_timeout(250)
    qa=page.evaluate("typeof window.__NEON_RIFT_TEST__")
    if errors:
        print('STARTUP PAGE ERRORS:')
        for error in errors: print(error)
    print('QA HOOK TYPE:',qa)
    if qa!='object' or errors:
        raise SystemExit('Neon Rift failed browser startup smoke test')
    context.close();browser.close()
print('Startup smoke passed')
