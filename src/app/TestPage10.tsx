import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, Html } from '@react-three/drei';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';

const BUTTON_INSET = 10;
const WAVE_AMPLITUDE_NORMAL = 0.5;
const WAVE_AMPLITUDE_HOVER = 1.0;

// Define shader material for solid blue color
const ButtonShaderMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(800, 600),
    inset: BUTTON_INSET,
    time: 0.0,
    waveAmplitude: WAVE_AMPLITUDE_NORMAL,
    color: new THREE.Vector3(1, 0, 0) // Default red color
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
  uniform float inset;
  uniform float time;
  uniform float waveAmplitude;
  uniform vec3 color;

  void main() {
    // Convert UV to pixel coordinates.
    vec2 pixelCoord = vUv * resolution;
    
    // Calculate center-relative coordinates.
    vec2 fromCenter = pixelCoord - resolution * 0.5;
    
    // Normalize the center-relative coordinates to account for non-square resolution.
    vec2 normFromCenter = vec2(
      fromCenter.x / (resolution.x * 0.5),
      fromCenter.y / (resolution.y * 0.5)
    );
    
    // Get the angle using the normalized coordinates.
    float angle = atan(normFromCenter.y, normFromCenter.x);
    
    // Calculate distance from edges (in pixel coordinates).
    float distFromLeft   = pixelCoord.x;
    float distFromRight  = resolution.x - pixelCoord.x;
    float distFromTop    = resolution.y - pixelCoord.y;
    float distFromBottom = pixelCoord.y;
    
    // Find the minimum distance to any edge.
    float minDist = min(min(distFromLeft, distFromRight), min(distFromTop, distFromBottom));
    
    // Create a smooth border transition with a sine wave that now uses the corrected angle.
    float wave = (sin(angle * 2.0 + time * 2.0) + 1.0) * waveAmplitude + 0.2;
    float variedInset = inset * wave;
    float borderIntensity = smoothstep(0.0, variedInset, minDist);
    borderIntensity = 1.0 - borderIntensity;
    
    // Apply Gaussian blur to the border.
    float sigma = variedInset * 0.3;
    float blur = exp(-(minDist * minDist) / (2.0 * sigma * sigma));
    
    float alpha = borderIntensity * blur;
    
    gl_FragColor = vec4(color * alpha, alpha);
  }
  `
);

extend({ ButtonShaderMaterial });

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  color?: THREE.Vector3;
}

const ButtonMesh = ({ width, height, color = new THREE.Vector3(1, 0, 0) }: { width: number; height: number; color?: THREE.Vector3 }) => {
  const materialRef = useRef<THREE.ShaderMaterial>();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.set(width, height);
      materialRef.current.uniforms.color.value = color;
    }
  }, [width, height, color]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.waveAmplitude.value = isHovered ? WAVE_AMPLITUDE_HOVER : WAVE_AMPLITUDE_NORMAL;
    }
  }, [isHovered]);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      if (materialRef.current) {
        materialRef.current.uniforms.time.value = performance.now() / 1000;
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <mesh 
      position={[0, 0, 0]}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      <planeGeometry args={[width, height]} />
      <buttonShaderMaterial ref={materialRef} />
    </mesh>
  );
};

const FlurpButton = ({ children, className = "", color }: ButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ cursor: 'pointer' }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Canvas style={{ width: dimensions.width, height: dimensions.height }} orthographic camera={{ zoom: 1, position: [0, 0, 100] }}>
          <ButtonMesh width={dimensions.width} height={dimensions.height} color={color} />
          <Html
            className="absolute inset-0 flex items-center justify-center w-full text-center"
          >
            {children}
          </Html>
        </Canvas>
      )}
    </div>
  );
};

function TestPage10() {
  return (
    <div className="h-screen w-screen relative flex flex-col items-center justify-center gap-4">
      <FlurpButton className="w-72 h-20" color={new THREE.Vector3(1, 0, 0)}>
        <span className="text-white font-bold">CLICK</span>
      </FlurpButton>
      <FlurpButton className="w-72 h-10" color={new THREE.Vector3(0, 1, 0)}>
        <span className="text-white font-bold">PUNCH</span>
      </FlurpButton>
      <FlurpButton className="w-72 h-10" color={new THREE.Vector3(0.0196, 0.7804, 0.8)}>
        <span className="text-white font-bold">SMACK</span>
      </FlurpButton>
      <FlurpButton className="w-72 h-10" color={new THREE.Vector3(1, 1, 0)}>
        <span className="text-white font-bold">Flurp</span>
      </FlurpButton>
      <FlurpButton className="w-72 h-10" color={new THREE.Vector3(0.0196, 0.7804, 0.8)}>
        <span className="text-white font-bold">GLURP</span>
      </FlurpButton>
      <FlurpButton className="w-72 h-72" color={new THREE.Vector3(0.0196, 0.7804, 0.8)}>
        <span className="text-white font-bold">GLURP</span>
      </FlurpButton>
    </div>
  );
}

export default TestPage10;