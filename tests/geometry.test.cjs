const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, "../src/geometry.js"), "utf8"), context);
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
test("100 seeded questions preserve silhouettes and accept the complete answer", () => {
  const random = rng(3102026);
  let previous = -1;
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    const q = G.makeQuestion(previous, i, random);
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
  assert.equal(seen.size, 5);
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
