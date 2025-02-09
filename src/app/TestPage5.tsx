import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrthographicCamera } from '@react-three/drei';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import { ExplosionButton } from './TestPage3';

// Define shader material for blurred border
const BorderShaderMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(800, 600),
    borderWidth: 10.0
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 resolution;
  uniform float borderWidth;

  void main() {
    // Convert UV to pixel coordinates
    vec2 pixelCoord = vUv * resolution;
    
    // Calculate distance from edges
    float distFromLeft = pixelCoord.x;
    float distFromRight = resolution.x - pixelCoord.x;
    float distFromTop = resolution.y - pixelCoord.y;
    float distFromBottom = pixelCoord.y;
    
    // Find minimum distance to any edge
    float minDist = min(min(distFromLeft, distFromRight), min(distFromTop, distFromBottom));
    
    // Create smooth border transition
    float borderIntensity = smoothstep(0.0, borderWidth, minDist);
    borderIntensity = 1.0 - borderIntensity; // Invert so border is visible
    
    // Apply Gaussian blur to the border
    float sigma = borderWidth * 0.3;
    float blur = exp(-(minDist * minDist) / (2.0 * sigma * sigma));
    
    vec3 color = vec3(0.0196, 0.7804, 0.8); // #05C7CC converted to RGB
    float alpha = borderIntensity * blur;
    
    gl_FragColor = vec4(color, alpha);
  }
  `
);

// Register the shader material
extend({ BorderShaderMaterial });

const BorderPlane = ({ width, height, borderWidth, setBorderWidth }: { width: number, height: number, borderWidth: number, setBorderWidth: (width: number) => void }) => {
  const ref = useRef<THREE.ShaderMaterial>();

  useEffect(() => {
    if (ref.current) {
      ref.current.uniforms.resolution.value.set(width, height);
    }
  }, [width, height]);

  useEffect(() => {
    if (ref.current) {
      ref.current.uniforms.borderWidth.value = borderWidth;
    }
  }, [borderWidth]);

  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <borderShaderMaterial ref={ref} attach="material" transparent />
    </mesh>
  );
};

function TestPage5() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [borderWidth, setBorderWidth] = useState(10);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }
  }, []);

  const handlePulse = () => {
    setBorderWidth(40);
    lastTimeRef.current = Date.now();
    cancelAnimationFrame(animationRef.current);
    
    const animate = () => {
      const elapsed = Date.now() - lastTimeRef.current;
      const decay = Math.exp(-elapsed * 0.003); // Adjust decay speed with this multiplier
      const newWidth = 10 + (80 * decay); // 30 is the difference between max (40) and min (10)
      
      setBorderWidth(newWidth);
      
      if (newWidth > 10.1) { // Continue animation until very close to 10
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setBorderWidth(10); // Snap to exactly 10 at the end
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div ref={containerRef} className="flex items-center justify-center h-screen w-screen relative">
      {dimensions.width > 0 && (
        <>
          <Canvas>
            <OrthographicCamera makeDefault position={[0, 0, 100]} />
            <BorderPlane 
              width={dimensions.width} 
              height={dimensions.height} 
              borderWidth={borderWidth}
              setBorderWidth={setBorderWidth}
            />
          </Canvas>
          <div className="absolute m-auto inset-0 h-fit w-fit flex flex-col gap-4">
            <button
              onClick={handlePulse}
              className="px-6 py-3 bg-[#4C4C4C] text-white border border-black rounded hover:bg-[#333333] transition-colors font-bold"
            >
              PULSE
            </button>
            <ExplosionButton
              className="px-6 py-3 bg-[#4C4C4C] text-white border border-black rounded hover:bg-[#333333] transition-colors font-bold"
              particleCount={1000}
              particleColor="#666666"
            >
              NO ACTION
            </ExplosionButton>
            <button
              onMouseEnter={handlePulse}
              className="px-6 py-3 bg-[#4C4C4C] text-white border border-black rounded hover:bg-[#333333] transition-colors font-bold"
            >
              HOVER PULSE 1
            </button>
            <button
              onMouseEnter={handlePulse}
              className="px-6 py-3 bg-[#4C4C4C] text-white border border-black rounded hover:bg-[#333333] transition-colors font-bold"
            >
              HOVER PULSE 2
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TestPage5;