(() => {
  'use strict';
  const T = window.THREE;
  const hero = document.querySelector('.hero');
  const stage = document.getElementById('object-stage');
  const canvas = document.getElementById('asset-canvas');
  const motion = document.getElementById('motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tabs = [...document.querySelectorAll('.phase-tabs button')];
  const phases = [
    {caption:'У каждого сложного актива есть внутренняя логика.', index:'01 / Исходная структура', layer:'Актив и его ограничения', core:'Объект. Права. Обязательства.'},
    {caption:'Раскрываем связи. Проверяем права, ограничения и экономику.', index:'02 / Подробный разбор', layer:'Каждая связь имеет значение', core:'Проверка до решения.'},
    {caption:'Те же элементы. Другая структура. Продуманный сценарий.', index:'03 / Новая конфигурация', layer:'Собранное решение', core:'Структура сделки и порядок действий.'},
    {caption:'Работаем с активом по выбранному сценарию реализации.', index:'04 / Работа с активом', layer:'От структуры — к действию', core:'Сценарий конкретного дела.'}
  ];
  const stops = [0, .34, .69, 1];
  let target = 0, progress = 0, active = -1, still = reduced.matches, visible = true;
  let manual = false, clickScrollY = 0, pointerX = 0, pointerY = 0;
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  function setText(index) {
    if (active === index) return;
    active = index;
    const data = phases[index];
    document.querySelector('.hero-stage').dataset.phase = String(index);
    tabs.forEach((tab, i) => tab.setAttribute('aria-pressed', String(i === index)));
    document.getElementById('phase-count').innerHTML = `0${index + 1}<span>/ 04</span>`;
    document.getElementById('phase-caption').textContent = data.caption;
    document.getElementById('layer-index').textContent = data.index;
    document.getElementById('layer-label').textContent = data.layer;
    document.getElementById('core-label').textContent = data.core;
  }
  function setMotion() {
    motion.textContent = still ? '▷' : 'Ⅱ';
    motion.setAttribute('aria-pressed', String(still));
    motion.setAttribute('aria-label', still ? 'Включить плавное движение' : 'Отключить плавное движение');
    hero.classList.toggle('motion-still', still);
  }
  motion.addEventListener('click', () => { still = !still; setMotion(); });
  reduced.addEventListener('change', () => { still = reduced.matches; setMotion(); });
  tabs.forEach((button, i) => button.addEventListener('click', () => {
    target = stops[i]; manual = true; clickScrollY = scrollY; setText(i);
  }));
  function readScroll() {
    if (manual && Math.abs(scrollY - clickScrollY) < 8) return;
    manual = false;
    const rect = hero.getBoundingClientRect();
    const distance = hero.offsetHeight - document.querySelector('.hero-pin').offsetHeight;
    target = distance > 0 ? clamp(-rect.top / distance) : 0;
  }
  window.addEventListener('scroll', readScroll, {passive:true});
  setMotion(); setText(0); readScroll();
  if (!T) { stage.classList.add('no-webgl'); motion.hidden = true; return; }
  let renderer;
  try { renderer = new T.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'}); }
  catch { stage.classList.add('no-webgl'); motion.hidden = true; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0xf4f3ef, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-4, 4, 3.5, -3.5, .1, 60);
  camera.position.set(8, 5.5, 10); camera.lookAt(0, -.15, 0);
  // The studio and all reflections are generated locally.
  const studio = new T.Scene(); studio.background = new T.Color(0xa6b5bc);
  function softbox(x, y, z, w, h, color, intensity) {
    const box = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(intensity), side:T.DoubleSide}));
    box.position.set(x, y, z); box.lookAt(0, 0, 0); studio.add(box);
  }
  softbox(-4, 5, 2, 6, 9, 0xffffff, 2.7);
  softbox(5, 2, -3, 2, 8, 0xffffff, 3.8);
  softbox(0, 7, 0, 8, 6, 0xffffff, 2);
  softbox(0, 0, -7, 5, 5, 0x798a95, .38);
  softbox(5, 1, 5, 2.8, 8, 0x192d39, .25);
  softbox(-5, 0, -3, 1.8, 8, 0x283e48, .4);
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio, .06).texture; pmrem.dispose();
  scene.add(new T.HemisphereLight(0xeaf5ff, 0xc8bba8, 1.35));
  const key = new T.DirectionalLight(0xfff4e1, 2.6);
  key.position.set(-4, 8, 5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left:-7, right:7, top:7, bottom:-7});
  key.shadow.normalBias = .025; key.shadow.bias = -.0001; key.shadow.radius = 4; scene.add(key);
  const rim = new T.DirectionalLight(0xc8e3f4, 1.7); rim.position.set(4, 4, -5); scene.add(rim);
  const mat = {
    silver:new T.MeshStandardMaterial({color:0x8c9ba2, metalness:.86, roughness:.24, envMapIntensity:1.1}),
    stone:new T.MeshStandardMaterial({color:0xdddcd5, metalness:.05, roughness:.52}),
    brass:new T.MeshStandardMaterial({color:0xb09a74, metalness:.78, roughness:.32}),
    glass:new T.MeshPhysicalMaterial({color:0xa6d0de, metalness:0, roughness:.08, transmission:.93, thickness:.22, ior:1.46, transparent:true, opacity:.78, envMapIntensity:1, depthWrite:false}),
    frost:new T.MeshPhysicalMaterial({color:0xc7dedd, metalness:.04, roughness:.24, transmission:.56, thickness:.12, transparent:true, opacity:.6, depthWrite:false})
  };
  const root = new T.Group(); scene.add(root);
  const unitBox = new T.BoxGeometry(1, 1, 1), parts = [];
  const pose = (x, y, z, rx=0, ry=0, rz=0) => ({p:new T.Vector3(x,y,z), q:new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz))});
  function addPart(w, h, d, material, poses, glass=false) {
    const group = new T.Group(), geometry = new T.BoxGeometry(w, h, d);
    const body = new T.Mesh(geometry, material);
    body.castShadow = !glass; body.receiveShadow = !glass; group.add(body);
    if (glass) {
      group.add(new T.LineSegments(new T.EdgesGeometry(geometry), new T.LineBasicMaterial({color:0x5f8795, transparent:true, opacity:.44})));
      [-1,1].forEach(x => [-1,1].forEach(y => {
        const fitting = new T.Mesh(unitBox, mat.silver);
        fitting.scale.set(.055,.055,d+.017); fitting.position.set(x*(w/2-.065),y*(h/2-.09),0); group.add(fitting);
      }));
    }
    group.position.copy(poses[0].p); group.quaternion.copy(poses[0].q);
    root.add(group); parts.push({group, poses}); return group;
  }
  const PI = Math.PI;
  // Four solid plates from the enclosure become the full pavilion deck.
  [-1,1].forEach(s => {
    addPart(1.55,.12,2.84,mat.stone,[pose(s*.785,-1.5,0),pose(s*1.15,-1.9,.1),pose(s*2.345,-1.5,0),pose(s*2.345,-1.5,0)]);
    addPart(1.55,.09,2.84,mat.silver,[pose(s*.785,1.5,0),pose(s*1.1,2.36,-.15,0,0,s*.12),pose(s*.785,-1.5,0),pose(s*.785,-1.5,0)]);
  });
  [-1,1].forEach(x => [-1,1].forEach(z => {
    addPart(.065,2.94,.065,mat.silver,[pose(x*1.55,0,z*1.37),pose(x*2.1,0,z*1.75,0,0,-x*.08),pose(x*2.75,0,z*1.3),pose(x*2.75,0,z*1.3)]);
  }));
  // Vertical mullions rotate into two continuous horizontal edge beams.
  [-1,1].forEach((x, xi) => [-1,1].forEach(z => {
    const start = xi === 0 ? pose(0,0,z*1.37) : pose(z*1.55,0,0);
    addPart(.045,2.84,.045,mat.silver,[start,pose(x*2.35,.2,z*2,0,0,x*.15),pose(x*1.42,1.46,z*1.3,0,0,PI/2),pose(x*1.42,1.46,z*1.3,0,0,PI/2)]);
  }));
  // Façade glass becomes the canopy; each panel keeps its original dimensions.
  let pane = 0;
  [-1,1].forEach(z => [-1,1].forEach(x => {
    const p = pane++;
    addPart(1.43,2.74,.055,mat.glass,[pose(x*.775,0,z*1.37),pose(x*1.62,.15,z*2.45,0,x*z*.19,z*.05),pose((p-1.5)*1.44,1.43,0,PI/2),pose((p-1.5)*1.44,1.43,0,PI/2)],true);
  }));
  [-1,1].forEach(s => {
    addPart(2.63,2.74,.06,mat.frost,[pose(s*1.55,0,0,0,PI/2),pose(s*3.1,0,0,0,PI/2+s*.18),pose(s*2.79,0,0,0,PI/2),pose(s*2.79,0,0,0,PI/2)],true);
  });
  [-1,0,1].forEach(s => {
    addPart(.07,2.82,.42,mat.brass,[pose(s*.48,0,0),pose(s*.8,.2,.1,0,s*.2,s*.08),pose(0,-1.355,s*.53,0,0,PI/2),pose(0,-1.355,s*.53,0,0,PI/2)]);
  });
  const guidePoints = [];
  [[-1.55,0,0,-3.1,0,0],[1.55,0,0,3.1,0,0],[0,1.5,0,0,2.5,0],[0,0,1.37,0,0,2.7]].forEach(a => {
    guidePoints.push(new T.Vector3(...a.slice(0,3)),new T.Vector3(...a.slice(3)));
  });
  const guides = new T.LineSegments(new T.BufferGeometry().setFromPoints(guidePoints), new T.LineDashedMaterial({color:0x819598,transparent:true,opacity:0,dashSize:.055,gapSize:.075}));
  guides.computeLineDistances(); root.add(guides);
  const ghost = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(3.14,3.02,2.84)),new T.LineBasicMaterial({color:0x98a9ac,transparent:true,opacity:0})); root.add(ghost);
  const floor = new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({color:0x56717c,opacity:.04}));
  floor.rotation.x = -PI/2; floor.position.y = -1.61; floor.receiveShadow = true; scene.add(floor);
  const grid = new T.GridHelper(11,22,0x98adb1,0xb8c8c9);
  grid.position.y=-1.6; grid.material.transparent=true; grid.material.opacity=.12; grid.material.depthWrite=false; scene.add(grid);
  const route = new T.Group(); root.add(route);
  const routeMaterial = new T.MeshStandardMaterial({color:0xb89765,metalness:.5,roughness:.4,transparent:true,opacity:0});
  const routeLine = new T.Mesh(unitBox,routeMaterial); routeLine.scale.set(.035,.014,4.8); routeLine.position.set(.1,-1.425,1.8); route.add(routeLine);
  const routeHead = new T.Mesh(new T.ConeGeometry(.11,.28,3),routeMaterial);
  routeHead.rotation.x=PI/2; routeHead.position.set(.1,-1.415,4.23); route.add(routeHead);
  function resize() {
    const r=stage.getBoundingClientRect(); if(!r.width || !r.height) return;
    renderer.setSize(r.width,r.height,false);
    const aspect=r.width/r.height, height=Math.max(6.7,8.7/aspect);
    camera.left=-height*aspect/2; camera.right=height*aspect/2; camera.top=height/2; camera.bottom=-height/2;
    camera.updateProjectionMatrix(); readScroll();
  }
  new ResizeObserver(resize).observe(stage); resize();
  stage.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch')return;
    const r=stage.getBoundingClientRect();pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5;
  });
  stage.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'100px'}).observe(stage);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stage.classList.add('no-webgl');});
  canvas.addEventListener('webglcontextrestored',()=>stage.classList.remove('no-webgl'));
  let previous=performance.now(),lastRender=0,mx=0,my=0;
  function draw(now) {
    requestAnimationFrame(draw);
    const dt=Math.min((now-previous)/1000,.06);previous=now;
    if(!visible || document.hidden || now-lastRender<30)return;
    lastRender=now;
    const amount=still?1:1-Math.exp(-dt*7);
    progress+=(target-progress)*amount;
    const display = still ? stops.reduce((a,b)=>Math.abs(b-target)<Math.abs(a-target)?b:a) : progress;
    let section=0,t=0;
    if(display<.09){section=0;t=0;}
    else if(display<.31){section=0;t=smooth((display-.09)/.22);}
    else if(display<.4){section=1;t=0;}
    else if(display<.65){section=1;t=smooth((display-.4)/.25);}
    else if(display<.75){section=2;t=0;}
    else {section=2;t=smooth((display-.75)/.25);}
    parts.forEach(({group,poses})=>{
      group.position.lerpVectors(poses[section].p,poses[section+1].p,t);
      group.quaternion.slerpQuaternions(poses[section].q,poses[section+1].q,t);
    });
    const unfold=section===0?t:section===1?1-t:0, assembly=section===0?0:section===1?t:1, realized=section===2?t:0;
    mx+=((still?0:pointerX)-mx)*amount;my+=((still?0:pointerY)-my)*amount;
    root.rotation.y=-.14+assembly*.17-realized*.28+mx*.07; root.rotation.x=my*.025; root.position.y=.15+unfold*.1;
    camera.zoom=1.06-unfold*.17-assembly*.04;camera.updateProjectionMatrix();
    guides.material.opacity=unfold*.4;ghost.material.opacity=unfold*.16;grid.material.opacity=.095+unfold*.12-realized*.08;
    routeMaterial.opacity=realized*.8;
    const resultVisible=realized>.72, result=document.getElementById('scene-result');
    result.inert=!resultVisible;result.setAttribute('aria-hidden',String(!resultVisible));stage.classList.toggle('is-realized',resultVisible);
    setText(display<.16?0:display<.49?1:display<.84?2:3);
    hero.style.setProperty('--journey',`${display*100}%`);
    renderer.render(scene,camera);
  }
  requestAnimationFrame(draw);
})();
