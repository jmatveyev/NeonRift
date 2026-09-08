// Authored solid geometry: hull plates, recessed components, thrusters and orbital structures.
const NR15Art = (() => {
 const {Model,matrix}=NR15;
 const M={dark:'#182733',black:'#08131e',steel:'#647b8c',edge:'#9cafb8',white:'#dae6e9',ivory:'#b9c6ca',teal:'#358e90',cyan:'#51ebdf',glass:'#174657',amber:'#efb94a',gold:'#b58a48',red:'#d74750',pink:'#ff526b',purple:'#7774b6',lilac:'#b4a0de',green:'#75c669'};
 function hull(b,pts,z,h,c=M.white,bevel=1.6){b.prism(pts,z,h,c,bevel);}
 function engine(b,x,y,z,w=7,l=14,color=M.cyan){b.box(x,y,z,w,l,6,M.dark,1);b.box(x,y-2,z+5,w*.8,l*.65,3,M.steel,.7);b.box(x,y+l*.46,z+1,w*.86,2.8,3,M.black,.4);b.glow(x,y+l*.55,z+1.3,w*.66,2.6,color,2.4);for(let i=0;i<3;i++)b.box(x,y-4+i*3,z+7,w*.74,.8,.35,M.black);}
 function gun(b,x,y,z,l=14){b.box(x,y,z,3.6,l,3.8,M.dark,.6);b.box(x,y-l*.4,z+.8,2.8,6,2,M.steel,.4);b.glow(x,y-l*.62,z+1.5,1.2,2.0,M.amber,1.8);}
 function cockpit(b,x,y,z,w=8,l=18,color=M.glass){hull(b,[[x,y-l*.58],[x+w*.46,y-l*.1],[x+w*.4,y+l*.42],[x-w*.4,y+l*.42],[x-w*.46,y-l*.1]],z,5.2,M.dark,.8);hull(b,[[x,y-l*.47],[x+w*.33,y-l*.08],[x+w*.3,y+l*.29],[x-w*.3,y+l*.29],[x-w*.33,y-l*.08]],z+4.3,2.2,color,.35);b.glow(x-w*.25,y-1,z+6.7,.4,l*.48,'#b2edfa',.6,-.02);b.box(x,y+l*.18,z+6.9,w*.6,.5,.5,M.steel);}
 function decal(b,x,y,z,w,l,c){b.glow(x,y,z,w,l,c,0);}
 function ship(id){const b=new Model();
  if(id==='striker'){
   hull(b,[[0,-32],[9,-9],[11,19],[5,25],[-5,25],[-11,19],[-9,-9]],0,7,M.dark,2);
   for(let s of[-1,1]){hull(b,[[s*7,-9],[s*20,1],[s*28,22],[s*17,19],[s*9,11]],1,5,M.steel,1.4);hull(b,[[s*8,-7],[s*18,4],[s*22,16],[s*10,9]],6,2.8,M.ivory,1);engine(b,s*10,17,1,8,20);gun(b,s*21,2,4,17);decal(b,s*14,8,9.1,2.2,8,M.teal);b.glow(s*25,17,6,2,2.2,M.red,1.5);}
   hull(b,[[0,-31],[6,-13],[6,15],[0,21],[-6,15],[-6,-13]],7,5,M.white,1.2);cockpit(b,0,-9,11,8,17);b.box(0,16,12,7,5,1.3,M.steel,.5);b.glow(0,13,13.5,3,.7,M.cyan,1.6);
   for(let y of[1,5,9]){b.box(-3.8,y,12,.7,2,.4,M.dark);b.box(3.8,y,12,.7,2,.4,M.dark);}b.glow(0,-26,10,1.2,3,M.amber,.7);
  } else if(id==='ghost'){
   hull(b,[[0,-32],[6,-17],[17,-7],[33,18],[24,23],[9,12],[0,22],[-9,12],[-24,23],[-33,18],[-17,-7],[-6,-17]],0,5,M.black,1.8);
   for(let s of[-1,1]){hull(b,[[s*6,-20],[s*13,-5],[s*28,17],[s*20,17],[s*6,4]],5,3,M.purple,1);hull(b,[[s*14,0],[s*27,14],[s*23,14],[s*13,5]],8,1.5,M.lilac,.6);engine(b,s*15,15,2,7,11,M.lilac);gun(b,s*11,-15,2,13);b.glow(s*20,13,10,1,10,M.lilac,1.4,s*-.65);}
   hull(b,[[0,-30],[5,-14],[5,8],[0,14],[-5,8],[-5,-14]],5,7,M.steel,1);cockpit(b,0,-8,11,7,18,'#504a92');b.glow(0,7,12.5,3,5,M.lilac,1.7);
  }else{
   hull(b,[[-15,-23],[15,-23],[24,-9],[24,23],[13,28],[-13,28],[-24,23],[-24,-9]],0,7,M.dark,2.2);
   for(let s of[-1,1]){hull(b,[[s*10,-22],[s*20,-13],[s*23,18],[s*14,20],[s*11,5]],7,7,M.gold,1.6);b.box(s*20,8,14,6,13,2,M.amber,.6);engine(b,s*13,23,2,10,12,M.amber);gun(b,s*13,-21,8,23);b.glow(s*23,12,12,1.2,7,M.amber,1.5);for(let y of[-3,1,5])b.box(s*16,y,15,6,.9,.5,M.dark);}
   hull(b,[[0,-28],[7,-17],[8,15],[0,21],[-8,15],[-7,-17]],6,8,M.ivory,2);cockpit(b,0,-6,13,11,15);b.box(0,13,14,10,9,2,M.dark,1);b.glow(0,13,16.3,6,1.5,M.amber,1.4);decal(b,3,-21,12.7,2,6,M.red);
  }return b;
 }
 function enemy(type){const b=new Model();
  if(type==='seeker'){
   hull(b,[[-8,-12],[0,-19],[8,-12],[12,10],[0,17],[-12,10]],0,7,M.dark,1.4);for(let s of[-1,1]){hull(b,[[s*6,-8],[s*13,-12],[s*21,-1],[s*16,14],[s*10,9]],1,5,M.red,1);gun(b,s*14,-1,5,13);engine(b,s*7,11,0,5,9,M.pink);}hull(b,[[0,-16],[6,-5],[5,5],[0,8],[-5,5],[-6,-5]],7,3,M.ivory,.8);b.sphere(0,-5,10,3.1,M.pink,1.3,12,6,.5);
  }else if(type==='lancer'||type==='skater'||type==='fragment'){
   let color=type==='lancer'?M.red:M.purple;hull(b,[[0,-26],[7,-4],[6,16],[0,20],[-6,16],[-7,-4]],0,6,M.dark,1);for(let s of[-1,1]){hull(b,[[s*4,-3],[s*17,13],[s*16,20],[s*5,13]],1,4,color,1);b.glow(s*11,14,6,1.3,5,type==='lancer'?M.pink:M.lilac,1.8);}
   hull(b,[[0,-25],[4,-3],[3,12],[0,14],[-3,12],[-4,-3]],6,3,M.ivory,.8);engine(b,0,15,0,8,10,type==='lancer'?M.pink:M.lilac);b.glow(0,-3,9.1,2,7,type==='lancer'?M.pink:M.lilac,2);
  }else if(type==='gunner'){
   b.disc(0,0,0,17,6,M.dark,8,2);for(let s of[-1,1])for(let k of[-1,1]){b.box(s*14,k*12,3,12,7,5,M.gold,1,s*k*.6);b.glow(s*19,k*15,8,3,2,M.amber,1.8);}
   b.disc(0,0,6,11,7,M.steel,8,1);b.ring(0,0,13,8,2,.5,M.amber,24,0,Math.PI*2,1.3);for(let s of[-1,1])gun(b,s*6,-11,10,24);b.box(0,3,12,9,9,5,M.ivory,1);b.glow(0,-1,17,5,1.6,M.red,1.6);
  }else if(type==='brute'){
   b.disc(0,0,0,29,7,M.black,10,2);b.disc(0,0,7,21,8,M.steel,10,1);for(let i=0;i<6;i++){let a=i*Math.PI/3;let panel=new Model();panel.box(0,-25,8,15,9,8,M.gold,1.5);panel.glow(0,-29,16.2,8,1.3,M.amber,1.7);b.add(panel,matrix(0,0,0,a));}
   b.disc(0,0,15,12,4,M.black,16,1);b.sphere(0,0,19,8,M.pink,1.7,16,8,.5);for(let s of[-1,1])gun(b,s*15,-22,11,22);
  }else if(type==='splitter'){
   b.disc(0,0,0,16,7,M.black,6,1.5);for(let i=0;i<3;i++){let a=i*Math.PI*2/3;let panel=new Model();panel.box(0,-14,4,9,16,7,M.steel,1.3);panel.disc(0,-20,11,5,4,M.dark,12,1);panel.sphere(0,-20,15,3.4,M.green,2,12,6,.7);b.add(panel,matrix(0,0,0,a));}b.sphere(0,0,11,8,M.green,.9,12,8,.6);b.ring(0,0,12,11,1.5,1,M.ivory,20);
  }
  return b;
 }
 function boss(stage){const b=new Model(),accent=stage===1?M.pink:stage===2?M.lilac:M.amber,plate=stage===1?M.ivory:stage===2?M.purple:M.gold;
  if(stage===1){
   hull(b,[[-21,-50],[21,-50],[34,-13],[27,48],[0,66],[-27,48],[-34,-13]],0,17,M.dark,4);
   for(let s of[-1,1]){hull(b,[[s*25,-36],[s*56,-49],[s*75,-8],[s*71,49],[s*53,65],[s*40,28]],0,18,plate,4);hull(b,[[s*36,-26],[s*54,-35],[s*63,-3],[s*57,25],[s*47,22]],18,8,M.steel,2);engine(b,s*53,50,2,25,24,accent);for(let i=0;i<3;i++)gun(b,s*(37+i*11),-31+i*9,14,30);b.glow(s*58,9,27,3,26,accent,1.6);}
   hull(b,[[-15,-45],[15,-45],[20,-8],[15,35],[0,45],[-15,35],[-20,-8]],17,12,plate,3);b.disc(0,0,29,17,5,M.dark,20,2);b.sphere(0,0,34,12,accent,2.2,20,10,.8);b.ring(0,0,34,19,2,1,M.steel,40);engine(b,0,48,0,24,23,accent);
  } else if(stage===2){
   b.disc(0,0,0,48,15,M.dark,12,4);b.ring(0,0,13,41,12,7,M.steel,48);
   for(let i=0;i<3;i++){let a=i*Math.PI*2/3;let arm=new Model();hull(arm,[[-9,-27],[9,-27],[27,-62],[21,-85],[0,-94],[-21,-85],[-27,-62]],2,16,plate,4);hull(arm,[[-10,-47],[10,-47],[15,-68],[0,-79],[-15,-68]],18,10,M.ivory,2);gun(arm,-11,-78,21,33);gun(arm,11,-78,21,33);arm.glow(0,-62,28.3,5,13,accent,2);engine(arm,0,-40,0,15,15,accent);b.add(arm,matrix(0,0,0,a));}
   b.disc(0,0,17,28,12,M.black,12,2);b.ring(0,0,31,23,3,1,accent,40,0,Math.PI*2,2);b.sphere(0,0,30,17,accent,1.7,20,10,.55);
  }else{
   hull(b,[[0,-73],[20,-46],[35,12],[23,48],[0,74],[-23,48],[-35,12],[-20,-46]],0,20,M.black,4);
   for(let s of[-1,1]){hull(b,[[s*17,-41],[s*57,-61],[s*89,-31],[s*105,14],[s*90,49],[s*66,25],[s*40,53],[s*27,13]],5,20,plate,4);hull(b,[[s*31,-20],[s*60,-43],[s*76,-20],[s*84,12],[s*67,3],[s*47,30]],25,7,M.ivory,2);gun(b,s*50,-34,24,37);gun(b,s*73,0,24,32);engine(b,s*67,21,4,21,26,M.lilac);b.glow(s*41,-2,32.4,3,20,accent,2,s*-.3);}
   hull(b,[[0,-65],[14,-27],[19,13],[0,43],[-19,13],[-14,-27]],20,18,M.ivory,3);b.disc(0,0,38,16,4,M.black,8,1);b.sphere(0,0,44,11,accent,2.2,20,10,.65);b.ring(0,0,40,21,3,2,M.gold,32);engine(b,0,58,2,27,23,M.lilac);}
  return b;
 }
 function station(zone){const b=new Model(),cx=1200,cy=900;
  // Everything here lies below the flight plane; scenery never blocks or impersonates a collider.
  if(zone===0){
   b.ring(cx,cy,-165,510,220,52,M.dark,80);b.ring(cx,cy,-111,470,100,6,'#334c61',80);b.ring(cx,cy,-104,438,3,1,'#397e8a',96,0,Math.PI*2,.15);
   for(let i=0;i<16;i++){let a=i*Math.PI/8;let part=new Model();part.box(0,-508,0,90,182,24,'#263c4e',3);part.box(0,-462,24,69,69,10,'#49606e',3);for(let j=0;j<4;j++)part.box(-25+j*17,-462,34,7,52,3,M.black,.5);part.glow(-35,-436,30,7,8,M.cyan,.8);part.glow(35,-436,30,7,8,M.cyan,.8);part.box(0,-568,25,83,14,5,M.ivory,1);for(let j=-32;j<36;j+=12)part.box(j,-568,30,6,11,1,M.gold,0,.38);b.add(part,matrix(cx,cy,-110,a));}
   for(let i=0;i<4;i++){let a=i*Math.PI/2+.30;let part=new Model();part.box(0,-330,-28,92,380,26,'#1f3343',3);part.box(0,-343,0,64,300,8,'#4e6572',2);part.box(0,-341,9,4,278,2,M.gold);for(let y=-470;y<-205;y+=28)part.glow(0,y,13,7,9,M.amber,1.2);part.box(0,-201,6,110,45,20,M.dark,3);part.disc(0,-201,28,25,12,M.steel,16,2);part.ring(0,-201,42,19,3,1,M.cyan,32,0,Math.PI*2,1.6);b.add(part,matrix(cx,cy,-115,a));}
   b.ring(cx,cy,-121,225,18,10,M.steel,70);b.ring(cx,cy,-109,225,2,1,M.cyan,72,0,Math.PI*2,.6);
   // Smaller underflight deck islands have vents, hazards and machinery rather than a drawn grid.
   for(let[x,y]of[[-330,-80],[330,80],[-180,260],[180,-260]]){b.box(cx+x,cy+y,-157,154,108,28,'#263c4d',5,.18);b.box(cx+x,cy+y,-128,128,82,5,'#435664',2,.18);b.box(cx+x,cy+y,-122,54,48,10,M.dark,2);b.glow(cx+x-47,cy+y,-120,4,55,M.amber,1.1,.18);b.glow(cx+x+47,cy+y,-120,4,55,M.cyan,1.1,.18);}
  }else if(zone===1){
   // A kilometer-scale split capital ship drifts below the arena.
   let wreck=new Model();hull(wreck,[[-82,-620],[50,-610],[112,-290],[94,62],[64,140],[-68,162],[-120,63],[-110,-270]],-210,66,'#392f30',14);
   hull(wreck,[[-75,-606],[41,-592],[81,-278],[60,-80],[-80,-98],[-88,-275]],-144,22,'#6b5a4b',7);
   for(let s of[-1,1]){wreck.box(s*121,-224,-185,79,384,45,M.dark,8,s*.08);wreck.box(s*135,-243,-137,64,227,12,'#736552',5,s*.08);for(let j=0;j<5;j++){wreck.box(s*130,-330+j*40,-123,44,16,5,M.black,2);wreck.glow(s*101,-312+j*41,-132,3,14,M.amber,1.0);}}
   wreck.box(-17,-315,-119,73,116,42,M.steel,6);wreck.box(-17,-321,-75,51,57,12,M.black,3);for(let j=0;j<5;j++)wreck.glow(-37+j*10,-355,-72,5,7,M.cyan,.5);
   hull(wreck,[[-60,240],[94,236],[150,615],[66,706],[-135,602]],-220,66,'#342f33',10);for(let s of[-1,1]){engine(wreck,s*78,578,-152,75,170,M.amber);wreck.glow(s*40,312,-152,9,60,M.amber,1.1);}
   b.add(wreck,matrix(cx-85,cy+18,0,-.62));
   for(let i=0;i<31;i++){let a=i*2.399,r=100+(i%7)*95,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;let rock=new Model();let rr=16+(i%6)*8,pts=Array.from({length:7},(_,j)=>[Math.cos(j*Math.PI*2/7)*rr*(.8+.13*Math.sin(i+j)),Math.sin(j*Math.PI*2/7)*rr]);hull(rock,pts,0,rr*.9,i%2?'#504440':'#65594d',rr*.24);b.add(rock,matrix(x,y,-210-(i%5)*35,i*.7));}
  }else if(zone===2){
   for(let i=0;i<12;i++){let a=i*Math.PI/6+.25,r=350+(i%3)*95,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;let shard=new Model();hull(shard,[[0,-98],[24,-50],[36,50],[0,116],[-37,49],[-22,-60]],0,90,'#292438',6);hull(shard,[[0,-88],[12,-42],[18,34],[0,89],[-20,35],[-10,-40]],90,20,'#8b7c9a',3);shard.glow(0,0,111,3,118,M.lilac,1.5);b.add(shard,matrix(x,y,-210,a,1,1,1,.24));}
   b.ring(cx,cy,-230,280,40,28,'#34334b',80,0,Math.PI*1.55);b.ring(cx,cy,-200,280,5,3,M.lilac,80,0,Math.PI*1.55,1.2);b.ring(cx,cy,-235,520,56,32,'#32303e',96,.7,Math.PI*1.8);
  }else{
   for(let r of[225,425,635]){b.ring(cx,cy,-202,r,40,25,'#322b3d',96);b.ring(cx,cy,-175,r-10,4,1,M.gold,96);b.ring(cx,cy,-174,r+18,2,1,M.lilac,96,0,Math.PI*2,1.1);}
   for(let i=0;i<8;i++){let a=i*Math.PI/4;let arm=new Model();hull(arm,[[-24,-250],[24,-250],[42,-490],[87,-610],[73,-708],[-73,-708],[-87,-610],[-42,-490]],0,54,'#3b3040',7);hull(arm,[[-14,-328],[14,-328],[28,-507],[0,-583],[-28,-507]],54,18,'#81745e',4);arm.box(0,-620,54,76,58,33,M.dark,4);arm.disc(0,-620,89,25,7,M.gold,12,2);arm.sphere(0,-620,97,14,M.lilac,1.8,16,8,.5);arm.glow(0,-407,74,4,122,M.amber,1.3);b.add(arm,matrix(cx,cy,-177,a));}
  }
  // Flight-perimeter pylons, below the action plane, show arena boundaries in every biome.
  for(let side of[-1,1]){let y=cy+side*(cy-25);b.box(cx,y,-48,2340,14,12,M.dark,0);b.glow(cx,y,-35,2310,1.4,zone===1?M.amber:zone===2?M.lilac:M.cyan,.55);}
  for(let side of[-1,1]){let x=cx+side*(cx-25);b.box(x,cy,-48,14,1750,12,M.dark);b.glow(x,cy,-35,1.4,1720,zone===1?M.amber:zone===2?M.lilac:M.cyan,.55);}
  return b;
 }
 function hangar(){const b=new Model();b.disc(0,0,-28,145,12,'#203440',64,3);b.disc(0,0,-14,126,6,'#304753',64,2);b.ring(0,0,-6,111,2.5,1,M.cyan,80,0,Math.PI*2,.9);b.ring(0,0,-7,128,7,2,M.steel,80);for(let i=0;i<12;i++){let a=i*Math.PI/6;const part=new Model();part.box(0,-127,-4,16,26,5,M.dark,2);part.glow(0,-122,1.2,8,3,M.amber,1.2);b.add(part,matrix(0,0,0,a));}b.glow(0,0,-6,6,180,'#3e7a7f',.2);b.glow(0,0,-6,180,6,'#3e7a7f',.2);return b;}
 function build(engine){const shadow=new Model();shadow.face(Array.from({length:32},(_,i)=>[Math.cos(i*Math.PI/16),Math.sin(i*Math.PI/16),0]),'#000000');engine.mesh('softShadow',shadow);for(const id of['striker','ghost','bastion'])engine.mesh(id,ship(id));for(const id of['seeker','skater','gunner','brute','lancer','splitter','fragment'])engine.mesh(id,enemy(id));for(let stage=1;stage<=3;stage++)engine.mesh('boss'+stage,boss(stage));engine.mesh('hangar',hangar());
  let b=new Model();b.sphere(0,0,0,1,M.cyan,2,8,6);engine.mesh('boltCyan',b);b=new Model();b.sphere(0,0,0,1,M.amber,2,8,6);engine.mesh('boltGold',b);b=new Model();b.sphere(0,0,0,1,M.pink,2,8,6);engine.mesh('boltRed',b);
  b=new Model();b.box(0,0,0,8,8,5,M.steel,1.5,.785);b.glow(0,0,5.1,4.8,4.8,M.cyan,1.8,.785);engine.mesh('pickup',b);b=new Model();b.box(0,0,0,11,11,5,M.dark,2);b.glow(0,0,5.1,2.5,8,M.green,1.5);b.glow(0,0,5.2,8,2.5,M.green,1.5);engine.mesh('repair',b);
  b=new Model();b.ring(0,0,0,1,.08,.06,M.cyan,48,0,Math.PI*2,1.5);engine.mesh('shield',b);
  return engine;
 }
 return{build,station,ship,M};
})();
