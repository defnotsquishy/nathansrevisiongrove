'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const shapeDetails = {
  sphere: {
    title: 'Sphere',
    formula: 'V = 4/3 πr³',
    note: 'Every point on the surface is the same distance from the centre.',
  },
  cone: {
    title: 'Cone',
    formula: 'V = 1/3 πr²h',
    note: 'One third of the volume of a cylinder with the same base and height.',
  },
  cylinder: {
    title: 'Cylinder',
    formula: 'V = πr²h',
    note: 'The area of the circular base multiplied by its height.',
  },
} as const;
type Shape = keyof typeof shapeDetails;
const subscribeMotion = (callback: () => void) => {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};
export default function HomeStage() {
  const [shape, setShape] = useState<Shape>('sphere');
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const quiet = useSyncExternalStore(
    subscribeMotion,
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => true,
  );
  const host = useRef<HTMLDivElement>(null);
  const orbit = useRef<OrbitControls | null>(null);
  useEffect(() => {
    if (!host.current) return;
    const element = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      'aria-label',
      `Rotatable ${shape} geometry preview`,
    );
    renderer.domElement.setAttribute('role', 'img');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(5, 3.2, 7);
    const controls = new OrbitControls(camera, renderer.domElement);
    orbit.current = controls;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = false;
    controls.autoRotate = !paused && !quiet;
    controls.autoRotateSpeed = 1.3;
    controls.target.set(0, 0.1, 0);
    scene.add(new THREE.HemisphereLight('#ffe9d0', '#251109', 2));
    const key = new THREE.DirectionalLight('#fff0d6', 5);
    key.position.set(2, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#ff6b25', 8);
    rim.position.set(-4, 1, -3);
    scene.add(rim);
    const fill = new THREE.PointLight('#fa9c55', 35, 15);
    fill.position.set(4, -1, 1);
    scene.add(fill);
    const geometry =
      shape === 'sphere'
        ? new THREE.SphereGeometry(1.55, 48, 32)
        : shape === 'cone'
          ? new THREE.ConeGeometry(1.5, 2.9, 64)
          : new THREE.CylinderGeometry(1.35, 1.35, 2.45, 64);
    const solid = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: '#ba642e',
        metalness: 0.72,
        roughness: 0.3,
      }),
    );
    scene.add(solid);
    const wireGeometry =
      shape === 'sphere'
        ? new THREE.SphereGeometry(1.566, 20, 12)
        : shape === 'cone'
          ? new THREE.ConeGeometry(1.512, 2.925, 24, 8)
          : new THREE.CylinderGeometry(1.362, 1.362, 2.472, 24, 8);
    const wire = new THREE.Mesh(
      wireGeometry,
      new THREE.MeshBasicMaterial({
        color: '#ffb66b',
        wireframe: true,
        transparent: true,
        opacity: 0.14,
      }),
    );
    scene.add(wire);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.12, 0.009, 6, 128),
      new THREE.MeshBasicMaterial({
        color: '#d46d35',
        transparent: true,
        opacity: 0.55,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.7;
    scene.add(ring);
    const ring2 = ring.clone();
    ring2.scale.setScalar(1.15);
    ring2.position.y -= 0.08;
    scene.add(ring2);
    const resize = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    });
    resize.observe(element);
    let visible = true;
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersection.observe(element);
    renderer.setAnimationLoop(() => {
      if (visible && !document.hidden) {
        controls.update();
        renderer.render(scene, camera);
      }
    });
    return () => {
      resize.disconnect();
      intersection.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      orbit.current = null;
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [shape, quiet, paused]);
  const rotate = (direction: number) => {
    const controls = orbit.current;
    if (!controls) return;
    const position = controls.object.position.clone().sub(controls.target);
    position.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * 0.3);
    controls.object.position.copy(controls.target).add(position);
    controls.update();
  };
  return (
    <div className="home-model">
      <fieldset className="shape-selector">
        <legend className="sr-only">Choose a geometry preview</legend>
        {(Object.keys(shapeDetails) as Shape[]).map((key) => (
          <button
            key={key}
            aria-pressed={shape === key}
            onClick={() => setShape(key)}
          >
            {shapeDetails[key].title}
          </button>
        ))}
      </fieldset>
      <div className="model-stage" ref={host}>
        {failed && (
          <p className="model-unavailable">
            3D preview unavailable on this device. You can still use all
            revision tools.
          </p>
        )}
      </div>
      <div className="model-caption">
        <div>
          <span>GEOMETRY PREVIEW</span>
          <strong>{shapeDetails[shape].formula}</strong>
        </div>
        <div className="model-controls">
          <button
            onClick={() => rotate(-1)}
            aria-label="Rotate model left"
            disabled={failed}
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setPaused(!paused)}
            aria-label={
              paused || quiet ? 'Play model rotation' : 'Pause model rotation'
            }
            disabled={failed || quiet}
            title={
              quiet
                ? 'Motion follows your device reduced-motion preference'
                : undefined
            }
          >
            {paused || quiet ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            onClick={() => rotate(1)}
            aria-label="Rotate model right"
            disabled={failed}
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>
      <p className="model-fact" aria-live="polite">
        {shapeDetails[shape].note}
      </p>
    </div>
  );
}
