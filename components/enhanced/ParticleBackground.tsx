"use client";

import * as React from "react";
import { useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

export const ParticleBackground: React.FC = () => {
  const [particles, setParticles] = React.useState<Particle[]>([]);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationRef = React.useRef<number>();

  const initParticles = useCallback(() => {
    const particlesArray: Particle[] = [];
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      particlesArray.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: `rgba(245, 158, 11, ${Math.random() * 0.3 + 0.1})`,
      });
    }
    
    setParticles(particlesArray);
  }, []);

  const animateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    setParticles(prevParticles => 
      prevParticles.map(particle => {
        // Update position
        let newX = particle.x + particle.speedX;
        let newY = particle.y + particle.speedY;
        
        // Bounce off edges
        if (newX > canvas.width || newX < 0) {
          newX = particle.x;
          particle.speedX = -particle.speedX;
        }
        if (newY > canvas.height || newY < 0) {
          newY = particle.y;
          particle.speedY = -particle.speedY;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(newX, newY, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        
        // Draw connections
        prevParticles.forEach(otherParticle => {
          const dx = newX - otherParticle.x;
          const dy = newY - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(245, 158, 11, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(newX, newY);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
        
        return { ...particle, x: newX, y: newY };
      })
    );
    
    animationRef.current = requestAnimationFrame(animateParticles);
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    handleResize();
    initParticles();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initParticles]);

  React.useEffect(() => {
    if (particles.length > 0) {
      animationRef.current = requestAnimationFrame(animateParticles);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles, animateParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.3 }}
    />
  );
};

export default ParticleBackground;
