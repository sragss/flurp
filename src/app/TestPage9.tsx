import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';

// Animation constants
const BORDER_WIDTH_INITIAL = 5;
const BORDER_WIDTH_PEAK = 30;
const BORDER_WIDTH_RANGE = BORDER_WIDTH_PEAK - BORDER_WIDTH_INITIAL;
const DECAY_SPEED = 0.002;
const BORDER_COLOR = new THREE.Vector3(0.0196, 0.7804, 0.8); // #05C7CC in RGB

// Define shader material for blurred border
const BorderShaderMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(800, 600),
    borderWidth: BORDER_WIDTH_INITIAL,
    time: 0.0,
    color1: new THREE.Vector3(0.0196, 0.7804, 0.8), // #05C7CC - Cyan
    color2: new THREE.Vector3(0.8, 0.0196, 0.7804), // #CC05C7 - Magenta
    wave1Amplitude: 0.8,
    wave2Amplitude: 2,
    wave1Speed: 8.0,
    wave2Speed: 1.0,
    wave1Frequency: 6.0,
    wave2Frequency: 4.0
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
  uniform float time;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float wave1Amplitude;
  uniform float wave2Amplitude;
  uniform float wave1Speed;
  uniform float wave2Speed;
  uniform float wave1Frequency;
  uniform float wave2Frequency;

  void main() {
    // Convert UV to pixel coordinates
    vec2 pixelCoord = vUv * resolution;
    
    // Calculate center-relative coordinates
    vec2 fromCenter = pixelCoord - resolution * 0.5;
    
    // Get rotation angle for current pixel
    float angle = atan(fromCenter.y, fromCenter.x);
    
    // Vary border width based on angle and time for first wave
    // Add 1.0 to shift sine wave up to [0,2] range instead of [-1,1]
    float variedBorderWidth1 = borderWidth * (1.0 + wave1Amplitude * (sin(angle * wave1Frequency + time * wave1Speed) + 1.0));
    
    // Time shifted second wave, also shifted up
    float variedBorderWidth2 = borderWidth * (1.0 + wave2Amplitude * (sin(angle * wave2Frequency + (time + 0.5) * wave2Speed) + 1.0));
    
    // Calculate distance from edges
    float distFromLeft = pixelCoord.x;
    float distFromRight = resolution.x - pixelCoord.x;
    float distFromTop = resolution.y - pixelCoord.y;
    float distFromBottom = pixelCoord.y;
    
    // Find minimum distance to any edge
    float minDist = min(min(distFromLeft, distFromRight), min(distFromTop, distFromBottom));
    
    // Create smooth border transition with varied width for both waves
    float borderIntensity1 = 1.0 - smoothstep(0.0, variedBorderWidth1, minDist);
    float borderIntensity2 = 1.0 - smoothstep(0.0, variedBorderWidth2, minDist);
    
    // Apply Gaussian blur to both borders
    float sigma1 = variedBorderWidth1 * 0.3;
    float sigma2 = variedBorderWidth2 * 0.3;
    float blur1 = exp(-(minDist * minDist) / (2.0 * sigma1 * sigma1));
    float blur2 = exp(-(minDist * minDist) / (2.0 * sigma2 * sigma2));
    
    float alpha1 = borderIntensity1 * blur1;
    float alpha2 = borderIntensity2 * blur2;
    
    // Mix the two waves
    vec3 finalColor = mix(color1, color2, alpha2 / (alpha1 + alpha2));
    float finalAlpha = max(alpha1, alpha2);
    
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
  `
);

// Register the shader material
extend({ BorderShaderMaterial });

const BorderPlane = ({ width, height, borderWidth }: { width: number, height: number, borderWidth: number }) => {
  const ref = useRef<THREE.ShaderMaterial>();
  const { size } = useThree();

  useEffect(() => {
    if (ref.current) {
      ref.current.uniforms.resolution.value.set(size.width, size.height);
    }
  }, [size]);

  useEffect(() => {
    if (ref.current) {
      ref.current.uniforms.borderWidth.value = borderWidth;
    }
  }, [borderWidth]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <borderShaderMaterial ref={ref} attach="material" transparent />
    </mesh>
  );
};

function TestPage9() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [borderWidth, setBorderWidth] = useState(BORDER_WIDTH_INITIAL);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

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

  const handlePulse = () => {
    setBorderWidth(BORDER_WIDTH_PEAK);
    lastTimeRef.current = Date.now();
    cancelAnimationFrame(animationRef.current);
    
    const animate = () => {
      const elapsed = Date.now() - lastTimeRef.current;
      const decay = Math.exp(-elapsed * DECAY_SPEED);
      const newWidth = BORDER_WIDTH_INITIAL + (BORDER_WIDTH_RANGE * decay);
      
      setBorderWidth(newWidth);
      
      if (newWidth > BORDER_WIDTH_INITIAL + 0.1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setBorderWidth(BORDER_WIDTH_INITIAL);
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
            />
          </Canvas>
          <div className="absolute m-auto inset-0 h-fit w-fit flex flex-col gap-4">
            <button
              onClick={handlePulse}
              className="px-6 py-3 bg-[#4C4C4C] text-white border border-black rounded hover:bg-[#333333] transition-colors font-bold active:scale-95 active:bg-[#222222] transform duration-100"
            >
              PULSE
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TestPage9; 