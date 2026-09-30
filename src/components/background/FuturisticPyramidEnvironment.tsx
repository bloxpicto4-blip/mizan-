import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import pyramidBg from '../../assets/images/futuristic_giza_pyramids_1790772612439.jpg';
import { ActiveTab } from '../../types';

interface FuturisticPyramidEnvironmentProps {
  activeTab: ActiveTab;
}

export const FuturisticPyramidEnvironment: React.FC<FuturisticPyramidEnvironmentProps> = ({
  activeTab,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Parallax mouse tracker
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  // Track target camera settings per tab
  const tabConfigRef = useRef({
    home: { camX: 0, camY: 0.8, camZ: 14, lookY: 1.2, fogDensity: 0.025, lightIntensity: 1.2 },
    chat: { camX: 1.2, camY: 0.4, camZ: 16, lookY: 1.0, fogDensity: 0.035, lightIntensity: 0.9 },
    study: { camX: -1.5, camY: 1.5, camZ: 15, lookY: 1.5, fogDensity: 0.02, lightIntensity: 1.3 },
    history: { camX: 0.8, camY: 0.6, camZ: 17, lookY: 1.1, fogDensity: 0.03, lightIntensity: 0.85 },
    settings: { camX: 0, camY: 0.5, camZ: 18, lookY: 1.0, fogDensity: 0.038, lightIntensity: 0.75 },
    about: { camX: 0, camY: 1.8, camZ: 13, lookY: 2.2, fogDensity: 0.018, lightIntensity: 1.6 },
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseRef.current.targetX = (e.clientX / innerWidth - 0.5) * 2;
      mouseRef.current.targetY = -(e.clientY / innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060913, 0.028);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 1, 15);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

    // Ambient & Directional golden lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 0.8);
    scene.add(ambientLight);

    const horizonGoldLight = new THREE.DirectionalLight(0xf59e0b, 1.5);
    horizonGoldLight.position.set(0, -2, -10);
    scene.add(horizonGoldLight);

    const cyanRimLight = new THREE.DirectionalLight(0x06b6d4, 1.2);
    cyanRimLight.position.set(-8, 6, 8);
    scene.add(cyanRimLight);

    // Group for pyramids and landscape
    const pyramidsGroup = new THREE.Group();
    scene.add(pyramidsGroup);

    // Helper: create a 3D Pyramid with stone texture, edge wireframe glow, and apex capstone
    const createPyramid = (baseSize: number, height: number, position: THREE.Vector3, isKhufu = false) => {
      const group = new THREE.Group();

      // Procedural stone texture canvas for subtle block relief
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 256;
      texCanvas.height = 256;
      const ctx = texCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#1e293b';
        for (let y = 0; y < 256; y += 8) {
          ctx.fillRect(0, y, 256, 1);
        }
        for (let i = 0; i < 400; i++) {
          const x = Math.random() * 256;
          const y = Math.random() * 256;
          const w = 4 + Math.random() * 8;
          ctx.fillStyle = Math.random() > 0.5 ? '#172554' : '#0d1629';
          ctx.fillRect(x, y, w, 2);
        }
      }
      const stoneTexture = new THREE.CanvasTexture(texCanvas);
      stoneTexture.wrapS = THREE.RepeatWrapping;
      stoneTexture.wrapT = THREE.RepeatWrapping;
      stoneTexture.repeat.set(4, 4);

      // Solid Pyramid Mesh (4-sided cone)
      const geometry = new THREE.ConeGeometry(baseSize / Math.SQRT2, height, 4);
      geometry.rotateY(Math.PI / 4);

      const material = new THREE.MeshStandardMaterial({
        color: 0x090e1a,
        roughness: 0.75,
        metalness: 0.35,
        bumpMap: stoneTexture,
        bumpScale: 0.05,
      });

      const pyramidMesh = new THREE.Mesh(geometry, material);
      pyramidMesh.position.y = height / 2;
      group.add(pyramidMesh);

      // Golden Edge wireframe lines
      const edges = new THREE.EdgesGeometry(geometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: isKhufu ? 0xfbbf24 : 0xf59e0b,
        transparent: true,
        opacity: isKhufu ? 0.85 : 0.6,
        linewidth: 1.5,
      });
      const wireframe = new THREE.LineSegments(edges, edgeMaterial);
      wireframe.position.y = height / 2;
      group.add(wireframe);

      // Glowing Capstone at Apex
      const capstoneHeight = height * 0.12;
      const capstoneBase = (baseSize / Math.SQRT2) * 0.12;
      const capstoneGeo = new THREE.ConeGeometry(capstoneBase, capstoneHeight, 4);
      capstoneGeo.rotateY(Math.PI / 4);
      const capstoneMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.2,
      });
      const capstoneMesh = new THREE.Mesh(capstoneGeo, capstoneMat);
      capstoneMesh.position.y = height - capstoneHeight / 2;
      group.add(capstoneMesh);

      // Apex Point Light
      const apexLight = new THREE.PointLight(0xf59e0b, isKhufu ? 2.5 : 1.2, 12);
      apexLight.position.y = height + 0.1;
      group.add(apexLight);

      // Khufu Apex Celestial Light Beam
      if (isKhufu) {
        const beamGeo = new THREE.CylinderGeometry(0.04, 0.6, 12, 16, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.y = height + 6;
        group.add(beam);
      }

      group.position.copy(position);
      return group;
    };

    // Instantiate 3 iconic Giza Pyramids (Khufu, Khafre, Menkaure)
    const khufu = createPyramid(5.5, 4.2, new THREE.Vector3(0, -1.8, -5), true); // Great Pyramid
    const khafre = createPyramid(4.6, 3.8, new THREE.Vector3(-4.8, -1.9, -7.5), false); // Khafre
    const menkaure = createPyramid(2.8, 2.3, new THREE.Vector3(4.5, -2.0, -9), false); // Menkaure

    pyramidsGroup.add(khufu);
    pyramidsGroup.add(khafre);
    pyramidsGroup.add(menkaure);

    // Subtle desert horizon ground mesh with cyber grid
    const groundGeo = new THREE.PlaneGeometry(60, 40, 30, 20);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x050811,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -2.0;
    scene.add(ground);

    // Floating Golden & Cyan Micro-Particles (AI Energy Motes)
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    const goldColor = new THREE.Color(0xf59e0b);
    const cyanColor = new THREE.Color(0x38bdf8);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = Math.random() * 12 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25 - 5;

      const c = Math.random() > 0.35 ? goldColor : cyanColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      scales[i] = Math.random() * 2 + 0.5;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Material with circular soft sprite
    const partCanvas = document.createElement('canvas');
    partCanvas.width = 64;
    partCanvas.height = 64;
    const pctx = partCanvas.getContext('2d');
    if (pctx) {
      const grad = pctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(245, 158, 11, 0.8)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pctx.fillStyle = grad;
      pctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(partCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.35,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop with smooth Camera & Parallax Lerping
    let animationId: number;
    let clock = new THREE.Clock();

    const targetLookAt = new THREE.Vector3(0, 1.2, 0);
    const currentLookAt = new THREE.Vector3(0, 1.2, 0);

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      // Current target settings based on activeTab
      const activeConf = tabConfigRef.current[activeTab] || tabConfigRef.current.home;

      const targetCamX = activeConf.camX + mouseRef.current.x * 0.7;
      const targetCamY = activeConf.camY + mouseRef.current.y * 0.4;
      const targetCamZ = activeConf.camZ;

      // Smooth camera transition
      camera.position.x += (targetCamX - camera.position.x) * 0.035;
      camera.position.y += (targetCamY - camera.position.y) * 0.035;
      camera.position.z += (targetCamZ - camera.position.z) * 0.035;

      targetLookAt.set(mouseRef.current.x * 0.5, activeConf.lookY, 0);
      currentLookAt.lerp(targetLookAt, 0.035);
      camera.lookAt(currentLookAt);

      // Subtle pyramid floating breath
      pyramidsGroup.position.y = Math.sin(elapsed * 0.4) * 0.05;
      horizonGoldLight.intensity = activeConf.lightIntensity + Math.sin(elapsed * 0.8) * 0.15;

      // Particle floating drift
      const posArray = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        // Slowly rise and gently sway
        posArray[i * 3 + 1] += 0.005 + Math.sin(elapsed + i) * 0.002;
        posArray[i * 3] += Math.cos(elapsed * 0.2 + i) * 0.003;

        // Reset if too high
        if (posArray[i * 3 + 1] > 10) {
          posArray[i * 3 + 1] = -2;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [activeTab]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden select-none">
      {/* 1. Deep Matte Dark Sky Base */}
      <div className="absolute inset-0 bg-[#040711]" />

      {/* 2. High-Fidelity Futuristic Pyramids Backdrop Image with Parallax & Soft Glow */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-screen transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: `url(${pyramidBg})`,
          transform: `scale(1.05) translate(${mouseRef.current.targetX * -8}px, ${
            mouseRef.current.targetY * -5
          }px)`,
        }}
      />

      {/* 3. 3D WebGL Canvas Layer (3D Pyramids, golden wireframes, particles, apex light) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block opacity-90 transition-opacity duration-700"
      />

      {/* 4. Atmospheric Volumetric Fog Layers */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#02050c] via-[#060b17]/85 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-16 h-64 bg-gradient-to-t from-amber-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none opacity-60 animate-pulse-glow" />

      {/* 5. Liquid Glass Edge Reflections & Modern AI Radial Vignette */}
      {/* Crucial for Readability: The center is shielded with a dark translucent gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(6, 10, 22, 0.78) 0%, rgba(3, 6, 14, 0.92) 65%, rgba(2, 4, 10, 0.98) 100%)',
        }}
      />

      {/* 6. Subtle Cybernetic Grid Overlay on Far Horizon */}
      <div
        className="absolute inset-x-0 bottom-0 h-48 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(245, 158, 11, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* 7. Liquid Glass Top & Corner Refractions */}
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#02050e]/90 via-[#02050e]/40 to-transparent pointer-events-none" />
    </div>
  );
};
