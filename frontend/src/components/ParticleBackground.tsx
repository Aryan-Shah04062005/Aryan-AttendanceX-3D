import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 100;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particle Geometry
    const particlesCount = 1200;
    const positions = new Float32Array(particlesCount * 3);
    const velocities = new Float32Array(particlesCount * 3);
    const randomScales = new Float32Array(particlesCount);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Position particles in a spherical/cloud structure
      positions[i] = (Math.random() - 0.5) * 200;     // X
      positions[i + 1] = (Math.random() - 0.5) * 200; // Y
      positions[i + 2] = (Math.random() - 0.5) * 200; // Z

      // Slow drift velocity
      velocities[i] = (Math.random() - 0.5) * 0.05;
      velocities[i + 1] = (Math.random() - 0.5) * 0.05;
      velocities[i + 2] = (Math.random() - 0.5) * 0.05;

      randomScales[i / 3] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Custom Canvas Texture for Glowing Circle Particles
    const createCircleTexture = () => {
      const size = 32;
      const canvasTex = document.createElement('canvas');
      canvasTex.width = size;
      canvasTex.height = size;
      const ctx = canvasTex.getContext('2d');
      if (ctx) {
        // Gradient for glow
        const gradient = ctx.createRadialGradient(
          size / 2,
          size / 2,
          0,
          size / 2,
          size / 2,
          size / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(129, 140, 248, 0.8)'); // Indigo
        gradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.2)'); // Purple glow
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
      }
      return new THREE.CanvasTexture(canvasTex);
    };

    const material = new THREE.PointsMaterial({
      size: 2.2,
      map: createCircleTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.75,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Grid System Helper (Futuristic Hologram Grid at bottom)
    const gridHelper = new THREE.GridHelper(200, 25, 0x818cf8, 0x0f172a);
    gridHelper.position.y = -60;
    gridHelper.rotation.x = 0.05;
    scene.add(gridHelper);

    // Mouse interactions
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - window.innerWidth / 2) * 0.03;
      mouseY = (event.clientY - window.innerHeight / 2) * 0.03;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth camera position easing based on mouse
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (-targetY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      // Rotate particles slowly
      particles.rotation.y = elapsedTime * 0.015;
      particles.rotation.x = elapsedTime * 0.008;

      // Animate grid helper
      gridHelper.rotation.y = elapsedTime * 0.005;

      // Modify particle positions in wave-like pattern
      const positionsArr = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        const x = positionsArr[i3];
        const z = positionsArr[i3 + 2];

        // Wave motion on Y coordinate
        positionsArr[i3 + 1] += Math.sin(elapsedTime + x * 0.1 + z * 0.1) * 0.02;

        // Apply slight speed drifts
        positionsArr[i3] += velocities[i3];
        positionsArr[i3 + 1] += velocities[i3 + 1];
        positionsArr[i3 + 2] += velocities[i3 + 2];

        // Boundary checks
        if (Math.abs(positionsArr[i3]) > 100) velocities[i3] *= -1;
        if (Math.abs(positionsArr[i3 + 1]) > 100) velocities[i3 + 1] *= -1;
        if (Math.abs(positionsArr[i3 + 2]) > 100) velocities[i3 + 2] *= -1;
      }
      geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 bg-cyber-dark"
    />
  );
};
