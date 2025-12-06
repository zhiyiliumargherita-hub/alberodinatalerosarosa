
import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { AppState } from '../types';

interface HandControllerProps {
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  currentAppState: AppState;
  onHandUpdate: (data: { 
    x: number; 
    y: number; 
    isPinching: boolean; 
    isFist: boolean; 
    present: boolean 
  }) => void;
}

export const HandController: React.FC<HandControllerProps> = ({ 
  setAppState, 
  currentAppState,
  onHandUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [gesture, setGesture] = useState<'OPEN' | 'FIST' | 'PINCH' | 'NONE'>('NONE');
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastStateToggle = useRef<number>(0);

  // Initialize MediaPipe
  useEffect(() => {
    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      landmarkerRef.current = landmarker;
      setLoaded(true);
      startCamera();
    };
    init();
    return () => {
      cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
         (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predict);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const drawSkeleton = (landmarks: NormalizedLandmark[], ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Connections based on MediaPipe hand topology
    const connections = [
      [0,1], [1,2], [2,3], [3,4], // Thumb
      [0,5], [5,6], [6,7], [7,8], // Index
      [0,9], [9,10], [10,11], [11,12], // Middle
      [0,13], [13,14], [14,15], [15,16], // Ring
      [0,17], [17,18], [18,19], [19,20] // Pinky
    ];

    // Draw Lines
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FF1493'; // Hot Pink
    ctx.beginPath();
    connections.forEach(([start, end]) => {
      const p1 = landmarks[start];
      const p2 = landmarks[end];
      ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
      ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
    });
    ctx.stroke();

    // Draw Joints
    ctx.fillStyle = '#E8E8E8'; // Silver
    landmarks.forEach(lm => {
      ctx.beginPath();
      ctx.arc(lm.x * ctx.canvas.width, lm.y * ctx.canvas.height, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const getDistance = (p1: NormalizedLandmark, p2: NormalizedLandmark) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const predict = async () => {
    if (!landmarkerRef.current || !videoRef.current || !canvasRef.current) return;
    
    const nowInMs = Date.now();
    const results = landmarkerRef.current.detectForVideo(videoRef.current, nowInMs);
    const ctx = canvasRef.current.getContext('2d');

    if (results.landmarks && results.landmarks.length > 0 && ctx) {
      const landmarks = results.landmarks[0];
      
      // 1. Draw Skeleton
      drawSkeleton(landmarks, ctx);

      // 2. Gesture Detection
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const wrist = landmarks[0];
      
      // Pinch: Thumb tip close to Index tip
      const pinchDist = getDistance(thumbTip, indexTip);
      const isPinching = pinchDist < 0.05;

      // Fist Logic: Check extension of fingers (Index, Middle, Ring, Pinky)
      // If tips are closer to wrist than knuckles, they are curled.
      const fingers = [
        { tip: 8, pip: 6 },   // Index
        { tip: 12, pip: 10 }, // Middle
        { tip: 16, pip: 14 }, // Ring
        { tip: 20, pip: 18 }, // Pinky
      ];
      let extendedCount = 0;
      fingers.forEach(f => {
        if (getDistance(landmarks[f.tip], wrist) > getDistance(landmarks[f.pip], wrist) * 1.1) {
          extendedCount++;
        }
      });
      // Thumb check logic
      const thumbExtended = getDistance(landmarks[4], wrist) > getDistance(landmarks[2], wrist) * 1.1;
      if (thumbExtended) extendedCount++;

      const isFist = extendedCount <= 1; // 0 or 1 finger open
      const isOpen = extendedCount >= 4; // 4 or 5 fingers open

      // 3. State Management
      let currentGesture: 'OPEN' | 'FIST' | 'PINCH' | 'NONE' = 'NONE';

      if (isPinching) {
        currentGesture = 'PINCH';
      } else if (isFist) {
        currentGesture = 'FIST';
        // Toggle AppState (Explosion) with cooldown
        if (nowInMs - lastStateToggle.current > 1000) {
           setAppState(prev => prev === AppState.TREE_SHAPE ? AppState.SCATTERED : AppState.TREE_SHAPE);
           lastStateToggle.current = nowInMs;
        }
      } else if (isOpen) {
        currentGesture = 'OPEN';
      }

      setGesture(currentGesture);

      // 4. Position Tracking (Palm Center approx by Index MCP or Middle MCP)
      // Use Middle MCP (9)
      const handX = landmarks[9].x; 
      const handY = landmarks[9].y;

      // 5. Callback to Parent
      onHandUpdate({
        x: handX,
        y: handY,
        isPinching,
        isFist,
        present: true
      });

    } else {
      // Clear canvas if no hand
      if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      setGesture('NONE');
      onHandUpdate({ x: 0.5, y: 0.5, isPinching: false, isFist: false, present: false });
    }

    requestRef.current = requestAnimationFrame(predict);
  };

  return (
    <div className="absolute bottom-8 right-8 z-50 flex flex-col items-end gap-2 pointer-events-none">
      <div className={`
        relative overflow-hidden rounded-2xl border-4 
        ${gesture === 'PINCH' ? 'border-yellow-400 shadow-[0_0_30px_#FACC15]' : 
          gesture === 'FIST' ? 'border-red-500 shadow-[0_0_30px_#EF4444]' : 
          'border-pink-900/30'}
        transition-all duration-100 w-48 h-36 bg-black/40 backdrop-blur-sm
      `}>
         <video 
           ref={videoRef} 
           autoPlay playsInline muted
           className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-60"
         />
         <canvas 
           ref={canvasRef}
           width={320} height={240}
           className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
         />
         
         {!loaded && (
           <div className="absolute inset-0 flex items-center justify-center text-pink-200 text-xs uppercase tracking-widest">
             Initializing...
           </div>
         )}

         {/* Gesture Status */}
         <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] text-pink-100 font-mono tracking-wider border border-pink-500/30">
            {gesture === 'NONE' ? 'HOVER' : gesture}
         </div>
      </div>
      
      <div className="text-[10px] text-pink-300/80 uppercase tracking-widest text-right bg-black/20 p-2 rounded backdrop-blur-sm">
        <span className="font-bold text-pink-200">Controls:</span><br/>
        ✊ FIST: EXPLODE / SWITCH<br/>
        👌 PINCH: ROTATE MODEL<br/>
        ✋ HOVER: REPULSE PARTICLES
      </div>
    </div>
  );
};
