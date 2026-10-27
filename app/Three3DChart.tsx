"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// --- DATA ---
const histData = [
  { id: 'h1', range: '0–15ms', label: 'Ultra-low sub-network', freq: '1,420', pct: 6.4, z: -2.4, h: 3.2, color: 0x60a5fa, sub: 'London LD4 fastpath' },
  { id: 'h2', range: '15–30ms', label: 'Core consensus fastpath', freq: '2,890', pct: 13.1, z: -1.8, h: 6.5, color: 0x22d3ee, sub: 'Equinix NY4' },
  { id: 'h3', range: '30–45ms', label: 'Optimistic validation', freq: '4,720', pct: 21.4, z: -0.9, h: 10.8, color: 0x34d399, sub: 'ZK rollup' },
  { id: 'h4', range: '45–60ms', label: 'Median cluster peak', freq: '6,240', pct: 28.3, z: 0.0, h: 14.4, color: 0xfbbf24, sub: 'Gaussian mean' },
  { id: 'h5', range: '60–75ms', label: 'Cross-rollup ingestion', freq: '3,950', pct: 17.9, z: 0.8, h: 9.0, color: 0xfb923c, sub: 'Inter-exchange' },
  { id: 'h6', range: '75–90ms', label: 'High-congestion tail', freq: '1,840', pct: 8.3, z: 1.6, h: 4.4, color: 0xf97316, sub: 'Global outlier' },
  { id: 'h7', range: '90ms+', label: 'Extreme outlier', freq: '1,030', pct: 4.6, z: 2.5, h: 2.3, color: 0xf43f5e, sub: 'Degraded gateway' },
];

const barData = [
  { q: 'Q1', label: 'Q1 · Charcoal', val: '₦2.84M', raw: 7.1, pct: '+14.2%', color: 0xfbbf24, col: 0, row: 0 },
  { q: 'Q1', label: 'Q1 · Bitterleaf', val: '₦4.12M', raw: 10.3, pct: '+22.5%', color: 0x60a5fa, col: 0, row: 1 },
  { q: 'Q1', label: 'Q1 · Scrap iron', val: '₦1.95M', raw: 4.8, pct: '+8.1%', color: 0x34d399, col: 0, row: 2 },
  { q: 'Q2', label: 'Q2 · Charcoal', val: '₦3.90M', raw: 9.7, pct: '+18.4%', color: 0xfbbf24, col: 1, row: 0 },
  { q: 'Q2', label: 'Q2 · Bitterleaf', val: '₦5.80M', raw: 14.5, pct: '+31.0%', color: 0x60a5fa, col: 1, row: 1 },
  { q: 'Q2', label: 'Q2 · Scrap iron', val: '₦2.60M', raw: 6.5, pct: '+12.7%', color: 0x34d399, col: 1, row: 2 },
  { q: 'Q3', label: 'Q3 · Charcoal', val: '₦5.40M', raw: 13.5, pct: '+26.8%', color: 0xfbbf24, col: 2, row: 0 },
  { q: 'Q3', label: 'Q3 · Bitterleaf', val: '₦7.95M', raw: 19.8, pct: '+48.2%', color: 0x60a5fa, col: 2, row: 1 },
  { q: 'Q3', label: 'Q3 · Scrap iron', val: '₦3.80M', raw: 9.5, pct: '+19.3%', color: 0x34d399, col: 2, row: 2 },
  { q: 'Q4', label: 'Q4 · Charcoal', val: '₦7.20M', raw: 18.0, pct: '+41.5%', color: 0xfbbf24, col: 3, row: 0 },
  { q: 'Q4', label: 'Q4 · Bitterleaf', val: '₦9.60M', raw: 24.0, pct: '+64.7%', color: 0x60a5fa, col: 3, row: 1 },
  { q: 'Q4', label: 'Q4 · Scrap iron', val: '₦4.90M', raw: 12.2, pct: '+24.6%', color: 0x34d399, col: 3, row: 2 },
];

const donutData = [
  { id: 'd1', label: 'Charcoal', share: 34.5, val: '₦14.28M', yld: '+38.4%', color: 0x38bdf8, h: 4.6, cat: 'Fuel' },
  { id: 'd2', label: 'Bitterleaf', share: 26.0, val: '₦10.76M', yld: '+24.1%', color: 0xfbbf24, h: 3.8, cat: 'Vegetable' },
  { id: 'd3', label: 'Scrap iron', share: 18.5, val: '₦7.65M', yld: '+42.8%', color: 0xf43f5e, h: 3.2, cat: 'Metal' },
  { id: 'd4', label: 'Engine oil', share: 12.0, val: '₦4.96M', yld: '+19.6%', color: 0x34d399, h: 2.6, cat: 'Liquid' },
  { id: 'd5', label: 'Others', share: 9.0, val: '₦3.72M', yld: '+8.2%', color: 0xcbd5e1, h: 2.0, cat: 'Mixed' },
];

const graphNodes = [
  { id: 'core', label: 'Enugu Hub', cat: 'Core market', val: '₦4.2M', txs: '142k', r: 3.0, color: 0xfbbf24, pos: [0, 0, 0] },
  { id: 'a', label: 'Onitsha', cat: 'Vegetables', val: '₦890k', txs: '45k', r: 2.0, color: 0x60a5fa, pos: [-15, 12, 7] },
  { id: 'b', label: 'Kano', cat: 'Metals', val: '₦640k', txs: '31k', r: 1.9, color: 0x22d3ee, pos: [16, 11, -5] },
  { id: 'c', label: 'P/H', cat: 'Liquids', val: '₦1.1M', txs: '68k', r: 2.3, color: 0x34d399, pos: [13, -13, 9] },
  { id: 'd', label: 'Aba', cat: 'Mixed', val: '₦420k', txs: '19k', r: 1.7, color: 0xf43f5e, pos: [-17, -11, -11] },
  { id: 'e', label: 'Ibadan', cat: 'Grains', val: '₦750k', txs: '39k', r: 1.9, color: 0x60a5fa, pos: [0, 20, -13] },
  { id: 'f', label: 'Jos', cat: 'Tubers', val: '₦310k', txs: '14k', r: 1.6, color: 0xcbd5e1, pos: [-22, 2, 13] },
  { id: 'g', label: 'Benin', cat: 'Oils', val: '₦530k', txs: '26k', r: 1.8, color: 0x34d399, pos: [20, -2, -16] },
  { id: 'h', label: 'Kaduna', cat: 'Nuts', val: '₦290k', txs: '12k', r: 1.5, color: 0xfbbf24, pos: [2, -20, 14] },
];

const graphEdges = [['core', 'a'], ['core', 'b'], ['core', 'c'], ['core', 'd'], ['core', 'e'], ['core', 'f'], ['core', 'g'], ['core', 'h'], ['a', 'b'], ['c', 'h']];

const PAL = {
  hist: [0x60a5fa, 0x22d3ee, 0x34d399, 0xfbbf24, 0xfb923c, 0xf97316, 0xf43f5e],
  bar: [0xfbbf24, 0x60a5fa, 0x34d399],
  donut: [0x38bdf8, 0xfbbf24, 0xf43f5e, 0x34d399, 0xcbd5e1],
  nodes: [0xfbbf24, 0x60a5fa, 0x22d3ee, 0x34d399, 0xf43f5e, 0x60a5fa, 0xcbd5e1, 0x34d399, 0xfbbf24],
  emissiveIdle: 0.55,
  emissiveSelected: 1.15,
  metalness: 0.20,
  roughness: 0.42,
  fog: 0x0a0c10,
  grid: 0x334155,
  gridSub: 0x1e293b,
  gridOp: 0.65,
};

export default function Three3DChart() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'histogram' | 'bar' | 'donut' | 'graph'>('histogram');
  const [inspector, setInspector] = useState<any>(histData[3]);
  
  // We store references to the Three.js objects to manipulate them
  const sceneRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    groups: Record<string, THREE.Group>;
    animationId?: number;
  }>({ scene: null, camera: null, renderer: null, groups: {} });

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Setup Scene
    const W = mountRef.current.clientWidth;
    const H = mountRef.current.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(PAL.fog, 70, 140);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 400);
    camera.position.set(0, 24, 42);
    camera.lookAt(0, 6, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mountRef.current.appendChild(renderer.domElement);

    // 2. Lighting
    const hemi = new THREE.HemisphereLight(0xa8c4e0, 0x0a0c10, 1.0);
    scene.add(hemi);
    const keyL = new THREE.DirectionalLight(0xffffff, 1.0);
    keyL.position.set(20, 40, 30);
    scene.add(keyL);

    // 3. Groups
    const groups = {
      histogram: new THREE.Group(),
      bar: new THREE.Group(),
      donut: new THREE.Group(),
      graph: new THREE.Group(),
    };
    Object.values(groups).forEach(g => scene.add(g));
    groups.bar.visible = false;
    groups.donut.visible = false;
    groups.graph.visible = false;

    // 4. Build Meshes
    const meshes: Record<string, THREE.Mesh[]> = { histogram: [], bar: [], donut: [], graph: [] };

    // --- Histogram ---
    const sp = 4.6, w = 3.6, d = 9.5, startX = -((histData.length - 1) * sp) / 2;
    histData.forEach((it, i) => {
      const geo = new THREE.BoxGeometry(w, it.h, d);
      geo.translate(0, it.h / 2, 0);
      const mat = new THREE.MeshStandardMaterial({ color: it.color, emissive: it.color, emissiveIntensity: PAL.emissiveIdle });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = startX + i * sp;
      mesh.userData = { type: 'histogram', data: it };
      groups.histogram.add(mesh);
      meshes.histogram.push(mesh);
    });

    // --- Bar ---
    const cg = 7.5, rg = 6.5, ox = -11.25, oz = -6.5;
    barData.forEach((it, i) => {
      const geo = new THREE.BoxGeometry(3.0, it.raw, 3.0);
      geo.translate(0, it.raw / 2, 0);
      const mat = new THREE.MeshStandardMaterial({ color: it.color, emissive: it.color, emissiveIntensity: PAL.emissiveIdle });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ox + it.col * cg, 0, oz + it.row * rg);
      mesh.userData = { type: 'bar', data: it };
      groups.bar.add(mesh);
      meshes.bar.push(mesh);
    });

    // --- Graph ---
    const nodeMap: Record<string, THREE.Mesh> = {};
    graphNodes.forEach(it => {
      const geo = new THREE.SphereGeometry(it.r, 20, 20);
      const mat = new THREE.MeshStandardMaterial({ color: it.color, emissive: it.color, emissiveIntensity: PAL.emissiveIdle });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(it.pos[0], it.pos[1], it.pos[2]);
      mesh.userData = { type: 'graph', data: it };
      groups.graph.add(mesh);
      meshes.graph.push(mesh);
      nodeMap[it.id] = mesh;
    });
    // Graph Edges
    graphEdges.forEach(([a, b]) => {
      if (!nodeMap[a] || !nodeMap[b]) return;
      const geo = new THREE.BufferGeometry().setFromPoints([nodeMap[a].position, nodeMap[b].position]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }));
      groups.graph.add(line);
    });

    // Save to ref
    sceneRef.current = { scene, camera, renderer, groups };

    // 5. Animation Loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Slow rotation for visual effect
      groups.histogram.rotation.y += 0.001;
      groups.bar.rotation.y += 0.001;
      groups.graph.rotation.y += 0.001;
      
      renderer.render(scene, camera);
    };
    animate();

    // 6. Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 7. Raycaster (Click detection)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const onClick = (e: MouseEvent) => {
      const rect = mountRef.current!.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      const activeMeshes = meshes[mode] || [];
      const hits = raycaster.intersectObjects(activeMeshes, false);
      
      if (hits.length > 0) {
        const clickedMesh = hits[0].object as THREE.Mesh;
        const data = clickedMesh.userData.data;
        
        // Update Inspector UI
        setInspector(data);
        
        // Highlight selected
        activeMeshes.forEach(m => {
          (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 
            m === clickedMesh ? PAL.emissiveSelected : PAL.emissiveIdle;
        });
      }
    };
    mountRef.current.addEventListener("click", onClick);

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      if (mountRef.current) {
        mountRef.current.removeEventListener("click", onClick);
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []); // Run once on mount

  // Handle Mode Switching
  useEffect(() => {
    if (!sceneRef.current.groups) return;
    const { groups, camera } = sceneRef.current;
    
    Object.entries(groups).forEach(([k, g]) => {
      g.visible = (k === mode);
    });

    // Adjust camera based on mode
    if (camera) {
      if (mode === 'histogram') { camera.position.set(0, 24, 42); camera.lookAt(0, 6, 0); }
      if (mode === 'bar') { camera.position.set(22, 26, 40); camera.lookAt(0, 6, 0); }
      if (mode === 'donut') { camera.position.set(0, 30, 40); camera.lookAt(0, 2, 0); }
      if (mode === 'graph') { camera.position.set(0, 10, 72); camera.lookAt(0, 0, 0); }
    }

    // Set initial inspector data
    if (mode === 'histogram') setInspector(histData[3]);
    if (mode === 'bar') setInspector(barData[10]);
    if (mode === 'donut') setInspector(donutData[0]);
    if (mode === 'graph') setInspector(graphNodes[0]);

  }, [mode]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* 3D Canvas Container */}
      <div ref={mountRef} className="flex-1 w-full relative cursor-crosshair" />

      {/* Top Toolbar (Mode Switcher) */}
      <div className="absolute top-4 left-4 flex items-center gap-1 bg-[#0e1116]/80 backdrop-blur-md p-1 rounded-lg border border-white/10 z-10">
        {(['histogram', 'bar', 'donut', 'graph'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${mode === m ? 'bg-yellow-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Bottom Inspector Panel */}
      <div className="border-t border-white/10 bg-[#0e1116] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-10 relative">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold text-xs font-mono">
            {inspector?.z === 0 ? 'μ' : mode === 'bar' ? inspector?.q : mode === 'donut' ? `${inspector?.share}%` : 'NODE'}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{inspector?.label || inspector?.name || "Select an item"}</div>
            <div className="text-xs font-mono text-gray-500 mt-0.5">
              {inspector?.sub || inspector?.cat || "Click any 3D element"}
            </div>
          </div>
        </div>
        
        {/* Dynamic Metrics */}
        <div className="flex gap-4">
          {mode === 'histogram' && (
            <>
              <div className="text-center"><div className="text-[10px] text-gray-500 font-mono">FREQ</div><div className="text-sm font-bold text-blue-400 font-mono">{inspector?.freq}</div></div>
              <div className="text-center"><div className="text-[10px] text-gray-500 font-mono">Z-SCORE</div><div className="text-sm font-bold text-yellow-500 font-mono">{inspector?.z?.toFixed(2)}σ</div></div>
              <div className="text-center"><div className="text-[10px] text-gray-500 font-mono">SHARE</div><div className="text-sm font-bold text-white font-mono">{inspector?.pct}%</div></div>
            </>
          )}
          {mode === 'bar' && (
            <>
              <div className="text-center"><div className="text-[10px] text-gray-500 font-mono">VALUE</div><div className="text-sm font-bold text-yellow-500 font-mono">{inspector?.val}</div></div>
              <div className="text-center"><div className="text-[10px] text-gray-500 font-mono">QoQ</div><div className="text-sm font-bold text-green-500 font-mono">{inspector?.pct}</div></div>
            </>
          )}
          {mode === 'donut' && (
            <>
              <div className="text-center"><div className="text-[10px] text-gray-500 font-mono">VALUE</div><div className="text-sm font-bold text-yellow-500 font-mono">{inspector?.val}</div></div>
              <div className="text-center"><div className="text-[10px] text-gray-500 font-mono">YIELD</div><div className="text-sm font-bold text-green-500 font-mono">{inspector?.yld}</div></div>
            </>
          )}
          {mode === 'graph' && (
            <>
              <div className="text-center"><div className="text-[10px] text-gray-500 font-mono">VOL</div><div className="text-sm font-bold text-yellow-500 font-mono">{inspector?.val}</div></div>
              <div className="text-center"><div className="text-[10px] text-gray-500 font-mono">FLOW</div><div className="text-sm font-bold text-blue-400 font-mono">{inspector?.txs}</div></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}