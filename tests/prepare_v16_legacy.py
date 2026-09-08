"""Adapt expected version/UI contracts; preserve inherited behavioral assertions.
Creates disposable test copies, not modified production code. They are excluded
from commits. Legacy wall-clock touch checks run on supported 2D compatibility;
separate suites explicitly require and exercise WebGL 2.
"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
for name in ['startup_smoke','mobile_controls','v13_regression','v131_regression','v15_regression']:
    text=(ROOT/f'tests/{name}.py').read_text()
    text=text.replace("args=['--no-sandbox', '--disable-dev-shm-usage']", "args=['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']")
    text=text.replace("args=['--no-sandbox','--disable-dev-shm-usage']", "args=['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']")
    text=text.replace('1.3.1','1.6.0')
    if name=='mobile_controls':
        # A new deliberate travel state separates choosing an upgrade and arrival.
        for n in [1,2]:
            old=f"page.locator('.upgrade-card').nth({n}).tap()"
            assert text.count(old)==1
            text=text.replace(old,old+";page.wait_for_function(\"__NEON_RIFT_TEST__.snapshot().state==='playing'\")")
    if name=='v15_regression':
        old="page.locator('#graphicsBtn').click();test(prefix+' performance graphics selection',page.locator('#graphicsBtn').inner_text()=='PERFORMANCE')"
        assert old in text
        text=text.replace(old,"page.locator('#graphicsSelect').select_option('low');test(prefix+' performance graphics selection',page.locator('#graphicsSelect').input_value()=='low')")
        old="page.locator('#pauseBtn').click();page.locator('#graphicsBtn').click();page.locator('#resumeBtn').click()"
        assert old in text
        text=text.replace(old,"page.locator('#pauseBtn').click();page.locator('#graphicsSelect').select_option('compatibility');page.locator('#resumeBtn').click()")
    (ROOT/f'tests/.v16_{name}.py').write_text(text)
print('Inherited assertions preserved; expected version, travel wait, and graphics selector adapted.')
