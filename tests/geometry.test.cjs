const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, "../src/geometry.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../src/polyhedra.js"), "utf8"), context);
const G = context.TriView.Geometry;
const empty = () => [[], [], []];
function rng(seed) { return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }

test("plain cuboid has exactly four solid silhouette edges in every view", () => {
  const outer = G.poly([[0,0],[8,0],[8,6],[0,6]]);
  const m = {W:8,H:6,D:4,outer,outerPoly:G.flatten(outer),layers:[{y0:0,y1:4,holes:[],polys:[]}]};
  for (let v = 0; v < 3; v++) {
    const lines = G.projection(m, v);
    assert.equal(lines.length, 4);
    assert.ok(lines.every(e => e.type === "solid" && e.protect));
  }
});
test("rear counterbore rings are hidden; front counterbore rings are visible", () => {
  const front = G.makeModel(0, () => .8);
  const rear = G.makeModel(0, () => .2);
  const rings = m => G.projection(m, 0).filter(e => e.k === "arc");
  assert.ok(rings(front).every(e => e.type === "solid"));
  const rearRings = rings(rear);
  assert.equal(rearRings.filter(e => e.type === "dash").length, 2);
  assert.equal(rearRings.filter(e => e.type === "solid").length, 2);
});
test("100 seeded questions across every family preserve silhouettes and accept the complete answer", () => {
  const random = rng(3102026);
  let previous = -1;
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    // Cycle through all families once, then exercise unrestricted seeded selection.
    let selection = true;
    const q = G.makeQuestion(previous, i, () => {
      if (selection) { selection = false; if (i < 5 + context.TriView.Polyhedra.names.length) return 0; }
      return random();
    });
    assert.notEqual(q.model.kind, previous);
    previous = q.model.kind;
    seen.add(previous);
    assert.ok(q.count === 1 || q.count === 2);
    assert.equal(q.missing.flat().length, q.count);
    for (let v = 0; v < 3; v++) {
      assert.ok(q.missing[v].every(e => !e.protect));
      assert.ok(q.full[v].filter(e => e.protect).every(e => q.base[v].includes(e)));
      assert.equal(q.base[v].length + q.missing[v].length, q.full[v].length);
      assert.ok(q.full[v].flatMap(e => G.sample(e, .25)).flat().every(Number.isFinite));
    }
    assert.equal(G.grade(q.full, q.missing, q.missing).ok, true);
    assert.equal(G.grade(q.full, q.missing, empty()).ok, false);
    assert.ok(q.mesh.tris.flatMap(t => [...t.p.flat(), ...t.n]).every(Number.isFinite));
  }
  assert.equal(seen.size, 5 + context.TriView.Polyhedra.names.length);
});
test("grading accepts split lines and reverse drawing direction", () => {
  const line = {...G.ln([0,0],[4,0]),type:"dash"};
  const arc = {...G.ar([2,2],1,0,Math.PI),type:"solid"};
  const full = [[line,arc],[],[]];
  const ink = [[{...G.ln([4,0],[2,0]),type:"dash"},{...G.ln([0,0],[2,0]),type:"dash"},
    {...G.ar([2,2],1,Math.PI,-Math.PI),type:"solid"}],[],[]];
  assert.equal(G.grade(full,full,ink).ok,true);
});
test("grading rejects wrong line type, displaced lines and incomplete arcs", () => {
  const line = {...G.ln([0,0],[4,0]),type:"dash"};
  const full = [[line],[],[]];
  assert.equal(G.grade(full,full,[[{...line,type:"solid"}],[],[]]).wrong,true);
  assert.equal(G.grade(full,full,[[{...G.ln([0,1],[4,1]),type:"dash"}],[],[]]).extra,true);
  const circle = {...G.ar([2,2],1,0,G.TAU),type:"solid"};
  assert.equal(G.grade([[circle],[],[]],[[circle],[],[]],[[{...circle,d:Math.PI}],[],[]]).absent,true);
});
test("rounded profile mesh leaves the capsule opening out of the front cap", () => {
  const m = G.makeModel(4, () => .2); // rear counterbore => small front opening
  const mesh = G.meshModel(m);
  const cap = mesh.tris.filter(t => t.p.every(p => p[1] === 0));
  const area = cap.reduce((sum,t) => {
    const [a,b,c] = t.p;
    return sum + Math.abs((b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]))/2;
  },0);
  // Rounded rectangle: 44 + pi; capsule: 4 + pi => material area 40.
  assert.ok(Math.abs(area-40)<.02, "cap area " + area);
  assert.ok(!cap.some(t => {
    const [a,b,c] = t.p;
    const x=(a[0]+b[0]+c[0])/3,z=(a[2]+b[2]+c[2])/3;
    const dx=Math.max(0,Math.abs(x-4)-1);
    return dx*dx+(z-3)*(z-3)<.98*.98;
  }));
});

function rectangleCells(x0,y0,x1,y1,height) {
  const a=[x0,y0,height(x0,y0)],b=[x1,y0,height(x1,y0)];
  const c=[x1,y1,height(x1,y1)],d=[x0,y1,height(x0,y1)];
  return [[a,b,c],[a,c,d]];
}
test("planar wedge has a trapezoidal side, no triangle seams and the correct volume",()=>{
  const m=context.TriView.Polyhedra.fromCells(rectangleCells(0,0,4,4,(x,y)=>1+y));
  const side=G.projection(m,1),top=G.projection(m,2),front=G.projection(m,0);
  assert.equal(side.length,4);
  assert.ok(side.every(e=>e.type==="solid"&&e.protect));
  assert.ok(side.some(e=>Math.abs(e.a[0]-e.b[0])>3.9&&Math.abs(e.a[1]-e.b[1])>3.9));
  assert.equal(top.length,4);
  assert.ok(top.every(e=>e.protect));
  assert.equal(front.length,5);
  assert.equal(front.filter(e=>!e.protect&&e.type==="solid").length,1);
  const volume=m.mesh.tris.reduce((sum,{p:[a,b,c]})=>sum+
    (a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6,0);
  assert.ok(Math.abs(volume-48)<1e-6,"wedge volume "+volume);
});
test("a front terrace is visible; the same terrace behind a taller block is dashed",()=>{
  const cells=[...rectangleCells(0,0,4,2,()=>1),...rectangleCells(0,2,4,4,()=>3)];
  const front=context.TriView.Polyhedra.fromCells(cells);
  const back=context.TriView.Polyhedra.fromCells(cells.map(t=>t.map(([x,y,z])=>[x,4-y,z]).reverse()));
  const edge=m=>G.projection(m,0).find(e=>Math.abs(e.a[1]-2)<1e-6&&Math.abs(e.b[1]-2)<1e-6);
  assert.equal(edge(front).type,"solid");
  assert.equal(edge(back).type,"dash");
  assert.equal(edge(front).protect,false);
  assert.equal(edge(back).protect,false);
});
test("irregular plan cuts retain their diagonal silhouette",()=>{
  for(const kind of [7,11]) {
    const m=G.makeModel(kind,()=>.8);
    const top=G.projection(m,2);
    const diagonals=top.filter(e=>Math.abs(e.a[0]-e.b[0])>.1&&Math.abs(e.a[1]-e.b[1])>.1);
    assert.ok(diagonals.length>0);
    assert.ok(diagonals.every(e=>e.protect&&e.type==="solid"));
  }
});
test("all planar families have positive material and drawable missing lines",()=>{
  const random=rng(42131);
  for(let kind=5;kind<5+context.TriView.Polyhedra.names.length;kind++)for(let variant=0;variant<12;variant++) {
    const m=G.makeModel(kind,random);
    assert.ok(m.mesh.tris.flatMap(t=>t.p).every(p=>p[2]>=-1e-6));
    const full=[0,1,2].map(v=>G.projection(m,v));
    const choices=full.flat().filter(e=>!e.protect&&G.curveLength(e)>.5&&
      [...e.a,...e.b].every(n=>Math.abs(n*4-Math.round(n*4))<.001));
    assert.ok(choices.length>0,"no drawable omissions for "+kind);
  }
});

function solidVolume(m) {
  return m.mesh.tris.reduce((sum,{p:[a,b,c]})=>sum+
    (a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6,0);
}
test("worksheet staircase and open C braces have the expected material volume",()=>{
  const staircase=G.makeModel(13,()=>.99),braces=G.makeModel(14,()=>.99);
  // Six 2x2 cells: heights 2, 4, 2, 6, a 6-to-4 ramp, and 2.
  assert.ok(Math.abs(solidVolume(staircase)-84)<1e-6);
  // 2x6x6 spine + two 4x2 ramps with mean height 4.
  assert.ok(Math.abs(solidVolume(braces)-136)<1e-6);
  const bottomArea=braces.mesh.tris.filter(t=>t.n[2]<-.99).reduce((sum,{p:[a,b,c]})=>
    sum+Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2,0);
  assert.ok(Math.abs(bottomArea-28)<1e-6); // C plan: 36 minus an 8-unit opening.
});
test("four corner towers preserve a U-shaped silhouette in both elevation views",()=>{
  const m=G.makeModel(16,()=>.99);
  const outline=G.poly([[0,6],[6,6],[6,0],[4,0],[4,4],[2,4],[2,0],[0,0]]);
  for(const view of [0,1]) {
    const projected=G.projection(m,view),silhouette=projected.filter(e=>e.protect);
    assert.equal(silhouette.length,8);
    assert.ok(silhouette.every(e=>e.type==="solid"));
    for(const line of outline)for(const p of G.sample(line,.2))
      assert.ok(silhouette.some(e=>G.distance(p,e)<1e-5));
    assert.equal(projected.filter(e=>e.type==="dash").length,2);
  }
  assert.ok(Math.abs(solidVolume(m)-136)<1e-6); // Base plus four corner posts.
});
