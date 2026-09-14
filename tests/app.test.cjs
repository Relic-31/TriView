// A simulated DOM checks application wiring and state transitions.
// It does not substitute for a real browser's SVG transforms or pointer capture.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const read = name => fs.readFileSync(path.join(__dirname,"..",name),"utf8");
class Element {
  constructor() {
    this.dataset={};this.handlers={};this.textContent="";this.innerHTML="";
    this.disabled=false;this.open=false;this.width=600;this.height=380;
    this.classList={add(){},remove(){},toggle(){}};
    this.captures=new Set();this.attributes={};
  }
  addEventListener(type,fn){(this.handlers[type] ||= []).push(fn);}
  emit(type,values={}) {
    const event={target:this,preventDefault(){},stopPropagation(){},pointerType:"mouse",button:0,pointerId:1,...values};
    for(const fn of this.handlers[type]||[])fn(event);
  }
  setAttribute(name,value){this.attributes[name]=value;}
  focus(){}
  matches(){return false;}
  setPointerCapture(id){this.captures.add(id);}
  hasPointerCapture(id){return this.captures.has(id);}
  releasePointerCapture(id){this.captures.delete(id);}
  getScreenCTM(){return {inverse(){return {};}};}
  createSVGPoint(){return {x:0,y:0,matrixTransform(){return {x:this.x,y:this.y};}};}
  getContext(){return {createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:image=>{this.image=image;}};}
}
function boot() {
  const html=read("index.html"),elements={},buttons=[];
  for(const match of html.matchAll(/id="([^"]+)"/g))elements[match[1]]=new Element();
  for(const match of html.matchAll(/data-(tool|shape|camera)="([^"]+)"/g)){
    const button=new Element();button.dataset[match[1]]=match[2];buttons.push(button);
  }
  const document=new Element();
  document.readyState="complete";
  document.getElementById=id=>elements[id]||null;
  document.querySelectorAll=selector=>buttons.filter(b=>selector.split(",").some(s=>{
    const match=s.match(/\[data-(\w+)\]/);return match&&b.dataset[match[1]]!==undefined;
  }));
  const timers=new Map(),frames=[],errors=[];
  let serial=0,q,renderer;
  const context=vm.createContext({document,console:{error:e=>errors.push(String(e)),warn(){}},
    setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id),
    requestAnimationFrame:fn=>frames.push(fn)});
  const scripts=[...html.matchAll(/<script defer src="([^"]+)"><\/script>/g)].map(m=>m[1]);
  assert.equal(scripts.join(","),"src/geometry.js,src/polyhedra.js,src/worksheets.js,src/renderer.js,src/app.js");
  vm.runInContext(read(scripts[0]),context);
  vm.runInContext(read(scripts[1]),context);
  vm.runInContext(read(scripts[2]),context);
  const G=context.TriView.Geometry,make=G.makeQuestion;
  // Deterministic generated questions, observed without changing production code.
  let seed=310;
  G.makeQuestion=(previous,number,unused,selectedKind)=>{
    q=make(previous,number,()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;},selectedKind);
    return q;
  };
  vm.runInContext(read(scripts[3]),context);
  const Base=context.TriView.Renderer;
  context.TriView.Renderer=class extends Base{constructor(...args){super(...args);renderer=this;}};
  vm.runInContext(read(scripts[4]),context);
  assert.equal(errors.length,0,errors.join("\n"));
  return {elements,buttons,context,errors,get q(){return q;},get renderer(){return renderer;},
    click:id=>elements[id].emit("click"),
    tool:(key,value)=>buttons.find(b=>b.dataset[key]===value).emit("click"),
    flushFrames:()=>{while(frames.length)frames.shift()();},
    flushTimers:()=>{const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());}};
}
function point(h,v,p,type){
  h.elements["view"+v].emit(type,{clientX:60+30*p[0],clientY:55+30*p[1]});
}
function tap(h,v,p){point(h,v,p,"pointerdown");point(h,v,p,"pointerup");}

test("page initializes, incorrect submission retries the same question",()=>{
  const h=boot(),q=h.q;
  assert.ok(h.elements.view0.innerHTML.includes("<line"));
  assert.equal(h.elements.modelDetails.open,false);
  h.click("check");
  assert.equal(q.state,"error");
  assert.equal(h.elements.check.disabled,true);
  h.click("reset");
  assert.equal(h.q,q);
  assert.equal(q.state,"drawing");
  assert.equal(q.ink.flat().length,0);
});
test("draw, erase and undo use the actual UI handlers",()=>{
  const h=boot();
  tap(h,0,[1,1]);tap(h,0,[3,1]);
  assert.equal(h.q.ink[0].length,1);
  h.tool("tool","erase");tap(h,0,[2,1]);
  assert.equal(h.q.ink[0].length,0);
  h.click("undo");
  assert.equal(h.q.ink[0].length,1);
  h.click("reset");
  assert.equal(h.q.ink.flat().length,0);
});
test("circle and arc input creates the selected stroke type",()=>{
  const h=boot();
  h.tool("shape","circle");h.tool("tool","dash");
  tap(h,0,[3,3]);tap(h,0,[4,3]);
  assert.equal(h.q.ink[0][0].type,"dash");
  assert.equal(h.q.ink[0][0].r,1);
  h.tool("shape","arc");
  tap(h,0,[3,3]);tap(h,0,[4,3]);tap(h,0,[2,3]);
  assert.ok(Math.abs(h.q.ink[0][1].d-Math.PI)<1e-6);
});
test("correct answer advances once and an old pointer gesture cannot leak into the next question",()=>{
  const h=boot(),old=h.q;
  old.ink=old.missing.map(list=>list.slice());
  point(h,0,[1,1],"pointerdown");
  h.click("check");h.click("check");
  assert.equal(old.state,"success");
  assert.equal(h.elements.solved.textContent,1);
  h.flushTimers();
  assert.notEqual(h.q,old);
  point(h,0,[3,1],"pointerup");
  assert.equal(h.q.ink.flat().length,0);
  assert.equal(h.elements.modelDetails.open,false);
});
test("3D reference rasterizes and camera responds to pointer and keyboard input",()=>{
  const h=boot(),canvas=h.elements.model;
  h.elements.modelDetails.open=true;
  h.flushFrames();
  assert.ok(canvas.image.data.some((value,index)=>index%4===3&&value===255));
  const yaw=h.renderer.yaw;
  canvas.emit("pointerdown",{clientX:20,clientY:20});
  canvas.emit("pointermove",{clientX:50,clientY:30});
  canvas.emit("pointerup",{});
  assert.notEqual(h.renderer.yaw,yaw);
  canvas.emit("keydown",{key:"ArrowLeft"});
  canvas.emit("wheel",{deltaY:-100});
  assert.ok(h.renderer.zoom>1);
  h.tool("camera","front");
  assert.equal(h.renderer.yaw,0);
  assert.equal(h.renderer.elevation,0);
});

test("interface, feedback and accessibility strings contain no Chinese text",()=>{
  const h=boot();
  const sources=["index.html","src/app.js","src/geometry.js","src/polyhedra.js","src/worksheets.js","src/renderer.js"];
  for(const file of sources)assert.ok(!/[\u3400-\u9fff]/u.test(read(file)),file);
  assert.ok(read("index.html").includes('lang="en"'));
  h.click("check");
  assert.ok(h.elements.status.textContent.startsWith("Not quite:"));
  h.click("reset");
  assert.ok(h.elements.status.textContent.startsWith("Same exercise."));
});

test("model picker switches exercises and keeps a selected reference after success",()=>{
  const h=boot();
  h.elements.modelFamily.value="35";
  h.elements.modelFamily.emit("change");
  const q=h.q;
  assert.equal(q.model.reference,"B3");
  assert.equal(h.elements.modelName.textContent,q.model.name);
  q.ink=q.missing.map(list=>list.slice());
  h.click("check");
  assert.equal(q.state,"success");
  h.flushTimers();
  assert.notEqual(h.q,q);
  assert.equal(h.q.model.reference,"B3");
  assert.equal(h.elements.modelDetails.open,false);
});
test("changing the model clears an old success timer and returns error state to drawing",()=>{
  const h=boot();
  h.click("check");
  assert.equal(h.q.state,"error");
  h.elements.modelFamily.value="30";h.elements.modelFamily.emit("change");
  assert.equal(h.q.state,"drawing");
  h.q.ink=h.q.missing.map(list=>list.slice());h.click("check");
  h.elements.modelFamily.value="48";h.elements.modelFamily.emit("change");
  const selected=h.q;
  h.flushTimers();
  assert.equal(h.q,selected);
  assert.equal(selected.model.kind,48);
});
