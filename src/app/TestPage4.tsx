import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CanvasContainerProps {
  debug_mode?: boolean;
  width: number;
  height: number;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INSET_EDGES = 30;

function CanvasContainer({ debug_mode = false, width, height }: CanvasContainerProps) {
  const [blurAmount, setBlurAmount] = useState(1.0);

  const blurShader = {
    uniforms: {
      resolution: { value: new THREE.Vector2(width, height) },
      blurSize: { value: blurAmount }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec2 resolution;
      uniform float blurSize;
      varying vec2 vUv;

      void main() {
        vec2 texelSize = vec2(1.0 / resolution.x, 1.0 / resolution.y);
        vec4 color = vec4(0.0);
        float totalWeight = 0.0;

        // Simple Gaussian blur
        for(int x = -2; x <= 2; x++) {
          for(int y = -2; y <= 2; y++) {
            float weight = exp(-float(x*x + y*y) / (2.0 * blurSize * blurSize));
            vec2 offset = vec2(float(x), float(y)) * texelSize * blurSize;
            color += vec4(0.5, 0.0, 0.5, 1.0) * weight; // Purple color
            totalWeight += weight;
          }
        }

        // Edge detection
        float edge = 1.0 - (
          smoothstep(0.4, 0.5, abs(vUv.x - 0.5)) * 
          smoothstep(0.4, 0.5, abs(vUv.y - 0.5))
        );

        gl_FragColor = (color / totalWeight) * edge;
      }
    `
  };

  return (
    <>
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <label htmlFor="blur-control" className="text-white">Blur Amount:</label>
        <input
          id="blur-control"
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={blurAmount}
          onChange={(e) => setBlurAmount(parseFloat(e.target.value))}
          className="w-32"
        />
      </div>
      <Canvas style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <OrthographicCamera makeDefault position={[0, 0, 100]} />
        <color attach="background" args={["#4B0082"]} />
        {/* Top border */}
        <mesh position={[0, height/2, 0]}>
          <planeGeometry args={[width, INSET_EDGES]} />
          <meshBasicMaterial color="red" />
        </mesh>
        {/* Bottom border */}
        <mesh position={[0, -height/2, 0]}>
          <planeGeometry args={[width, INSET_EDGES]} />
          <meshBasicMaterial color="red" />
        </mesh>
        {/* Left border */}
        <mesh position={[-width/2, 0, 0]}>
          <planeGeometry args={[INSET_EDGES, height]} />
          <meshBasicMaterial color="red" />
        </mesh>
        {/* Right border */}
        <mesh position={[width/2, 0, 0]}>
          <planeGeometry args={[INSET_EDGES, height]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <mesh>
          {/* <planeGeometry args={[width - INSET_EDGES * 2, height - INSET_EDGES * 2]} /> */}
          <shaderMaterial 
            {...blurShader}
            transparent={true}
            depthTest={false}
          />
        </mesh>
      </Canvas>
    </>
  );
}

export default function TestPage4() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="p-8 w-screen h-screen border border-dashed border-green-300 bg-red-200">
      <div className="relative w-[400px] h-[300px]">
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Test Button
          </button>
        </div>
      </div>
      {dimensions.width > 0 && <CanvasContainer debug_mode={true} width={dimensions.width} height={dimensions.height} />}
    </div>
  );
}