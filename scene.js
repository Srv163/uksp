(() => {
  'use strict';
  const canvas=document.getElementById('asset-canvas');
  const stage=document.getElementById('object-stage');
  const motion=document.getElementById('motion-toggle');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
  const phases=[
    {caption:'За внешними ограничениями ищем реальную ценность.',layer:'Юридическая сложность',core:'Реальный актив',gap:.29,offset:.09,turn:0},
    {caption:'Проверяем права, обязательства и экономику.',layer:'Права и обязательства',core:'Проверенная экономика',gap:.54,offset:.31,turn:.19},
    {caption:'Связываем юридическую работу со сценарием сделки.',layer:'Структура сделки',core:'Обеспечение и расчёты',gap:.08,offset:0,turn:.42},
    {caption:'Выход определяется устройством конкретного актива.',layer:'Продажа / Аренда / ЦФА',core:'Сценарий реализации',gap:.17,offset:.14,turn:.77}
  ];
  let phase=0,paused=reduced.matches,manualUntil=0,autoAt=performance.now(),visible=true;
  function selectPhase(i,manual=false){phase=i;document.querySelector('.hero-stage').dataset.phase=String(i);document.querySelectorAll('[data-phase] button');document.querySelectorAll('.phase-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.phase)===i)));document.getElementById('phase-count').innerHTML=`0${i+1}<span>/ 04</span>`;document.getElementById('phase-caption').textContent=phases[i].caption;document.getElementById('layer-label').textContent=phases[i].layer;document.getElementById('core-label').textContent=phases[i].core;if(manual)manualUntil=performance.now()+18000;autoAt=performance.now();}
  document.querySelectorAll('.phase-tabs button').forEach(b=>b.addEventListener('click',()=>selectPhase(Number(b.dataset.phase),true)));
  function setMotion(){motion.textContent=paused?'▷':'Ⅱ';motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Возобновить движение модели':'Приостановить движение модели');}
  motion.addEventListener('click',()=>{paused=!paused;autoAt=performance.now();setMotion();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;setMotion();});setMotion();
  if(!gl){stage.classList.add('no-webgl');motion.hidden=true;return;}
  const vertex=`attribute vec3 position;attribute vec3 normal;uniform mat4 model;uniform mat4 vp;varying vec3 N;varying vec3 P;void main(){vec4 world=model*vec4(position,1.0);P=world.xyz;N=normalize(mat3(model)*normal);gl_Position=vp*world;}`;
  const fragment=`precision highp float;varying vec3 N;varying vec3 P;uniform vec3 eye;uniform vec3 color;uniform float metal;uniform float glow;uniform float alpha;void main(){vec3 n=normalize(N);vec3 v=normalize(eye-P);vec3 l=normalize(vec3(-3.0,6.0,4.0));vec3 r=reflect(-v,n);float diff=max(dot(n,l),0.0);float rim=pow(1.0-max(dot(n,v),0.0),3.0);float key=pow(max(dot(r,normalize(vec3(-.7,1.0,.9))),0.0),17.0);float strip=pow(max(dot(r,normalize(vec3(1.0,.9,-.9))),0.0),35.0);float sky=smoothstep(-.3,.7,r.y);vec3 env=mix(vec3(.045,.065,.035),vec3(.75,.79,.63),sky);env+=vec3(1.0,.91,.7)*key*1.25+vec3(.9,1.0,.76)*strip*1.25;float rough=sin(P.x*129.0+P.z*179.0)*sin(P.y*173.0)*.012;vec3 base=color*(.26+diff*.58+rough);vec3 reflected=env*mix(vec3(.85),color,metal);vec3 c=mix(base,reflected,.25+metal*.46);c+=vec3(.6,.66,.44)*rim*.20;c+=color*glow;c=c/(1.0+c*.36);gl_FragColor=vec4(pow(c,vec3(.87)),alpha);}`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  let program;
  try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Renderer link failed');}
  catch{stage.classList.add('no-webgl');motion.hidden=true;return;}
  gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  const uniforms={};['model','vp','eye','color','metal','glow','alpha'].forEach(k=>uniforms[k]=gl.getUniformLocation(program,k));
  const pos=gl.getAttribLocation(program,'position'),normal=gl.getAttribLocation(program,'normal');
  const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  function multiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
  function transform(x,y,z,sx,sy,sz,ry=0){const c=Math.cos(ry),s=Math.sin(ry);return new Float32Array([c*sx,0,-s*sx,0,0,sy,0,0,s*sz,0,c*sz,0,x,y,z,1]);}
  const sub=(a,b)=>a.map((v,i)=>v-b[i]);const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);const norm=a=>{const m=Math.hypot(...a);return a.map(v=>v/m);};const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function lookAt(eye,target){const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
  function perspective(fov,aspect){const f=1/Math.tan(fov/2),near=.1,far=80;return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);}
  function makeMesh(vertices,normals,mode){const p=gl.createBuffer(),n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);return{p,n,count:vertices.length/3,mode};}
  const vertices=[],normals=[];
  const faces=[[[0,0,1],[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]],[[0,0,-1],[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]],[[1,0,0],[[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]]],[[-1,0,0],[[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]]],[[0,1,0],[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]]],[[0,-1,0],[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]]];
  faces.forEach(([n,vs])=>[0,1,2,0,2,3].forEach(i=>{vertices.push(...vs[i]);normals.push(...n);}));
  const cube=makeMesh(vertices,normals,gl.TRIANGLES);
  const wireVertices=[],wireNormals=[];const corners=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5],[-.5,.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,.5,.5]];
  [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a,b])=>{wireVertices.push(...corners[a],...corners[b]);wireNormals.push(0,1,0,0,1,0);});
  const wire=makeMesh(wireVertices,wireNormals,gl.LINES);
  const ringVertices=[],ringNormals=[];for(let i=0;i<160;i++){const a=i*Math.PI/80,b=(i+1)*Math.PI/80;ringVertices.push(Math.cos(a),0,Math.sin(a),Math.cos(b),0,Math.sin(b));ringNormals.push(0,1,0,0,1,0);}const ring=makeMesh(ringVertices,ringNormals,gl.LINES);
  const mat={stone:{color:[.055,.075,.045],metal:.3},graphite:{color:[.19,.235,.14],metal:.9},silver:{color:[.65,.69,.53],metal:.85},gold:{color:[.66,.45,.21],metal:.85},edge:{color:[.63,.68,.47],metal:.6},black:{color:[.018,.032,.014],metal:.15},light:{color:[.79,.61,.33],metal:.6,glow:.3}};
  let root=identity(),lastMesh=null;
  function draw(mesh,m,material,a=1){if(lastMesh!==mesh){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.p);gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,mesh.n);gl.enableVertexAttribArray(normal);gl.vertexAttribPointer(normal,3,gl.FLOAT,false,0,0);lastMesh=mesh;}gl.uniformMatrix4fv(uniforms.model,false,multiply(root,m));gl.uniform3fv(uniforms.color,material.color);gl.uniform1f(uniforms.metal,material.metal||0);gl.uniform1f(uniforms.glow,material.glow||0);gl.uniform1f(uniforms.alpha,a);gl.drawArrays(mesh.mode,0,mesh.count);}
  const box=(x,y,z,w,h,d,material,angle=0)=>draw(cube,transform(x,y,z,w,h,d,angle),material);
  let W=0,H=0;const pixelRatio=Math.min(devicePixelRatio||1,1.75);
  function resize(){const r=stage.getBoundingClientRect();W=r.width;H=r.height;if(!W||!H)return;canvas.width=Math.round(W*pixelRatio);canvas.height=Math.round(H*pixelRatio);gl.viewport(0,0,canvas.width,canvas.height);}
  new ResizeObserver(resize).observe(stage);resize();
  let px=0,py=0,mx=0,my=0,rotation=0,gap=.29,offset=.09,turn=0,lastTime=performance.now(),clock=0;
  stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=stage.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5;});stage.addEventListener('pointerleave',()=>{px=0;py=0;});
  canvas.addEventListener('click',()=>selectPhase((phase+1)%4,true));
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stage.classList.add('no-webgl');});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'100px'}).observe(stage);
  document.addEventListener('visibilitychange',()=>{autoAt=performance.now();});
  window.addEventListener('scroll',()=>{if(paused||performance.now()<manualUntil)return;const r=document.querySelector('.hero').getBoundingClientRect();const progress=-r.top/r.height;if(progress>.12&&progress<.75){const p=Math.min(3,Math.floor(progress*5));if(p!==phase)selectPhase(p);}}, {passive:true});
  function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-lastTime)/1000,.04);lastTime=now;if(!visible||document.hidden)return;if(!paused){clock+=dt;if(now>manualUntil&&now-autoAt>7000)selectPhase((phase+1)%4);mx+=(px-mx)*.04;my+=(py-my)*.04;}else{mx+=(0-mx)*.07;my+=(0-my)*.07;}
    const smoothing=reduced.matches?1:.045;gap+=(phases[phase].gap-gap)*smoothing;offset+=(phases[phase].offset-offset)*smoothing;turn+=(phases[phase].turn-turn)*smoothing;
    rotation=Math.sin(clock*.19)*.11+mx*.35+turn;
    const eye=[7.9,5.7+my*.65,9.5];const projection=perspective(.54,W/H);const view=lookAt(eye,[0,.15,0]);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(uniforms.vp,false,multiply(projection,view));gl.uniform3fv(uniforms.eye,eye);root=transform(0,Math.sin(clock*.65)*.04,0,1,1,1,rotation);lastMesh=null;
    draw(ring,transform(0,-2.55,0,3.05,1,3.05),mat.graphite,.38);draw(ring,transform(0,-2.55,0,3.32,1,3.32),mat.graphite,.18);
    // Machined base: a real platform anchors the object, while the floors separate.
    box(0,-2.22,0,3.83,.12,3.4,mat.stone);box(0,-2.12,0,3.61,.065,3.2,mat.silver);box(0,-2.065,0,3.45,.04,3.06,mat.black);
    // The amber core stays whole through each structural transformation.
    box(0,-.46,0,1.16,2.78,1.12,mat.gold);box(.01,-.44,.575,.83,2.43,.018,mat.light);
    for(let k=0;k<9;k++){box(-.5+k*.125,-.42,.597,.023,2.56,.027,mat.gold);}
    for(let i=0;i<5;i++){
      const y=-1.76+i*(.49+gap),x=(i-2)*offset*.6,z=Math.sin(i*1.6)*offset;
      const float=paused||reduced.matches?0:Math.sin(clock*.8+i*.9)*.016;
      const h=y+float;
      box(x,h,z,3.28,.09,2.88,i===4?mat.silver:mat.graphite);
      box(x,h+.055,z,3.32,.018,2.92,mat.silver);
      box(x,h-.068,z,3.14,.035,2.72,mat.black);
      // Repeated facade fins give the model architectural rather than abstract detail.
      if(i<4){
        for(let j=0;j<13;j++){
          const k=-1.48+j*.247;
          box(x+k,h+.2,z+1.38,.045,.29,.08,j%4===0?mat.gold:mat.silver);
          box(x+k,h+.2,z-1.38,.045,.29,.08,mat.graphite);
        }
        for(let j=0;j<10;j++){const k=-1.22+j*.272;box(x+1.57,h+.2,z+k,.07,.29,.046,mat.silver);box(x-1.57,h+.2,z+k,.07,.29,.046,mat.graphite);}
        box(x,h+.355,z+1.38,3.13,.027,.065,mat.silver);box(x+1.57,h+.355,z,.065,.027,2.7,mat.silver);
      }
      // The roof has inset panels, grooves, and a separate structural frame.
      if(i===4){box(x,h+.09,z,2.97,.045,2.58,mat.graphite);for(let j=0;j<6;j++)box(x-.94+j*.37,h+.127,z,.012,.007,2.22,mat.silver);box(x,h+.13,z,2.44,.008,.012,mat.silver);}
    }
    // Fine structural boundaries expand during due diligence.
    const spread=phase===1?.42:.16;
    draw(wire,transform(-.07,-.12,0,3.67+spread,4.63,3.35+spread),mat.edge,phase===1?.33:.12);
    const yTop=-1.76+4*(.49+gap)+.45;
    draw(wire,transform((4-2)*offset*.6,yTop,Math.sin(6.4)*offset,3.42,.16,3.02),mat.edge,.22);
  }
  requestAnimationFrame(frame);
})();
