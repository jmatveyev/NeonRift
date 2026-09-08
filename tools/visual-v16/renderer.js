// Neon Rift 1.5: self-contained WebGL 2 scene renderer. No network assets.
// Gameplay remains in the original simulation; this module receives presentation data only.
const NR15 = (() => {
  const C = h => { const n=parseInt(String(h).replace('#',''),16); return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]; };
  const norm = v => {const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
  const cross = (a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const sub=(a,b)=>a.map((x,i)=>x-b[i]);
  const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  function matrix(x=0,y=0,z=0,yaw=0,sx=1,sy=sx,sz=sx,pitch=0){const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);return [c*sx,s*sx,0,0,-s*cp*sy,c*cp*sy,sp*sy,0,s*sp*sz,-c*sp*sz,cp*sz,0,x,y,z,1];}
  function point(m,p){return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];}
  class Model {
    constructor(){this.vertices=[];this.indices=[];}
    face(points,color,emission=0){let n=norm(cross(sub(points[1],points[0]),sub(points[2],points[0]))),base=this.vertices.length/10,c=Array.isArray(color)?color:C(color);for(const p of points)this.vertices.push(...p,...n,...c,emission);for(let i=1;i<points.length-1;i++)this.indices.push(base,base+i,base+i+1);return this;}
    prism(points,z,h,color,bevel=0,topColor=color){ // points run counterclockwise in x/y; caps face +z.
      let pts=points.map(p=>[...p]);let area=0;for(let i=0;i<pts.length;i++){let a=pts[i],b=pts[(i+1)%pts.length];area+=a[0]*b[1]-a[1]*b[0];}if(area<0)pts.reverse();
      let center=[pts.reduce((s,p)=>s+p[0],0)/pts.length,pts.reduce((s,p)=>s+p[1],0)/pts.length];let inner=pts.map(p=>{let dx=p[0]-center[0],dy=p[1]-center[1],l=Math.hypot(dx,dy)||1;return [p[0]-dx/l*bevel,p[1]-dy/l*bevel];});
      let bottom=pts.map(p=>[p[0],p[1],z]),rim=pts.map(p=>[p[0],p[1],z+h-bevel*.65]),top=inner.map(p=>[p[0],p[1],z+h]);
      this.face([...bottom].reverse(),color);
      for(let i=0;i<pts.length;i++){let j=(i+1)%pts.length;this.face([bottom[i],bottom[j],rim[j],rim[i]],color);if(bevel)this.face([rim[i],rim[j],top[j],top[i]],topColor);}
      this.face(top,topColor);return this;
    }
    box(x,y,z,w,l,h,c,b=0,yaw=0){let pts=[[-w/2,-l/2],[w/2,-l/2],[w/2,l/2],[-w/2,l/2]].map(p=>[x+p[0]*Math.cos(yaw)-p[1]*Math.sin(yaw),y+p[0]*Math.sin(yaw)+p[1]*Math.cos(yaw)]);return this.prism(pts,z,h,c,b);}
    disc(x,y,z,r,h,c,n=20,bevel=0){return this.prism(Array.from({length:n},(_,i)=>[x+Math.cos(i/n*Math.PI*2)*r,y+Math.sin(i/n*Math.PI*2)*r]),z,h,c,bevel);}
    glow(x,y,z,w,l,c,e=1.7,angle=0){let cc=Math.cos(angle),ss=Math.sin(angle);let ps=[[-w/2,-l/2],[w/2,-l/2],[w/2,l/2],[-w/2,l/2]].map(p=>[x+p[0]*cc-p[1]*ss,y+p[0]*ss+p[1]*cc,z]);this.face(ps,c,e);return this;}
    ring(x,y,z,r,width,depth,c,n=64,begin=0,end=Math.PI*2,e=0){for(let i=0;i<n;i++){let a=begin+(end-begin)*i/n,b=begin+(end-begin)*(i+1)/n;let ro=r+width/2,ri=r-width/2;let p=[[x+Math.cos(a)*ri,y+Math.sin(a)*ri],[x+Math.cos(a)*ro,y+Math.sin(a)*ro],[x+Math.cos(b)*ro,y+Math.sin(b)*ro],[x+Math.cos(b)*ri,y+Math.sin(b)*ri]];if(e)this.face(p.map(p=>[...p,z+depth]),c,e);else this.prism(p,z,depth,c,0);}return this;}
    sphere(x,y,z,r,c,e=0,n=16,rows=8,flatten=1){for(let j=0;j<rows;j++)for(let i=0;i<n;i++){let points=[];for(let[a,b]of[[i,j],[i+1,j],[i+1,j+1],[i,j+1]]){let th=b/rows*Math.PI,ph=a/n*Math.PI*2;points.push([x+r*Math.sin(th)*Math.cos(ph),y+r*Math.sin(th)*Math.sin(ph),z+r*Math.cos(th)*flatten]);}if(j===0)points.splice(0,1);else if(j===rows-1)points.splice(2,1);this.face(points.reverse(),c,e);}return this;}
    add(other,m=identity()){let start=this.vertices.length/10;for(let i=0;i<other.vertices.length;i+=10){let v=other.vertices;let p=point(m,v.slice(i,i+3));let n=norm([m[0]*v[i+3]+m[4]*v[i+4]+m[8]*v[i+5],m[1]*v[i+3]+m[5]*v[i+4]+m[9]*v[i+5],m[2]*v[i+3]+m[6]*v[i+4]+m[10]*v[i+5]]);this.vertices.push(...p,...n,...v.slice(i+6,i+10));}for(const i of other.indices)this.indices.push(start+i);return this;}
  }
  const vertex=`#version 300 es
precision highp float;
layout(location=0) in vec3 position;layout(location=1) in vec3 normal;layout(location=2) in vec3 color;layout(location=3) in float emissive;
layout(location=4) in mat4 model;layout(location=8) in vec4 info;
uniform mat4 vp;out vec3 p,n,c;out vec4 extra;out float glow;out vec2 shadowUV;
void main(){vec4 world=model*vec4(position,1.);p=world.xyz;n=normalize(transpose(inverse(mat3(model)))*normal);c=color;glow=emissive;extra=info;shadowUV=position.xy;gl_Position=vp*world;}`;
  const fragment=`#version 300 es
precision highp float;in vec3 p,n,c;in vec4 extra;in float glow;in vec2 shadowUV;out vec4 outColor;
uniform vec3 accent,eye;uniform float time,zone;
float hash(vec3 v){return fract(sin(dot(v,vec3(127.1,311.7,74.7)))*43758.5453);}
void main(){if(extra.z>.5){float a=extra.w*(1.-smoothstep(.12,1.,length(shadowUV)));outColor=vec4(.002,.008,.014,a);return;}vec3 N=normalize(n);vec3 V=normalize(vec3(0.,.65,1.));vec3 L=normalize(vec3(-.5,-.6,1.));vec3 H=normalize(V+L);float d=max(dot(N,L),0.);float spec=pow(max(dot(N,H),0.),40.);float rim=pow(1.-max(dot(N,V),0.),3.);vec3 base=pow(c,vec3(2.2));
float grain=hash(floor(p*1.7));base*=.97+grain*.055;
if(p.z< -60.){float scratch=sin(p.x*.064+sin(p.y*.048)*2.3);if(zone>.5&&zone<1.5){float ice=pow(abs(scratch),18.);base=mix(base,base*vec3(.68,.91,1.03),ice*.38);}else if(zone>3.5&&zone<5.5){vec2 grid=abs(fract(p.xy/37.)-.5);float seam=smoothstep(.455,.486,max(grid.x,grid.y));base*=1.-seam*.14;}else if(zone>6.5&&zone<7.5){base*=.96+.04*sin(p.x*.055+p.y*.09);}}
vec3 lit=base*(.23+d*1.8)+vec3(.72,.85,.91)*spec*.12+accent*rim*.085;
float ambientShadow=clamp(.65+N.z*.35,0.,1.);lit*=ambientShadow;
if(glow>0.)lit=base*(1.05+glow*.7);lit+=base*glow*.25;
if(extra.x>0.)lit=mix(lit,vec3(1.,.78,.48),min(.7,extra.x));
if(extra.y>0.)lit=mix(lit,accent*1.7,extra.y*.26);
if(p.z< -45.)lit*=.53;float fog=clamp((-p.z-100.)/1500.,0.,.30);lit=mix(lit,vec3(.005,.012,.026),fog);
vec3 mapped=lit/(lit+vec3(.68));outColor=vec4(pow(mapped,vec3(.4545)),extra.w);}`;
  const quadVS=`#version 300 es
precision highp float;out vec2 uv;void main(){vec2 a=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=a;gl_Position=vec4(a*2.-1.,0.,1.);}`;
  const skyFS=`#version 300 es
precision highp float;
in vec2 uv;out vec4 outColor;
uniform vec2 resolution,offset;uniform float time,zone;uniform vec3 accent;
uniform vec3 nebulaColor,planetColor,planetPosition;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<4;i++){n+=noise(p)*a;p=mat2(.8,.6,-.6,.8)*p*2.05;a*=.5;}return n;}
void main(){vec2 q=(uv-.5)*vec2(resolution.x/resolution.y,1.);vec2 cloud=q*2.8+offset*.000055+vec2(time*.001,0.);float f=fbm(cloud+fbm(cloud*1.4));vec3 col=vec3(.006,.012,.026)+nebulaColor*pow(f,2.)*.85;
for(int layer=0;layer<2;layer++){vec2 stars=(q+offset*(.000022+float(layer)*.00002))*vec2(160.+float(layer)*90.);vec2 id=floor(stars),cell=fract(stars)-.5;float h=hash(id+float(layer)*37.);float star=(1.-smoothstep(.008,.08,length(cell)))*step(.991,h);col+=vec3(.55,.71,.85)*star*(.4+h)*(.88+.12*sin(time*.4+h*100.));}
vec2 pc=q-planetPosition.xy-offset*.000018;float r=length(pc),radius=planetPosition.z;
if(zone<7.5){
 float atmosphere=exp(-max(0.,r-radius)*74.)*smoothstep(radius-.022,radius+.014,r);col+=planetColor*atmosphere*.55;
 if(r<radius){float z=sqrt(max(0.,radius*radius-r*r));vec3 N=normalize(vec3(pc/radius,z/radius));float light=max(dot(N,normalize(vec3(-.6,.5,.4))),0.);float terrain=fbm(pc*17.+vec2(zone*2.7,0.));float clouds=fbm(pc*39.+vec2(time*.001,zone));vec3 land=mix(planetColor*.23,planetColor*.8,terrain);
 if(zone>.5&&zone<1.5){land=mix(vec3(.18,.31,.39),vec3(.61,.75,.83),terrain);land+=vec3(.12,.20,.23)*pow(abs(sin(pc.y*90.+terrain*13.)),22.);}
 else if(zone>1.5&&zone<2.5){land=mix(vec3(.53,.12,.018),vec3(1.,.61,.18),terrain);light=.55+light*.40;}
 else if(zone>4.5&&zone<5.5){float cracks=pow(1.-abs(sin(terrain*28.+pc.x*45.)),8.);land+=vec3(.85,.13,.008)*cracks;}
 else{land=mix(land,vec3(.57,.65,.65),smoothstep(.60,.78,clouds)*.45);}
 col=land*(.1+light*1.1)+planetColor*pow(1.-N.z,5.)*.50;
 }
 if(zone>3.5&&zone<4.5){vec2 ring=pc*vec2(1.,3.8);float d=length(ring);float band=smoothstep(radius*1.03,radius*1.18,d)*(1.-smoothstep(radius*1.62,radius*1.77,d));if(pc.y<0.||r>radius){col+=vec3(.27,.33,.15)*band*(.65+.35*sin(d*220.));}}
 if(zone>6.5){float ribbon=exp(-abs(q.y-.2*sin(q.x*3.4+f*2.)+.16)*19.);col+=vec3(.14,.08,.24)*ribbon;vec2 moon=q-vec2(-.3,.32);float mr=length(moon);if(mr<.07)col=vec3(.15,.16,.22)*(.2+max(0.,-moon.x/.07));}
}else{float ring=exp(-abs(r-radius)*94.);float halo=exp(-abs(r-radius)*12.)*.10;vec2 disk=pc*vec2(1.,3.6);float dr=length(disk),a=atan(pc.y,pc.x);float band=exp(-abs(dr-.31)*48.)*(.65+fbm(vec2(a*4.,r*65.-time*.02)));vec3 fire=mix(vec3(.32,.12,.72),vec3(1.,.56,.19),smoothstep(-.3,.4,pc.x));col+=fire*(ring*1.35+halo+band*.7);if(r<radius*.90)col*=smoothstep(radius*.40,radius*.91,r)*.06;}
col*=1.-dot(uv-.5,uv-.5)*.24;outColor=vec4(col,1.);}
`;
  const bloomFS=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;uniform sampler2D source;uniform vec2 delta;uniform int extract;
void main(){vec3 c=texture(source,uv).rgb*.227;c+=texture(source,uv+delta*1.3846).rgb*.3162;c+=texture(source,uv-delta*1.3846).rgb*.3162;c+=texture(source,uv+delta*3.2308).rgb*.0703;c+=texture(source,uv-delta*3.2308).rgb*.0703;if(extract==1)c*=smoothstep(.60,.96,max(c.r,max(c.g,c.b)));outColor=vec4(c,1.);}`;
  const finalFS=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;uniform sampler2D scene,bloom;uniform vec2 resolution;uniform float pulse,hurt,bloomAmount;uniform vec4 impacts[4];
void main(){vec2 sampleUV=uv;for(int i=0;i<4;i++){vec2 d=(uv-impacts[i].xy)*vec2(resolution.x/resolution.y,1.);float r=length(d);float band=exp(-pow((r-impacts[i].z)*65.,2.));sampleUV+=normalize(d+vec2(.00001))*vec2(resolution.y/resolution.x,1.)*band*impacts[i].w;}vec2 px=1./resolution;vec3 c=texture(scene,sampleUV).rgb;vec3 n=texture(scene,sampleUV+vec2(0,px.y)).rgb,s=texture(scene,sampleUV-vec2(0,px.y)).rgb,e=texture(scene,sampleUV+vec2(px.x,0)).rgb,w=texture(scene,sampleUV-vec2(px.x,0)).rgb;float l=dot(c,vec3(.299,.587,.114)),maxL=max(max(dot(n,vec3(.333)),dot(s,vec3(.333))),max(dot(e,vec3(.333)),dot(w,vec3(.333))));float minL=min(min(dot(n,vec3(.333)),dot(s,vec3(.333))),min(dot(e,vec3(.333)),dot(w,vec3(.333))));c=mix(c,(n+s+e+w)*.25,clamp((maxL-minL-.20)*.45,0.,.3));c+=texture(bloom,uv).rgb*bloomAmount;float edge=pow(length((uv-.5)*1.45),3.);c+=vec3(.02,.12,.13)*pulse*edge;c=mix(c,vec3(.5,.025,.04),edge*hurt*.42);outColor=vec4(c,1.);}`;
  class Engine {
    constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:true,stencil:false,powerPreference:'high-performance'});if(!this.gl)throw Error('WebGL 2 unavailable');let g=this.gl;this.program=this.compile(vertex,fragment);this.sky=this.compile(quadVS,skyFS);this.blur=this.compile(quadVS,bloomFS);this.final=this.compile(quadVS,finalFS);this.empty=g.createVertexArray();this.targets=[];this.models=new Map();this.batches=new Map();this.max=Math.min(g.getParameter(g.MAX_TEXTURE_SIZE),g.getParameter(g.MAX_RENDERBUFFER_SIZE),...g.getParameter(g.MAX_VIEWPORT_DIMS));this.w=0;this.h=0;this.quality='auto';this.drawCalls=0;this.triangles=0;this.enabled=true;this.lastError=null;this.targetSize=0;this.instanceBuffers=[];this.lastZone=-1;}
    compile(v,f){let g=this.gl,p=g.createProgram();for(let[type,code]of[[g.VERTEX_SHADER,v],[g.FRAGMENT_SHADER,f]]){let s=g.createShader(type);g.shaderSource(s,code);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS)){let message=g.getShaderInfoLog(s);g.deleteShader(s);g.deleteProgram(p);throw Error(message);}g.attachShader(p,s);g.deleteShader(s);}g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));return{p,u:new Map()};}
    use(p){this.gl.useProgram(p.p);this.current=p;}
    uniform(name,type,value){let p=this.current,g=this.gl;if(!p.u.has(name))p.u.set(name,g.getUniformLocation(p.p,name));let u=p.u.get(name);if(u===null)return;if(type==='m')g.uniformMatrix4fv(u,false,value);else if(type===2)g.uniform2fv(u,value);else if(type===3)g.uniform3fv(u,value);else if(type===4)g.uniform4fv(u,value);else if(type==='i')g.uniform1i(u,value);else g.uniform1f(u,value);}
    mesh(name,model){let g=this.gl,vao=g.createVertexArray(),v=g.createBuffer(),idx=g.createBuffer(),inst=g.createBuffer();g.bindVertexArray(vao);g.bindBuffer(g.ARRAY_BUFFER,v);g.bufferData(g.ARRAY_BUFFER,new Float32Array(model.vertices),g.STATIC_DRAW);g.bindBuffer(g.ELEMENT_ARRAY_BUFFER,idx);g.bufferData(g.ELEMENT_ARRAY_BUFFER,new Uint32Array(model.indices),g.STATIC_DRAW);let sizes=[3,3,3,1],off=0;for(let i=0;i<4;i++){g.enableVertexAttribArray(i);g.vertexAttribPointer(i,sizes[i],g.FLOAT,false,40,off*4);off+=sizes[i];}g.bindBuffer(g.ARRAY_BUFFER,inst);g.bufferData(g.ARRAY_BUFFER,80*100,g.DYNAMIC_DRAW);for(let i=4;i<9;i++){g.enableVertexAttribArray(i);g.vertexAttribPointer(i,4,g.FLOAT,false,80,(i-4)*16);g.vertexAttribDivisor(i,1);}let mesh={vao,v,idx,inst,count:model.indices.length};this.models.set(name,mesh);return mesh;}
    destroyMesh(name){const m=this.models.get(name);if(!m)return;const g=this.gl;g.deleteVertexArray(m.vao);g.deleteBuffer(m.v);g.deleteBuffer(m.idx);g.deleteBuffer(m.inst);this.models.delete(name);}
    target(w,h,depth=false){let g=this.gl,t=g.createTexture(),f=g.createFramebuffer(),d=null;g.bindTexture(g.TEXTURE_2D,t);g.texImage2D(g.TEXTURE_2D,0,g.RGBA8,w,h,0,g.RGBA,g.UNSIGNED_BYTE,null);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.bindFramebuffer(g.FRAMEBUFFER,f);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,t,0);if(depth){d=g.createRenderbuffer();g.bindRenderbuffer(g.RENDERBUFFER,d);g.renderbufferStorage(g.RENDERBUFFER,g.DEPTH_COMPONENT16,w,h);g.framebufferRenderbuffer(g.FRAMEBUFFER,g.DEPTH_ATTACHMENT,g.RENDERBUFFER,d);}if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE){g.deleteTexture(t);g.deleteFramebuffer(f);if(d)g.deleteRenderbuffer(d);throw Error('Render target unsupported');}return{t,f,d,w,h};}
    resize(w,h,mobile){
      const uhd=this.quality==='ultra',high=this.quality==='high';
      const budget=uhd?8294400:high?3686400:this.quality==='low'?520000:mobile?1100000:2304000;
      const requested=Math.min(devicePixelRatio||1,uhd?3:high?2:mobile?1.75:1.5);
      let scale=Math.min(requested,Math.sqrt(budget/(w*h)),this.max/w,this.max/h);
      let nw=Math.max(2,Math.floor(w*scale)),nh=Math.max(2,Math.floor(h*scale));
      if(nw===this.w&&nh===this.h)return;
      const g=this.gl;let next=[],failure=null;
      const drop=t=>{g.deleteTexture(t.t);g.deleteFramebuffer(t.f);if(t.d)g.deleteRenderbuffer(t.d);};
      for(let attempt=0;attempt<3;attempt++){
        try{next.push(this.target(nw,nh,true));next.push(this.target(Math.ceil(nw/4),Math.ceil(nh/4)));next.push(this.target(Math.ceil(nw/4),Math.ceil(nh/4)));const bgScale=Math.min(1,Math.sqrt((mobile?360000:700000)/(nw*nh)));next.push(this.target(Math.max(2,Math.floor(nw*bgScale)),Math.max(2,Math.floor(nh*bgScale))));failure=null;break;}
        catch(e){failure=e;for(const t of next)drop(t);next=[];nw=Math.max(2,Math.floor(nw*.7));nh=Math.max(2,Math.floor(nh*.7));for(let i=0;i<16&&g.getError()!==g.NO_ERROR;i++){} }
      }
      if(failure)throw failure;
      for(const t of this.targets)drop(t);this.targets=next;this.w=nw;this.h=nh;this.canvas.width=nw;this.canvas.height=nh;
    }
    ready(force=false){const g=this.gl;if(!this.fence)return true;if(force){g.finish();g.deleteSync(this.fence);this.fence=null;return true;}const status=g.clientWaitSync(this.fence,0,0);if(status===g.TIMEOUT_EXPIRED)return false;g.deleteSync(this.fence);this.fence=null;return true;}
    begin(){this.batches.clear();}
    add(name,x,y,z=0,yaw=0,s=1,hit=0,energy=0,alpha=1,sy=s,sz=s,pitch=0){let batch=this.batches.get(name);if(!batch){batch=[];this.batches.set(name,batch);}batch.push(...matrix(x,y,z,yaw,s,sy,sz,pitch),hit,energy,0,alpha);}
    shadow(name,x,y,yaw,s,alpha){const key='softShadow';let batch=this.batches.get(key);if(!batch){batch=[];this.batches.set(key,batch);}const boss=name.startsWith('boss'),w=boss?90:name==='brute'?32:26,h=boss?72:31;batch.push(...matrix(x,y,-55,yaw,s*w,s*h,.002),0,0,1,alpha*.68);}
    quad(){this.gl.bindVertexArray(this.empty);this.gl.drawArrays(this.gl.TRIANGLES,0,3);this.drawCalls++;}
    tex(texture,unit){let g=this.gl;g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,texture);}
    render({width,height,cx,cy,zoom,time,zone,accent,pulse=0,hurt=0,mobile=false,impacts=[],location=null}){if(!this.enabled)return;this.resize(width,height,mobile);let g=this.gl,[scene,a,b,background]=this.targets;this.drawCalls=0;this.triangles=0;g.bindFramebuffer(g.FRAMEBUFFER,scene.f);g.viewport(0,0,this.w,this.h);g.clearColor(.015,.025,.04,1);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.disable(g.DEPTH_TEST);g.disable(g.CULL_FACE);g.disable(g.BLEND);this.use(this.sky);g.bindFramebuffer(g.FRAMEBUFFER,background.f);g.viewport(0,0,background.w,background.h);this.uniform('resolution',2,[width,height]);this.uniform('offset',2,[cx-1200,cy-900]);this.uniform('time',1,time);this.uniform('zone',1,zone);this.uniform('accent',3,C(accent));this.uniform('nebulaColor',3,location?.sky||[.035,.15,.23]);this.uniform('planetColor',3,location?.planet||[.12,.38,.61]);this.uniform('planetPosition',3,location?.position||[-.3,.12,.48]);this.quad();g.bindFramebuffer(g.READ_FRAMEBUFFER,background.f);g.bindFramebuffer(g.DRAW_FRAMEBUFFER,scene.f);g.blitFramebuffer(0,0,background.w,background.h,0,0,this.w,this.h,g.COLOR_BUFFER_BIT,g.LINEAR);g.bindFramebuffer(g.FRAMEBUFFER,scene.f);g.viewport(0,0,this.w,this.h);g.enable(g.DEPTH_TEST);g.enable(g.CULL_FACE);g.frontFace(g.CW);g.depthFunc(g.LEQUAL);g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);this.use(this.program);
      let sx=2*zoom/width,sy=2*zoom/height;let vp=new Float32Array([sx,0,0,0,0,-sy,-.00008,0,0,sy*.62,-.001,0,-cx*sx,cy*sy,cy*.00008,1]);this.uniform('vp','m',vp);this.uniform('time',1,time);this.uniform('zone',1,zone);this.uniform('accent',3,C(accent));
      for(let[name,values]of this.batches){const m=this.models.get(name);if(!m||!values.length)continue;g.bindVertexArray(m.vao);g.bindBuffer(g.ARRAY_BUFFER,m.inst);g.bufferData(g.ARRAY_BUFFER,new Float32Array(values),g.DYNAMIC_DRAW);g.drawElementsInstanced(g.TRIANGLES,m.count,g.UNSIGNED_INT,0,values.length/20);this.drawCalls++;this.triangles+=m.count/3*values.length/20;}
      g.disable(g.DEPTH_TEST);g.disable(g.CULL_FACE);g.disable(g.BLEND);this.use(this.blur);this.uniform('source','i',0);g.bindFramebuffer(g.FRAMEBUFFER,a.f);g.viewport(0,0,a.w,a.h);this.tex(scene.t,0);this.uniform('extract','i',1);this.uniform('delta',2,[1/this.w,1/this.h]);this.quad();if(this.quality!=='low'){g.bindFramebuffer(g.FRAMEBUFFER,b.f);this.tex(a.t,0);this.uniform('extract','i',0);this.uniform('delta',2,[1/a.w,0]);this.quad();g.bindFramebuffer(g.FRAMEBUFFER,a.f);this.tex(b.t,0);this.uniform('delta',2,[0,1/a.h]);this.quad();}
      g.bindFramebuffer(g.FRAMEBUFFER,null);g.viewport(0,0,this.w,this.h);this.use(this.final);this.tex(scene.t,0);this.tex(a.t,1);this.uniform('scene','i',0);this.uniform('bloom','i',1);this.uniform('resolution',2,[this.w,this.h]);this.uniform('bloomAmount',1,this.quality==='low'?.1:.36);this.uniform('pulse',1,pulse);this.uniform('hurt',1,hurt);let imp=[];for(let i=0;i<4;i++)imp.push(...(impacts[i]||[0,0,0,0]));this.uniform('impacts[0]',4,imp);this.quad();if(this.fence)g.deleteSync(this.fence);this.fence=g.fenceSync(g.SYNC_GPU_COMMANDS_COMPLETE,0);g.flush();}
  }
  return {Engine,Model,matrix,C};
})();
