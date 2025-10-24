import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three-stdlib';
import { GLTFLoader } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';
import { Sparkles } from "lucide-react";
import type { EmotionType } from '../types/schema';
import maxSticker1 from '@assets/image-removebg-preview (33) - copia_1759978567237.png';
import maxSticker2 from '@assets/1211_1759978567238.png';
import gigglesLogo from '@assets/image-removebg-preview (30)_1759978567238.png';
import czLoadingImage from '@assets/image_1761243437671.png';

interface CZ3DViewerProps {
  emotion?: EmotionType;
}

export default function CZ3DViewer({ emotion = 'idle' }: CZ3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelsRef = useRef<Record<EmotionType, { model: THREE.Group; mixer: THREE.AnimationMixer; clip: THREE.AnimationClip } | null>>({
    idle: null,
    talking: null,
    thinking: null,
    angry: null,
    celebrating: null,
    crazy_dance: null,
    confused: null
  });
  const [currentState, setCurrentState] = useState<EmotionType>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const loadTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (error) {
      console.error('WebGL not available:', error);
      setIsLoading(false);
      setLoadError(true);
      return;
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xF0B90B, 0.5);
    pointLight1.position.set(-3, 2, -3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xFCD535, 0.5);
    pointLight2.position.set(0, 3, 3);
    scene.add(pointLight2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI / 1.5;
    controlsRef.current = controls;

    const fbxLoader = new FBXLoader();
    const gltfLoader = new GLTFLoader();

    const loadModel = (path: string, state: EmotionType): Promise<void> => {
      return new Promise((resolve) => {
        // Detect file format from extension (case-insensitive, strips query params)
        const normalizedPath = path.toLowerCase().split('?')[0].split('#')[0];
        const isGLTF = normalizedPath.endsWith('.glb') || normalizedPath.endsWith('.gltf');
        
        const processModel = (model: THREE.Group, animations: THREE.AnimationClip[]) => {
          // Calculate bounding box to understand model size
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          console.log(`📦 Model ${state} - Size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
          console.log(`📍 Model ${state} - Center: ${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}`);
          
          // Calculate scale to fit model to desired height (3.2 units - 60% larger than original)
          const desiredHeight = 3.2;
          const currentHeight = size.y;
          const scaleFactor = currentHeight > 0 ? desiredHeight / currentHeight : 0.02;
          
          console.log(`🔍 Model ${state} - Scale factor: ${scaleFactor.toFixed(4)}`);
          
          model.scale.set(scaleFactor, scaleFactor, scaleFactor);
          
          // Recalculate box after scaling
          box.setFromObject(model);
          const scaledCenter = box.getCenter(new THREE.Vector3());
          
          // Center the model and position it slightly below origin
          model.position.set(-scaledCenter.x, -scaledCenter.y - 0.2, -scaledCenter.z);
          
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              
              // Force smooth shading to fix blocky appearance
              if (mesh.geometry) {
                mesh.geometry.computeVertexNormals();
              }
              
              // Ensure materials use smooth shading
              if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    if (mat && 'flatShading' in mat) {
                      (mat as any).flatShading = false;
                      mat.needsUpdate = true;
                    }
                  });
                } else if ('flatShading' in mesh.material) {
                  (mesh.material as any).flatShading = false;
                  mesh.material.needsUpdate = true;
                }
              }
            }
          });

          model.visible = state === 'idle';
          scene.add(model);
          
          console.log(`✨ Model ${state} added to scene at position:`, model.position);

          const mixer = new THREE.AnimationMixer(model);
          
          if (animations && animations.length > 0) {
            const clip = animations[0];
            modelsRef.current[state] = { model, mixer, clip };
            
            if (state === 'idle') {
              const action = mixer.clipAction(clip);
              action.play();
            }
          }
          
          resolve();
        };

        if (isGLTF) {
          // Use GLTFLoader for .glb/.gltf files (supports >4 skinning weights!)
          gltfLoader.load(
            path,
            (gltf) => {
              console.log(`✅ Loaded GLB model for ${state} (supports unlimited skinning weights)`);
              processModel(gltf.scene, gltf.animations);
            },
            undefined,
            (error) => {
              console.error(`Error loading ${state} GLTF:`, error);
              resolve();
            }
          );
        } else {
          // Use FBXLoader for .fbx files (limited to 4 skinning weights)
          fbxLoader.load(
            path,
            (fbxModel) => {
              console.log(`⚠️ Loaded FBX model for ${state} (limited to 4 skinning weights)`);
              processModel(fbxModel, fbxModel.animations);
            },
            undefined,
            (error) => {
              console.error(`Error loading ${state} FBX:`, error);
              resolve();
            }
          );
        }
      });
    };

    // Set timeout to show app even if 3D doesn't load (increased to 20s for large GLB files)
    loadTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      setLoadError(true);
      console.warn('3D model loading timed out - showing UI without 3D');
    }, 20000);

    // Randomly select one of the 4 idle animations for variety
    const randomIdleIndex = Math.floor(Math.random() * 4) + 1;
    const idlePath = randomIdleIndex === 1 ? '/idle.glb' : `/idle${randomIdleIndex}.glb`;
    console.log(`🎲 Randomly selected idle animation: ${idlePath}`);

    // Load selected idle model first for fast initial render
    loadModel(idlePath, 'idle').then(() => {
      if (loadTimeoutRef.current !== null) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      setIsLoading(false);
      
      // Load other models in background (lazy loading)
      Promise.all([
        loadModel('/talking.glb', 'talking'),
        loadModel('/thinking.glb', 'thinking'),
        loadModel('/angry.glb', 'angry'),
        loadModel('/celebrating.glb', 'celebrating'),
        loadModel('/crazy_dance.glb', 'crazy_dance'),
        loadModel('/confused.glb', 'confused')
      ]);
    });

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      
      Object.values(modelsRef.current).forEach(modelData => {
        if (modelData && modelData.mixer) {
          modelData.mixer.update(delta);
        }
      });

      const currentModelData = modelsRef.current[currentState];
      if (currentModelData && currentState === 'idle') {
        currentModelData.model.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.1;
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (loadTimeoutRef.current !== null) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (emotion !== currentState) {
      setCurrentState(emotion);
      
      Object.entries(modelsRef.current).forEach(([state, modelData]) => {
        if (modelData) {
          const isActive = state === emotion;
          modelData.model.visible = isActive;
          
          if (isActive && modelData.mixer && modelData.clip) {
            const action = modelData.mixer.clipAction(modelData.clip);
            action.reset();
            action.play();
          }
        }
      });
    }
  }, [emotion, currentState]);

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-muted/50 to-background flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,185,11,0.08)_0%,transparent_70%)]" />
      
      <img 
        src={maxSticker1} 
        alt="" 
        className="absolute top-20 right-16 w-20 h-20 opacity-40 pointer-events-none transform rotate-12"
      />
      
      <img 
        src={gigglesLogo} 
        alt="" 
        className="absolute bottom-32 left-12 w-20 h-20 opacity-30 pointer-events-none transform -rotate-8"
      />
      
      <img 
        src={maxSticker2} 
        alt="" 
        className="absolute top-1/4 left-1/3 w-16 h-16 opacity-30 pointer-events-none transform rotate-15"
      />
      
      <img 
        src={gigglesLogo} 
        alt="" 
        className="absolute bottom-1/4 right-1/3 w-20 h-20 opacity-40 pointer-events-none transform -rotate-10"
      />
      
      <img 
        src={maxSticker1} 
        alt="" 
        className="absolute top-2/3 left-16 w-20 h-20 opacity-30 pointer-events-none transform rotate-25"
      />
      
      <img 
        src={maxSticker2} 
        alt="" 
        className="absolute bottom-16 right-20 w-20 h-20 opacity-50 pointer-events-none transform -rotate-12"
      />

      <div className="absolute top-8 left-8 z-10">
        <div className="flex items-center gap-2 bg-red-500 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-md" data-testid="badge-live">
          <div className="h-2.5 w-2.5 bg-white rounded-full animate-pulse" />
          <span className="text-white text-sm font-bold uppercase tracking-wide">LIVE</span>
        </div>
      </div>

      {emotion === 'thinking' && (
        <div className="absolute top-8 right-8 z-10 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 bg-primary backdrop-blur-sm px-5 py-2.5 rounded-full shadow-md" data-testid="status-thinking">
            <Sparkles className="h-4 w-4 text-primary-foreground animate-pulse" />
            <span className="text-primary-foreground text-sm font-bold">思考中...</span>
          </div>
        </div>
      )}

      {isLoading && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6">
            <img 
              src={czLoadingImage} 
              alt="CZ" 
              className="w-32 h-32 animate-pulse"
            />
            <div className="text-foreground text-lg font-bold">
              加载3D模型中...
            </div>
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-4 text-center px-8">
            <img 
              src={maxSticker2} 
              alt="CZ AI" 
              className="w-48 h-48 opacity-80 animate-bounce"
            />
            <div className="text-foreground text-2xl font-bold">
              CZ 在这里！
            </div>
            <div className="text-muted-foreground text-sm max-w-md">
              (3D 可视化不可用 - 聊天功能完全正常)
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className="relative z-10 w-full h-full" data-testid="model-cz" />

      {(emotion === 'talking' || emotion === 'celebrating') && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-end gap-2 h-14 z-20 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl border border-border shadow-md" data-testid="audio-waves">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="w-2.5 bg-primary rounded-full"
              style={{
                height: '40%',
                animation: `audioWave ${0.4 + (i * 0.05)}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes audioWave {
          0% { height: 20%; }
          50% { height: 100%; }
          100% { height: 30%; }
        }
      `}</style>
    </div>
  );
}
