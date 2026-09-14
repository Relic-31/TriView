/* Canvas renderer. Kept separate from projection and exercise state. */
(function(root) {
"use strict";
const {PI,EPS,onArc}=root.TriView.Geometry;

class Renderer {
  constructor(canvas,details,onUnavailable=()=>{}) {
    this.canvas=canvas;
    this.details=details;
    this.onUnavailable=onUnavailable;
    this.ctx=null;
    try {this.ctx=canvas.getContext("2d");} catch(error) {console.warn(error);}
    this.question=null;
    this.pending=false;
    this.drag=null;
    this.resetCamera();
    this.bind();
  }
  resetCamera() {this.yaw=-.65;this.elevation=.5;this.zoom=1;}
  setQuestion(question) {this.question=question;this.drag=null;this.resetCamera();this.request();}
  setCamera(name) {
    const cameras={iso:[-.65,.5],front:[0,0],left:[-PI/2,0],top:[0,PI/2]};
    if(!cameras[name]) return;
    [this.yaw,this.elevation]=cameras[name];this.zoom=1;this.request();
  }
  camera(p) {
    const m=this.question.model;
    const x=p[0]-m.W/2,y=p[1]-m.D/2,z=p[2]-m.H/2;
    const c=Math.cos(this.yaw),s=Math.sin(this.yaw);
    const ce=Math.cos(this.elevation),se=Math.sin(this.elevation);
    const depth=s*x-c*y,scale=31*this.zoom;
    return [this.canvas.width/2+(c*x+s*y)*scale,
      this.canvas.height/2+(se*depth-ce*z)*scale,ce*depth+se*z];
  }
  request() {
    if(this.pending) return;
    this.pending=true;
    requestAnimationFrame(()=>{this.pending=false;this.render();});
  }
  render() {
    if(!this.details.open||!this.question) return;
    if(!this.ctx) {this.onUnavailable();return;}
    const W=this.canvas.width,H=this.canvas.height;
    const image=this.ctx.createImageData(W,H),pixels=image.data;
    const zbuffer=new Float32Array(W*H);zbuffer.fill(-Infinity);
    for(const triangle of this.question.mesh.tris) {
      const [a,b,c]=triangle.p.map(p=>this.camera(p)),n=triangle.n;
      const shade=.62+.38*Math.max(0,n[0]*-.35+n[1]*-.55+n[2]*.76);
      const color=[100*shade,157*shade,239*shade];
      const denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
      if(Math.abs(denominator)<EPS) continue;
      const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(W-1,Math.ceil(Math.max(a[0],b[0],c[0])));
      const y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(H-1,Math.ceil(Math.max(a[1],b[1],c[1])));
      for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) {
        const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/denominator;
        const v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/denominator;
        const w=1-u-v;
        if(u<-.00001||v<-.00001||w<-.00001) continue;
        const z=u*a[2]+v*b[2]+w*c[2],index=y*W+x;
        if(z<zbuffer[index]) continue;
        zbuffer[index]=z;
        pixels[index*4]=color[0];pixels[index*4+1]=color[1];
        pixels[index*4+2]=color[2];pixels[index*4+3]=255;
      }
    }
    const edge=(a3,b3)=>{
      const a=this.camera(a3),b=this.camera(b3);
      const steps=Math.max(1,Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])*1.5));
      for(let i=0;i<=steps;i++) {
        const t=i/steps,x=Math.round(a[0]+(b[0]-a[0])*t),y=Math.round(a[1]+(b[1]-a[1])*t),z=a[2]+(b[2]-a[2])*t;
        for(const [dx,dy] of [[0,0],[1,0],[0,1]]) {
          const xx=x+dx,yy=y+dy;
          if(xx<0||yy<0||xx>=W||yy>=H) continue;
          const index=yy*W+xx;
          if(z<zbuffer[index]-.06) continue;
          pixels[index*4]=34;pixels[index*4+1]=64;pixels[index*4+2]=107;pixels[index*4+3]=255;
        }
      }
    };
    for(const path of this.question.mesh.borders) for(let i=0;i<path.length-1;i++) edge(path[i],path[i+1]);
    const nx=Math.sin(this.yaw)*Math.cos(this.elevation),nz=Math.sin(this.elevation);
    if(Math.hypot(nx,nz)>.0001) {
      const angle=Math.atan2(-nx,nz);
      for(const sweep of this.question.mesh.sweeps) for(const s of sweep.loop) {
        if(s.k!=="arc") continue;
        for(const a of [angle,angle+PI]) if(onArc(a,s)) {
          const x=s.c[0]+s.r*Math.cos(a),z=s.c[1]+s.r*Math.sin(a);
          edge([x,sweep.y0,z],[x,sweep.y1,z]);
        }
      }
    }
    this.ctx.putImageData(image,0,0);
  }
  bind() {
    const canvas=this.canvas;
    this.details.addEventListener("toggle",()=>this.request());
    canvas.addEventListener("pointerdown",e=>{
      if(e.pointerType==="mouse"&&e.button!==0) return;
      canvas.focus({preventScroll:true});
      this.drag={x:e.clientX,y:e.clientY,id:e.pointerId};
      canvas.setPointerCapture(e.pointerId);canvas.classList.add("dragging");
    });
    canvas.addEventListener("pointermove",e=>{
      if(!this.drag||e.pointerId!==this.drag.id) return;
      this.yaw+=(e.clientX-this.drag.x)*.009;
      this.elevation=Math.max(-PI/2,Math.min(PI/2,this.elevation+(e.clientY-this.drag.y)*.009));
      this.drag.x=e.clientX;this.drag.y=e.clientY;this.request();
    });
    const end=e=>{
      if(canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      this.drag=null;canvas.classList.remove("dragging");
    };
    canvas.addEventListener("pointerup",end);canvas.addEventListener("pointercancel",end);
    canvas.addEventListener("wheel",e=>{
      e.preventDefault();this.zoom=Math.max(.7,Math.min(1.6,this.zoom*Math.exp(-e.deltaY*.001)));this.request();
    },{passive:false});
    canvas.addEventListener("keydown",e=>{
      const change={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]}[e.key];
      if(change) {
        e.preventDefault();this.yaw+=change[0];
        this.elevation=Math.max(-PI/2,Math.min(PI/2,this.elevation+change[1]));this.request();
      }
    });
  }
}
root.TriView.Renderer=Renderer;
})(globalThis);
