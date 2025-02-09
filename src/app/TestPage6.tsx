import React, { useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useRef } from 'react';

// Define the new shader material
const CustomShaderMaterial = shaderMaterial(
  {
    iResolution: new THREE.Vector3(window.innerWidth, window.innerHeight, 1),
    iTime: 0,
    opacity: 0
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
  uniform vec3 iResolution;
  uniform float iTime;
  uniform float opacity;
  varying vec2 vUv;

  void main() {
    vec2 uv = (2.0 * vUv - iResolution.xy / iResolution.y);
    for(float i = 1.0; i < 10.0; i++){
        uv.x += 0.6 / i * cos(i * 2.5 * uv.y + iTime);
        uv.y += 0.6 / i * cos(i * 1.5 * uv.x + iTime);
    }
    vec3 color = vec3(0.1) / abs(sin(iTime - uv.y - uv.x));
    gl_FragColor = vec4(color, opacity);
  }
  `
);

// Register the shader material
extend({ CustomShaderMaterial });

const CustomPlane = ({ isTriggered }: { isTriggered: boolean }) => {
  const ref = useRef<THREE.ShaderMaterial>();
  const startTime = useRef<number | null>(null);
  const FADE_DURATION = 0.3; // Duration of fade in/out in seconds
  const HOLD_DURATION = 1.0; // Duration to hold at full opacity

  useFrame(({ clock }) => {
    if (!ref.current) return;

    ref.current.uniforms.iTime.value = clock.getElapsedTime();

    if (isTriggered && startTime.current === null) {
      startTime.current = clock.getElapsedTime();
    }

    if (startTime.current !== null) {
      const elapsed = clock.getElapsedTime() - startTime.current;
      
      if (elapsed <= FADE_DURATION) {
        // Fade in
        ref.current.uniforms.opacity.value = elapsed / FADE_DURATION;
      } else if (elapsed <= FADE_DURATION + HOLD_DURATION) {
        // Hold at full opacity
        ref.current.uniforms.opacity.value = 1;
      } else if (elapsed <= FADE_DURATION * 2 + HOLD_DURATION) {
        // Fade out
        ref.current.uniforms.opacity.value = 1 - ((elapsed - FADE_DURATION - HOLD_DURATION) / FADE_DURATION);
      } else {
        // Reset
        ref.current.uniforms.opacity.value = 0;
        startTime.current = null;
      }
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <customShaderMaterial ref={ref} attach="material" transparent={true} />
    </mesh>
  );
};

function TestPage6() {
  const [isTriggered, setIsTriggered] = useState(false);

  const handleClick = () => {
    if (!isTriggered) {
      setIsTriggered(true);
      setTimeout(() => setIsTriggered(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        className="absolute z-10 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={handleClick}
      >
        Trigger Animation
      </button>
      <Canvas>
        <CustomPlane isTriggered={isTriggered} />
      </Canvas>
    </div>
  );
}

export default TestPage6;