/* Reconstructed worksheet solids: lower surfaces allow portals and cantilevers. */
(function(root) {
"use strict";
const names=[
  "A1 · Diagonal pocket block","A2 · Two-level step","A3 · Twin inclined channels","A4 · Bevelled staircase",
  "A5 · Open V-channel bracket","A6 · Pyramid on a chamfered plinth","A7 · Notched bridge with a V-groove","A8 · Pyramid portal with a side ramp",
  "B1 · Corner-post tray","B2 · Faceted open trough","B3 · Pierced cantilever frame","B4 · Folded cantilever corner",
  "B5 · L-wall with a sloping cap","B6 · Slotted tray with a diagonal rib","B7 · Square collar on a chamfered footing","B8 · Three ribs on an upright",
  "C1 · Twin underpass stair bridge","C2 · Twin pyramidal towers","C3 · Slotted table with tapered webs","C4 · Stepped arch with a slanted underside",
  "C5 · Oblique portal","C6 · Nested recesses and a bevelled boss","C7 · Double-ridge portal","C8 · Raised frame with a diagonal web"
];
const constant=z=>()=>z;
const mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
/** Clip a convex XY polygon carrying top/bottom heights; plane is ax+by<=c. */
function clip(poly,plane) {
  const [a,b,c]=plane,out=[];
  for(let i=0;i<poly.length;i++) {
    const p=poly[i],q=poly[(i+1)%poly.length],dp=a*p[0]+b*p[1]-c,dq=a*q[0]+b*q[1]-c;
    if(dp<=1e-8)out.push(p);
    if(dp< -1e-8&&dq>1e-8||dp>1e-8&&dq< -1e-8)out.push(mix(p,q,dp/(dp-dq)));
  }
  return out;
}
function section(family,i,j) {
  let top=constant(1),bottom=constant(0),planes=[];
  if(family===0) {
    top=i===0||i===5||j===5?constant(5):(X,Y)=>1+.75*Y;
  } else if(family===1) {
    top=constant(j<3?2:4);
  } else if(family===2) {
    top=(i===1||i===4)&&j<4?(X,Y)=>1+Y:constant(5);
  } else if(family===3) {
    top=constant(j<2?2:j<4?4:6);
    bottom=j<2?(X,Y)=>1-.5*Y:constant(0);
  } else if(family===4) {
    top=i===0||i===5||j===5?constant(5):(X,Y)=>1+Math.abs(X-3)+.25*Y;
  } else if(family===5) {
    if(i>=1&&i<5&&j>=1&&j<5)top=(X,Y)=>6-Math.max(Math.abs(X-3),Math.abs(Y-3));
    planes=[[-1,-1,-1],[1,1,11]];
  } else if(family===6) {
    top=i===0||i===5||j>=4?constant(5):(X,Y)=>3+.5*Math.abs(X-3)+.25*Y;
    if(i===2||i===3)bottom=constant(2);
  } else if(family===7) {
    if(i<4&&j>=1&&j<5) {
      top=(X,Y)=>6-Math.max(Math.abs(X-2),Math.abs(Y-3));
      if(i===1||i===2)bottom=constant(2.5);
    } else if(i>=4&&j>=1&&j<5)top=(X,Y)=>7-X;
  } else if(family===8) {
    top=constant(i===0&&j===5?6:i===0||j===5?2:1);
  } else if(family===9) {
    if(i>=2&&i<4&&j<2)return null;
    bottom=(X,Y)=>.5*Math.abs(X-3);
    top=j>=4?constant(4):(X,Y)=>2+.5*Math.abs(X-3);
  } else if(family===10) {
    if(i>=2&&i<4&&j>=2&&j<4)return null;
    top=constant(5);bottom=constant(i===0||j===5?0:4);
  } else if(family===11) {
    if(i>=4&&j===0)return null;
    top=(X,Y)=>5-.5*Math.abs(X-Y);
    bottom=i===0||j===5?constant(0):(X,Y)=>5-.5*Math.abs(X-Y)-(j>=2&&(i===2||i===4)?2:1);
  } else if(family===12) {
    if(i>=2&&j<4)return null;
    top=i===0||j===5?(X,Y)=>6-.5*X-.25*Y:constant(3);
  } else if(family===13) {
    if((i===3||i===4)&&j===0)return null;
    top=i===0||j===5?constant(6):i===2&&j>=1?(X,Y)=>1+Y:constant(1);
  } else if(family===14) {
    if(i>=1&&i<5&&j>=1&&j<5&&(i===1||i===4||j===1||j===4))top=constant(4);
    planes=[[-1,-1,-1]];
  } else if(family===15) {
    top=j===5?constant(6):(i===0||i===2||i===4)?(X,Y)=>1+Y:constant(1);
  } else if(family===16) {
    top=constant(j<2?3:j<4?4:5);
    if(i===1||i===4)bottom=constant(2);
  } else if(family===17) {
    if(i>=1&&i<5&&j>=2&&j<4) {
      const center=i<3?2:4;
      top=(X,Y)=>5-2*Math.max(Math.abs(X-center),Math.abs(Y-3));
    }
  } else if(family===18) {
    if(i>=2&&i<4&&j>=2&&j<4)return null;
    top=constant(5);
    bottom=i===0||i===5?constant(0):j===1||j===4?(X,Y)=>1+.5*X:constant(4);
  } else if(family===19) {
    top=constant(i<2?3:i<4?4:5);
    if(i>=1&&i<5)bottom=(X,Y)=>1+.25*X;
  } else if(family===20) {
    top=(X,Y)=>6-.25*Y;
    if(i>=1&&i<5)bottom=(X,Y)=>2.5+.25*Y;
  } else if(family===21) {
    if(i>=1&&i<5&&j>=1&&j<5)top=constant(i>=2&&i<4&&j>=2&&j<4?1:3);
    if(i===4&&j===4)top=(X,Y)=>5-.5*(X-4)-.5*(Y-4);
    if(j===5)top=constant(4);
  } else if(family===22) {
    top=(X,Y)=>5-Math.min(Math.abs(X-2),Math.abs(X-4));
    if(i===2||i===3)bottom=constant(2);
  } else {
    top=constant(4);bottom=constant(i===0||j===5?0:3);
    if(i!==0&&i!==5&&j!==0&&j!==5)planes=[[1,-1,1],[-1,1,1]];
  }
  return {top,bottom,planes};
}
function makeModel(kind,random=Math.random) {
  const family=kind-25;
  const scaleX=random()<.5?.75:1,scaleY=random()<.5?.75:1,scaleZ=random()<.5?.75:1;
  const reverseX=random()<.5,reverseY=random()<.5,swap=random()<.5,cells=[];
  for(let i=0;i<6;i++)for(let j=0;j<6;j++) {
    const s=section(family,i,j);if(!s)continue;
    const points=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([x,y])=>[x,y,s.top(x,y),s.bottom(x,y)]);
    const mid=[s.top(i+.5,j+.5),s.bottom(i+.5,j+.5)];
    const error=(a,b)=>Math.abs((a[2]+b[2])/2-mid[0])+Math.abs((a[3]+b[3])/2-mid[1]);
    const triangles=error(points[0],points[2])<=error(points[1],points[3])+1e-8?[[0,1,2],[0,2,3]]:[[0,1,3],[1,2,3]];
    for(const tri of triangles) {
      let polygon=tri.map(n=>points[n]);
      for(const plane of s.planes)polygon=clip(polygon,plane);
      for(let k=1;k<polygon.length-1;k++) {
        let cell=[polygon[0],polygon[k],polygon[k+1]].map(([X,Y,hi,lo])=>{
          const x=(reverseX?6-X:X)*scaleX,y=(reverseY?6-Y:Y)*scaleY;
          return swap?[y,x,hi*scaleZ,lo*scaleZ]:[x,y,hi*scaleZ,lo*scaleZ];
        });
        if((Number(reverseX)+Number(reverseY)+Number(swap))&1)cell.reverse();
        cells.push(cell);
      }
    }
  }
  const model=root.TriView.Polyhedra.fromCells(cells,kind,names[family]);
  model.reference=family<8?"A"+(family+1):family<16?"B"+(family-7):null;
  return model;
}
root.TriView.Worksheets={names,makeModel};
})(globalThis);
