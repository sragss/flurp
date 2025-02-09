import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { ReactNode, useRef, useEffect, useState } from "react";
import * as THREE from "three";


// SRAGSS: Note that this is well wired. This is the proper way to setup the canvas.

const CANVAS_SPACE = 20; // pixels of padding around content

interface CanvasBKGProps {
  children: ReactNode;
}

function CanvasBKG({ children }: CanvasBKGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);
  const [childSize, setChildSize] = useState({ width: 0, height: 0 });

  const CHILD_OUTLINE_OFFSET = 2;

  useEffect(() => {
    if (childRef.current) {
      const { width, height } = childRef.current.getBoundingClientRect();
      setChildSize({ width, height });
    }
  }, []);

  const canvasWidth = childSize.width + 2 * CANVAS_SPACE;
  const canvasHeight = childSize.height + 2 * CANVAS_SPACE;

  return (
    <div ref={containerRef} style={{ width: canvasWidth, height: canvasHeight }} className="relative">
      <div className="absolute inset-0">
        <Canvas>
          <OrthographicCamera makeDefault position={[0, 0, 100]} />
          <mesh>
            <planeGeometry args={[canvasWidth, canvasHeight]} />
            <meshBasicMaterial color="#e6f3ff" />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(canvasWidth, canvasHeight)]} />
            <lineBasicMaterial color="red" linewidth={1} />
          </lineSegments>
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(
              childSize.width + 2 * CHILD_OUTLINE_OFFSET,
              childSize.height + 2 * CHILD_OUTLINE_OFFSET
            )]} />
            <lineBasicMaterial color="red" linewidth={1} />
          </lineSegments>
        </Canvas>
      </div>
      <div 
        ref={childRef}
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function TestPage2() {
  return (
    <div className="p-8">
      <CanvasBKG>
        <button className="px-4 py-2 rounded-lg bg-green-200 border border-dashed border-green-800 hover:bg-green-400 w-72 h-48">
          Click me
        </button>
      </CanvasBKG>
    </div>
  );
}
