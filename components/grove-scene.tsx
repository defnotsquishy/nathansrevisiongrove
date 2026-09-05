'use client';
import { useEffect, useRef, useState } from 'react';
import { RotateCcw, RotateCw, Move } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Props = {
  count?: number;
  quiet?: boolean;
  mode?: 'tree' | 'cylinder' | 'cone' | 'sphere';
  radius?: number;
  height?: number;
  tint?: string;
};
export default function GroveScene({
  count = 0,
  quiet = false,
  mode = 'tree',
  radius = 3,
  height = 5,
  tint = '#b8f78b',
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const control = useRef<OrbitControls | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      // Renderer creation reports an external browser capability failure once.
      // eslint-disable-next-line react/react-compiler
      setFailed(true);
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    camera.position.set(7, 4.5, 8);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute(
      'aria-label',
      mode === 'tree'
        ? `Interactive progress tree. ${count} completed sessions.`
        : `Interactive ${mode} model`,
    );
    const controls = new OrbitControls(camera, renderer.domElement);
    control.current = controls;
    controls.target.set(0, 1.5, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 0.45;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.enableDamping = !quiet;
    controls.autoRotate = !quiet;
    controls.autoRotateSpeed = 0.45;
    scene.add(new THREE.HemisphereLight(0xd7ffc5, 0x273527, 2.2));
    const sun = new THREE.DirectionalLight(0xfff2cf, 4);
    sun.position.set(-3, 7, 4);
    scene.add(sun);
    const rim = new THREE.PointLight(0x9f92ff, 16, 15);
    rim.position.set(3, 3, -3);
    scene.add(rim);
    const group = new THREE.Group();
    scene.add(group);
    const material = (colour: THREE.ColorRepresentation, emissive = 0) =>
      new THREE.MeshStandardMaterial({
        color: colour,
        roughness: 0.77,
        metalness: 0.12,
        flatShading: true,
        emissive: colour,
        emissiveIntensity: emissive,
      });
    const mesh = (
      geometry: THREE.BufferGeometry,
      mat: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
    ) => {
      const m = new THREE.Mesh(geometry, mat);
      m.position.set(x, y, z);
      group.add(m);
      return m;
    };
    const bark = material('#707657');
    function branch(a: THREE.Vector3, b: THREE.Vector3, r: number) {
      const dir = b.clone().sub(a);
      const m = mesh(
        new THREE.CylinderGeometry(r * 0.62, r, dir.length(), 7),
        bark,
      );
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.normalize(),
      );
    }
    if (mode === 'tree') {
      mesh(
        new THREE.CylinderGeometry(1.85, 1.45, 0.3, 12),
        material('#344b36'),
        0,
        -0.13,
      );
      mesh(
        new THREE.ConeGeometry(1.55, 1.2, 9),
        material('#29392d'),
        0,
        -0.73,
      ).rotation.z = Math.PI;
      mesh(
        new THREE.TorusGeometry(1.95, 0.018, 8, 100),
        material('#b7eb8a', 0.9),
        0,
        -0.02,
      ).rotation.x = Math.PI / 2;
      mesh(
        new THREE.TorusGeometry(2.2, 0.006, 4, 100),
        material('#586749', 0.2),
        0,
        -0.17,
      ).rotation.x = Math.PI / 2;
      const growth = Math.min(1, count / 35),
        top = 2.65 + growth * 0.75;
      branch(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.12, 1.25, 0),
        0.19 + growth * 0.055,
      );
      branch(
        new THREE.Vector3(0.12, 1.25, 0),
        new THREE.Vector3(-0.15, top, 0),
        0.12,
      );
      const leafMaterials = [
        material(tint, 0.17),
        material('#78ac60', 0.07),
        material('#d5ef9a', 0.13),
        material('#93cc80', 0.14),
        material('#548e6a', 0.08),
      ];
      const branchCount = 6 + Math.min(8, Math.floor(count / 3));
      for (let i = 0; i < branchCount; i++) {
        const theta = i * 2.39996;
        const spread = (1 + growth * 0.5) * (i % 3 === 0 ? 1.12 : 0.86);
        const y = 1.25 + (i % 4) * 0.36;
        const end = new THREE.Vector3(
          Math.cos(theta) * spread,
          y + 0.55,
          Math.sin(theta) * spread,
        );
        branch(new THREE.Vector3(0.08, y - 0.48, 0), end, 0.09);
        const tip = end
          .clone()
          .add(
            new THREE.Vector3(
              Math.cos(theta) * 0.25,
              0.28,
              Math.sin(theta) * 0.25,
            ),
          );
        branch(end, tip, 0.047);
        for (let j = 0; j < 6; j++) {
          const angle = j * 2.399 + i;
          const leaf = mesh(
            new THREE.IcosahedronGeometry(0.44 + growth * 0.13, 0),
            leafMaterials[(i + j) % 5],
            tip.x + Math.cos(angle) * 0.4,
            tip.y + (j % 3) * 0.15,
            tip.z + Math.sin(angle) * 0.4,
          );
          leaf.scale.set(1.15, 0.7, 1);
          leaf.rotation.set(i * 0.6, j * 0.3, i + j);
        }
      }
      for (let i = 0; i < 7; i++) {
        const leaf = mesh(
          new THREE.IcosahedronGeometry(0.48, 0),
          leafMaterials[i % 5],
          Math.sin(i * 2.4) * 0.36,
          top + 0.1 + (i % 3) * 0.15,
          Math.cos(i * 2.4) * 0.36,
        );
        leaf.scale.y = 0.75;
      }
      for (let i = 0; i < 10; i++) {
        const theta = i * 2.399;
        const rock = mesh(
          new THREE.DodecahedronGeometry(0.1 + (i % 3) * 0.08, 0),
          material(i % 2 ? '#69775a' : '#718d6b'),
          Math.cos(theta) * (1.2 + (i % 3) * 0.16),
          0.03,
          Math.sin(theta) * (1.2 + (i % 3) * 0.16),
        );
        rock.scale.y = 0.6;
        branch(
          new THREE.Vector3(0, 0.15, 0),
          new THREE.Vector3(Math.cos(theta) * 0.7, 0.02, Math.sin(theta) * 0.7),
          0.055,
        );
      }
      const p = new Float32Array(45 * 3);
      for (let i = 0; i < 45; i++) {
        p[i * 3] = Math.sin(i * 8.31) * 2.7;
        p[i * 3 + 1] = ((i * 17) % 41) / 10 - 0.5;
        p[i * 3 + 2] = Math.cos(i * 3.91) * 2.7;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
      group.add(
        new THREE.Points(
          geo,
          new THREE.PointsMaterial({
            color: '#dcffb2',
            size: 0.026,
            transparent: true,
            opacity: 0.65,
          }),
        ),
      );
      controls.target.set(0, 1.35, 0);
    } else {
      const r = radius * 0.32,
        h = height * 0.32;
      const geometry =
        mode === 'sphere'
          ? new THREE.SphereGeometry(r, 32, 20)
          : mode === 'cone'
            ? new THREE.ConeGeometry(r, h, 40)
            : new THREE.CylinderGeometry(r, r, h, 40);
      const solid = mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: '#c3b5fc',
          metalness: 0.25,
          roughness: 0.25,
          transparent: true,
          opacity: 0.8,
        }),
        0,
        1.25,
      );
      const edges = new THREE.LineSegments(
        new THREE.WireframeGeometry(geometry),
        new THREE.LineBasicMaterial({
          color: '#e4dcff',
          transparent: true,
          opacity: 0.17,
        }),
      );
      solid.add(edges);
      const grid = new THREE.GridHelper(6, 12, '#5d7659', '#28372b');
      grid.position.y = -0.7;
      scene.add(grid);
      controls.target.set(0, 0.8, 0);
      camera.position.set(6, 4, 7);
    }
    let visible = true;
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    observer.observe(element);
    const resize = new ResizeObserver(() => {
      const w = element.clientWidth,
        h = element.clientHeight;
      if (w && h) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      }
    });
    resize.observe(element);
    let frame = 0;
    let previous = 0;
    const animate = (t: number) => {
      frame = requestAnimationFrame(animate);
      if (!visible || document.hidden || t - previous < 32) return;
      previous = t;
      controls.update();
      if (!quiet && mode === 'tree')
        group.position.y = Math.sin(t * 0.0006) * 0.025;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      controls.dispose();
      control.current = null;
      scene.traverse((o) => {
        if (
          o instanceof THREE.Mesh ||
          o instanceof THREE.LineSegments ||
          o instanceof THREE.Points
        ) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [count, quiet, mode, radius, height, tint]);
  return (
    <div className="scene-wrap">
      <div className="scene" ref={host} />
      {failed ? (
        <div className="scene-fallback">
          <strong>
            {mode === 'tree'
              ? `${count} sessions planted`
              : 'Model unavailable'}
          </strong>
          <p>
            Your browser cannot display 3D. All planning and progress features
            still work.
          </p>
        </div>
      ) : (
        <div className="scene-controls">
          <span>
            <Move size={13} /> Drag to explore
          </span>
          <button
            aria-label="Rotate model left"
            onClick={() => {
              if (control.current) {
                control.current.object.position.applyAxisAngle(
                  new THREE.Vector3(0, 1, 0),
                  -0.3,
                );
                control.current.update();
              }
            }}
          >
            <RotateCcw size={15} />
          </button>
          <button
            aria-label="Rotate model right"
            onClick={() => {
              if (control.current) {
                control.current.object.position.applyAxisAngle(
                  new THREE.Vector3(0, 1, 0),
                  0.3,
                );
                control.current.update();
              }
            }}
          >
            <RotateCw size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
