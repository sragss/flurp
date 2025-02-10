import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';

// Animation constants
const BORDER_WIDTH_INITIAL = 10;
const BORDER_WIDTH_PEAK = 70;
const BORDER_WIDTH_RANGE = BORDER_WIDTH_PEAK - BORDER_WIDTH_INITIAL;
const DECAY_SPEED = 0.002;
const BORDER_COLOR = new THREE.Vector3(0.0196, 0.7804, 0.8); // #05C7CC in RGB

// Define shader material for blurred border
const BorderShaderMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(800, 600),
    borderWidth: BORDER_WIDTH_INITIAL,
    time: 0.0,
    color: BORDER_COLOR
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
  uniform vec3 color;

  void main() {
    // Convert UV to pixel coordinates
    vec2 pixelCoord = vUv * resolution;
    
    // Calculate center-relative coordinates
    vec2 fromCenter = pixelCoord - resolution * 0.5;
    
    // Get rotation angle for current pixel
    float angle = atan(fromCenter.y, fromCenter.x);
    
    // Vary border width based on angle and time
    float variedBorderWidth = borderWidth * (1.0 + 0.3 * sin(angle * 6.0 + time * 8.0));
    
    // Calculate distance from edges
    float distFromLeft = pixelCoord.x;
    float distFromRight = resolution.x - pixelCoord.x;
    float distFromTop = resolution.y - pixelCoord.y;
    float distFromBottom = pixelCoord.y;
    
    // Find minimum distance to any edge
    float minDist = min(min(distFromLeft, distFromRight), min(distFromTop, distFromBottom));
    
    // Create smooth border transition with varied width
    float borderIntensity = smoothstep(0.0, variedBorderWidth, minDist);
    borderIntensity = 1.0 - borderIntensity;
    
    // Apply Gaussian blur to the border
    float sigma = variedBorderWidth * 0.3;
    float blur = exp(-(minDist * minDist) / (2.0 * sigma * sigma));
    
    float alpha = borderIntensity * blur;
    
    gl_FragColor = vec4(color, alpha);
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

function TestPage7() {
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
              className="px-6 py-3 bg-[#4C4C4C] text-white border border-black rounded hover:bg-[#333333] transition-colors font-bold"
            >
              PULSE
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TestPage7;