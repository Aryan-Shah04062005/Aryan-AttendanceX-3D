import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ChartDataItem {
  label: string;
  value: number;
  secondaryValue?: number; // e.g. Absent count
}

interface Charts3DProps {
  data: ChartDataItem[];
  type: 'bar' | 'donut';
  height?: number;
}

export const Charts3D: React.FC<Charts3DProps> = ({ data, type, height = 300 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ show: boolean; text: string; x: number; y: number }>({
    show: false,
    text: '',
    x: 0,
    y: 0
  });

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    let width = container.clientWidth;
    
    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 18, 28);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x818cf8, 1, 100);
    pointLight.position.set(-10, 10, -10);
    scene.add(pointLight);

    // Group to hold chart elements
    const chartGroup = new THREE.Group();
    scene.add(chartGroup);

    const interactiveObjects: THREE.Object3D[] = [];

    // Colors
    const colorPrimary = 0x60a5fa; // Blue
    const colorSecondary = 0xa78bfa; // Purple
    const colorGreen = 0x34d399; // Green
    
    // Create elements based on type
    if (type === 'bar') {
      const barWidth = 1.8;
      const spacing = 1.2;
      const totalWidth = data.length * barWidth + (data.length - 1) * spacing;
      const startX = -totalWidth / 2 + barWidth / 2;

      // Find max value for normalization
      const maxVal = Math.max(...data.map(d => d.value + (d.secondaryValue || 0)), 1);

      // Floor grid
      const grid = new THREE.GridHelper(totalWidth + 10, 10, 0xffffff, 0xffffff);
      (grid.material as THREE.Material).opacity = 0.05;
      (grid.material as THREE.Material).transparent = true;
      grid.position.y = -0.01;
      chartGroup.add(grid);

      data.forEach((item, index) => {
        const xPos = startX + index * (barWidth + spacing);
        const normValue = (item.value / maxVal) * 10;
        
        // 3D Bar geometry (Present count)
        const geoPrimary = new THREE.BoxGeometry(barWidth, normValue, barWidth);
        
        // Move pivot to bottom of bar
        geoPrimary.translate(0, normValue / 2, 0);

        const matPrimary = new THREE.MeshStandardMaterial({
          color: colorPrimary,
          roughness: 0.1,
          metalness: 0.6,
          transparent: true,
          opacity: 0.85
        });

        const meshPrimary = new THREE.Mesh(geoPrimary, matPrimary);
        meshPrimary.position.set(xPos, 0, 0);
        meshPrimary.castShadow = true;
        meshPrimary.receiveShadow = true;
        
        // Attach raw values for tooltip raycasting
        meshPrimary.userData = {
          label: item.label,
          value: item.value,
          secondary: item.secondaryValue
        };

        chartGroup.add(meshPrimary);
        interactiveObjects.push(meshPrimary);

        // Optional stacked bar (Absent count)
        if (item.secondaryValue !== undefined && item.secondaryValue > 0) {
          const normSecVal = (item.secondaryValue / maxVal) * 10;
          const geoSec = new THREE.BoxGeometry(barWidth, normSecVal, barWidth);
          geoSec.translate(0, normSecVal / 2, 0);

          const matSec = new THREE.MeshStandardMaterial({
            color: colorSecondary,
            roughness: 0.1,
            metalness: 0.6,
            transparent: true,
            opacity: 0.85
          });

          const meshSec = new THREE.Mesh(geoSec, matSec);
          // Stack it on top of the primary bar
          meshSec.position.set(xPos, normValue, 0);
          meshSec.castShadow = true;
          meshSec.receiveShadow = true;
          meshSec.userData = {
            label: `${item.label} (Absent)`,
            value: item.secondaryValue,
            isSecondary: true
          };

          chartGroup.add(meshSec);
          interactiveObjects.push(meshSec);
        }
      });
    } else if (type === 'donut') {
      // Donut Chart for ratios
      const total = data.reduce((sum, item) => sum + item.value, 0);
      let currentAngle = 0;

      data.forEach((item) => {
        const percentage = item.value / (total || 1);

        const segmentAngle = percentage * Math.PI * 2;
        
        // Extrude cylinder sector
        const shape = new THREE.Shape();
        const innerRadius = 3.5;
        const outerRadius = 5.5;
        
        // Draw sector arc
        shape.moveTo(Math.cos(currentAngle) * outerRadius, Math.sin(currentAngle) * outerRadius);
        shape.absarc(0, 0, outerRadius, currentAngle, currentAngle + segmentAngle, false);
        shape.lineTo(Math.cos(currentAngle + segmentAngle) * innerRadius, Math.sin(currentAngle + segmentAngle) * innerRadius);
        shape.absarc(0, 0, innerRadius, currentAngle + segmentAngle, currentAngle, true);

        const extrudeSettings = {
          depth: 1.5,
          bevelEnabled: true,
          bevelSegments: 3,
          steps: 1,
          bevelSize: 0.1,
          bevelThickness: 0.1
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        
        // Rotate geometry to lay flat on ground
        geometry.rotateX(-Math.PI / 2);

        // Pick color based on label
        let segColor = colorPrimary;
        if (item.label.toLowerCase().includes('absent') || item.label.toLowerCase().includes('leave')) {
          segColor = colorSecondary;
        } else if (item.label.toLowerCase().includes('late') || item.label.toLowerCase().includes('half')) {
          segColor = 0xfbbf24; // Amber yellow
        } else if (item.label.toLowerCase().includes('present')) {
          segColor = colorGreen;
        }

        const material = new THREE.MeshStandardMaterial({
          color: segColor,
          roughness: 0.1,
          metalness: 0.5,
          transparent: true,
          opacity: 0.85
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = {
          label: item.label,
          value: item.value,
          percentage: (percentage * 100).toFixed(1)
        };

        chartGroup.add(mesh);
        interactiveObjects.push(mesh);

        currentAngle += segmentAngle;
      });
    }

    // Raycasting for Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      // Calculate mouse position relative to canvas
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      // Reset all materials emissive color
      interactiveObjects.forEach((obj) => {
        const mesh = obj as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0x000000);
      });

      if (intersects.length > 0) {
        const hoveredObj = intersects[0].object as THREE.Mesh;
        const mat = hoveredObj.material as THREE.MeshStandardMaterial;
        
        // Glow effect on hover
        mat.emissive.setHex(0x222222);

        const uData = hoveredObj.userData;
        let tooltipText = '';
        if (type === 'bar') {
          tooltipText = `${uData.label}: ${uData.value}`;
          if (uData.secondary !== undefined) {
             tooltipText += ` | Absent: ${uData.secondary}`;
          }
        } else {
          tooltipText = `${uData.label}: ${uData.value} (${uData.percentage}%)`;
        }

        // Adjust coordinates relative to container
        setTooltip({
          show: true,
          text: tooltipText,
          x: event.clientX - rect.left + 10,
          y: event.clientY - rect.top - 40
        });
      } else {
        setTooltip(prev => ({ ...prev, show: false }));
      }
    };

    const handleMouseLeave = () => {
      setTooltip(prev => ({ ...prev, show: false }));
      // Reset emissive
      interactiveObjects.forEach((obj) => {
        const mesh = obj as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0x000000);
      });
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      const touch = event.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      // Reset all materials emissive color
      interactiveObjects.forEach((obj) => {
        const mesh = obj as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0x000000);
      });

      if (intersects.length > 0) {
        const hoveredObj = intersects[0].object as THREE.Mesh;
        const mat = hoveredObj.material as THREE.MeshStandardMaterial;
        
        // Glow effect
        mat.emissive.setHex(0x222222);

        const uData = hoveredObj.userData;
        let tooltipText = '';
        if (type === 'bar') {
          tooltipText = `${uData.label}: ${uData.value}`;
          if (uData.secondary !== undefined) {
             tooltipText += ` | Absent: ${uData.secondary}`;
          }
        } else {
          tooltipText = `${uData.label}: ${uData.value} (${uData.percentage}%)`;
        }

        setTooltip({
          show: true,
          text: tooltipText,
          x: touch.clientX - rect.left + 10,
          y: touch.clientY - rect.top - 40
        });
      } else {
        setTooltip(prev => ({ ...prev, show: false }));
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchStart, { passive: true });

    // Smooth subtle chart rotation
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Slowly rotate chart group
      chartGroup.rotation.y += 0.003;
      
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      width = container.clientWidth;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchStart);
      resizeObserver.disconnect();
      
      // Dispose geometries & materials
      chartGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [data, type, height]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden select-none">
      <canvas ref={canvasRef} className="block cursor-pointer mx-auto" />
      {tooltip.show && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-950/90 text-cyber-silver text-xs rounded-lg px-3 py-1.5 border border-white/20 shadow-lg backdrop-blur-md transition-all duration-75"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};
