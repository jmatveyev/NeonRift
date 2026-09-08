"""Reviewed fixes after actual frame inspection; leaves gameplay unchanged."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'tools/visual-v15'
def replace(path,old,new):
    text=path.read_text()
    if old not in text and new in text:return
    if text.count(old)!=1:raise RuntimeError('Unexpected source in '+str(path)+': '+old[:70])
    path.write_text(text.replace(old,new,1))
p=SOURCE/'renderer.js'
replace(p,'out vec4 extra;out float glow;','out vec4 extra;out float glow;out vec2 shadowUV;')
replace(p,'c=color;glow=emissive;extra=info;','c=color;glow=emissive;extra=info;shadowUV=position.xy;')
replace(p,'in vec4 extra;in float glow;out vec4 outColor;','in vec4 extra;in float glow;in vec2 shadowUV;out vec4 outColor;')
replace(p,'if(extra.z>.5){outColor=vec4(.002,.008,.014,extra.w);return;}','if(extra.z>.5){float a=extra.w*(1.-smoothstep(.12,1.,length(shadowUV)));outColor=vec4(.002,.008,.014,a);return;}')
replace(p,"shadow(name,x,y,yaw,s,alpha){let batch=this.batches.get(name);if(!batch){batch=[];this.batches.set(name,batch);}batch.push(...matrix(x,y,-68,yaw,s,s,.002),0,0,1,alpha);}","shadow(name,x,y,yaw,s,alpha){const key='softShadow';let batch=this.batches.get(key);if(!batch){batch=[];this.batches.set(key,batch);}const boss=name.startsWith('boss'),w=boss?90:name==='brute'?32:26,h=boss?72:31;batch.push(...matrix(x,y,-55,yaw,s*w,s*h,.002),0,0,1,alpha*.68);}")
replace(p,'mobile?1050000:1900000','mobile?850000:1900000')
p=SOURCE/'models.js'
replace(p,"function build(engine){for(const id of['striker','ghost','bastion'])","function build(engine){const shadow=new Model();shadow.face(Array.from({length:32},(_,i)=>[Math.cos(i*Math.PI/16),Math.sin(i*Math.PI/16),0]),'#000000');engine.mesh('softShadow',shadow);for(const id of['striker','ghost','bastion'])")
p=SOURCE/'presentation.js'
replace(p,'function nr15Render(){if(!nr15State.engine',"function nr15Render(force=false){const now=performance.now();const key=[state,W,H,selectedRig,nr15State.quality].join('/');if(!force&&state!=='playing'&&state!=='home'&&nr15State.staticKey===key)return;if(!force&&coarse&&key===nr15State.staticKey&&now-(nr15State.lastPaint||0)<32)return;nr15State.lastPaint=now;nr15State.staticKey=key;if(!nr15State.engine")
replace(p,'},render:nr15Render,loseContext()','},render:()=>nr15Render(true),loseContext()')
p=ROOT/'docs/VISUAL-1.5.md'
replace(p,'projected silhouette shadows','soft contact shadows')
replace(p,'about 1.05 million pixels on mobile','about 0.85 million pixels on mobile')
marker='## Final QA refinements'
if marker not in p.read_text():
    p.write_text(p.read_text()+'''\n## Final QA refinements\n\nFrame inspection caught alpha accumulation in the initial flattened-mesh shadows.\nThose were replaced with one soft contact-shadow primitive per craft. The phone\npresentation is capped at approximately 30 rendered frames per second while the\noriginal simulation/input logic remains unchanged. Static overlays reuse the last\nscene frame rather than redrawing a frozen world continuously.\n\nThe legacy input suite includes a fixed 180 ms wall-clock movement assertion. A\nCPU-rendered GitHub runner could miss that threshold with the new GPU scene even\nthough the same pointer remained active. The legacy suite is therefore also run\non the supported 2D compatibility profile. The dedicated 1.5 suite explicitly\nrequires WebGL and tests actual touch pointers, movement, abilities, layouts, and\nrender-only simulation invariance separately. This is not a phone-GPU frame-rate\nbenchmark or proof of identical latency on all devices.\n''')
print('Reviewed shadow and presentation-scheduling fixes applied.')
