import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createSculptScene() {
  const container = document.getElementById('canvas-container');
  const renderer  = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x002FA7);
  renderer.outputColorSpace    = THREE.SRGBColorSpace;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5);

  const scene = new THREE.Scene();

  // ── PBR environment (studio-like IBL) ───────────────────
  // This is what makes MeshPhysicalMaterial feel 3D — real reflections
  // and ambient occlusion hints from a virtual room.
  const pmrem   = new THREE.PMREMGenerator(renderer);
  const envTex  = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmrem.dispose();

  // ── Direct lights layered on top of IBL ─────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  const key = new THREE.DirectionalLight(0xfff2d6, 2.6);
  key.position.set(4, 5, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x88aaff, 1.0);
  fill.position.set(-5, -1, 2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.8);
  rim.position.set(0, -3, -5);
  scene.add(rim);

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  return { renderer, scene, camera };
}
