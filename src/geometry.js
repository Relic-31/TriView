/* TriView geometry: x = width, y = back, z = height. */
(function(root) {
"use strict";
const PI=Math.PI, TAU=2*PI, EPS=1e-6;
const ln=(a,b)=>({k:"line",a,b});
const ar=(c,r,a,d)=>({k:"arc",c,r,a,d});
const near=(a,b,e=1e-5)=>Math.abs(a-b)<e;
const mod=a=>(a%TAU+TAU)%TAU;
const round=n=>Math.round(n*1e5)/1e5;

function pt(s,t) {
  if(s.k==="line") return s.a.map((v,i)=>v+(s.b[i]-v)*t);
  return [s.c[0]+s.r*Math.cos(s.a+s.d*t),s.c[1]+s.r*Math.sin(s.a+s.d*t)];
}
function onArc(a,s) {
  return Math.abs(s.d)>=TAU-EPS ||
    (s.d>0?mod(a-s.a):mod(s.a-a))<=Math.abs(s.d)+EPS;
}
const poly=p=>p.map((a,i)=>ln(a,p[(i+1)%p.length]));
const circle=(x,z,r)=>[ar([x,z],r,0,TAU)];
function capsule(x,z,l,r) {
  return [ln([x-l,z-r],[x+l,z-r]),ar([x+l,z],r,-PI/2,PI),
    ln([x+l,z+r],[x-l,z+r]),ar([x-l,z],r,PI/2,PI)];
}
function rounded(w,h,r) {
  return [ln([r,0],[w-r,0]),ar([w-r,r],r,-PI/2,PI/2),
    ln([w,r],[w,h-r]),ar([w-r,h-r],r,0,PI/2),
    ln([w-r,h],[r,h]),ar([r,h-r],r,PI/2,PI/2),
    ln([0,h-r],[0,r]),ar([r,r],r,PI,PI/2)];
}
function flatten(loop) {
  const points=[];
  for(const s of loop) {
    const n=s.k==="line"?1:Math.ceil(Math.abs(s.d)/(PI/48));
    for(let i=0;i<n;i++) points.push(pt(s,i/n));
  }
  return points;
}
function mirrored(loop,w) {
  return loop.map(s=>s.k==="line"
    ? ln([w-s.a[0],s.a[1]],[w-s.b[0],s.b[1]])
    : ar([w-s.c[0],s.c[1]],s.r,PI-s.a,-s.d));
}

/** Five extruded profiles; nested holes in two depth layers form counterbores. */
function makeModel(kind,random=Math.random) {
  if(kind>=5) return root.TriView.Polyhedra.makeModel(kind,random);
  const pick=n=>Math.floor(random()*n), W=8,H=6,D=3+pick(3);
  let outer,small,big;
  const c=.5+.5*pick(3),r=.75+.25*pick(2);
  if(kind===0) {
    outer=poly([[0,c],[c,0],[W-c,0],[W,c],[W,H-c],[W-c,H],[c,H],[0,H-c]]);
    small=[circle(2.5,3,r),circle(5.5,3,r)];
    big=[circle(2.5,3,r+.25),circle(5.5,3,r+.25)];
  } else if(kind===1) {
    outer=[ln([0,0],[8,0]),ln([8,0],[8,2]),ar([4,2],4,0,PI),ln([0,2],[0,0])];
    small=[circle(4,2.75,1.25)];big=[circle(4,2.75,1.75)];
  } else if(kind===2) {
    outer=[ln([0,0],[8,0]),ln([8,0],[8,6]),ln([8,6],[6,6]),
      ar([4,6],2,0,-PI),ln([2,6],[0,6]),ln([0,6],[0,0])];
    small=[circle(1.25,2,.5),circle(6.75,2,.5)];
    big=[circle(1.25,2,.75),circle(6.75,2,.75)];
  } else if(kind===3) {
    outer=poly([[0,0],[8,0],[8,2],[6,2],[6,5],[5,6],[1,6],[0,5]]);
    small=[circle(3,3,1)];big=[circle(3,3,1.5)];
  } else {
    outer=rounded(W,H,1);
    small=[capsule(4,3,1,1)];big=[capsule(4,3,1,1.5)];
  }
  if(random()<.5) {
    outer=mirrored(outer,W);
    small=small.map(l=>mirrored(l,W));big=big.map(l=>mirrored(l,W));
  }
  const depth=.75+.25*pick(4),rear=random()<.5,cut=rear?D-depth:depth;
  const layers=rear
    ? [{y0:0,y1:cut,holes:small},{y0:cut,y1:D,holes:big}]
    : [{y0:0,y1:cut,holes:big},{y0:cut,y1:D,holes:small}];
  const m={W,H,D,kind,outer,layers,small,big,cut};
  m.outerPoly=flatten(outer);
  m.layers.forEach(l=>l.polys=l.holes.map(flatten));
  return m;
}
function intersections(polygons,value,axis) {
  const hits=[];
  for(const p of polygons) for(let i=0;i<p.length;i++) {
    const a=p[i],b=p[(i+1)%p.length];
    if((a[axis]>value)===(b[axis]>value)) continue;
    const t=(value-a[axis])/(b[axis]-a[axis]);
    hits.push(a[1-axis]+t*(b[1-axis]-a[1-axis]));
  }
  return hits.sort((a,b)=>a-b);
}
function inside(p,x,z) {
  const hits=intersections([p],z,1);
  for(let i=0;i+1<hits.length;i+=2) if(x>hits[i]&&x<hits[i+1]) return true;
  return false;
}
function project(m,p,v) {
  const [x,y,z]=p;
  return v===0?[x,m.H-z,-y]:v===1?[m.D-y,m.H-z,-x]:[x,m.D-y,z];
}
function depthAt(m,v,u,w) {
  if(v===0) {
    const x=u,z=m.H-w;
    if(!inside(m.outerPoly,x,z)) return -Infinity;
    for(const l of m.layers) if(!l.polys.some(p=>inside(p,x,z))) return -l.y0;
    return -Infinity;
  }
  const y=v===1?m.D-u:m.D-w;
  if(y<0||y>=m.D) return -Infinity;
  const layer=m.layers.find(l=>y>=l.y0&&y<l.y1);
  if(!layer) return -Infinity;
  const polygons=[m.outerPoly,...layer.polys];
  const hits=v===1?intersections(polygons,m.H-w,1):intersections(polygons,u,0);
  if(hits.length<2) return -Infinity;
  return v===1?-hits[0]:hits[hits.length-1];
}
function visible(m,v,a,b,p) {
  const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
  if(len<EPS) return "solid";
  const nx=-dy/len*.012,ny=dx/len*.012;
  const nearest=Math.min(depthAt(m,v,p[0]+nx,p[1]+ny),depthAt(m,v,p[0]-nx,p[1]-ny));
  return p[2]>=nearest-.003?"solid":"dash";
}
function isProtected(m,v,a,b,outer) {
  if(v===0) return outer;
  const w=v===1?m.D:m.W,h=v===1?m.H:m.D;
  return (near(a[0],b[0])&&(near(a[0],0)||near(a[0],w))) ||
    (near(a[1],b[1])&&(near(a[1],0)||near(a[1],h)));
}
function tangent(s,t) {
  if(s.k==="line") return [s.b[0]-s.a[0],s.b[1]-s.a[1]];
  const a=s.a+s.d*t;return [-Math.sin(a)*s.d,Math.cos(a)*s.d];
}
/** Smooth tangent joins are not physical seams. Add view-dependent silhouette generators. */
function generators(loop,angles) {
  const points=[];
  for(let i=0;i<loop.length;i++) {
    const s=loop[i],next=loop[(i+1)%loop.length],a=tangent(s,1),b=tangent(next,0);
    const cosine=(a[0]*b[0]+a[1]*b[1])/(Math.hypot(...a)*Math.hypot(...b));
    if(cosine<.99999) points.push(pt(s,1));
    if(s.k==="arc") for(const angle of angles) if(onArc(angle,s))
      points.push([s.c[0]+s.r*Math.cos(angle),s.c[1]+s.r*Math.sin(angle)]);
  }
  return points;
}
/** Merge collinear projected intervals, giving visible lines precedence. */
function mergeLines(raw) {
  const groups=new Map(),out=[];
  for(const e of raw) {
    let dx=e.b[0]-e.a[0],dy=e.b[1]-e.a[1];const len=Math.hypot(dx,dy);
    if(len<EPS) continue;dx/=len;dy/=len;
    if(dx<-EPS||(Math.abs(dx)<EPS&&dy<0)){dx=-dx;dy=-dy;}
    const offset=-dy*e.a[0]+dx*e.a[1];
    const k=[round(dx),round(dy),round(offset)].join(",");
    if(!groups.has(k)) groups.set(k,{dx,dy,offset,items:[]});
    const t1=dx*e.a[0]+dy*e.a[1],t2=dx*e.b[0]+dy*e.b[1];
    groups.get(k).items.push({...e,lo:Math.min(t1,t2),hi:Math.max(t1,t2)});
  }
  for(const g of groups.values()) {
    const ticks=[...new Set(g.items.flatMap(e=>[round(e.lo),round(e.hi)]))].sort((a,b)=>a-b);
    const chunks=[];
    for(let i=0;i<ticks.length-1;i++) {
      const lo=ticks[i],hi=ticks[i+1],mid=(lo+hi)/2;
      if(hi-lo<EPS) continue;
      const cover=g.items.filter(e=>e.lo<mid+EPS&&e.hi>mid-EPS);
      if(!cover.length) continue;
      const type=cover.some(e=>e.type==="solid")?"solid":"dash";
      const protect=cover.some(e=>e.protect),last=chunks[chunks.length-1];
      if(last&&last.type===type&&last.protect===protect&&near(last.hi,lo)) last.hi=hi;
      else chunks.push({lo,hi,type,protect});
    }
    const p=t=>[round(g.dx*t-g.dy*g.offset),round(g.dy*t+g.dx*g.offset)];
    for(const c of chunks) out.push({k:"line",a:p(c.lo),b:p(c.hi),type:c.type,protect:c.protect});
  }
  return out;
}
function projection(m,v) {
  if(m.planar) return root.TriView.Polyhedra.projection(m,v);
  const lines=[],arcs=new Map();
  function addLine(a3,b3,outer) {
    const a=project(m,a3,v),b=project(m,b3,v);
    if(Math.hypot(a[0]-b[0],a[1]-b[1])<EPS) return;
    const middle=a3.map((n,i)=>(n+b3[i])/2);
    lines.push({a:a.slice(0,2),b:b.slice(0,2),
      type:visible(m,v,a,b,project(m,middle,v)),protect:isProtected(m,v,a,b,outer)});
  }
  function cap(loop,y,outer) {
    for(const s of loop) {
      if(s.k==="line") {addLine([s.a[0],y,s.a[1]],[s.b[0],y,s.b[1]],outer);continue;}
      if(v===0) {
        const a3=pt(s,.49),b3=pt(s,.51),mid=pt(s,.5);
        const a=project(m,[a3[0],y,a3[1]],v),b=project(m,[b3[0],y,b3[1]],v);
        const type=visible(m,v,a,b,project(m,[mid[0],y,mid[1]],v));
        const e={k:"arc",c:[s.c[0],m.H-s.c[1]],r:s.r,a:-s.a,d:-s.d,type,protect:outer};
        const full=Math.abs(s.d)>=TAU-EPS;
        const ends=[pt(e,0),pt(e,1)].map(p=>p.map(round).join(",")).sort();
        const k=[...e.c.map(round),round(e.r),full?"full":ends.join("|")+"|"+pt(e,.5).map(round)].join(":");
        if(!arcs.has(k)||type==="solid") arcs.set(k,e);
      } else {
        const count=Math.ceil(Math.abs(s.d)/(PI/48));
        for(let i=0;i<count;i++) {
          const a=pt(s,i/count),b=pt(s,(i+1)/count);
          addLine([a[0],y,a[1]],[b[0],y,b[1]],outer);
        }
      }
    }
  }
  const angles=v===1?[PI/2,3*PI/2]:v===2?[0,PI]:[];
  function sweep(loop,y0,y1,outer) {
    for(const p of generators(loop,angles)) addLine([p[0],y0,p[1]],[p[0],y1,p[1]],outer);
  }
  cap(m.outer,0,true);cap(m.outer,m.D,true);sweep(m.outer,0,m.D,true);
  for(const layer of m.layers) for(const hole of layer.holes) {
    cap(hole,layer.y0,false);cap(hole,layer.y1,false);sweep(hole,layer.y0,layer.y1,false);
  }
  return [...mergeLines(lines),...arcs.values()];
}
function curveLength(e) {
  return e.k==="line"?Math.hypot(e.b[0]-e.a[0],e.b[1]-e.a[1]):Math.abs(e.d)*e.r;
}
function sample(e,step=.055) {
  const n=Math.max(2,Math.ceil(curveLength(e)/step));
  return Array.from({length:n+1},(_,i)=>pt(e,i/n));
}
function segmentDistance(p,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],squared=dx*dx+dy*dy;
  const t=squared?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/squared)):0;
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}
function distance(p,e) {
  if(e.k==="line") return segmentDistance(p,e.a,e.b);
  const angle=Math.atan2(p[1]-e.c[1],p[0]-e.c[0]);
  if(onArc(angle,e)) return Math.abs(Math.hypot(p[0]-e.c[0],p[1]-e.c[1])-e.r);
  const a=pt(e,0),b=pt(e,1);
  return Math.min(Math.hypot(p[0]-a[0],p[1]-a[1]),Math.hypot(p[0]-b[0],p[1]-b[1]));
}
/** Compare geometric coverage, not stroke count or drawing direction. */
function grade(full,missing,ink) {
  const tolerance=.065;let absent=false,wrong=false,extra=false;
  const bad=ink.map((list,v)=>list.map(e=>{
    let invalid=false;
    for(const p of sample(e)) {
      const close=full[v].filter(t=>distance(p,t)<tolerance);
      if(!close.length){extra=true;invalid=true;}
      else if(!close.some(t=>t.type===e.type)){wrong=true;invalid=true;}
    }
    return invalid;
  }));
  for(let v=0;v<3;v++) for(const e of missing[v]) for(const p of sample(e)) {
    if(!ink[v].some(t=>t.type===e.type&&distance(p,t)<tolerance)){absent=true;break;}
  }
  return {ok:!absent&&!wrong&&!extra,absent,wrong,extra,bad};
}

/** Scanline-triangulated caps respect holes; curved walls use polygonal approximation. */
function meshModel(m) {
  if(m.planar) return m.mesh;
  const tris=[],borders=[],sweeps=[];
  function tri(a,b,c,n){tris.push({p:[a,b,c],n});}
  function cap(loops,y,normal) {
    const polygons=loops.map(flatten);
    const edges=polygons.flatMap(p=>p.map((a,i)=>({a,b:p[(i+1)%p.length]})));
    const heights=[...new Set(polygons.flat().map(p=>round(p[1])))].sort((a,b)=>a-b);
    function at(edge,z){const {a,b}=edge;return a[0]+(z-a[1])*(b[0]-a[0])/(b[1]-a[1]);}
    for(let i=0;i<heights.length-1;i++) {
      const z0=heights[i],z1=heights[i+1],mid=(z0+z1)/2;
      if(z1-z0<EPS) continue;
      const hits=edges.filter(e=>(e.a[1]>mid)!==(e.b[1]>mid)).sort((a,b)=>at(a,mid)-at(b,mid));
      for(let j=0;j+1<hits.length;j+=2) {
        const left=hits[j],right=hits[j+1];
        const a=[at(left,z0),y,z0],b=[at(right,z0),y,z0],c=[at(right,z1),y,z1],d=[at(left,z1),y,z1];
        tri(a,b,c,normal);tri(a,c,d,normal);
      }
    }
  }
  function wall(loop,y0,y1,hole) {
    const points=flatten(loop);
    const area=points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a[0]*b[1]-b[0]*a[1];},0);
    const sign=Math.sign(area)*(hole?-1:1);
    for(let i=0;i<points.length;i++) {
      const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
      if(len<EPS) continue;
      const normal=[sign*dz/len,0,-sign*dx/len];
      const p=[a[0],y0,a[1]],q=[b[0],y0,b[1]],r=[b[0],y1,b[1]],s=[a[0],y1,a[1]];
      tri(p,q,r,normal);tri(p,r,s,normal);
    }
    for(const y of [y0,y1]) for(const e of loop) borders.push(sample(e,.05).map(p=>[p[0],y,p[1]]));
    for(const p of generators(loop,[])) borders.push([[p[0],y0,p[1]],[p[0],y1,p[1]]]);
    sweeps.push({loop,y0,y1});
  }
  cap([m.outer,...m.layers[0].holes],0,[0,-1,0]);
  cap([m.outer,...m.layers[1].holes],m.D,[0,1,0]);
  const frontBig=m.layers[0].holes===m.big;
  for(let i=0;i<m.big.length;i++) cap([m.big[i],m.small[i]],m.cut,[0,frontBig?-1:1,0]);
  wall(m.outer,0,m.D,false);
  for(const layer of m.layers) for(const hole of layer.holes) wall(hole,layer.y0,layer.y1,true);
  return {tris,borders,sweeps};
}
function shuffle(list,random=Math.random) {
  const a=list.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function makeQuestion(previousKind=-1,number=0,random=Math.random) {
  const kind=previousKind<0?5:(previousKind+1+Math.floor(random()*12))%13;
  const model=makeModel(kind,random),full=[0,1,2].map(v=>projection(model,v));
  const candidates=shuffle(full.flatMap((list,v)=>list.filter(e=>!e.protect&&curveLength(e)>.5&&
    (e.k!=="line"||[...e.a,...e.b].every(n=>Math.abs(n*4-Math.round(n*4))<.001))).map(e=>({e,v}))),random);
  if(!candidates.length) throw new Error("No suitable missing lines were found. Please refresh to try again.");
  const count=Math.min(candidates.length,1+Math.floor(random()*2));
  const first=number%3!==2?candidates.find(t=>t.e.k==="arc")||candidates[0]:candidates[0];
  const chosen=[first];
  if(count===2) chosen.push(candidates.find(t=>t!==first&&t.v!==first.v)||candidates.find(t=>t!==first));
  const missing=full.map((_,v)=>chosen.filter(t=>t.v===v).map(t=>t.e));
  const base=full.map((list,v)=>list.filter(e=>!missing[v].includes(e)));
  return {model,mesh:meshModel(model),full,base,missing,count:chosen.length,
    ink:[[],[],[]],history:[],state:"drawing",result:null};
}
root.TriView=root.TriView||{};
root.TriView.Geometry={PI,TAU,EPS,ln,ar,pt,onArc,round,mod,poly,circle,capsule,rounded,
  flatten,generators,makeModel,projection,mergeLines,curveLength,sample,distance,grade,meshModel,makeQuestion};
})(globalThis);
