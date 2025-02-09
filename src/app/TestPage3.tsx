import { Canvas, useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { ReactNode, useRef, useEffect, useState } from "react";
import * as THREE from "three";

interface CanvasBKGProps {
  children: ReactNode;
  debug_mode?: boolean;
  canvas_space?: number;
  particleCount: number;
  particleColor?: string;
}

interface AnimatedButtonProps {
  className?: string;
  children: ReactNode;
  particleCount?: number;
  particleColor?: string;
  onClick?: () => void;
}

function EdgeFade({ width, height }: { width: number, height: number }) {
  const fadeShader = {
    uniforms: {
      fadeWidth: { value: 0.3 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float fadeWidth;
      varying vec2 vUv;
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = length(vUv - center) * 2.0;
        float alpha = 1.0 - smoothstep(1.0 - fadeWidth, 1.0, dist);
        gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
      }
    `
  };

  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <shaderMaterial 
        {...fadeShader}
        transparent={true}
        blending={THREE.MultiplyBlending}
      />
    </mesh>
  );
}

function ExplosionEffect({ isExploding, position, childSize, particle_count = 1000, color = "#660000" }: { isExploding: boolean, position: THREE.Vector3, childSize: {width: number, height: number}, particle_count?: number, color?: string }) {
  const particlesRef = useRef<THREE.Points>(null);
  const startTime = useRef(0);
  const [particles, setParticles] = useState<Float32Array>(new Float32Array(0));
  
  useEffect(() => {
    if (isExploding) {
      startTime.current = Date.now();
      const positions = new Float32Array(particle_count * 3);
      
      for (let i = 0; i < particle_count * 3; i += 3) {
        positions[i] = position.x + (Math.random() - 0.5) * childSize.width;
        positions[i + 1] = position.y + (Math.random() - 0.5) * childSize.height;
        positions[i + 2] = position.z;
      }
      
      setParticles(positions);
    }
  }, [isExploding, position, childSize, particle_count]);

  useFrame(() => {
    if (!particlesRef.current || !isExploding) return;
    
    const elapsed = (Date.now() - startTime.current) / 1000;
    const positions = particlesRef.current.geometry.attributes.position;
    const array = positions.array as Float32Array;
    
    for (let i = 0; i < array.length; i += 3) {
      const angle = (i / 3) * (Math.PI * 2 / (array.length / 3)) + Math.random() * 0.5;
      const speed = 1 + Math.random() * 1.5;
      const verticalBias = Math.random();
      
      array[i] += Math.cos(angle) * speed * elapsed;
      array[i + 1] += (Math.sin(angle) * speed * elapsed + verticalBias * elapsed) * 1.5;
    }
    
    positions.needsUpdate = true;
  });

  if (!isExploding) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        color={color}
        transparent
        opacity={1.0}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function CanvasBKG({ children, debug_mode = false, canvas_space = 20, particleCount=1000, particleColor="red" }: CanvasBKGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);
  const [childSize, setChildSize] = useState({ width: 0, height: 0 });
  const [isExploding, setIsExploding] = useState(false);
  const isAnimating = useRef(false);

  const CHILD_OUTLINE_OFFSET = 0;

  useEffect(() => {
    if (childRef.current) {
      const { width, height } = childRef.current.getBoundingClientRect();
      setChildSize({ width, height });
    }
  }, []);

  const canvasWidth = childSize.width + 2 * canvas_space;
  const canvasHeight = childSize.height + 2 * canvas_space;

  const handleClick = () => {
    if (isAnimating.current) return;
    
    isAnimating.current = true;
    setIsExploding(true);
    setTimeout(() => {
      setIsExploding(false);
      isAnimating.current = false;
    }, 1000);
  };

  return (
    <div ref={containerRef} style={{ width: canvasWidth, height: canvasHeight }} className="relative">
      <div className="absolute inset-0">
        <Canvas>
          <OrthographicCamera makeDefault position={[0, 0, 100]} />
          {debug_mode && (
            <>
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
            </>
          )}
          <ExplosionEffect 
            isExploding={isExploding} 
            position={new THREE.Vector3(0, 0, 0)} 
            childSize={childSize} 
            particle_count={particleCount}
            color={particleColor}
          />
          {!debug_mode && <EdgeFade width={canvasWidth} height={canvasHeight} />}
        </Canvas>
      </div>
      <div 
        ref={childRef}
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: debug_mode ? 0.5 : 1
        }}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  );
}

export function ExplosionButton({ className = "", children, particleCount = 1000, particleColor = "#660000", onClick }: AnimatedButtonProps) {
  // Extract margin classes to calculate canvas space
  const marginMatch = className.match(/m[trblxy]?-(\d+)/);
  const canvasSpace = marginMatch ? parseInt(marginMatch[1]) * 4 : 20; // Convert tailwind spacing to pixels

  return (
    <CanvasBKG debug_mode={false} canvas_space={canvasSpace} particleCount={particleCount} particleColor={particleColor}>
      <button 
        className={className}
        onClick={onClick}
      >
        {children}
      </button>
    </CanvasBKG>
  );
}

export default function TestPage3() {
  return (
    <div className="p-8 grid grid-cols-2 gap-8">
      <ExplosionButton 
        className="px-4 py-2 rounded-lg bg-blue-200 border border-dashed border-blue-800 hover:bg-blue-400 text-sm"
        particleCount={800}
        particleColor="#0000ff"
      >
        Small Button
      </ExplosionButton>

      <ExplosionButton 
        className="px-6 py-3 rounded-xl bg-zinc-800 border-2 border-solid border-zinc-600 hover:bg-zinc-700 text-lg w-48 h-32 text-zinc-200 shadow-lg transition-all duration-200 hover:shadow-zinc-500/50 hover:scale-[1.02]"
        particleCount={1200}
        particleColor="#666666"
      >
        Medium Button
      </ExplosionButton>

      <ExplosionButton 
        className="px-8 py-4 rounded-2xl bg-purple-200 border-4 border-dotted border-purple-800 hover:bg-purple-400 text-xl w-64 h-40"
        particleCount={1500}
        particleColor="#800080"
      >
        Large Button
      </ExplosionButton>

      <ExplosionButton 
        className="px-5 py-3 rounded-full bg-red-200 border-3 border-double border-red-800 hover:bg-red-400 text-base w-40 h-40"
        particleCount={1000}
        particleColor="#ff0000"
      >
        Round Button
      </ExplosionButton>
    </div>
  );
}