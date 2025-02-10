import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';

const BUTTON_INSET = 10;
const WAVE_AMPLITUDE_NORMAL = 0.2;
const WAVE_AMPLITUDE_HOVER = 0.4;
const WAVE_AMPLITUDE_CLICK = 0.8;
const WAVE_SPEED_NORMAL = 1.0;
const WAVE_SPEED_HOVER = 2.0;

// Define shader material with hover effect (click now only increases amplitude).
const ButtonShaderMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(800, 600),
    inset: BUTTON_INSET,
    time: 0.0,
    waveAmplitude: WAVE_AMPLITUDE_NORMAL,
    waveSpeed: WAVE_SPEED_NORMAL,
    color: new THREE.Vector3(1, 0, 0), // Default red color
    color2: new THREE.Vector3(0.5, 0.1, 0), // Dark red color
    cornerRadius: 10.0
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
  uniform float waveSpeed;
  uniform vec3 color;
  uniform vec3 color2;
  uniform float cornerRadius;

  void main() {
    // Convert UV to pixel coordinates.
    vec2 pixelCoord = vUv * resolution;
    
    // Compute the canvas center.
    vec2 center = resolution * 0.5;
    vec2 p = pixelCoord - center;
    
    // Determine half-size considering the inset.
    vec2 halfSize = center - vec2(inset);
    vec2 rectHalf = halfSize - vec2(cornerRadius);
    
    // Compute an angle for applying the wave effect.
    vec2 normP = vec2(p.x / halfSize.x, p.y / halfSize.y);
    float angle = atan(normP.y, normP.x);
    
    // Rounded rectangle SDF.
    vec2 d = abs(p) - rectHalf;
    float sdf = length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - cornerRadius;
    float dEdge = abs(sdf);
    
    // Calculate two wave effects.
    float wave1 = (sin(angle * 6.0 + time * 4.0 * waveSpeed) + 1.0) * waveAmplitude + 0.2;
    float wave2 = (sin(angle * 3.0 + time * 2.0 * waveSpeed + 3.14) + 1.0) * (waveAmplitude * 0.7) + 0.2;
    float glowWidth1 = inset * wave1;
    float glowWidth2 = inset * wave2;
    float borderIntensity1 = 1.0 - smoothstep(0.0, glowWidth1, dEdge);
    float borderIntensity2 = 1.0 - smoothstep(0.0, glowWidth2, dEdge);
    
    // Apply Gaussian blur.
    float sigma1 = glowWidth1 * 0.3;
    float sigma2 = glowWidth2 * 0.3;
    float blur1 = exp(-(dEdge * dEdge) / (2.0 * sigma1 * sigma1));
    float blur2 = exp(-(dEdge * dEdge) / (2.0 * sigma2 * sigma2));
    float alpha1 = borderIntensity1 * blur1;
    float alpha2 = borderIntensity2 * blur2;
    
    // Mix colors based on wave intensities.
    vec3 finalColor = mix(color * alpha1, color2 * alpha2, 0.5);
    float finalAlpha = max(alpha1, alpha2);
    
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
  `
);

extend({ ButtonShaderMaterial });

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  color?: THREE.Vector3;
}

interface ButtonMeshProps {
  width: number;
  height: number;
  color?: THREE.Vector3;
  hovered: boolean;
  clicked: boolean;
}

const ButtonMesh = ({ width, height, color = new THREE.Vector3(1, 0, 0), hovered, clicked }: ButtonMeshProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>();

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.set(width, height);
      materialRef.current.uniforms.color.value = color;
    }
  }, [width, height, color]);

  useEffect(() => {
    if (materialRef.current) {
      const amplitude = clicked ? WAVE_AMPLITUDE_CLICK : (hovered ? WAVE_AMPLITUDE_HOVER : WAVE_AMPLITUDE_NORMAL);
      materialRef.current.uniforms.waveAmplitude.value = amplitude;
      materialRef.current.uniforms.waveSpeed.value = hovered ? WAVE_SPEED_HOVER : WAVE_SPEED_NORMAL;
    }
  }, [hovered, clicked]);
  
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
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <buttonShaderMaterial ref={materialRef} />
    </mesh>
  );
};

const FlurpButton = ({ children, className = "", color }: ButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

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

  const handleMouseDown = () => {
    console.log("Button pressed (mouse down)");
    setIsClicked(true);
  };

  const handleMouseUp = () => {
    console.log("Button released (mouse up)");
    setIsClicked(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Canvas style={{ width: dimensions.width, height: dimensions.height }} orthographic camera={{ zoom: 1, position: [0, 0, 100] }}>
            <ButtonMesh width={dimensions.width} height={dimensions.height} color={color} hovered={isHovered} clicked={isClicked} />
          </Canvas>
        </div>
      )}
      <div 
        className="absolute inset-0 z-10 backdrop-blur-sm rounded-lg"
        onMouseEnter={() => { console.log("Mouse entered"); setIsHovered(true); }}
        onMouseLeave={() => { console.log("Mouse left"); setIsHovered(false); setIsClicked(false); }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ 
          cursor: 'pointer',
          margin: `${BUTTON_INSET}px`
        }}
      >
        <div className="w-full h-full flex items-center justify-center transition-transform hover:scale-110">
          {children}
        </div>
      </div>
    </div>
  );
};

function TestPage11() {
  return (
    <div className="h-screen w-screen relative flex flex-col items-center justify-center gap-4">
      <FlurpButton className="w-72 h-20" color={new THREE.Vector3(1, 0, 0)}>
        <span className="text-white font-bold">CLICK</span>
      </FlurpButton>
      <FlurpButton className="w-72 h-10" color={new THREE.Vector3(0, 1, 0)}>
        <span className="text-white font-bold hover:text-red-200">PUNCH</span>
      </FlurpButton>
      <FlurpButton className="w-32 h-12" color={new THREE.Vector3(0.0196, 0.7804, 0.8)}>
        <span className="text-white font-bold">SMACK</span>
      </FlurpButton>
      <FlurpButton className="w-32 h-16" color={new THREE.Vector3(1, 1, 0)}>
        <span className="text-white font-bold">Flurp</span>
      </FlurpButton>
      <FlurpButton className="w-24 h-16" color={new THREE.Vector3(0.0196, 0.7804, 0.8)}>
        <span className="text-white font-bold">GLURP</span>
      </FlurpButton>
      <FlurpButton className="w-72 h-72" color={new THREE.Vector3(0.0196, 0.7804, 0.8)}>
        <span className="text-white font-bold">GLURP</span>
      </FlurpButton>
    </div>
  );
}

export default TestPage11;