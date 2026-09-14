/* UI orchestration. geometry.js and renderer.js load first via defer. */
(function() {
"use strict";
function start() {
  const $=id=>document.getElementById(id);
  try {
    if(!globalThis.TriView?.Geometry||!globalThis.TriView?.Polyhedra||!globalThis.TriView?.Renderer)
      throw new Error("Some app files did not load. Keep the src folder intact and reload the page.");
    const {PI,TAU,EPS,ln,ar,pt,round,mod,distance,grade,makeQuestion}=TriView.Geometry;
    const svgs=[0,1,2].map(v=>$("view"+v));
    const SCALE=30,OX=60,OY=55,sx=x=>OX+x*SCALE,sy=y=>OY+y*SCALE;
    let q=null,tool="solid",shape="line",clockwise=true;
    let points=[],active=-1,hover=null,completed=0,number=0,previousKind=-1,nextTimer=null;
    let cursors=[[0,0],[0,0],[0,0]];
    function message(text,kind=""){$("status").textContent=text;$("status").className=kind;}
    const renderer=new TriView.Renderer($("model"),$("modelDetails"),()=>{
      message("This browser cannot display the 3D canvas. Try a modern browser.");
    });
    function shapeSVG(e,color,width=2,opacity=1) {
      const attrs='fill="none" stroke="'+color+'" stroke-width="'+width+'" opacity="'+opacity+'"'+
        (e.type==="dash"?' stroke-dasharray="7 5"':"");
      if(e.k==="line") return '<line x1="'+sx(e.a[0])+'" y1="'+sy(e.a[1])+'" x2="'+sx(e.b[0])+'" y2="'+sy(e.b[1])+'" '+attrs+'/>';
      if(Math.abs(e.d)>=TAU-EPS) return '<circle cx="'+sx(e.c[0])+'" cy="'+sy(e.c[1])+'" r="'+e.r*SCALE+'" '+attrs+'/>';
      const a=pt(e,0),b=pt(e,1);
      return '<path d="M '+sx(a[0])+' '+sy(a[1])+' A '+e.r*SCALE+' '+e.r*SCALE+' 0 '+
        (Math.abs(e.d)>PI?1:0)+' '+(e.d>0?1:0)+' '+sx(b[0])+' '+sy(b[1])+'" '+attrs+'/>';
    }
    function makeStroke(selected,preview=false) {
      if(shape==="line") {
        if(selected.length<2) return null;
        const a=selected[0],b=selected[1];
        return Math.hypot(a[0]-b[0],a[1]-b[1])>.1?{...ln(a,b),type:tool}:null;
      }
      if(selected.length<2) return null;
      const center=selected[0],first=selected[1];
      const radius=Math.hypot(first[0]-center[0],first[1]-center[1]);
      if(radius<.2) return null;
      if(shape==="circle") return {...ar(center,radius,0,TAU),type:tool};
      if(selected.length<3) return null;
      const end=selected[2],radius2=Math.hypot(end[0]-center[0],end[1]-center[1]);
      if(Math.abs(radius-radius2)>.12) {
        if(!preview) message("The arc start and end must be on the same circle.");
        return null;
      }
      const a=Math.atan2(first[1]-center[1],first[0]-center[0]),b=Math.atan2(end[1]-center[1],end[0]-center[0]);
      const delta=clockwise?mod(b-a):-mod(a-b);
      return Math.abs(delta)>.01?{...ar(center,radius,a,delta),type:tool}:null;
    }
    function render() {
      if(!q) return;
      for(let v=0;v<3;v++) {
        const width=v===1?q.model.D:q.model.W,height=v===2?q.model.D:q.model.H;
        let html="";
        for(let i=0;i<=width*2;i++) {
          const x=i/2;
          html+='<line x1="'+sx(x)+'" y1="'+sy(0)+'" x2="'+sx(x)+'" y2="'+sy(height)+'" stroke="'+(i%2?"#eef2f8":"#dfe7f2")+'" stroke-width=".7"/>';
        }
        for(let i=0;i<=height*2;i++) {
          const y=i/2;
          html+='<line x1="'+sx(0)+'" y1="'+sy(y)+'" x2="'+sx(width)+'" y2="'+sy(y)+'" stroke="'+(i%2?"#eef2f8":"#dfe7f2")+'" stroke-width=".7"/>';
        }
        const originals=q.base[v].slice().sort((a,b)=>(a.type==="solid")-(b.type==="solid"));
        for(const e of originals) html+=shapeSVG(e,"#263549",e.type==="dash"?1.4:2.1);
        q.ink[v].forEach((e,index)=>{
          let color="#245bea";
          if(q.state==="success") color="#168163";
          if(q.state==="error") color=q.result.bad[v][index]?"#d43845":"#168163";
          html+=shapeSVG(e,color,2.4);
        });
        if(q.state==="drawing"&&active===v) {
          if(hover?.v===v&&tool!=="erase") {
            const preview=makeStroke([...points,hover.p],true);
            if(preview) html+=shapeSVG(preview,"#245bea",2,.45);
          }
          points.forEach((p,index)=>{
            const label=shape==="line"?["A","B"][index]:["C","A","B"][index];
            html+='<circle cx="'+sx(p[0])+'" cy="'+sy(p[1])+'" r="4" fill="white" stroke="#245bea" stroke-width="1.8"/>'+
              '<text x="'+(sx(p[0])+7)+'" y="'+(sy(p[1])-7)+'" font-size="10" fill="#245bea">'+label+'</text>';
          });
        }
        if(q.state==="drawing"&&hover?.v===v) html+='<circle cx="'+sx(hover.p[0])+'" cy="'+sy(hover.p[1])+
          '" r="3.5" fill="'+(tool==="erase"?"#d43845":"#245bea")+'" opacity=".6"/>';
        const note=hover?.v===v?"Position "+hover.p.map(round).join(" , "):"All views use the same scale";
        html+='<text x="180" y="273" text-anchor="middle" fill="#8190a5" font-size="10">'+note+'</text>';
        svgs[v].innerHTML=html;
      }
      $("undo").disabled=q.state!=="drawing"||!q.history.length;
      $("check").disabled=q.state!=="drawing";
      $("reset").disabled=q.state==="success";
      $("reset").textContent=q.state==="error"?"Try again":"Clear lines";
      document.querySelectorAll("[data-tool],[data-shape]").forEach(b=>b.disabled=q.state!=="drawing");
      $("arcDirection").disabled=q.state!=="drawing";
    }
    function cancel(){points=[];active=-1;}
    function chooseTool(value) {
      if(q&&q.state!=="drawing") return;
      tool=value;cancel();
      document.querySelectorAll("[data-tool]").forEach(button=>{
        const on=button.dataset.tool===tool;
        button.classList.toggle("active",on);button.setAttribute("aria-pressed",String(on));
      });
      render();
    }
    function saveHistory(){q.history.push(q.ink.map(list=>list.slice()));if(q.history.length>80)q.history.shift();}
    function commit(v,e) {
      if(q.state!=="drawing") return;
      saveHistory();q.ink[v].push(e);cancel();
      message("Line added. Continue drawing or check your answer.");render();
    }
    function choose(v,p) {
      if(q.state!=="drawing") return;
      if(tool==="erase") {
        let index=-1;
        for(let i=q.ink[v].length-1;i>=0;i--) if(distance(p,q.ink[v][i])<.24){index=i;break;}
        if(index>=0){saveHistory();q.ink[v].splice(index,1);message("Your stroke was erased.");}
        else message("Click one of your own strokes. Original lines cannot be erased.");
        render();return;
      }
      if(active!==v){cancel();active=v;}
      points.push(p.slice());
      const required=shape==="arc"?3:2;
      if(points.length===required) {
        const stroke=makeStroke(points);
        if(stroke) commit(v,stroke);
        else {
          points.pop();
          message(shape==="arc"?"Choose a different endpoint on the same circle.":"Choose a point different from the start.");
        }
      } else message(shape==="line"?"Choose the endpoint.":points.length===1
        ?"Center selected. Choose a point on the circle.":"Arc start selected. Choose the endpoint and check the direction.");
      render();
    }
    function eventPoint(svg,event,snap=true) {
      const matrix=svg.getScreenCTM();if(!matrix)return null;
      const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
      const local=point.matrixTransform(matrix.inverse()),v=svgs.indexOf(svg);
      const width=v===1?q.model.D:q.model.W,height=v===2?q.model.D:q.model.H;
      let x=(local.x-OX)/SCALE,y=(local.y-OY)/SCALE;
      if(x<-.25||y<-.25||x>width+.25||y>height+.25)return null;
      if(snap){x=Math.round(x*4)/4;y=Math.round(y*4)/4;}
      return [Math.max(0,Math.min(width,x)),Math.max(0,Math.min(height,y))];
    }
    svgs.forEach((svg,v)=>{
      let down=null;
      svg.addEventListener("pointerdown",event=>{
        if(q.state!=="drawing"||(event.pointerType==="mouse"&&event.button!==0))return;
        const p=eventPoint(svg,event,tool!=="erase");if(!p)return;
        event.preventDefault();svg.focus({preventScroll:true});
        down={p,id:event.pointerId,question:q};svg.setPointerCapture(event.pointerId);
      });
      svg.addEventListener("pointermove",event=>{
        if(q.state!=="drawing")return;
        const p=eventPoint(svg,event,tool!=="erase");hover=p?{v,p}:null;
        if(down&&down.question===q&&p&&shape!=="arc"&&tool!=="erase"&&Math.hypot(p[0]-down.p[0],p[1]-down.p[1])>.1)
          {active=v;points=[down.p];}
        render();
      });
      svg.addEventListener("pointerup",event=>{
        if(!down||down.id!==event.pointerId)return;
        const press=down;down=null;
        if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);
        if(press.question!==q||q.state!=="drawing")return;
        const a=press.p,b=eventPoint(svg,event,tool!=="erase");
        if(!b){cancel();render();return;}
        if(shape!=="arc"&&tool!=="erase"&&Math.hypot(a[0]-b[0],a[1]-b[1])>.1) {
          const stroke=makeStroke([a,b]);if(stroke)commit(v,stroke);
        } else choose(v,b);
      });
      svg.addEventListener("pointercancel",()=>{down=null;cancel();hover=null;render();});
      svg.addEventListener("pointerleave",()=>{if(!down){hover=null;render();}});
      svg.addEventListener("keydown",event=>{
        if(q.state!=="drawing")return;
        const deltas={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
        if(deltas[event.key]) {
          event.preventDefault();
          const bounds=[v===1?q.model.D:q.model.W,v===2?q.model.D:q.model.H];
          cursors[v]=cursors[v].map((n,i)=>Math.max(0,Math.min(bounds[i],n+deltas[event.key][i]*(event.shiftKey?1:.25))));
          hover={v,p:cursors[v]};render();
        } else if(event.key===" "||event.key==="Enter") {
          event.preventDefault();event.stopPropagation();choose(v,cursors[v]);
        }
      });
    });
    document.querySelectorAll("[data-tool]").forEach(button=>button.addEventListener("click",()=>chooseTool(button.dataset.tool)));
    document.querySelectorAll("[data-shape]").forEach(button=>button.addEventListener("click",()=>{
      if(q.state!=="drawing")return;
      shape=button.dataset.shape;cancel();
      document.querySelectorAll("[data-shape]").forEach(target=>{
        const on=target===button;target.classList.toggle("active",on);target.setAttribute("aria-pressed",String(on));
      });
      $("arcDirection").hidden=shape!=="arc";
      if(tool==="erase")chooseTool("solid");render();
    }));
    $("arcDirection").addEventListener("click",()=>{
      if(q.state!=="drawing")return;
      clockwise=!clockwise;$("arcDirection").textContent=clockwise?"Clockwise ↻":"Counterclockwise ↺";render();
    });
    function undo() {
      if(q.state!=="drawing"||!q.history.length)return;
      q.ink=q.history.pop();cancel();message("Undone.");render();
    }
    $("undo").addEventListener("click",undo);
    $("reset").addEventListener("click",()=>{
      if(q.state==="success")return;
      q.ink=[[],[],[]];q.history=[];q.state="drawing";q.result=null;cancel();
      message("Same exercise. Try drawing the missing lines again.");render();
    });
    $("check").addEventListener("click",()=>{
      if(q.state!=="drawing")return;
      cancel();q.result=grade(q.full,q.missing,q.ink);
      if(q.result.ok) {
        q.state="success";$("solved").textContent=++completed;
        message("Correct! Loading the next exercise...","success");nextTimer=setTimeout(newQuestion,1400);
      } else {
        q.state="error";const reasons=[];
        if(q.result.absent)reasons.push("some lines are still missing");if(q.result.wrong)reasons.push("incorrect line type");if(q.result.extra)reasons.push("extra lines");
        message("Not quite: "+reasons.join(", ")+". Click Try again to retry.","error");
      }
      render();
    });
    document.addEventListener("keydown",event=>{
      if(event.target.matches("input,textarea,select"))return;
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z"){event.preventDefault();undo();return;}
      if(event.ctrlKey||event.metaKey||event.altKey)return;
      if(event.key==="1")chooseTool("solid");if(event.key==="2")chooseTool("dash");if(event.key.toLowerCase()==="e")chooseTool("erase");
      if(event.key==="Escape"){cancel();hover=null;render();}
    });
    document.querySelectorAll("[data-camera]").forEach(button=>button.addEventListener("click",()=>renderer.setCamera(button.dataset.camera)));
    function newQuestion() {
      clearTimeout(nextTimer);q=makeQuestion(previousKind,number);previousKind=q.model.kind;number++;
      cancel();hover=null;cursors=[[0,0],[0,0],[0,0]];
      $("questionNo").textContent="Exercise "+String(number).padStart(2,"0");
      $("missingLabel").textContent="Missing: "+q.count+" line(s)";
      $("modelDetails").open=false;renderer.setQuestion(q);chooseTool("solid");
      message("Outlines are complete. Restore the missing internal edges or hidden lines.");render();
    }
    newQuestion();
  } catch(error) {
    console.error(error);
    const status=$("status");
    if(status){status.className="error";status.textContent="Unable to start: "+error.message;}
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})();
