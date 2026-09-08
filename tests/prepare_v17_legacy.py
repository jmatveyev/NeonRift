"""Adapt inherited suites to the 1.7 release without weakening their assertions."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
for name in ['startup_smoke','mobile_controls','v13_regression','v131_regression','v15_regression']:
    text=(ROOT/f'tests/{name}.py').read_text()
    text=text.replace("args=['--no-sandbox', '--disable-dev-shm-usage']", "args=['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']")
    text=text.replace("args=['--no-sandbox','--disable-dev-shm-usage']", "args=['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']")
    text=text.replace('1.3.1','1.7.0').replace('1.6.0','1.7.0')
    if name=='mobile_controls':
        for n in [1,2]:
            old=f"page.locator('.upgrade-card').nth({n}).tap()"
            assert text.count(old)==1
            text=text.replace(old,old+";page.wait_for_function(\"__NEON_RIFT_TEST__.snapshot().state==='playing'\")")
    if name=='v15_regression':
        old="page.locator('#graphicsBtn').click();test(prefix+' performance graphics selection',page.locator('#graphicsBtn').inner_text()=='PERFORMANCE')"
        if old in text:text=text.replace(old,"page.locator('#graphicsSelect').select_option('low');test(prefix+' performance graphics selection',page.locator('#graphicsSelect').input_value()=='low')")
        old="page.locator('#pauseBtn').click();page.locator('#graphicsBtn').click();page.locator('#resumeBtn').click()"
        if old in text:text=text.replace(old,"page.locator('#pauseBtn').click();page.locator('#graphicsSelect').select_option('compatibility');page.locator('#resumeBtn').click()")
    (ROOT/f'tests/.v17_{name}.py').write_text(text)
print('Inherited suites adapted for 1.7 version/travel/graphics contracts.')
