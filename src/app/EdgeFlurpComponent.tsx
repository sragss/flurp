import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

interface EdgeFlurpProps {
  borderWidthInitial?: number;
  borderWidthPeak?: number;
  decaySpeed?: number;
  borderColor?: THREE.Vector3;
  isPulsing?: boolean;
}

const EdgeFlurpScene = ({
  borderWidthInitial,
  borderWidthPeak,
  decaySpeed,
  borderColor,
  isPulsing,
}: EdgeFlurpProps) => {
  const ref = useRef<THREE.ShaderMaterial>();
  const { size } = useThree();
  const [borderWidth, setBorderWidth] = useState(borderWidthInitial);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (ref.current) {
      ref.current.uniforms.resolution.value.set(size.width, size.height);
      ref.current.uniforms.color.value = borderColor;
    }
  }, [size, borderColor]);

  useEffect(() => {
    if (isPulsing) {
      setBorderWidth(borderWidthPeak);
      lastTimeRef.current = Date.now();
      cancelAnimationFrame(animationRef.current);

      const animate = () => {
        const elapsed = Date.now() - lastTimeRef.current;
        const decay = Math.exp(-elapsed * decaySpeed);
        const newWidth = borderWidthInitial + (borderWidthPeak - borderWidthInitial) * decay;

        setBorderWidth(newWidth);

        if (newWidth > borderWidthInitial + 0.1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setBorderWidth(borderWidthInitial);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isPulsing, borderWidthInitial, borderWidthPeak, decaySpeed]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh>
      <planeGeometry args={[size.width, size.height]} />
      <shaderMaterial
        ref={ref}
        attach="material"
        transparent
        uniforms={{
          resolution: { value: new THREE.Vector2(size.width, size.height) },
          borderWidth: { value: borderWidth },
          time: { value: 0.0 },
          color: { value: borderColor },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          precision highp float;
          varying vec2 vUv;
          uniform vec2 resolution;
          uniform float borderWidth;
          uniform float time;
          uniform vec3 color;

          void main() {
            vec2 pixelCoord = vUv * resolution;
            vec2 fromCenter = pixelCoord - resolution * 0.5;
            float angle = atan(fromCenter.y, fromCenter.x);
            float variedBorderWidth = borderWidth * (1.0 + 0.3 * sin(angle * 6.0 + time * 8.0));
            float distFromLeft = pixelCoord.x;
            float distFromRight = resolution.x - pixelCoord.x;
            float distFromTop = resolution.y - pixelCoord.y;
            float distFromBottom = pixelCoord.y;
            float minDist = min(min(distFromLeft, distFromRight), min(distFromTop, distFromBottom));
            float borderIntensity = 1.0 - smoothstep(0.0, variedBorderWidth, minDist);
            float sigma = variedBorderWidth * 0.3;
            float blur = exp(-(minDist * minDist) / (2.0 * sigma * sigma));
            float alpha = borderIntensity * blur;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  );
};

const EdgeFlurpComponent: React.FC<EdgeFlurpProps> = (props) => {
  return (
    <Canvas orthographic camera={{ zoom: 1, position: [0, 0, 100] }}>
      <EdgeFlurpScene {...props} />
    </Canvas>
  );
};

export default EdgeFlurpComponent;