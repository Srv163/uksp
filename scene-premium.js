(() => {
  'use strict';
  const canvas=document.getElementById('asset-canvas'),stage=document.getElementById('object-stage'),motion=document.getElementById('motion-toggle');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const phases=[
    {caption:'Видим реальный актив за внешними ограничениями.',layer:'Права и ограничения',core:'Ценность актива',gap:.26,offset:.18,turn:-.1},
    {caption:'Разбираем права, обязательства и экономику.',layer:'Проверка каждого слоя',core:'Экономика проекта',gap:.65,offset:.46,turn:.08},
    {caption:'Собираем проверенные данные в структуру сделки.',layer:'Структура сделки',core:'Обеспечение и расчёты',gap:.045,offset:0,turn:.36},
    {caption:'Определяем путь реализации конкретного актива.',layer:'Продажа / Аренда / ЦФА',core:'Сценарий реализации',gap:.23,offset:.26,turn:.69}
  ];
  let phase=0,paused=reduced.matches,manualUntil=0,autoAt=performance.now(),visible=true;
  function selectPhase(i,manual=false){phase=i;document.querySelector('.hero-stage').dataset.phase=String(i);document.querySelectorAll('.phase-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.phase)===i)));document.getElementById('phase-count').innerHTML=`0${i+1}<span>/ 04</span>`;document.getElementById('phase-caption').textContent=phases[i].caption;document.getElementById('layer-label').textContent=phases[i].layer;document.getElementById('core-label').textContent=phases[i].core;if(manual)manualUntil=performance.now()+20000;autoAt=performance.now();}
  document.querySelectorAll('.phase-tabs button').forEach(b=>b.addEventListener('click',()=>selectPhase(Number(b.dataset.phase),true)));
  function setMotion(){motion.textContent=paused?'▷':'Ⅱ';motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Возобновить движение модели':'Приостановить движение модели');}
  motion.addEventListener('click',()=>{paused=!paused;autoAt=performance.now();setMotion();});reduced.addEventListener('change',()=>{paused=reduced.matches;setMotion();});setMotion();
  if(!window.THREE){stage.classList.add('no-webgl');motion.hidden=true;return;}
  const T=window.THREE;
  let renderer;
  try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{stage.classList.add('no-webgl');motion.hidden=true;return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x121412,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.24;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(32,1,.1,80);camera.position.set(7.8,4.8,9.6);camera.lookAt(0,.16,0);
  // A studio reflection environment is rendered locally; no textures or remote assets.
  const environment=new T.Scene();environment.background=new T.Color(0x151715);
  function softbox(x,y,z,w,h,color,intensity){const p=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(intensity),side:T.DoubleSide}));p.position.set(x,y,z);p.lookAt(0,0,0);environment.add(p);}
  softbox(-4,5,2,3,7,0xf5f5f1,4.2);softbox(3,4,-2,1.7,8,0xf3f4f2,5.4);softbox(0,6,0,6,6,0xffffff,2.1);softbox(4,0,5,1.3,5,0xf5dcc0,1.9);softbox(-4,0,-4,1,8,0xe1e7e3,2.4);
  const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(environment,.08).texture;pmrem.dispose();
  scene.add(new T.AmbientLight(0x8d997b,.5));
  const key=new T.DirectionalLight(0xfff4df,4.1);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=7;key.shadow.camera.bottom=-5;key.shadow.normalBias=.018;key.shadow.bias=-.00015;key.shadow.radius=3;scene.add(key);
  const rim=new T.DirectionalLight(0xdce8c9,2.3);rim.position.set(4,4,-5);scene.add(rim);const fill=new T.DirectionalLight(0xe5cead,.75);fill.position.set(2,0,7);scene.add(fill);
  const materials={
    silver:new T.MeshStandardMaterial({color:0xc3c7c4,metalness:.96,roughness:.23,envMapIntensity:1.4}),
    edge:new T.MeshStandardMaterial({color:0xe3e6e3,metalness:1,roughness:.12,envMapIntensity:1.8}),
    dark:new T.MeshStandardMaterial({color:0x454b48,metalness:.94,roughness:.24,envMapIntensity:1.5}),
    black:new T.MeshStandardMaterial({color:0x10140f,metalness:.35,roughness:.4}),
    gold:new T.MeshStandardMaterial({color:0x947043,metalness:.95,roughness:.22,envMapIntensity:1.8}),
    core:new T.MeshStandardMaterial({color:0xba965e,metalness:.94,roughness:.17,emissive:0x362313,emissiveIntensity:.1,envMapIntensity:1.7}),
    glass:new T.MeshPhysicalMaterial({color:0xd8e0db,metalness:.2,roughness:.09,transparent:true,opacity:.13,side:T.DoubleSide,depthWrite:false})
  };
  const root=new T.Group();scene.add(root);
  const boxGeometry=new T.BoxGeometry(1,1,1);
  function box(parent,x,y,z,w,h,d,material){const m=new T.Mesh(boxGeometry,material);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function plateGeometry(w,d,h,r=.026){const s=new T.Shape(),x=-w/2,y=-d/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+d-r);s.quadraticCurveTo(x+w,y+d,x+w-r,y+d);s.lineTo(x+r,y+d);s.quadraticCurveTo(x,y+d,x,y+d-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,steps:1,curveSegments:3});g.rotateX(-Math.PI/2);return g;}
  function mesh(parent,geo,material,y){const m=new T.Mesh(geo,material);m.position.y=y;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function frameGeometry(w,d,h,holeW,holeD){
    const s=new T.Shape(),r=.1,x=-w/2,z=-d/2;
    s.moveTo(x+r,z);s.lineTo(x+w-r,z);s.quadraticCurveTo(x+w,z,x+w,z+r);s.lineTo(x+w,z+d-r);s.quadraticCurveTo(x+w,z+d,x+w-r,z+d);s.lineTo(x+r,z+d);s.quadraticCurveTo(x,z+d,x,z+d-r);s.lineTo(x,z+r);s.quadraticCurveTo(x,z,x+r,z);
    const p=new T.Path(),a=holeW/2,b=holeD/2,ir=.07;
    p.moveTo(-a+ir,-b);p.quadraticCurveTo(-a,-b,-a,-b+ir);p.lineTo(-a,b-ir);p.quadraticCurveTo(-a,b,-a+ir,b);p.lineTo(a-ir,b);p.quadraticCurveTo(a,b,a,b-ir);p.lineTo(a,-b+ir);p.quadraticCurveTo(a,-b,a-ir,-b);p.lineTo(-a+ir,-b);s.holes.push(p);
    const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:4,curveSegments:8});g.rotateX(-Math.PI/2);return g;
  }
  const frameGeo=frameGeometry(3.25,2.9,.36,2.21,1.86),trimGeo=frameGeometry(3.26,2.91,.025,2.2,1.85);
  const core=new T.Group();root.add(core);mesh(core,plateGeometry(1.29,1.29,1.29,.09),materials.core,-.53);
  const coreGlass=mesh(core,plateGeometry(1.47,1.47,1.47,.07),materials.glass,-.62);coreGlass.castShadow=false;
  const seamGeo=new T.BoxGeometry(1.296,.008,1.296);[-.12,.32].forEach(y=>mesh(core,seamGeo,materials.gold,y));
  const coreEdges=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.57,1.57,1.57)),new T.LineBasicMaterial({color:0xdbbe8d,transparent:true,opacity:.28}));coreEdges.position.y=.11;core.add(coreEdges);
  const layers=[];
  for(let i=0;i<4;i++){
    const g=new T.Group();root.add(g);layers.push(g);mesh(g,frameGeo,i===1?materials.dark:materials.silver,0);mesh(g,trimGeo,materials.edge,.36);
    // Fine inlaid details belong to the material, rather than to a miniature building.
    for(let j=0;j<3;j++){box(g,0,.095+j*.045,1.474,2.95,.007,.005,materials.black);box(g,1.649,.095+j*.045,0,.005,.007,2.62,materials.black);}
    box(g,-.96,.394,1.24,.2,.008,.04,materials.gold);box(g,-.65,.394,1.24,.04,.008,.04,materials.gold);
  }
  // The ghost volume reads as a boundary, separating the actual asset from its constraints.
  const ghost=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(3.62,3.9,3.3)),new T.LineBasicMaterial({color:0xc0c9bc,transparent:true,opacity:.08}));ghost.position.y=.05;root.add(ghost);
  function resize(){const r=stage.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);resize();
  let px=0,py=0,mx=0,my=0,gap=.26,offset=.18,turn=-.1,clock=0,last=performance.now(),lastRender=0;
  stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=stage.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5;});stage.addEventListener('pointerleave',()=>{px=0;py=0;});canvas.addEventListener('click',()=>selectPhase((phase+1)%4,true));
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stage.classList.add('no-webgl');});canvas.addEventListener('webglcontextrestored',()=>stage.classList.remove('no-webgl'));
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;},{rootMargin:'100px'}).observe(stage);
  document.addEventListener('visibilitychange',()=>{autoAt=performance.now();});
  window.addEventListener('scroll',()=>{if(paused||performance.now()<manualUntil)return;const r=document.querySelector('.hero').getBoundingClientRect(),p=-r.top/r.height;if(p>.12&&p<.75){const n=Math.min(3,Math.floor(p*5));if(n!==phase)selectPhase(n);}}, {passive:true});
  function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(!visible||document.hidden)return;if(now-lastRender<27)return;lastRender=now;if(!paused){clock+=dt;if(now>manualUntil&&now-autoAt>8500)selectPhase((phase+1)%4);}const f=reduced.matches?1:.065;gap+=(phases[phase].gap-gap)*f;offset+=(phases[phase].offset-offset)*f;turn+=(phases[phase].turn-turn)*f;mx+=((paused?0:px)-mx)*.06;my+=((paused?0:py)-my)*.06;root.rotation.y=turn+Math.sin(clock*.18)*.09+mx*.26;root.rotation.x=my*.055;root.rotation.z=-.065;root.position.y=Math.sin(clock*.6)*.035;
    layers.forEach((g,i)=>{g.position.set((i-1.5)*offset*.85,-1.36+i*(.58+gap),Math.sin(i*1.8)*offset*.7);g.rotation.y=Math.sin(i*1.45)*offset*.22;});core.rotation.y=.18+Math.sin(clock*.15)*.045;ghost.material.opacity+=((phase===1?.16:.035)-ghost.material.opacity)*.04;ghost.scale.x=1+offset*.2;ghost.scale.z=1+offset*.2;renderer.render(scene,camera);
  }requestAnimationFrame(frame);
})();
