import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Sparkles, MapPin, Calendar, CreditCard, Volume2, VolumeX } from "lucide-react";
import confetti from "canvas-confetti";

// --- DEVICE DETECTION ---
const useDeviceDetection = () => {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setDevice({ isMobile, isTablet, isDesktop });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return device;
};

// --- CONFIGURATION ---
const CONFIG = {
  MUSIC_PATH: "RitV\public\music\Clair de Lune.mp3",
  STORY_LINES: [
    "They say time stops for no one...",
    "But whenever I'm with you...",
    "It slows down just enough.",
    "So I have a question..."
  ],
  NO_TEXTS: [
    "No", "Are you sure?", "Really?", "Think again", "Last chance",
    "Surely not?", "You might regret this", "Give it another thought",
    "Are you absolutely certain?", "This could be a mistake", "Have a heart!"
  ],
  AUDIO: {
    TARGET_VOLUME: 0.8,
    FADE_STEP: 0.05,
    FADE_INTERVAL: 200
  },
  ANIMATION: {
    CONFETTI_DURATION: 4000,
    CONFETTI_INTERVAL: 200,
    BLOB_DURATION: 25
  },
  STARS: {
    DESKTOP_COUNT: 100,
    TABLET_COUNT: 60,
    SHOOTING_INTERVAL: 2000
  }
};

// --- AUDIO HOOK ---
const useAudioPlayer = (audioPath) => {
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const fadeIntervalRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(audioPath);
    audioRef.current.loop = true;
    
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [audioPath]);

  const fadeIn = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let volume = 0;
    audio.volume = 0;
    
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    
    fadeIntervalRef.current = setInterval(() => {
      if (volume < CONFIG.AUDIO.TARGET_VOLUME) {
        volume = Math.min(volume + CONFIG.AUDIO.FADE_STEP, CONFIG.AUDIO.TARGET_VOLUME);
        audio.volume = volume;
      } else {
        clearInterval(fadeIntervalRef.current);
      }
    }, CONFIG.AUDIO.FADE_INTERVAL);
  }, []);

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => fadeIn())
        .catch((err) => console.warn("Audio autoplay blocked:", err));
    }
  }, [fadeIn]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = CONFIG.AUDIO.TARGET_VOLUME;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted]);

  return { playAudio, toggleMute, isMuted };
};

// --- CONSTELLATION BACKGROUND ---
const ConstellationBackground = ({ step, device }) => {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const shootingStarsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const lastFrameTimeRef = useRef(0);

  const isEnabled = device.isDesktop || device.isTablet;

  useEffect(() => {
    if (!isEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(dpr, dpr);

    const starCount = device.isDesktop ? CONFIG.STARS.DESKTOP_COUNT : CONFIG.STARS.TABLET_COUNT;

    if (starsRef.current.length === 0) {
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.5,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    let shootingInterval;
    if (device.isDesktop && step === 1) {
      shootingInterval = setInterval(() => {
        shootingStarsRef.current.push({
          x: Math.random() * window.innerWidth,
          y: -10,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 3 + 2,
          life: 1,
          length: Math.random() * 80 + 40
        });
      }, CONFIG.STARS.SHOOTING_INTERVAL);
    }

    const animate = (currentTime) => {
      const targetFPS = device.isDesktop ? 60 : 30;
      const frameDelay = 1000 / targetFPS;
      
      if (currentTime - lastFrameTimeRef.current < frameDelay) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTimeRef.current = currentTime;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      starsRef.current.forEach(star => {
        star.phase += star.twinkleSpeed;
        const currentOpacity = star.opacity * (0.5 + 0.5 * Math.sin(star.phase));
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.fill();
      });

      if (step >= 2 && device.isDesktop) {
        drawHeartConstellations(ctx);
      }

      if (device.isDesktop) {
        shootingStarsRef.current = shootingStarsRef.current.filter(star => {
          star.x += star.vx;
          star.y += star.vy;
          star.life -= 0.01;

          if (star.life > 0) {
            const gradient = ctx.createLinearGradient(
              star.x, star.y,
              star.x - star.vx * star.length, star.y - star.vy * star.length
            );
            gradient.addColorStop(0, `rgba(255, 200, 220, ${star.life})`);
            gradient.addColorStop(1, 'rgba(255, 200, 220, 0)');

            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(star.x - star.vx * star.length, star.y - star.vy * star.length);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.stroke();

            return true;
          }
          return false;
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (shootingInterval) clearInterval(shootingInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, [step, device, isEnabled]);

  const drawHeartConstellations = (ctx) => {
    const hearts = [
      { cx: window.innerWidth * 0.2, cy: window.innerHeight * 0.3, size: 30 },
      { cx: window.innerWidth * 0.8, cy: window.innerHeight * 0.4, size: 25 },
      { cx: window.innerWidth * 0.5, cy: window.innerHeight * 0.7, size: 35 }
    ];

    hearts.forEach(heart => {
      const points = getHeartPoints(heart.cx, heart.cy, heart.size);
      
      ctx.strokeStyle = 'rgba(255, 182, 193, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();

      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 182, 193, 0.8)';
        ctx.fill();
      });
    });
  };

  const getHeartPoints = (cx, cy, size) => {
    const points = [];
    const numPoints = 12;
    
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      const x = cx + size * (16 * Math.pow(Math.sin(t), 3));
      const y = cy - size * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
      points.push({ x, y });
    }
    
    return points;
  };

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
};

// --- HANDWRITTEN TEXT ---
const HandwrittenText = ({ text, onComplete, device }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  const baseSpeed = device.isMobile ? 40 : 50;
  const variance = device.isMobile ? 20 : 30;

  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = baseSpeed + Math.random() * variance;

    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setShowCursor(false);
        if (onComplete) setTimeout(onComplete, 300);
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval);
  }, [text, onComplete, baseSpeed, variance]);

  return (
    <div className="relative inline-block">
      <h1 className="text-2xl md:text-5xl font-serif italic leading-relaxed text-rose-900/90 px-4">
        "{displayedText}
        {showCursor && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-0.5 h-6 md:h-12 bg-rose-900 ml-1 align-middle"
          />
        )}
        "
      </h1>
    </div>
  );
};

// --- IMPROVED SCRATCH OFF REVEAL ---
const ScratchOffReveal = ({ onRevealed, children, device }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Auto-reveal on mobile
  useEffect(() => {
    if (device.isMobile) {
      const timer = setTimeout(() => {
        setIsRevealed(true);
        if (onRevealed) onRevealed();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [device.isMobile, onRevealed]);

  // Canvas setup for desktop/tablet
  useEffect(() => {
    if (device.isMobile || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, '#fecdd3');
    gradient.addColorStop(0.5, '#fbcfe8');
    gradient.addColorStop(1, '#fecdd3');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Add texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 500; i++) {
      ctx.fillRect(Math.random() * rect.width, Math.random() * rect.height, 1, 1);
    }

    // Add hint text
    ctx.fillStyle = 'rgba(136, 19, 55, 0.5)';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ Scratch here to reveal ✨', rect.width / 2, rect.height / 2);
  }, [device.isMobile]);

  const getCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const scratch = useCallback((coords) => {
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 50;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw line from last position for smooth scratching
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPosRef.current = coords;

    // Calculate percentage every 10 scratch moves for performance
    if (Math.random() > 0.9) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparent = 0;

      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 128) transparent++;
      }

      const percentage = (transparent / (pixels.length / 4)) * 100;
      setScratchPercentage(percentage);

      if (percentage > 50 && !isRevealed) {
        setIsRevealed(true);
        if (onRevealed) onRevealed();
      }
    }
  }, [isRevealed, onRevealed]);

  const handleStart = useCallback((e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const coords = getCoordinates(e);
    if (coords) {
      lastPosRef.current = coords;
      scratch(coords);
    }
  }, [getCoordinates, scratch]);

  const handleMove = useCallback((e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    scratch(coords);
  }, [getCoordinates, scratch]);

  const handleEnd = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  // Mobile: Simple fade-in
  if (device.isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {children}
      </motion.div>
    );
  }

  // Desktop/Tablet: Scratch-off
  return (
    <div ref={containerRef} className="relative inline-block">
      <motion.div
        animate={{ opacity: isRevealed ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
      
      <AnimatePresence>
        {!isRevealed && (
          <motion.canvas
            ref={canvasRef}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-pointer"
            style={{ touchAction: 'none' }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        )}
      </AnimatePresence>
      
      {!isRevealed && scratchPercentage > 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-rose-700/60 text-sm font-medium"
        >
          {Math.round(scratchPercentage)}% revealed
        </motion.div>
      )}
    </div>
  );
};

// --- TICKET COMPONENT ---
const Ticket = React.memo(({ device }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(
    useSpring(y, { stiffness: 100, damping: 30 }),
    [-100, 100],
    [10, -10]
  );
  const rotateY = useTransform(
    useSpring(x, { stiffness: 100, damping: 30 }),
    [-100, 100],
    [-10, 10]
  );

  const handleMove = useCallback((clientX, clientY, currentTarget) => {
    if (device.isMobile) return;
    
    const rect = currentTarget.getBoundingClientRect();
    x.set(clientX - rect.left - rect.width / 2);
    y.set(clientY - rect.top - rect.height / 2);
  }, [x, y, device.isMobile]);

  const resetPosition = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const style = device.isMobile ? {} : { rotateX, rotateY, transformStyle: "preserve-3d" };

  return (
    <motion.div
      style={style}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY, e.currentTarget)}
      onMouseLeave={resetPosition}
      onTouchMove={(e) => {
        if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
      }}
      onTouchEnd={resetPosition}
      className="relative w-[85vw] max-w-sm h-[400px] md:h-[450px] mx-auto cursor-pointer perspective-1000"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col items-center text-rose-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 pointer-events-none" />
        
        <div className="w-full bg-rose-500/10 p-4 md:p-6 text-center border-b border-rose-500/10">
          <h3 className="text-xs md:text-sm tracking-[0.3em] font-bold text-rose-800 opacity-70">
            OFFICIAL INVITATION
          </h3>
        </div>
        
        <div className="flex-1 flex flex-col justify-center items-center gap-4 md:gap-6 p-6">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-rose-100 rounded-full flex items-center justify-center shadow-inner">
            <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-rose-500" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-serif italic font-bold">Valentine's Date</h2>
            <p className="text-xs md:text-sm opacity-60 font-medium">ADMIT ONE: FEMALE HORSE</p>
          </div>
          
          <div className="w-full space-y-3 pt-4 border-t border-rose-900/10">
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="flex items-center gap-2 opacity-60">
                <Calendar size={14} /> DATE
              </span>
              <span className="font-bold">Feb 14, 2026</span>
            </div>
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="flex items-center gap-2 opacity-60">
                <MapPin size={14} /> LOCATION
              </span>
              <span className="font-bold">Somewhere Special</span>
            </div>
          </div>
        </div>
        
        <div className="w-full p-3 bg-black/5 flex justify-between items-center">
          <div className="font-mono text-[10px] opacity-40">ID: LOVE-2026-XOXO</div>
          <CreditCard size={16} className="opacity-40" />
        </div>
      </div>
    </motion.div>
  );
});

Ticket.displayName = "Ticket";

// --- INTERACTIVE CAT ---
const InteractiveCat = React.memo(({ emotion = 'neutral', device }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 25 });
  const pupilX = useTransform(springX, [-10, 10], [-6, 6]);
  const pupilY = useTransform(springY, [-10, 10], [-6, 6]);

  useEffect(() => {
    if (emotion !== 'neutral' || device.isMobile) {
      mouseX.set(0);
      mouseY.set(0);
      return;
    }

    const handleMove = (clientX, clientY) => {
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      mouseX.set(x);
      mouseY.set(y);
    };

    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [emotion, mouseX, mouseY, device.isMobile]);

  return (
    <motion.div 
      className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 md:mb-8 pointer-events-none"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
        <motion.path
          d="M40 60 L60 10 L90 50 Z"
          fill="#fff"
          stroke="#fecdd3"
          strokeWidth="4"
          animate={{ rotate: emotion === 'sad' ? -10 : 0, y: emotion === 'sad' ? 10 : 0 }}
          transition={{ duration: 0.3 }}
        />
        <motion.path
          d="M160 60 L140 10 L110 50 Z"
          fill="#fff"
          stroke="#fecdd3"
          strokeWidth="4"
          animate={{ rotate: emotion === 'sad' ? 10 : 0, y: emotion === 'sad' ? 10 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        <circle cx="100" cy="110" r="70" fill="#fff" stroke="#fecdd3" strokeWidth="4" />
        
        {emotion === 'happy' || emotion === 'cool' ? (
          <g>
            {emotion === 'cool' ? (
              <g>
                <path d="M45 95 Q 70 95 95 95 Q 100 90 105 95 Q 130 95 155 95 L 150 115 Q 130 125 105 115 L 100 110 L 95 115 Q 70 125 50 115 Z" fill="#111" />
                <line x1="155" y1="95" x2="170" y2="85" stroke="#111" strokeWidth="3" />
                <line x1="45" y1="95" x2="30" y2="85" stroke="#111" strokeWidth="3" />
                <path d="M55 100 L 75 100 L 55 110 Z" fill="white" opacity="0.2" />
              </g>
            ) : (
              <g>
                <motion.path
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  d="M60 90 q10 -15 20 0 q10 -15 20 0 q-20 30 -40 0"
                  fill="#f43f5e"
                />
                <motion.path
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                  d="M120 90 q10 -15 20 0 q10 -15 20 0 q-20 30 -40 0"
                  fill="#f43f5e"
                />
              </g>
            )}
            <path d="M85 130 q15 15 30 0" fill="none" stroke="#881337" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="120" r="8" fill="#fda4af" opacity="0.6" />
            <circle cx="150" cy="120" r="8" fill="#fda4af" opacity="0.6" />
          </g>
        ) : emotion === 'sad' ? (
          <g>
            <circle cx="70" cy="95" r="8" fill="#333" />
            <circle cx="130" cy="95" r="8" fill="#333" />
            <motion.path
              d="M70 105 q-5 10 0 20 q5 -10 0 -20"
              fill="#60a5fa"
              animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <motion.path
              d="M130 105 q-5 10 0 20 q5 -10 0 -20"
              fill="#60a5fa"
              animate={{ y: [0, 15, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
            />
            <path d="M85 135 q15 -10 30 0" fill="none" stroke="#881337" strokeWidth="4" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <circle cx="70" cy="95" r="15" fill="#fce7f3" />
            <circle cx="130" cy="95" r="15" fill="#fce7f3" />
            {device.isMobile ? (
              <>
                <circle cx={70} cy={95} r="6" fill="#333" />
                <circle cx={130} cy={95} r="6" fill="#333" />
              </>
            ) : (
              <>
                <motion.circle cx={70} cy={95} r="6" fill="#333" style={{ x: pupilX, y: pupilY }} />
                <motion.circle cx={130} cy={95} r="6" fill="#333" style={{ x: pupilX, y: pupilY }} />
              </>
            )}
            <path d="M90 130 q10 5 20 0" fill="none" stroke="#881337" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </motion.div>
  );
});

InteractiveCat.displayName = "InteractiveCat";

// --- MAIN APP ---
export default function App() {
  const [step, setStep] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [noCount, setNoCount] = useState(0);
  const [petEmotion, setPetEmotion] = useState('neutral');
  const [showNextButton, setShowNextButton] = useState(false);
  const [questionRevealed, setQuestionRevealed] = useState(false);
  
  const device = useDeviceDetection();
  const { playAudio, toggleMute, isMuted } = useAudioPlayer(CONFIG.MUSIC_PATH);
  const confettiTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
    };
  }, []);

  const handleStartExperience = useCallback(() => {
    setStep(1);
    playAudio();
  }, [playAudio]);

  const handleTextComplete = useCallback(() => {
    setShowNextButton(true);
  }, []);

  const handleNextStoryLine = useCallback(() => {
    setShowNextButton(false);
    if (storyIndex < CONFIG.STORY_LINES.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else {
      setStep(2);
    }
  }, [storyIndex]);

  const triggerConfetti = useCallback(() => {
    const endTime = Date.now() + CONFIG.ANIMATION.CONFETTI_DURATION;
    const colors = ['#ec4899', '#fbcfe8', '#fb7185'];
    const particleCount = device.isMobile ? 20 : 40;

    const interval = setInterval(() => {
      if (Date.now() > endTime) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        colors,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      });
    }, CONFIG.ANIMATION.CONFETTI_INTERVAL);

    confettiTimeoutRef.current = interval;
  }, [device.isMobile]);

  const handleYes = useCallback(() => {
    setStep(3);
    setPetEmotion('cool');
    triggerConfetti();
  }, [triggerConfetti]);

  const handleNo = useCallback(() => {
    setNoCount((prev) => prev + 1);
    setPetEmotion('sad');
    setTimeout(() => setPetEmotion('neutral'), 1000);
  }, []);

  const blobVariants = useMemo(() => ({
    animate: {
      scale: [1, 1.2, 1],
      rotate: [0, 180, 0],
      x: [0, 100, -100, 0],
      y: [0, -100, 100, 0],
      transition: {
        duration: CONFIG.ANIMATION.BLOB_DURATION,
        repeat: Infinity,
        ease: "linear"
      }
    }
  }), []);

  const currentNoText = useMemo(
    () => CONFIG.NO_TEXTS[Math.min(noCount, CONFIG.NO_TEXTS.length - 1)],
    [noCount]
  );

  return (
    <div className="h-[100dvh] w-screen flex items-center justify-center relative overflow-hidden font-sans selection:bg-rose-300/50">
      
      <ConstellationBackground step={step} device={device} />

      <AnimatePresence>
        {step > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={toggleMute}
            className="fixed top-4 right-4 z-50 p-3 bg-white/40 backdrop-blur-md border border-white/60 rounded-full text-rose-900 shadow-sm hover:bg-white/60 transition-all active:scale-95"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ backgroundColor: step === 3 ? "#fff7ed" : "#fff1f2" }}
        className="fixed inset-0 -z-20 overflow-hidden"
        transition={{ duration: 2 }}
      >
        <motion.div
          variants={blobVariants}
          animate="animate"
          className="absolute top-0 left-0 w-[80vw] h-[80vw] md:w-[800px] md:h-[800px] bg-rose-300/40 rounded-full blur-[80px] md:blur-[120px] mix-blend-multiply"
        />
        <motion.div
          variants={blobVariants}
          animate="animate"
          transition={{ delay: 5 }}
          className="absolute bottom-0 right-0 w-[60vw] h-[60vw] md:w-[600px] md:h-[600px] bg-purple-200/40 rounded-full blur-[80px] md:blur-[120px] mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[60px] md:backdrop-blur-[100px]" />
      </motion.div>

      <div className="z-10 w-full max-w-3xl p-6 md:p-8 relative flex flex-col items-center">
        <AnimatePresence mode="wait">
          
          {step === 0 && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.2 }}
              className="text-center space-y-8 md:space-y-12"
            >
              <h1 className="text-4xl md:text-8xl font-serif italic font-medium text-rose-900 drop-shadow-sm pb-2 leading-tight">
                Ready to enter <br /> the experience?
              </h1>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartExperience}
                className="px-8 py-4 md:px-10 md:py-5 bg-white/40 backdrop-blur-md border border-white/60 rounded-full shadow-lg hover:bg-white/60 transition-all duration-500"
              >
                <span className="flex items-center gap-4 text-rose-900 font-serif text-base md:text-lg tracking-widest">
                  YES <ArrowRight className="w-5 h-5" />
                </span>
              </motion.button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="story"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-8 md:space-y-12 max-w-2xl mx-auto min-h-[40vh] flex flex-col justify-center items-center"
            >
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-rose-400 mx-auto animate-pulse mb-6" />
              
              <HandwrittenText 
                key={storyIndex}
                text={CONFIG.STORY_LINES[storyIndex]}
                onComplete={handleTextComplete}
                device={device}
              />
              
              <AnimatePresence>
                {showNextButton && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNextStoryLine}
                    className="px-8 py-3 md:px-10 md:py-4 bg-white/40 border border-white/60 rounded-full text-rose-900 font-serif tracking-widest hover:bg-white/60 transition-all shadow-sm mt-8"
                  >
                    {storyIndex < CONFIG.STORY_LINES.length - 1 ? "NEXT" : "PROCEED"}
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="proposal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 1 }}
              className="w-full text-center space-y-6 md:space-y-8"
            >
              <InteractiveCat emotion={petEmotion} device={device} />
              
              <div className="space-y-4 min-h-[160px] flex items-center justify-center">
                <ScratchOffReveal 
                  onRevealed={() => setQuestionRevealed(true)}
                  device={device}
                >
                  <h2 className="text-3xl md:text-7xl font-serif text-rose-900 leading-tight drop-shadow-sm px-4">
                    Will you be my <br />
                    <span className="italic text-rose-500">Valentine?</span>
                  </h2>
                </ScratchOffReveal>
              </div>
              
              <AnimatePresence>
                {questionRevealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 relative pt-8"
                  >
                    <motion.button
                      onClick={handleYes}
                      onMouseEnter={() => !device.isMobile && setPetEmotion('happy')}
                      onMouseLeave={() => !device.isMobile && setPetEmotion('neutral')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full md:w-auto px-12 py-4 bg-white text-rose-600 font-serif text-xl rounded-full transition-all shadow-lg font-bold z-20 border border-rose-100"
                    >
                      Yes
                    </motion.button>
                    
                    {noCount < 10 ? (
                      <motion.button
                        whileTap={{ x: [0, -10, 10, -10, 10, 0] }}
                        onClick={handleNo}
                        className="w-full md:w-auto px-12 py-4 bg-white/30 border border-white/60 text-rose-800/60 font-serif text-xl rounded-full hover:bg-white/50 transition-all backdrop-blur-sm"
                      >
                        {currentNoText}
                      </motion.button>
                    ) : (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        onClick={handleYes}
                        className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-emerald-300 to-teal-400 text-white font-serif text-xl rounded-full shadow-lg font-bold"
                      >
                        Okay Fine Yes 🙄
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="w-full text-center space-y-4 md:space-y-8"
            >
              <InteractiveCat emotion="cool" device={device} />
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full"
              >
                <h1 className="text-4xl md:text-7xl font-serif italic text-rose-900 mb-8">
                  Splendid.
                </h1>
                <Ticket device={device} />
                <p className="mt-8 text-rose-800/60 font-medium uppercase tracking-widest text-xs md:text-sm">
                  Screenshot this ticket
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}