// Nine authored destinations. Art randomness is isolated from the gameplay RNG.
const NR16World = (() => {
  const {Model,matrix}=NR15, M=NR15Art.M;
  const destinations=[
    {id:'haven',name:'HAVEN SHIPYARD',accent:'#69e7d6',sky:[.035,.15,.23],planet:[.12,.38,.61],position:[-.30,.12,.48],kind:0,sub:'Depart the orbital docks above Pelagos.',coordinate:'PELAGOS / LOW ORBIT'},
    {id:'boreal',name:'BOREAL ICE BELT',accent:'#a9e9ff',sky:[.035,.15,.28],planet:[.42,.68,.82],position:[.38,-.17,.33],kind:1,sub:'Thread the blue glaciers of a shattered moon.',coordinate:'BOREAL / DEBRIS FIELD'},
    {id:'helios',name:'HELIOS JUMP GATE',accent:'#ffcf85',sky:[.22,.095,.027],planet:[.95,.41,.09],position:[-.48,.26,.39],kind:2,sub:'Break the Gatekeeper blockade at the transit ring.',coordinate:'HELIOS / TRANSIT NEXUS'},
    {id:'ashfall',name:'ASHFALL GRAVEYARD',accent:'#ef9e74',sky:[.16,.055,.035],planet:[.42,.14,.065],position:[.37,-.06,.51],kind:3,sub:'Cross the remains of a fallen capital fleet.',coordinate:'ASHFALL / WRECK CORRIDOR'},
    {id:'solace',name:'SOLACE SOLAR ARRAY',accent:'#c6eb9a',sky:[.025,.14,.09],planet:[.16,.38,.15],position:[-.29,-.22,.41],kind:4,sub:'Skim the collectors on the sunward power grid.',coordinate:'SOLACE / STELLAR HARVEST'},
    {id:'forge',name:'WARDEN FOUNDRY',accent:'#ff936d',sky:[.22,.038,.027],planet:[.63,.12,.025],position:[.31,.18,.46],kind:5,sub:'Shut down the Warden inside a burning industrial complex.',coordinate:'PYRE / INDUSTRIAL RING'},
    {id:'cathedral',name:'OBSIDIAN CATHEDRAL',accent:'#b99bff',sky:[.12,.035,.23],planet:[.24,.13,.42],position:[-.34,.16,.34],kind:6,sub:'Descend between the spires of a broken sanctuary.',coordinate:'NACRE / FORBIDDEN ORBIT'},
    {id:'prism',name:'PRISM EXPANSE',accent:'#f1b0e6',sky:[.19,.065,.18],planet:[.35,.29,.52],position:[.38,-.18,.23],kind:7,sub:'Navigate the luminous fragments at reality\'s edge.',coordinate:'PRISM / FRACTURE SPACE'},
    {id:'horizon',name:'EVENT HORIZON',accent:'#f5bf79',sky:[.075,.025,.12],planet:[.50,.19,.7],position:[0,.04,.2],kind:8,sub:'Reach the Sovereign citadel at the singularity.',coordinate:'SOVEREIGN / POINT OF NO RETURN'}
  ];
  function index(wave=1){return ((Math.max(1,Math.floor(wave))-1)%9+9)%9;}
  function info(wave=1){return destinations[index(wave)];}
  function hash(n,s=0){let x=Math.sin(n*127.1+s*311.7)*43758.5453123;return x-Math.floor(x);}
  function perimeter(b,c){for(const y of[24,1776]){b.box(1200,y,-100,2330,12,12,M.dark);b.glow(1200,y,-87,2310,2,c,.55);}for(const x of[24,2376]){b.box(x,900,-100,12,1750,12,M.dark);b.glow(x,900,-87,2,1720,c,.55);}}
  function lattice(b,x,y,z,w,h,c,angle=0){let p=new Model();p.box(0,0,0,w,h,8,'#263e50',2);p.box(0,0,9,w-8,h-8,1,'#182e49');for(let i=-w/2+13;i<w/2-5;i+=18){p.glow(i,0,11,1,h-12,c,.20);}for(let j=-h/2+16;j<h/2-5;j+=24){p.glow(0,j,11,w-12,1,c,.20);}p.glow(-w/2+3,0,12,1.5,h,c,.55);p.glow(w/2-3,0,12,1.5,h,c,.55);b.add(p,matrix(x,y,z,angle));}
  function crystal(b,x,y,z,r,h,c,a=0){let p=new Model();const base=[[0,-r],[r*.64,-r*.36],[r*.75,r*.48],[0,r],[-r*.76,r*.46],[-r*.63,-r*.35]];p.prism(base,0,h*.4,c,3);const top=[r*.13,-r*.08,h];for(let i=0;i<6;i++){let j=(i+1)%6;p.face([[...base[i],h*.4],[...base[j],h*.4],top],i%2?'#c5dfeb':c);}p.glow(0,0,h*.41,2,r*1.2,'#baf8ff',.45);b.add(p,matrix(x,y,z,a));}
  function conduit(b,x,y,length,width,c,angle=0){let p=new Model();p.box(0,0,0,width,length,20,M.dark,3);p.box(0,0,21,width*.6,length-10,4,'#515361',1);p.glow(0,0,26,width*.23,length-20,c,.8);for(let j=-length/2+15;j<length/2;j+=32)p.box(0,j,27,width+5,7,7,M.steel,1);b.add(p,matrix(x,y,-155,angle));}
  function build(zone){let b=new Model(),cx=1200,cy=900,c=destinations[zone].accent;
    if(zone===0){return NR15Art.station(0);}
    if(zone===1){
      // Large white ice plates, crystalline peaks and a central diagonal ice scar.
      for(let i=0;i<38;i++){let a=i*2.399,rad=80+(i%8)*79,x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad*.85,r=31+hash(i,8)*71;let rock=new Model();let points=Array.from({length:7},(_,j)=>{let aa=j*Math.PI*2/7,rr=r*(.66+hash(i*9+j,4)*.4);return[Math.cos(aa)*rr,Math.sin(aa)*rr];});rock.prism(points,0,16+hash(i,11)*26,i%3?'#7398b1':'#b3cbd7',7,'#a9c9dc');rock.glow(0,0,45,2,r*.8,c,.45,.5);b.add(rock,matrix(x,y,-170-hash(i,3)*90,i*.41));if(i%3===0)crystal(b,x+20,y,-175,r*.52,58+hash(i,2)*42,'#9fccdf',a);}
      for(let i=0;i<12;i++)crystal(b,cx-190+i*31,cy-340+i*55,-180,22+(i%3)*14,74,'#81c4dd',i*.45);
    }else if(zone===2){
      b.ring(cx,cy,-196,322,100,48,'#45434a',112);b.ring(cx,cy,-145,300,12,10,'#b68c52',112);b.ring(cx,cy,-133,279,8,2,c,112,0,Math.PI*2,1.4);b.ring(cx,cy,-194,470,36,24,'#373846',112,0,Math.PI*1.74);
      for(let i=0;i<8;i++){let a=i*Math.PI/4,p=new Model();p.box(0,-346,0,92,186,40,'#343644',6);p.box(0,-329,41,68,100,19,'#b19d78',4);p.glow(0,-312,61,20,72,c,1.1);for(let j=-24;j<=24;j+=12)p.box(j,-383,60,7,23,5,M.black,1);p.box(0,-471,-15,38,90,24,M.dark,2);b.add(p,matrix(cx,cy,-169,a));}
      // Approach lanes, not the prior station's four-spoke layout.
      for(let s of[-1,1]){b.box(cx+s*460,cy,-155,74,1150,25,M.dark,4);for(let y=-520;y<550;y+=80){b.glow(cx+s*460,cy+y,-128,8,27,c,.9);}}
    }else if(zone===3){b=NR15Art.station(1);for(let i=0;i<12;i++){let x=cx-370+i*61,y=cy+Math.sin(i*1.2)*170; b.box(x,y,-198,38,26,17,'#704b3d',3,i);b.glow(x,y,-179,3,16,'#ff815f',.7,i);}}
    else if(zone===4){
      // Four huge banks of solar collectors; gold bus bars and green reactor cores.
      for(let side of[-1,1])for(let row=0;row<3;row++){let x=cx+side*285,y=cy-355+row*330;lattice(b,x,y,-188,310,272,'#85b9dd',side*.08);b.box(x,y,-205,328,9,16,'#b09a59',1);b.glow(x,y,-187,290,2,c,.5);}
      b.box(cx,cy,-192,114,1150,34,'#293c3c',4);b.box(cx,cy,-156,54,1050,8,'#a2a997',3);
      for(let y of[-365,0,365]){b.box(cx,cy+y,-150,144,122,32,'#1d3937',4);b.disc(cx,cy+y,-116,47,19,'#5f8b76',24,3);b.ring(cx,cy+y,-95,37,4,2,c,48,0,Math.PI*2,1.1);b.sphere(cx,cy+y,-88,25,'#8adbac',.65,20,10,.35);}
      for(let s of[-1,1])conduit(b,cx+s*475,cy,1170,19,'#d1d797',0);
    }else if(zone===5){
      // Square foundry terraces and hot furnace trenches, intentionally no circular dock.
      b.box(cx,cy,-240,1190,1140,33,'#302e31',9);for(let x of[-385,0,385])for(let y of[-335,335]){b.box(cx+x,cy+y,-206,252,210,35,'#514344',7);b.box(cx+x,cy+y,-169,192,150,8,'#161e26',3);b.glow(cx+x,cy+y,-160,171,121,'#df653f',.65);for(let j=-75;j<86;j+=30)b.box(cx+x+j,cy+y,-153,12,164,15,'#525158',1);}
      for(let x of[-560,-180,180,560])conduit(b,cx+x,cy,1150,24,'#ec7743');
      for(let s of[-1,1]){b.box(cx+s*280,cy,-206,280,140,43,M.dark,6);for(let i=-95;i<110;i+=38){b.disc(cx+s*280+i,cy,-162,17,52,'#6e6060',12,2);b.ring(cx+s*280+i,cy,-107,12,3,2,c,24,0,Math.PI*2,1);}}
      b.disc(cx,cy,-170,95,28,'#7f6850',32,4);b.disc(cx,cy,-140,66,14,'#241d21',32,3);b.sphere(cx,cy,-122,48,c,1.1,24,12,.3);
    }else if(zone===6){b=NR15Art.station(2);for(let s of[-1,1])for(let i=0;i<4;i++){let x=cx+s*(115+i*90),y=cy-260+i*160;let pillar=new Model();pillar.prism([[-28,-44],[28,-44],[43,8],[0,61],[-43,8]],0,125,'#393047',7,'#6e5d8b');pillar.glow(0,4,128,5,70,c,.75);b.add(pillar,matrix(x,y,-225,s*.28));}}
    else if(zone===7){
      // Floating prismatic terraces and faceted crystals: no reused industrial background.
      for(let i=0;i<20;i++){let a=i*2.399,rad=120+(i%5)*110,x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad*.8,r=55+hash(i,20)*75;let slab=new Model();slab.prism([[-r,-r*.32],[-r*.24,-r*.7],[r*.72,-r*.4],[r,r*.35],[r*.08,r*.6]],0,19,i%2?'#5a587d':'#7f719c',5,'#b9b0c9');slab.glow(0,0,20,2,r*1.1,i%2?'#e5a6dc':'#88d6ea',.6,.6);b.add(slab,matrix(x,y,-210-(i%3)*35,a));crystal(b,x-10,y,-190,r*.34,60+hash(i,23)*80,i%2?'#b3b8e0':'#92d3dc',a+.4);}
      const p=new Model();p.ring(0,0,0,228,18,16,'#b2a9cc',80,.15,Math.PI*1.74);p.ring(0,0,18,228,3,2,'#e9aeed',80,.15,Math.PI*1.74,.9);b.add(p,matrix(cx,cy-25,-180,.28,1,.67,1));
    }else{b=NR15Art.station(3);b.ring(cx,cy,-120,137,25,12,'#373047',96);b.ring(cx,cy,-106,116,4,2,c,96,0,Math.PI*2,1.0);}
    if(![3,6,8].includes(zone))perimeter(b,c);return b;
  }
  function dynamics(engine,zone,time,reduced){let t=reduced?0:time, cx=1200,cy=900;
    if(zone===2){engine.add('navHalo',cx,cy,-121,t*.045,273,0,0,.30,273,2);}
    if(zone===4){for(const y of[-365,0,365])engine.add('navHalo',cx,cy+y,-84,-t*.11,51,0,0,.32,51,1);}
    if(zone===6){engine.add('navHalo',cx,cy,-176,-t*.024,242,0,0,.25,242,2);}
    if(zone===8){engine.add('navHalo',cx,cy,-90,t*.037,140,0,0,.35,140,2);}
  }
  function init(engine){const b=new Model();b.ring(0,0,0,1,.007,.01,'#b9e8f6',80,0,Math.PI*1.75,1);engine.mesh('navHalo',b);}
  return {destinations,index,info,build,dynamics,init};
})();
