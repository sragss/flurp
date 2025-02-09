import { shaderMaterial, OrthographicCamera } from "@react-three/drei";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import * as THREE from "three";
import TestPage2 from "./TestPage2";
import TestPage3 from "./TestPage3";
import TestPage4 from "./TestPage4";
import TestPage5 from "./TestPage5";
import TestPage6 from "./TestPage6";
import TestPage7 from "./TestPage7";

function TestPage1() {
  const [isGlowing, setIsGlowing] = useState(false);
  const [clickTime, setClickTime] = useState(0);

  // Handle click to trigger glow effect for a short duration
  const handleGlowClick = () => {
    setIsGlowing(true);
    setClickTime(Date.now());
    // Temporarily show glow effect for 1 second
    setTimeout(() => {
      setIsGlowing(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main container with padding around the button */}
      <div className="relative flex items-center justify-center p-8">
        {/* Canvas container set to fill the entire padded space */}
        <div className="absolute w-full h-full" style={{ maskImage: 'linear-gradient(to bottom, transparent, black, transparent)' }}>
          <Canvas>
            <OrthographicCamera makeDefault position={[0, 0, 100]} />
            <GlowEffect isGlowing={isGlowing} clickTime={clickTime} />
          </Canvas>
        </div>

        {/* Button is placed above the canvas */}
        <button
          className="relative w-[72px] h-[48px] rounded-lg border-2 border-black bg-white hover:bg-gray-300"
          onClick={handleGlowClick}
        >
          Click Me
        </button>
      </div>

      {/* Debug view to preview the glow on a small canvas */}
      <div className="relative flex items-center justify-center p-8">
        <div className="absolute w-full h-full" style={{ maskImage: 'linear-gradient(to bottom, transparent, black, transparent)' }}>
          <Canvas>
            <OrthographicCamera makeDefault position={[0, 0, 100]} />
            <GlowEffect isGlowing={isGlowing} clickTime={clickTime} />
          </Canvas>
        </div>
      </div>
    </div>
  );
}

const GlowShaderMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    buttonSize: new THREE.Vector2(72, 48),
    time: 0,
    isGlowing: false,
    timeRemaining: 0,
  },
  /* Vertex Shader */
  `
  varying vec2 vUv;
  void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  /* Fragment Shader */
  `
  precision highp float;
  uniform vec2 resolution;
  uniform vec2 buttonSize;
  uniform float time;
  uniform bool isGlowing;
  uniform float timeRemaining;
  varying vec2 vUv;

  float roundedBoxSDF(vec2 p, vec2 b, float r) {
      vec2 d = abs(p) - b + vec2(r);
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
  }

  void main() {
      // Convert UV from [0,1] to coordinates centered on the button
      vec2 pixelCoord = (vUv - 0.5) * buttonSize;
      float dist = roundedBoxSDF(pixelCoord, buttonSize * 0.5, 8.0);
      
      // Calculate dynamic swirl effect
      float elapsed = timeRemaining * 0.001; // Convert to seconds
      float angle = atan(pixelCoord.y, pixelCoord.x);
      float radius = length(pixelCoord);
      float swirl = sin(angle * 10.0 + elapsed * 5.0) * exp(-radius * 0.1);
      float amplitude = 0.5 + 0.5 * sin(elapsed * 10.0); // Amplitude modulation
      float glow = isGlowing ? exp(-dist * 0.05) * (0.5 + 0.5 * swirl * amplitude) : 0.0;
      
      // Ensure glow falls off by the edge of the canvas
      float edgeFalloff = smoothstep(0.0, 1.0, 1.0 - length(vUv - 0.5) * 2.0);
      glow *= edgeFalloff;

      // Dramatic fade out effect
      float fadeOut = pow(smoothstep(0.0, 1.0, timeRemaining / 1000.0), 3.0);
      glow *= fadeOut;

      // Set color and alpha
      vec3 color = vec3(1.0, 0.0, 0.0) * glow; // Red color
      float alpha = glow;

      gl_FragColor = vec4(color, alpha);
  }
  `
);

const GlowEffect = ({ isGlowing, clickTime }: { isGlowing: boolean, clickTime: number }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>();

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      const elapsedTime = clock.getElapsedTime();
      // Accelerate the animation by reducing the time scale from 1000ms to 500ms
      const timeRemaining = Math.max(0, 500 - (elapsedTime * 1000 - clickTime));
      shaderRef.current.uniforms.time.value = elapsedTime * 2; // Double the time speed
      shaderRef.current.uniforms.isGlowing.value = isGlowing;
      shaderRef.current.uniforms.timeRemaining.value = timeRemaining;
    }
  });

  // Extend the shader to use the custom material
  extend({ GlowShaderMaterial });

  // Plane should be 50% larger than the button dimensions
  const planeWidth = 72 * 2; // 108
  const planeHeight = 48 * 2; // 72

  return (
    <>
      <mesh>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <glowShaderMaterial ref={shaderRef} attach="material" />
      </mesh>
    </>
  );
};
function App() {
  return (
    <Router>
      <main className="p-0">
        <Routes>
          <Route path="/" element={
            <div>
              <h1 className="text-2xl font-bold mb-4">Directory</h1>
              <nav className="mb-8">
                <ul className="flex space-x-4">
                  <li>
                    <Link to="/" className="text-blue-500 hover:text-blue-700">Home</Link>
                  </li>
                  <li>
                    <Link to="/test1" className="text-blue-500 hover:text-blue-700">Test Page 1</Link>
                  </li>
                  <li>
                    <Link to="/test2" className="text-blue-500 hover:text-blue-700">Test Page 2</Link>
                  </li>
                  <li>
                    <Link to="/test3" className="text-blue-500 hover:text-blue-700">Test Page 3</Link>
                  </li>
                  <li>
                    <Link to="/test4" className="text-blue-500 hover:text-blue-700">Test Page 4</Link>
                  </li>
                  <li>
                    <Link to="/test5" className="text-blue-500 hover:text-blue-700">Test Page 5</Link>
                  </li>
                  <li>
                    <Link to="/test6" className="text-blue-500 hover:text-blue-700">Test Page 6</Link>
                  </li>
                  <li>
                    <Link to="/test7" className="text-blue-500 hover:text-blue-700">Test Page 7</Link>
                  </li>
                </ul>
              </nav>
              <ul className="list-disc pl-5">
                <li>Home - Main directory page</li>
                <li>Test Page 1 - First test page</li>
                <li>Test Page 2 - Second test page</li>
                <li>Test Page 3 - Third test page</li>
                <li>Test Page 4 - Fourth test page</li>
                <li>Test Page 5 - Fifth test page</li>
                <li>Test Page 6 - Sixth test page</li>
                <li>Test Page 7 - Seventh test page</li>
              </ul>
            </div>
          } />
          <Route path="/test1" element={<TestPage1 />} />
          <Route path="/test2" element={<TestPage2 />} />
          <Route path="/test3" element={<TestPage3 />} />
          <Route path="/test4" element={<TestPage4 />} />
          <Route path="/test5" element={<TestPage5 />} />
          <Route path="/test6" element={<TestPage6 />} />
          <Route path="/test7" element={<TestPage7 />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
