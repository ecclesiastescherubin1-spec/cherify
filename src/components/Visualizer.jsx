import React, { useRef, useEffect, useContext, useState } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { Flame, Sparkles } from 'lucide-react';

const Visualizer = () => {
  const { currentTrack, isPlaying, analyserRef } = useContext(PlayerContext);
  const canvasRef = useRef(null);
  const [style, setStyle] = useState('bars'); // 'bars' or 'wave'
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on CSS display size
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Simulation variables for YouTube CORS fallback
    let simPhase = 0;

    const renderFrame = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      // Clear with slight trailing opacity for motion blur
      ctx.fillStyle = 'rgba(10, 10, 10, 0.18)';
      ctx.fillRect(0, 0, w, h);

      const isYoutube = currentTrack?.type === 'youtube';
      const hasAnalyser = analyserRef?.current;

      if (isPlaying && (!isYoutube && hasAnalyser)) {
        // Real-Time Web Audio API Visualization
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        if (style === 'bars') {
          analyser.getByteFrequencyData(dataArray);

          const barWidth = (w / bufferLength) * 2.8;
          let barHeight;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * h * 0.75;

            // Draw glowing bar with premium neon purple/indigo gradient
            const gradient = ctx.createLinearGradient(x, h, x, h - barHeight);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)'); // Indigo
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.85)'); // Purple

            ctx.fillStyle = gradient;
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'rgba(139, 92, 246, 0.6)';
            
            ctx.fillRect(x, h - barHeight, barWidth - 2, barHeight);
            x += barWidth;
          }
        } else {
          // Time domain (waveform) rendering
          analyser.getByteTimeDomainData(dataArray);

          ctx.lineWidth = 3;
          ctx.strokeStyle = '#818cf8';
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(129, 140, 248, 0.7)';
          ctx.beginPath();

          const sliceWidth = w / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * h) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.lineTo(w, h / 2);
          ctx.stroke();
        }
      } else {
        // Fallback / Idle State (Simulated kinetic wave)
        const activeWaveFactor = isPlaying ? 1.0 : 0.15; // smooth flatline when paused
        simPhase += isPlaying ? 0.05 : 0.005;

        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.lineWidth = 2.5;

        // Custom multi-sine wave overlay for a luxurious, alive look
        for (let x = 0; x < w; x++) {
          const y = h / 2 + 
            Math.sin(x * 0.02 + simPhase) * 15 * activeWaveFactor +
            Math.sin(x * 0.01 - simPhase * 0.7) * 8 * activeWaveFactor;
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const gradient = ctx.createLinearGradient(0, 0, w, 0);
        gradient.addColorStop(0, '#818cf8'); // Indigo
        gradient.addColorStop(0.5, '#ec4899'); // Pink
        gradient.addColorStop(1, '#a855f7'); // Violet
        
        ctx.strokeStyle = gradient;
        ctx.shadowBlur = 18;
        ctx.shadowColor = 'rgba(236, 72, 153, 0.45)';
        ctx.stroke();
      }

      // Reset shadows
      ctx.shadowBlur = 0;
      animationRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentTrack, isPlaying, style]);

  return (
    <div className="visualizer-wrapper">
      <div className="vis-controls">
        <button 
          className={`vis-btn ${style === 'bars' ? 'active' : ''}`}
          onClick={() => setStyle('bars')}
          title="Frequency Spectrum Bars"
        >
          <Flame size={12} /> Spectrum
        </button>
        <button 
          className={`vis-btn ${style === 'wave' ? 'active' : ''}`}
          onClick={() => setStyle('wave')}
          title="Oscilloscope Waveform"
        >
          <Sparkles size={12} /> Waveform
        </button>
      </div>
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  );
};

export default Visualizer;
