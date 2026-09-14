/* Piecewise planar solids with ramps, notches and irregular footprints. */
(function(root) {
"use strict";
const G=root.TriView.Geometry,EPS=1e-7;
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
const key=p=>p.map(x=>Math.round(x*1e6)/1e6).join(",");
const edgeKey=(a,b)=>[key(a),key(b)].sort().join("|");
const names=["Offset ramp","Forked wedge","Corner-cut terrace","Diagonal saddle","Twin ramp channels","Notched slope","Oblique roof","Stepped rib","Chamfered block staircase","C-shaped twin braces","Corner ramp cradle","Four corner towers","Offset chair block","Folded ramp basin","Uneven courtyard","Dogleg staircase","Cross buttresses","Twin towers with a saddle","Chamfered stair crown","Spiral terraces"];

/** Cells are CCW triangles in x/y with a linear top height at each vertex. */
function fromCells(cells,kind=5,name="Planar solid") {
  const tris=[],sides=new Map();
  function triangle(a,b,c,normal) {
    let n=cross(sub(b,a),sub(c,a)),length=Math.hypot(...n);
    if(length<EPS)return;
    if(normal&&dot(n,normal)<0)[b,c]=[c,b];
    n=normal||n.map(x=>x/length);
    tris.push({p:[a,b,c],n});
  }
  for(const cell of cells) {
    const top=cell.map(p=>p.slice()),bottom=cell.map(p=>[p[0],p[1],0]);
    triangle(...top);triangle(bottom[2],bottom[1],bottom[0],[0,0,-1]);
    for(let i=0;i<3;i++) {
      const a=top[i],b=top[(i+1)%3],k=edgeKey(a.slice(0,2),b.slice(0,2));
      if(!sides.has(k))sides.set(k,[]);
      sides.get(k).push({a,b});
    }
  }
  for(const pair of sides.values()) {
    for(let side=0;side<pair.length;side++) {
      const {a,b}=pair[side],other=pair[1-side];
      const lo=other?[other.b[2],other.a[2]]:[0,0];
      const delta=[a[2]-lo[0],b[2]-lo[1]],cuts=[0,1];
      if(delta[0]*delta[1]<-EPS)cuts.push(delta[0]/(delta[0]-delta[1]));
      cuts.sort((x,y)=>x-y);
      const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),n=[dy/length,-dx/length,0];
      for(let i=0;i<cuts.length-1;i++) {
        const t0=cuts[i],t1=cuts[i+1],mid=(t0+t1)/2;
        if(delta[0]+(delta[1]-delta[0])*mid<EPS)continue;
        const p=mix(a,b,t0),q=mix(a,b,t1);
        const r=[q[0],q[1],lo[0]+(lo[1]-lo[0])*t1];
        const s=[p[0],p[1],lo[0]+(lo[1]-lo[0])*t0];
        triangle(p,q,r,n);triangle(p,r,s,n);
      }
    }
  }
  // Split at T-junctions before removing coplanar triangle/cell seams.
  const vertices=[...new Map(tris.flatMap(t=>t.p).map(p=>[key(p),p])).values()],edges=new Map();
  for(const t of tris)for(let i=0;i<3;i++) {
    const a=t.p[i],b=t.p[(i+1)%3],d=sub(b,a),length2=dot(d,d);
    const cuts=[0,1];
    for(const p of vertices) {
      const ap=sub(p,a),u=dot(ap,d)/length2;
      if(u>EPS&&u<1-EPS&&Math.hypot(...cross(ap,d))<EPS*Math.sqrt(length2))cuts.push(u);
    }
    const ticks=[...new Set(cuts.map(x=>Math.round(x*1e8)/1e8))].sort((x,y)=>x-y);
    for(let j=0;j<ticks.length-1;j++) {
      if(ticks[j+1]-ticks[j]<EPS)continue;
      const p=mix(a,b,ticks[j]),q=mix(a,b,ticks[j+1]),k=edgeKey(p,q);
      if(!edges.has(k))edges.set(k,{a:p,b:q,normals:[]});
      edges.get(k).normals.push(t.n);
    }
  }
  const borders=[...edges.values()].filter(e=>e.normals.length===1||
    e.normals.some(n=>dot(n,e.normals[0])<.99999)).map(e=>[e.a,e.b]);
  const max=axis=>Math.max(...vertices.map(p=>p[axis]));
  return {kind,name,W:max(0),D:max(1),H:max(2),mesh:{tris,borders,sweeps:[]},planar:true};
}
function makeModel(kind,random=Math.random) {
  if(kind>=13) return makeBlockModel(kind,random);
  const family=kind-5,base=1+Math.floor(random()*3)*.5,high=4+Math.floor(random()*3);
  const reverseX=random()<.5,reverseY=random()<.5,diagonal=random()<.5;
  const ramp=(y)=>base+(high-base)*y/6;
  const cells=[];
  for(let i=0;i<4;i++)for(let j=0;j<3;j++) {
    const x=i*2,y=j*2;
    const corners=[[x,y],[x+2,y],[x+2,y+2],[x,y+2]];
    const triangles=(diagonal||family===2||family===6)?[[0,1,3],[1,2,3]]:[[0,1,2],[0,2,3]];
    for(const indices of triangles) {
      const p=indices.map(n=>corners[n]),cx=p.reduce((s,v)=>s+v[0],0)/3,cy=p.reduce((s,v)=>s+v[1],0)/3;
      let height;
      if(family===0) { // L-shaped base and an offset sloping boss.
        if(i===0&&j===0)continue;
        height=(X,Y)=>i>=2&&j>=1?base+(high-base)*(Y-2)/4:base;
      } else if(family===1) { // A fork, with two upright shoulders and a ramp between.
        if(i===1&&j===0)continue;
        height=(X,Y)=>j===2?(i===0||i===3?high:base+1):ramp(Y);
      } else if(family===2) { // Beveled base corner, oblique upper terrace.
        if(cx+cy<2)continue;
        height=(X,Y)=>i>=1&&j>=1?high-.25*(X-2)-.25*(6-Y):base;
      } else if(family===3) { // Two non-parallel slopes meet at a terrace.
        height=(X,Y)=>i<2?base+(high-base)*X/4:j===0?base:high-(high-base)*(Y-2)/4;
      } else if(family===4) { // Parallel ramp walls with a recessed central channel.
        height=(X,Y)=>i===1||i===2?base:base+(high-base)*Y/6;
      } else if(family===5) { // Side cutout and a broad chamfered roof.
        if(i===3&&j===1)continue;
        height=(X,Y)=>j===2?high:base+(high-base)*X/8;
      } else if(family===6) { // Irregular hexagonal footprint with a skewed roof.
        if(cx+cy<2||cx+cy>12)continue;
        height=(X,Y)=>i===0&&j===2?base:high-X*.25-(6-Y)*.25;
      } else { // Raised rib, side platform and triangular support.
        if(i===0&&j===0)continue;
        height=(X,Y)=>j===2?high:i===2?base+(high-base)*Y/4:i===3?base+1:base;
      }
      const cell=p.map(([X,Y])=>[reverseX?8-X:X,reverseY?6-Y:Y,height(X,Y)]);
      if(reverseX!==reverseY)cell.reverse();
      cells.push(cell);
    }
  }
  return fromCells(cells,kind,names[family]);
}

/** Worksheet-inspired 3-by-3 blocks. Cell heights and sloping faces vary together. */
function makeBlockModel(kind,random) {
  const family=kind-13,base=1+Math.floor(random()*3)*.5,high=4+Math.floor(random()*3);
  const step=(high-base)/2,unitX=1.5+.5*Math.floor(random()*2),unitY=1.5+.5*Math.floor(random()*2);
  const reverseX=random()<.5,reverseY=random()<.5,swap=random()<.5;
  const cells=[];
  for(let i=0;i<3;i++)for(let j=0;j<3;j++) {
    const corners=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]];
    // A diagonal corner cut uses x+y=constant; folded roofs use x-y=constant.
    const triangles=family===10?[[0,1,3],[1,2,3]]:[[0,1,2],[0,2,3]];
    for(const indices of triangles) {
      const points=indices.map(n=>corners[n]);
      const cx=points.reduce((sum,p)=>sum+p[0],0)/3,cy=points.reduce((sum,p)=>sum+p[1],0)/3;
      let height;
      if(family===0) { // Six-cell stair footprint with a chamfered upper step.
        if(i>j)continue;
        height=(X,Y)=>i===0?base+j*step:i===1&&j===2?high-step*(X-1):base;
      } else if(family===1) { // A C-shaped plan with two sloping arms.
        if(i>0&&j===1)continue;
        height=(X,Y)=>i===0?high:high-step*(X-1);
      } else if(family===2) { // Two perpendicular ramps meet at the high rear corner.
        height=(X,Y)=>i===0&&j===2?high:i===0?base+step*Y:j===2?high-step*(X-1):base;
      } else if(family===3) { // Four equal towers connected by a low base.
        height=()=>i!==1&&j!==1?high:base;
      } else if(family===4) { // A notched chair-shaped block with two front bevels.
        if(i===2&&j===0)continue;
        height=(X,Y)=>j===2?high:j===1?(i===1?base:base+step):i===0?base+step*Y:base+step*(2-X);
      } else if(family===5) { // Folded diagonal basin with a raised corner shoulder.
        height=(X,Y)=>i===0&&j===2?high:i===0?base+step*Y:j===2?high-step*(X-1):base+step*Math.max(0,Y-X+1);
      } else if(family===6) { // Unequal towers and short ramps around a recessed court.
        const levels=[[2,0,1],[0,0,0],[1,0,2]];
        height=(X,Y)=>i===0&&j===1?base+step*(2-Y):i===1&&j===2?base+step*(X-1):base+step*levels[j][i];
      } else if(family===7) { // A dogleg footprint with three levels and a ramp.
        if(i===2&&j===0||i===0&&j===2)continue;
        height=(X,Y)=>i===1&&j===1?base+step*Y:base+step*j;
      } else if(family===8) { // A central boss supported by four triangular ribs.
        height=(X,Y)=>i===1&&j===1?high:i===1?(j===0?base+2*step*Y:high-2*step*(Y-2)):
          j===1?(i===0?base+2*step*X:high-2*step*(X-2)):base;
      } else if(family===9) { // Opposite towers border a diagonal V-shaped saddle.
        height=(X,Y)=>i===0&&j===2||i===2&&j===0?high:base+step*Math.abs(X-Y);
      } else if(family===10) { // Cut opposite plan corners and slope the upper crown.
        if(cx+cy<1||cx+cy>5)continue;
        height=(X,Y)=>i===2||j===2?high-.5*(6-X-Y):base+step*Math.max(i,j);
      } else { // Staggered terraces spiral around a low central square.
        const levels=[[0,0,1],[1,0,1],[1,2,2]];
        height=(X,Y)=>i===1&&j===0?base+step*(X-1):i===2&&j===1?base+step*Y:
          i===1&&j===2?base+step*X:base+step*levels[j][i];
      }
      let cell=points.map(([X,Y])=>{
        const x=(reverseX?3-X:X)*unitX,y=(reverseY?3-Y:Y)*unitY,z=height(X,Y);
        return swap?[y,x,z]:[x,y,z];
      });
      if((Number(reverseX)+Number(reverseY)+Number(swap))&1)cell.reverse();
      cells.push(cell);
    }
  }
  return fromCells(cells,kind,names[kind-5]);
}

function project(m,p,v) {
  const [x,y,z]=p;
  return v===0?[x,m.H-z,-y]:v===1?[m.D-y,m.H-z,-x]:[x,m.D-y,z];
}
function cross2(a,b){return a[0]*b[1]-a[1]*b[0];}
function projection(m,v) {
  const triangles=m.mesh.tris.map(t=>t.p.map(p=>project(m,p,v))).filter(([a,b,c])=>Math.abs(cross2(sub(b,a),sub(c,a)))>EPS);
  function depth(p) {
    let max=-Infinity;
    for(const [a,b,c] of triangles) {
      const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),den=cross2(ab,ac);
      const u=cross2(ap,ac)/den,w=cross2(ab,ap)/den;
      if(u>=-EPS&&w>=-EPS&&u+w<=1+EPS)max=Math.max(max,a[2]+u*ab[2]+w*ac[2]);
    }
    return max;
  }
  const lines=[];
  for(const path of m.mesh.borders) {
    const a=project(m,path[0],v),b=project(m,path[1],v),d=sub(b,a),length=Math.hypot(d[0],d[1]);
    if(length<EPS)continue;
    const cuts=[0,1];
    for(const tri of triangles)for(let i=0;i<3;i++) {
      const c=tri[i],e=sub(tri[(i+1)%3],c),ca=sub(c,a),den=cross2(d,e);
      if(Math.abs(den)>EPS) {
        const t=cross2(ca,e)/den,u=cross2(ca,d)/den;
        if(t>EPS&&t<1-EPS&&u>=-EPS&&u<=1+EPS)cuts.push(t);
      } else if(Math.abs(cross2(ca,d))<EPS) {
        for(const p of [c,tri[(i+1)%3]]) {
          const t=((p[0]-a[0])*d[0]+(p[1]-a[1])*d[1])/(length*length);
          if(t>EPS&&t<1-EPS)cuts.push(t);
        }
      }
    }
    const ticks=[...new Set(cuts.map(t=>Math.round(t*1e8)/1e8))].sort((x,y)=>x-y);
    for(let i=0;i<ticks.length-1;i++) {
      const start=ticks[i],end=ticks[i+1];if((end-start)*length<1e-5)continue;
      const p=mix(a,b,(start+end)/2),delta=.0001;
      const left=depth([p[0]-d[1]/length*delta,p[1]+d[0]/length*delta]);
      const right=depth([p[0]+d[1]/length*delta,p[1]-d[0]/length*delta]);
      lines.push({a:mix(a,b,start).slice(0,2),b:mix(a,b,end).slice(0,2),
        type:p[2]>=depth(p)-.0001?"solid":"dash",protect:!Number.isFinite(left)||!Number.isFinite(right)});
    }
  }
  return G.mergeLines(lines);
}
root.TriView.Polyhedra={names,fromCells,makeModel,projection};
})(globalThis);
