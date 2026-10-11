// js/valve3d.js — Interactive 3D cutaway relief valve (ES module)
// Uses Three.js via importmap (three@0.160.0 from unpkg)
//
// API 526 vertical spring-loaded relief valve, vertical orientation:
// inlet at the BOTTOM, outlet at the TOP (vertical upward discharge).
// Bottom -> top: inlet flange -> body -> nozzle (with seat ring at its top)
// -> plug (disc) -> spring -> bonnet/spring housing -> back seat -> top cap
// -> outlet discharging vertically upward. The gold faces are the three
// lapped faces: seat face (top of nozzle), plug face (bottom of plug),
// and back seat (the second, higher seat).

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'https://unpkg.com/three@0.160.0/examples/jsm/environments/RoomEnvironment.js';

export function initValve3D() {
  const container = document.getElementById('valve3d-canvas');
  if (!container) return;

  const failFallback = (msg) => {
    const fb = container.querySelector('.valve-fallback');
    if (fb) {
      fb.querySelector('p').textContent = msg;
    }
    const btn = document.getElementById('valve-cutaway-toggle');
    if (btn) btn.style.display = 'none';
  };

  // Renderer (throws if WebGL is unavailable)
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (e) {
    failFallback('The 3D preview needs a browser with WebGL enabled. The valve specs are on the products page.');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0x000000, 1);
  container.appendChild(renderer.domElement);
  const fb = container.querySelector('.valve-fallback');
  if (fb) fb.style.display = 'none';

  // Camera (pulled back so the whole vertical valve fits in frame)
  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(12, 6, 17);
  camera.lookAt(0, 5.5, 0);

  // Scene
  const scene = new THREE.Scene();

  // Environment map: gives the metal something to reflect (prevents black metal)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // Lights (brighter: key + cool fill + stronger ambient so metal reads, not black)
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(6, 10, 8);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x8899ff, 1.0);
  fillLight.position.set(-8, 6, -6);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
  rimLight.position.set(0, 4, -10);
  scene.add(rimLight);

  const ambientLight = new THREE.AmbientLight(0x666677, 1.2);
  scene.add(ambientLight);

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x888899, metalness: 0.85, roughness: 0.35,
    clippingPlanes: [], clipShadows: true
  });
  const bonnetMat = new THREE.MeshStandardMaterial({
    color: 0x9999aa, metalness: 0.8, roughness: 0.4,
    clippingPlanes: [], clipShadows: true
  });
  const springMat = new THREE.MeshStandardMaterial({
    color: 0xccccdd, metalness: 0.7, roughness: 0.5,
    clippingPlanes: [], clipShadows: true
  });
  const flangeMat = new THREE.MeshStandardMaterial({
    color: 0x777788, metalness: 0.9, roughness: 0.3,
    clippingPlanes: [], clipShadows: true
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xF0DC2A, metalness: 0.6, roughness: 0.4,
    emissive: 0xF0DC2A, emissiveIntensity: 0.25,
    clippingPlanes: [], clipShadows: true
  });
  const springHousingMat = new THREE.MeshStandardMaterial({
    color: 0x9999aa, metalness: 0.8, roughness: 0.4,
    clippingPlanes: [], clipShadows: true,
    side: THREE.DoubleSide
  });

  // Clipping plane (cuts away the +x half to expose the internals)
  const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);

  // ---- Build the solid (normal-view) model ----
  // Vertical stack, built from the bottom up along +Y.
  // Inlet flange at the bottom, outlet at the top.
  const model = new THREE.Group();

  const INLET_R = 2.8;      // inlet flange radius
  const BODY_R = 2;         // body radius
  const NOZZLE_R_BOT = 1.6; // nozzle base radius
  const NOZZLE_R_TOP = 1.1; // nozzle / seat-ring radius at top

  // (1) Inlet flange — horizontal disc at the very bottom, facing down
  const inletFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(INLET_R, INLET_R, 0.6, 32), flangeMat);
  inletFlange.position.y = 0.3;
  model.add(inletFlange);

  // Inlet bolt circle (8 bolts)
  const boltCount = 8;
  const boltR = 2.4;
  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2;
    const bolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8), flangeMat);
    bolt.position.set(Math.cos(angle) * boltR, 0.3, Math.sin(angle) * boltR);
    model.add(bolt);
  }

  // (3) Valve body — vertical cylinder rising off the inlet flange
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(BODY_R, BODY_R, 6, 32), bodyMat);
  body.position.y = 0.6 + 3;
  model.add(body);

  // (2) Nozzle — tapered land rising up out of the body bottom,
  // ending in the seat ring near the top of the body.
  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(NOZZLE_R_TOP, NOZZLE_R_BOT, 5.2, 32), bodyMat);
  nozzle.position.y = 0.6 + 2.6;
  model.add(nozzle);

  // (4) Seat ring — top face of the nozzle, facing up (lapped face #1)
  const seatRing = new THREE.Mesh(
    new THREE.CylinderGeometry(NOZZLE_R_TOP, NOZZLE_R_TOP, 0.25, 32), goldMat);
  seatRing.position.y = 0.6 + 5.2 + 0.125;
  model.add(seatRing);

  // (5) Plug (disc) — rests on top of the seat ring.
  // Its bottom face is lapped face #2 ('Plug face').
  const plug = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.35, 0.4, 32), goldMat);
  plug.position.y = 0.6 + 5.2 + 0.25 + 0.2;
  model.add(plug);

  // (6) Spring — sits on top of the plug, inside the bonnet, pressing it down.
  const springCoils = 6;
  const springHeight = 3;
  const springRadius = 0.9;
  const springBaseY = 0.6 + 5.2 + 0.25 + 0.4;
  const springPoints = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const angle = t * springCoils * Math.PI * 2;
    springPoints.push(new THREE.Vector3(
      Math.cos(angle) * springRadius,
      springBaseY + t * springHeight,
      Math.sin(angle) * springRadius
    ));
  }
  const spring = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPoints), 120, 0.09, 8, false),
    springMat);
  model.add(spring);

  // (7) Bonnet / spring housing — cylinder around the spring, bolted to body.
  const bonnet = new THREE.Mesh(
    new THREE.CylinderGeometry(BODY_R, BODY_R, 3.8, 32), bonnetMat);
  bonnet.position.y = springBaseY + springHeight + 0.7;
  model.add(bonnet);

  // (8) Back seat — second, higher seat (top of plug/guide against bonnet)
  const backSeat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 0.2, 32), goldMat);
  backSeat.position.y = springBaseY + springHeight + 0.4;
  model.add(backSeat);

  // (9) Top cap / closure
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(BODY_R + 0.15, BODY_R + 0.15, 0.35, 32), flangeMat);
  cap.position.y = bonnet.position.y + 2.05;
  model.add(cap);

  // (10) Outlet — discharges vertically upward from the top of the body.
  // A vertical nozzle ending in an outlet flange pointing up.
  const outlet = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.3, 1.6, 32), bodyMat);
  outlet.position.y = cap.position.y + 0.9;
  model.add(outlet);
  const outletFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.7, 0.3, 32), flangeMat);
  outletFlange.position.y = cap.position.y + 1.75;
  model.add(outletFlange);

  // ---- Cutaway model (duplicates with clipping) ----
  const cutawayModel = new THREE.Group();

  const cutawayMat = bodyMat.clone();
  cutawayMat.clippingPlanes = [clipPlane];
  cutawayMat.clipShadows = true;
  cutawayMat.transparent = true;
  cutawayMat.opacity = 0.7;

  const cutawayBonnetMat = bonnetMat.clone();
  cutawayBonnetMat.clippingPlanes = [clipPlane];
  cutawayBonnetMat.clipShadows = true;
  cutawayBonnetMat.transparent = true;
  cutawayBonnetMat.opacity = 0.7;

  const cutawaySpringHousingMat = springHousingMat.clone();
  cutawaySpringHousingMat.clippingPlanes = [clipPlane];
  cutawaySpringHousingMat.clipShadows = true;
  cutawaySpringHousingMat.transparent = true;
  cutawaySpringHousingMat.opacity = 0.7;

  const cutawayFlangeMat = flangeMat.clone();
  cutawayFlangeMat.clippingPlanes = [clipPlane];
  cutawayFlangeMat.clipShadows = true;
  cutawayFlangeMat.transparent = true;
  cutawayFlangeMat.opacity = 0.7;

  const cutawayGoldMat = goldMat.clone();
  cutawayGoldMat.clippingPlanes = [clipPlane];
  cutawayGoldMat.clipShadows = true;
  cutawayGoldMat.transparent = true;
  cutawayGoldMat.opacity = 0.9;

  function cloneMesh(mesh) {
    let mat;
    if (mesh.material === bodyMat) mat = cutawayMat;
    else if (mesh.material === bonnetMat) mat = cutawayBonnetMat;
    else if (mesh.material === springHousingMat) mat = cutawaySpringHousingMat;
    else if (mesh.material === flangeMat) mat = cutawayFlangeMat;
    else if (mesh.material === goldMat) mat = cutawayGoldMat;
    else if (mesh.material === springMat) mat = springMat;
    else mat = mesh.material;
    const m = new THREE.Mesh(mesh.geometry, mat);
    m.position.copy(mesh.position);
    m.rotation.copy(mesh.rotation);
    return m;
  }

  [inletFlange, body, nozzle, seatRing, plug, spring, bonnet, backSeat, cap, outlet, outletFlange].forEach((m) => {
    cutawayModel.add(cloneMesh(m));
  });

  scene.add(model);
  scene.add(cutawayModel);
  cutawayModel.visible = false;

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;
  controls.target.set(0, 5.5, 0);
  controls.minDistance = 12;
  controls.maxDistance = 45;
  controls.enablePan = false;

  // Pause auto-rotate while dragging
  let idleTimer = null;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    clearTimeout(idleTimer);
  });
  controls.addEventListener('end', () => {
    idleTimer = setTimeout(() => { controls.autoRotate = true; }, 3000);
  });

  // Labels point at the three lapped faces.
  const labelPositions = [
    { text: 'Seat face', pos: new THREE.Vector3(-2.6, 0.6 + 5.2 + 0.25 + 0.4, 1.6) },
    { text: 'Plug face', pos: new THREE.Vector3(2.2, plug.position.y - 0.1, 1.6) },
    { text: 'Back seat', pos: new THREE.Vector3(-2.0, backSeat.position.y, 1.6) },
  ];

  const labelEls = labelPositions.map((l) => {
    const el = document.createElement('div');
    el.className = 'valve-label';
    el.textContent = l.text;
    container.appendChild(el);
    return { el, pos: l.pos };
  });

  // Cutaway toggle
  const toggleBtn = document.getElementById('valve-cutaway-toggle');
  let cutaway = false;
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      cutaway = !cutaway;
      model.visible = !cutaway;
      cutawayModel.visible = cutaway;
      toggleBtn.textContent = cutaway ? 'Normal View' : 'Show Cutaway';
    });
  }

  // Resize
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Update label positions
    labelEls.forEach((l) => {
      const v = l.pos.clone();
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * container.clientWidth;
      const y = (-v.y * 0.5 + 0.5) * container.clientHeight;
      l.el.style.left = x + 'px';
      l.el.style.top = y + 'px';
      l.el.style.display = v.z < 1 ? 'block' : 'none';
    });

    renderer.render(scene, camera);
  }
  animate();
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initValve3D);
} else {
  initValve3D();
}
