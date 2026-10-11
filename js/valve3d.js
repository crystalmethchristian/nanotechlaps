// js/valve3d.js — Interactive 3D cutaway relief valve (ES module)
// Uses Three.js via importmap (three@0.160.0 from unpkg)

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

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

  // Camera
  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(6, 5, 8);
  camera.lookAt(0, 3, 0);

  // Scene
  const scene = new THREE.Scene();

  // Lights
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
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

  // Clipping plane (cuts through the body at X = 2.5)
  const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 2.5);

  // Build model
  const model = new THREE.Group();

  // Valve body (main cylinder)
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 6, 32), bodyMat);
  body.position.set(0, 3, 0);
  model.add(body);

  // Bonnet (sits on top of body)
  const bonnet = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3, 32), bonnetMat);
  bonnet.position.set(0, 7.5, 0);
  model.add(bonnet);

  // Spring housing (wider cylinder on top)
  const springHousing = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 2, 32), springHousingMat);
  springHousing.position.set(0, 10, 0);
  model.add(springHousing);

  // Top cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.3, 32), flangeMat);
  cap.position.set(0, 11.15, 0);
  model.add(cap);

  // Inlet flange (bottom)
  const inletFlange = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.4, 32), flangeMat);
  inletFlange.position.set(0, 0.2, 0);
  model.add(inletFlange);

  // Inlet bolt holes (8 bolts)
  const boltCount = 8;
  const boltR = 2.4;
  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8), flangeMat);
    bolt.position.set(
      Math.cos(angle) * boltR,
      0.2,
      Math.sin(angle) * boltR
    );
    model.add(bolt);
  }

  // Outlet flange (on side, near top of body)
  const outletFlange = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.4, 24), flangeMat);
  outletFlange.rotation.z = Math.PI / 2;
  outletFlange.position.set(4.2, 8, 0);
  model.add(outletFlange);

  // Nozzle (extends from body toward outlet)
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.5, 24), bodyMat);
  nozzle.rotation.z = Math.PI / 2;
  nozzle.position.set(3.25, 6.5, 0);
  model.add(nozzle);

  // Seat ring (torus on top of nozzle)
  const seatRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.15, 12, 24),
    goldMat
  );
  seatRing.rotation.x = Math.PI / 2;
  seatRing.position.set(3.25, 8.2, 0);
  model.add(seatRing);

  // Plug (disc that seals against seat)
  const plug = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.3, 24), goldMat);
  plug.rotation.x = Math.PI / 2;
  plug.position.set(3.25, 6.5, 0);
  model.add(plug);

  // Spring (simplified as a coiled wire)
  const springCurve = new THREE.Curve();
  const springPoints = [];
  const springCoils = 6;
  const springHeight = 2.5;
  const springRadius = 1.2;
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const angle = t * springCoils * Math.PI * 2;
    springPoints.push(new THREE.Vector3(
      Math.cos(angle) * springRadius,
      8.5 + t * springHeight,
      Math.sin(angle) * springRadius
    ));
  }
  const springGeometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(springPoints),
    100, 0.08, 8, false
  );
  const spring = new THREE.Mesh(springGeometry, springMat);
  model.add(spring);

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
  cutawayGoldMat.opacity = 0.85;

  const cutawayBody = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 6, 32), cutawayMat);
  cutawayBody.position.set(0, 3, 0);
  cutawayModel.add(cutawayBody);

  const cutawayBonnet = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3, 32), cutawayBonnetMat);
  cutawayBonnet.position.set(0, 7.5, 0);
  cutawayModel.add(cutawayBonnet);

  const cutawaySpringHousing = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 2, 32), cutawaySpringHousingMat);
  cutawaySpringHousing.position.set(0, 10, 0);
  cutawayModel.add(cutawaySpringHousing);

  const cutawayCap = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.3, 32), cutawayFlangeMat);
  cutawayCap.position.set(0, 11.15, 0);
  cutawayModel.add(cutawayCap);

  const cutawayInletFlange = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.4, 32), cutawayFlangeMat);
  cutawayInletFlange.position.set(0, 0.2, 0);
  cutawayModel.add(cutawayInletFlange);

  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8), cutawayFlangeMat);
    bolt.position.set(Math.cos(angle) * boltR, 0.2, Math.sin(angle) * boltR);
    cutawayModel.add(bolt);
  }

  const cutawayOutletFlange = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.4, 24), cutawayFlangeMat);
  cutawayOutletFlange.rotation.z = Math.PI / 2;
  cutawayOutletFlange.position.set(4.2, 8, 0);
  cutawayModel.add(cutawayOutletFlange);

  const cutawayNozzle = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.5, 24), cutawayMat);
  cutawayNozzle.rotation.z = Math.PI / 2;
  cutawayNozzle.position.set(3.25, 6.5, 0);
  cutawayModel.add(cutawayNozzle);

  const cutawaySeatRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.15, 12, 24),
    cutawayGoldMat
  );
  cutawaySeatRing.rotation.x = Math.PI / 2;
  cutawaySeatRing.position.set(3.25, 8.2, 0);
  cutawayModel.add(cutawaySeatRing);

  const cutawayPlug = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.3, 24), cutawayGoldMat);
  cutawayPlug.rotation.x = Math.PI / 2;
  cutawayPlug.position.set(3.25, 6.5, 0);
  cutawayModel.add(cutawayPlug);

  const cutawaySpringPoints = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const angle = t * springCoils * Math.PI * 2;
    cutawaySpringPoints.push(new THREE.Vector3(
      Math.cos(angle) * springRadius,
      8.5 + t * springHeight,
      Math.sin(angle) * springRadius
    ));
  }
  const cutawaySpringGeometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(cutawaySpringPoints),
    100, 0.08, 8, false
  );
  const cutawaySpring = new THREE.Mesh(cutawaySpringGeometry, springMat);
  cutawayModel.add(cutawaySpring);

  scene.add(model);
  scene.add(cutawayModel);
  cutawayModel.visible = false;

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;
  controls.target.set(2, 5, 0);
  controls.minDistance = 5;
  controls.maxDistance = 20;
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

  // Labels
  const labelPositions = [
    { text: 'Seat face', pos: new THREE.Vector3(3.25, 8.8, 1.2) },
    { text: 'Plug face', pos: new THREE.Vector3(3.25, 6.0, 1.2) },
    { text: 'Back seat', pos: new THREE.Vector3(1.5, 6.5, 1.2) },
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
