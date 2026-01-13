
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Fly, Splat } from '../types';
import { LEVEL_CONFIGS, SPLAT_COLORS } from '../constants';
import { audioEngine } from '../services/AudioEngine';

interface GameCanvasProps {
  level: number;
  gameState: GameState;
  onLevelClear: () => void;
  onGameOver: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ level, gameState, onLevelClear, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flies, setFlies] = useState<Fly[]>([]);
  const [splats, setSplats] = useState<Splat[]>([]);
  const [shake, setShake] = useState(0);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isSlamming, setIsSlamming] = useState(false);

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  // Initialize Level
  useEffect(() => {
    const config = LEVEL_CONFIGS[level - 1];
    const newFlies: Fly[] = [];
    for (let i = 0; i < config.flyCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      newFlies.push({
        id: Math.random(),
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: Math.cos(angle) * config.flySpeed,
        vy: Math.sin(angle) * config.flySpeed,
        angle: angle,
        size: config.flySize,
        alive: true,
        speed: config.flySpeed,
        jitter: config.erraticness
      });
    }
    setFlies(newFlies);
    setSplats([]); 
    setShake(0);
  }, [level]);

  // Handle Input
  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (gameState !== GameState.PLAYING) return;
    
    audioEngine.resume();
    setIsSlamming(true);
    setShake(15);
    
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    const config = LEVEL_CONFIGS[level - 1];
    const swatterSize = window.innerWidth * config.swatterSizeScale;
    let hit = false;

    setFlies(prev => {
      const next = [...prev];
      next.forEach(fly => {
        if (!fly.alive) return;
        const dist = Math.sqrt((fly.x - clientX) ** 2 + (fly.y - clientY) ** 2);
        if (dist < swatterSize / 2 + fly.size / 2) {
          fly.alive = false;
          hit = true;
          setSplats(s => [...s, {
            x: fly.x,
            y: fly.y,
            size: fly.size * 1.8, // Slightly bigger visceral splats
            rotation: Math.random() * Math.PI * 2,
            color: SPLAT_COLORS[Math.floor(Math.random() * SPLAT_COLORS.length)]
          }]);
        }
      });
      return next;
    });

    if (hit) {
      audioEngine.playSquish();
    } else {
      audioEngine.playThud();
    }

    setTimeout(() => setIsSlamming(false), 100);
  }, [gameState, level]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      handleInteraction(e.clientX, e.clientY);
    };
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      setMousePos({ x: touch.clientX, y: touch.clientY });
      handleInteraction(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleInteraction]);

  // Game Loop
  const animate = useCallback((time: number) => {
    if (gameState !== GameState.PLAYING) return;
    
    if (lastTimeRef.current !== undefined) {
      setFlies(prev => {
        const next = prev.map(fly => {
          if (!fly.alive) return fly;

          // Apply jitter if defined in config (erraticness)
          if (fly.jitter > 0) {
            fly.angle += (Math.random() - 0.5) * fly.jitter * 10;
            fly.vx = Math.cos(fly.angle) * fly.speed;
            fly.vy = Math.sin(fly.angle) * fly.speed;
          }

          fly.x += fly.vx;
          fly.y += fly.vy;

          if (fly.x < -fly.size) fly.x = window.innerWidth + fly.size;
          if (fly.x > window.innerWidth + fly.size) fly.x = -fly.size;
          if (fly.y < -fly.size) fly.y = window.innerHeight + fly.size;
          if (fly.y > window.innerHeight + fly.size) fly.y = -fly.size;

          return fly;
        });

        if (next.length > 0 && next.every(f => !f.alive)) {
          setTimeout(onLevelClear, 500);
        }

        return next;
      });

      audioEngine.updateBuzzers(flies, window.innerWidth);
      setShake(s => Math.max(0, s * 0.9));
    }

    lastTimeRef.current = time;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        if (shake > 0) {
          ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        }

        // --- BACKGROUND TEXTURE ---
        ctx.fillStyle = '#f9ead3';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.lineWidth = 1.5;
        for(let i = 0; i < canvas.height; i += 8) {
           const opacity = 0.03 + Math.random() * 0.05;
           ctx.strokeStyle = `rgba(160, 120, 90, ${opacity})`;
           ctx.beginPath();
           ctx.moveTo(0, i);
           ctx.lineTo(canvas.width, i + (Math.random() - 0.5) * 5);
           ctx.stroke();
        }

        ctx.lineWidth = 2;
        for(let i = -200; i < canvas.height + 200; i += 120) {
           const opacity = 0.04 + Math.random() * 0.04;
           ctx.strokeStyle = `rgba(139, 90, 43, ${opacity})`;
           ctx.beginPath();
           ctx.moveTo(0, i);
           ctx.bezierCurveTo(canvas.width / 4, i + 80, canvas.width / 1.5, i - 120, canvas.width, i + 40);
           ctx.stroke();
        }

        ctx.fillStyle = 'rgba(80, 50, 20, 0.03)';
        for(let i = 0; i < 500; i++) {
           ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 0.8);
        }
        // --- END BACKGROUND ---

        // Draw Splats
        splats.forEach(splat => {
          ctx.save();
          ctx.translate(splat.x, splat.y);
          ctx.rotate(splat.rotation);
          ctx.fillStyle = splat.color;
          
          ctx.beginPath();
          ctx.ellipse(0, 0, splat.size, splat.size * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();

          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = splat.size * (0.8 + Math.random() * 0.8);
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, splat.size * 0.15, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });

        // Draw Flies
        flies.forEach(fly => {
          if (!fly.alive) return;
          ctx.save();
          ctx.translate(fly.x, fly.y);
          ctx.rotate(fly.angle + Math.PI/2);
          
          ctx.fillStyle = 'rgba(180, 180, 255, 0.4)';
          const wingSpread = Math.sin(Date.now() * 0.1) * fly.size * 0.5;
          ctx.beginPath();
          ctx.ellipse(-fly.size * 0.4, 0, fly.size * 0.4, fly.size * 0.8 + wingSpread, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(fly.size * 0.4, 0, fly.size * 0.4, fly.size * 0.8 + wingSpread, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0a0a0a';
          ctx.beginPath();
          ctx.ellipse(0, 0, fly.size * 0.4, fly.size * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'red';
          ctx.shadowColor = 'red';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(-fly.size * 0.2, -fly.size * 0.5, fly.size * 0.15, 0, Math.PI * 2);
          ctx.arc(fly.size * 0.2, -fly.size * 0.5, fly.size * 0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.restore();
        });

        // Draw Swatter
        const swSize = canvas.width * LEVEL_CONFIGS[level - 1].swatterSizeScale;
        const currentSwSize = isSlamming ? swSize * 0.85 : swSize;
        
        ctx.save();
        ctx.translate(mousePos.x, mousePos.y);
        ctx.globalAlpha = 0.7;
        
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#1a1a1a';
        ctx.strokeRect(-currentSwSize/2, -currentSwSize/2, currentSwSize, currentSwSize);
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        for (let i = -currentSwSize/2; i <= currentSwSize/2; i += currentSwSize/8) {
          ctx.beginPath(); ctx.moveTo(i, -currentSwSize/2); ctx.lineTo(i, currentSwSize/2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-currentSwSize/2, i); ctx.lineTo(currentSwSize/2, i); ctx.stroke();
        }

        ctx.restore();
        ctx.restore();
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [flies, splats, gameState, level, shake, mousePos, isSlamming, onLevelClear]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="cursor-none" />;
};

export default GameCanvas;
