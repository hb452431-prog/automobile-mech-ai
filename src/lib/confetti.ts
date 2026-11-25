// Lightweight canvas confetti helper (zero extra runtime dependency)
export function triggerConfetti(options: { particleCount?: number; spread?: number; origin?: { x?: number; y?: number } } = {}) {
  const count = options.particleCount ?? 60;
  const spread = options.spread ?? 70;
  const originX = options.origin?.x ?? 0.5;
  const originY = options.origin?.y ?? 0.5;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#3b82f6', '#60a5fa', '#38bdf8', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    rotation: number;
    rotSpeed: number;
  }> = [];

  const startX = window.innerWidth * originX;
  const startY = window.innerHeight * originY;

  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * spread - spread / 2 - 90) * (Math.PI / 180);
    const speed = Math.random() * 9 + 4;
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
    });
  }

  let startTime: number | null = null;
  const duration = 2500;

  function render(time: number) {
    if (!startTime) startTime = time;
    const elapsed = time - startTime;
    if (elapsed > duration) {
      canvas.remove();
      return;
    }

    ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.98;
      p.rotation += p.rotSpeed;
      p.alpha = Math.max(0, 1 - elapsed / duration);

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.rotation * Math.PI) / 180);
      ctx!.globalAlpha = p.alpha;
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx!.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
