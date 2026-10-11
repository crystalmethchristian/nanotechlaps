// js/valve3d.js — Interactive 3D cutaway relief valve (ES module)
// Uses Three.js via importmap (three@0.160.0 from unpkg)
//
// API 526 vertical spring-loaded relief valve, vertical orientation:
// inlet at the BOTTOM, outlet at the TOP (vertical upward discharge).
// Bottom -> top: inlet flange -> hollow body -> internal nozzle
// (seat ring at its top) -> plug resting on the seat -> spring pressing
// down -> bonnet (spring housing) bolted directly onto the body -> outlet
// nozzle + outlet flange discharging vertically upward. The gold faces are
// the three lapped faces: seat face (top of nozzle), plug face (bottom of
// plug), and back seat (the ring seal above the plug inside the bonnet).
//
// Geometry principle: every part is in continuous contact — no floating
// pieces, no exposed gaps. Shells are hollow (LatheGeometry) so the
// cutaway reveals the internals.

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

  // Camera (framed so the whole vertical valve, outlet included, fits)
  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(11, 6.5, 16);
  camera.lookAt(0, 5.6, 0);

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

  // Materials (shells use DoubleSide so hollow lathed parts render their
  // inner walls and read correctly once clipped in cutaway mode)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x888899, metalness: 0.85, roughness: 0.35, side: THREE.DoubleSide,
    clippingPlanes: [], clipShadows: true
  });
  const bonnetMat = new THREE.MeshStandardMaterial({
    color: 0x9999aa, metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide,
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

  // Clipping plane (cuts away the +x half to expose the internals)
  const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);

  // ---- Build the solid (normal-view) model ----
  // Vertical stack, built from the bottom up along +Y, all touching.
  // Helper: closed 2-D (radius, y) profile lathed around Y -> hollow shell.
  const lathe = (pts, seg = 48) =>
    new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);

  const model = new THREE.Group();

  // Y layout (parts touch at every seam):
  //   0.00 - 0.60  inlet flange (disc)
  //   0.60 - 0.90  inlet neck
  //   0.60 - 4.90  hollow body cup (rim flange 4.40 - 4.90)
  //   0.60 - 4.40  internal nozzle (hidden inside body, visible in cutaway)
  //   4.40 - 4.65  seat ring (gold) on top of nozzle
  //   4.65 - 5.25  plug (gold) resting on the seat ring
  //   5.25 - 8.70  spring on top of the plug, inside the bonnet
  //   4.90 - 5.40  bonnet flange (bolted flush on the body rim flange)
  //   5.30 - 5.50  back seat ring (gold) around spring base
  //   8.70 - 9.00  spring top plate
  //   9.60 - 9.90  bonnet head ceiling
  //   9.75 - 11.15 outlet nozzle + outlet flange, discharging upward

  // (1) Inlet flange — horizontal disc at the very bottom
  const inletFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(2.8, 2.8, 0.6, 48), flangeMat);
  inletFlange.position.y = 0.3;
  model.add(inletFlange);

  // Inlet neck — short cylinder joining flange to body base (no gap)
  const inletNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.9, 0.35, 32), bodyMat);
  inletNeck.position.y = 0.6 + 0.175;
  model.add(inletNeck);

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

  // (2) Body — hollow cup, open bottom sitting on the inlet flange.
  // Inner chamber r=1.7; rim flange r=2.6 at top (the bonnet bolts onto it).
  const body = new THREE.Mesh(lathe([
    [1.2, 0.6], [2.0, 0.6], [2.0, 4.4], [2.6, 4.4],
    [2.6, 4.9], [1.5, 4.9], [1.7, 4.4], [1.7, 0.9], [1.2, 0.6]
  ]), bodyMat);
  model.add(body);

  // (3) Nozzle — hollow tube rising inside the body chamber, ending at the
  // seat. Invisible in normal view (inside the body), obvious in cutaway.
  const nozzle = new THREE.Mesh(lathe([
    [0.85, 0.6], [1.35, 0.6], [1.1, 4.4], [0.85, 4.4]
  ]), bodyMat);
  model.add(nozzle);

  // (4) Seat ring — lapped face #1, capping the nozzle at y 4.4-4.65
  const SEAT_Y = 4.4;
  const seatRing = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.1, 0.25, 48), goldMat);
  seatRing.position.y = SEAT_Y + 0.125;
  model.add(seatRing);

  // (5) Plug — gold disc resting directly on the seat ring (bottom face is
  // lapped face #2, the 'Plug face'). No gap: plug bottom == seat top.
  const PLUG_Y = SEAT_Y + 0.25;                 // 4.65
  const plug = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.35, 0.6, 48), goldMat);
  plug.position.y = PLUG_Y + 0.3;
  model.add(plug);

  // (6) Spring — sits ON TOP of the plug, inside the bonnet, pressing down.
  const springCoils = 6;
  const springHeight = 3.45;
  const springRadius = 0.9;
  const springBaseY = PLUG_Y + 0.6;             // 5.25
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

  // Back seat — gold ring seal around the spring base, above the plug,
  // inside the bonnet neck (lapped face #3).
  const BACKSEAT_Y = springBaseY + 0.2;         // 5.45
  const backSeat = new THREE.Mesh(lathe([
    [1.0, BACKSEAT_Y - 0.1], [1.45, BACKSEAT_Y - 0.1],
    [1.45, BACKSEAT_Y + 0.1], [1.0, BACKSEAT_Y + 0.1]
  ]), goldMat);
  model.add(backSeat);

  // (7) Bonnet — hollow housing; its bottom flange (4.90-5.40, r 1.5-2.6)
  // seats FLUSH on the body rim flange (4.40-4.90). Encloses the spring
  // completely; its head ceiling closes the chamber, and the outlet rises
  // from the centre of that ceiling.
  const bonnet = new THREE.Mesh(lathe([
    // outer: flange -> neck -> dome -> head -> ceiling top
    [1.5, 4.9], [2.6, 4.9], [2.6, 5.4], [2.0, 5.4], [2.0, 6.5],
    [2.2, 6.5], [2.2, 8.8], [1.9, 8.8], [1.9, 9.9],
    // inner (down the bore): ceiling hole -> chamber -> neck -> flange bore
    [0.85, 9.9], [0.85, 9.6], [1.75, 9.6], [1.75, 8.9],
    [1.5, 7.5], [1.5, 5.4], [1.5, 4.9]
  ]), bonnetMat);
  model.add(bonnet);

  // Spring top plate — caps the spring, inside the bonnet chamber
  const springTopY = springBaseY + springHeight; // 8.70
  const topPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.3, 0.3, 48), springMat);
  topPlate.position.y = springTopY + 0.15;
  model.add(topPlate);

  // (8) Outlet — open discharge nozzle rising from the bonnet head, ending
  // in an outlet flange. Flow exits straight up: the discharge path is
  // obvious from outside.
  const outlet = new THREE.Mesh(lathe([
    [0.8, 9.75], [1.05, 9.75], [1.05, 10.85], [1.7, 10.85],
    [1.7, 11.15], [0.8, 11.15]
  ]), bodyMat);
  model.add(outlet);

  // ---- Cutaway model (duplicates with clipping) ----
  const cutawayModel = new THREE.Group();

  // Shell materials: sliced AND see-through (low opacity, no depth write)
  // so the internals inside the retained half are clearly legible.
  const mkCutMat = (src, opacity) => {
    const m = src.clone();
    m.clippingPlanes = [clipPlane];
    m.clipShadows = true;
    m.side = THREE.DoubleSide;
    m.transparent = true;
    m.opacity = opacity;
    m.depthWrite = false;
    return m;
  };
  const cutawayMat = mkCutMat(bodyMat, 0.3);
  const cutawayBonnetMat = mkCutMat(bonnetMat, 0.3);
  const cutawayFlangeMat = mkCutMat(flangeMat, 0.35);

  // Internals (seat/plug/back seat/spring) are NOT clipped: they stay fully
  // opaque and bright so they pop out of the ghosted shells.
  function cloneMesh(mesh, mat) {
    const m = new THREE.Mesh(mesh.geometry, mat);
    m.position.copy(mesh.position);
    m.rotation.copy(mesh.rotation);
    return m;
  }

  const cutShells = [
    [inletFlange, cutawayFlangeMat],
    [inletNeck, cutawayMat],
    [body, cutawayMat],
    [nozzle, cutawayMat],
    [bonnet, cutawayBonnetMat],
    [outlet, cutawayMat],
  ];
  const cutInternals = [
    [seatRing, goldMat],
    [plug, goldMat],
    [backSeat, goldMat],
    [spring, springMat],
    [topPlate, springMat],
  ];
  // Opaque internals render first; ghosted shells draw over them last.
  cutShells.forEach(([m, mat]) => {
    const c = cloneMesh(m, mat);
    c.renderOrder = 2;
    cutawayModel.add(c);
  });
  cutInternals.forEach(([m, mat]) => {
    const c = cloneMesh(m, mat);
    c.renderOrder = 1;
    cutawayModel.add(c);
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
  controls.target.set(0, 5.6, 0);
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

  // Labels point at the three lapped faces, spread around the valve so
  // they never collide in screen space.
  const labelPositions = [
    { text: 'Seat face', pos: new THREE.Vector3(-3.1, SEAT_Y + 0.12, 0.9) },
    { text: 'Plug face', pos: new THREE.Vector3(3.1, PLUG_Y + 0.05, 0.9) },
    { text: 'Back seat', pos: new THREE.Vector3(3.3, BACKSEAT_Y + 0.7, 0.6) },
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
