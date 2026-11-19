import { EFFECT_PALETTES } from '../data/presets';
import { EffectConfig } from '../types/studio';

interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
  trail: Array<{ x: number; y: number }>;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  size: number;
  trail: Array<{ x: number; y: number }>;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  tilt: number;
  tiltAngle: number;
  tiltSpeed: number;
  shape: 'rect' | 'ribbon' | 'star';
}

interface BinaryColumn {
  x: number;
  y: number;
  speed: number;
  length: number;
  fontSize: number;
  chars: string[];
  tick: number;
}

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  spin: number;
  swayPhase: number;
  color: string;
  alpha: number;
}

interface AmbientSparkle {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
  color: string;
}

export class ParticleEngine {
  private width = 720;
  private height = 1280;
  private rockets: Rocket[] = [];
  private sparks: Spark[] = [];
  private confetti: ConfettiPiece[] = [];
  private binaryCols: BinaryColumn[] = [];
  private petals: Petal[] = [];
  private ambient: AmbientSparkle[] = [];
  private launchCooldown = 0;

  constructor(width: number, height: number) {
    this.resize(width, height);
    this.seedInitial();
  }

  public resize(width: number, height: number) {
    const changed = Math.abs(this.width - width) > 4 || Math.abs(this.height - height) > 4;
    this.width = width;
    this.height = height;
    if (changed) {
      this.seedInitial();
    }
  }

  public reset() {
    this.rockets = [];
    this.sparks = [];
    this.seedInitial();
  }

  private getColors(config: EffectConfig): string[] {
    return EFFECT_PALETTES[config.palette]?.colors ?? EFFECT_PALETTES['festive-gold'].colors;
  }

  private randomBinaryChar(): string {
    const pool = ['0', '1', '0', '1', '0', '1', '✦', '2', '6'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private seedInitial() {
    this.confetti = [];
    for (let i = 0; i < 95; i++) {
      this.confetti.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.4,
        vy: 1.5 + Math.random() * 2.5,
        size: 7 + Math.random() * 9,
        color: '#FBBF24',
        tilt: Math.random() * 10,
        tiltAngle: Math.random() * Math.PI * 2,
        tiltSpeed: 0.04 + Math.random() * 0.09,
        shape: i % 5 === 0 ? 'star' : i % 2 === 0 ? 'ribbon' : 'rect',
      });
    }

    this.binaryCols = [];
    const colCount = Math.max(18, Math.floor(this.width / 26));
    for (let i = 0; i < colCount; i++) {
      const len = 8 + Math.floor(Math.random() * 14);
      const chars: string[] = [];
      for (let c = 0; c < len; c++) chars.push(this.randomBinaryChar());
      this.binaryCols.push({
        x: (i + 0.5) * (this.width / colCount),
        y: Math.random() * this.height,
        speed: 2.5 + Math.random() * 4.2,
        length: len,
        fontSize: 15 + Math.floor(Math.random() * 7),
        chars,
        tick: Math.floor(Math.random() * 20),
      });
    }

    this.petals = [];
    for (let i = 0; i < 55; i++) {
      this.petals.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: -0.4 + Math.random() * 0.8,
        vy: 1.0 + Math.random() * 1.5,
        size: 8 + Math.random() * 10,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.04,
        swayPhase: Math.random() * Math.PI * 2,
        color: '#FDE68A',
        alpha: 0.55 + Math.random() * 0.4,
      });
    }

    this.ambient = [];
    for (let i = 0; i < 42; i++) {
      this.ambient.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 1.8 + Math.random() * 4.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.025 + Math.random() * 0.04,
        color: '#FDE68A',
      });
    }
  }

  private spawnRocket(colors: string[]) {
    const startX = this.width * (0.15 + Math.random() * 0.7);
    const targetY = this.height * (0.12 + Math.random() * 0.36);
    const color = colors[Math.floor(Math.random() * colors.length)];
    this.rockets.push({
      x: startX,
      y: this.height * 0.96,
      vx: (Math.random() - 0.5) * 1.6,
      vy: -(9.5 + Math.random() * 4.5),
      targetY,
      color,
      trail: [],
    });
  }

  private burstFirework(x: number, y: number, primaryColor: string, colors: string[], density: number) {
    const count = Math.floor((48 + Math.random() * 34) * Math.min(1.4, Math.max(0.5, density)));
    const secondary = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.14;
      const speed = 1.8 + Math.random() * 5.6;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.015,
        color: i % 3 === 0 ? secondary : primaryColor,
        size: 2.2 + Math.random() * 2.6,
        trail: [],
      });
    }
  }

  public updateAndDraw(ctx: CanvasRenderingContext2D, config: EffectConfig, dtFactor = 1) {
    const colors = this.getColors(config);
    const speed = config.speed * dtFactor;
    const density = config.density;

    if (config.type === 'fireworks') {
      this.updateAndDrawFireworks(ctx, colors, speed, density, config.glow);
    } else if (config.type === 'confetti') {
      this.updateAndDrawConfetti(ctx, colors, speed, density);
    } else if (config.type === 'binary') {
      this.updateAndDrawBinary(ctx, colors, speed, density, config.glow);
    } else if (config.type === 'petals') {
      this.updateAndDrawPetals(ctx, colors, speed, density, config.glow);
    } else if (config.type === 'sparkles') {
      this.updateAndDrawSparkles(ctx, colors, speed, density * 1.4, config.glow);
    }

    if (config.secondarySparkle && config.type !== 'sparkles' && config.type !== 'none') {
      this.updateAndDrawSparkles(ctx, colors, speed * 0.85, density * 0.6, config.glow);
    }
  }

  private updateAndDrawFireworks(
    ctx: CanvasRenderingContext2D,
    colors: string[],
    speed: number,
    density: number,
    glow: boolean
  ) {
    this.launchCooldown -= speed;
    if (this.launchCooldown <= 0) {
      this.spawnRocket(colors);
      if (Math.random() < 0.35 * density) {
        this.spawnRocket(colors);
      }
      this.launchCooldown = Math.max(14, 42 / Math.max(0.4, density));
    }

    ctx.save();
    if (glow) {
      ctx.globalCompositeOperation = 'lighter';
    }

    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 8) r.trail.shift();

      r.x += r.vx * speed;
      r.y += r.vy * speed;
      r.vy += 0.08 * speed;

      // Draw rocket trail
      for (let t = 0; t < r.trail.length; t++) {
        const pt = r.trail[t];
        const ratio = (t + 1) / r.trail.length;
        ctx.fillStyle = r.color;
        ctx.globalAlpha = ratio * 0.75;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.2 * ratio, 0, Math.PI * 2);
        ctx.fill();
      }

      if (r.y <= r.targetY || r.vy >= -1.2) {
        this.burstFirework(r.x, r.y, r.color, colors, density);
        this.rockets.splice(i, 1);
      }
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.trail.push({ x: s.x, y: s.y });
      if (s.trail.length > 6) s.trail.shift();

      s.vx *= Math.pow(0.975, speed);
      s.vy *= Math.pow(0.975, speed);
      s.vy += 0.075 * speed;
      s.x += s.vx * speed;
      s.y += s.vy * speed;
      s.alpha -= s.decay * speed;

      if (s.alpha <= 0.02) {
        this.sparks.splice(i, 1);
        continue;
      }

      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size * 0.9;
      ctx.lineCap = 'round';
      ctx.globalAlpha = Math.max(0, s.alpha);

      if (s.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.trail[0].x, s.trail[0].y);
        for (let t = 1; t < s.trail.length; t++) {
          ctx.lineTo(s.trail[t].x, s.trail[t].y);
        }
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = Math.max(0, s.alpha * 0.9);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private updateAndDrawConfetti(
    ctx: CanvasRenderingContext2D,
    colors: string[],
    speed: number,
    density: number
  ) {
    const activeCount = Math.min(this.confetti.length, Math.floor(24 + 68 * density));
    ctx.save();
    for (let i = 0; i < activeCount; i++) {
      const c = this.confetti[i];
      c.tiltAngle += c.tiltSpeed * speed;
      c.y += c.vy * speed * 1.35;
      c.x += (c.vx + Math.sin(c.tiltAngle) * 0.9) * speed;
      c.tilt = Math.sin(c.tiltAngle) * 12;

      if (c.y > this.height + 24) {
        c.y = -20;
        c.x = Math.random() * this.width;
      }
      if (c.x < -20) c.x = this.width + 20;
      if (c.x > this.width + 20) c.x = -20;

      const color = colors[i % colors.length];
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate((c.tiltAngle * 0.6) % (Math.PI * 2));
      ctx.scale(1, Math.max(0.22, Math.abs(Math.cos(c.tiltAngle))));
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.88;

      if (c.shape === 'ribbon') {
        ctx.fillRect(-c.size * 0.35, -c.size * 0.8, c.size * 0.7, c.size * 1.6);
      } else if (c.shape === 'star') {
        this.drawMiniStar(ctx, 0, 0, 4, c.size * 0.65, c.size * 0.25);
        ctx.fill();
      } else {
        ctx.fillRect(-c.size * 0.5, -c.size * 0.35, c.size, c.size * 0.7);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  private updateAndDrawBinary(
    ctx: CanvasRenderingContext2D,
    colors: string[],
    speed: number,
    density: number,
    glow: boolean
  ) {
    const activeCols = Math.min(this.binaryCols.length, Math.max(10, Math.floor(this.binaryCols.length * Math.min(1.2, density))));
    ctx.save();
    ctx.textAlign = 'center';

    for (let i = 0; i < activeCols; i++) {
      const col = this.binaryCols[i];
      col.y += col.speed * speed * 1.25;
      col.tick++;
      if (col.tick % 9 === 0) {
        const idx = Math.floor(Math.random() * col.chars.length);
        col.chars[idx] = this.randomBinaryChar();
      }

      const tailHeight = col.length * (col.fontSize * 1.22);
      if (col.y - tailHeight > this.height) {
        col.y = -Math.random() * 140;
      }

      ctx.font = `700 ${col.fontSize}px "JetBrains Mono", monospace`;
      const baseColor = colors[i % colors.length];

      for (let j = 0; j < col.length; j++) {
        const charY = col.y - j * col.fontSize * 1.22;
        if (charY < -20 || charY > this.height + 20) continue;

        const isHead = j === 0;
        const alpha = isHead ? 0.96 : Math.max(0.06, (1 - j / col.length) * 0.72);
        ctx.globalAlpha = alpha;

        if (isHead) {
          ctx.fillStyle = '#FFFFFF';
          if (glow) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 12;
          }
        } else {
          ctx.fillStyle = baseColor;
          ctx.shadowBlur = 0;
        }
        ctx.fillText(col.chars[j], col.x, charY);
      }
    }
    ctx.restore();
  }

  private updateAndDrawPetals(
    ctx: CanvasRenderingContext2D,
    colors: string[],
    speed: number,
    density: number,
    glow: boolean
  ) {
    const activeCount = Math.min(this.petals.length, Math.floor(14 + 38 * density));
    ctx.save();
    for (let i = 0; i < activeCount; i++) {
      const p = this.petals[i];
      p.swayPhase += 0.03 * speed;
      p.x += (p.vx + Math.sin(p.swayPhase) * 0.8) * speed;
      p.y += p.vy * speed;
      p.angle += p.spin * speed;

      if (p.y > this.height + 24) {
        p.y = -20;
        p.x = Math.random() * this.width;
      }
      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;

      const color = colors[i % colors.length];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.alpha;
      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.6);
      ctx.bezierCurveTo(p.size * 0.65, -p.size * 0.25, p.size * 0.5, p.size * 0.6, 0, p.size * 0.7);
      ctx.bezierCurveTo(-p.size * 0.5, p.size * 0.6, -p.size * 0.65, -p.size * 0.25, 0, -p.size * 0.6);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  private updateAndDrawSparkles(
    ctx: CanvasRenderingContext2D,
    colors: string[],
    speed: number,
    density: number,
    glow: boolean
  ) {
    const activeCount = Math.min(this.ambient.length, Math.floor(10 + 30 * density));
    ctx.save();
    if (glow) ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < activeCount; i++) {
      const a = this.ambient[i];
      a.phase += a.speed * speed;
      a.y -= 0.22 * speed;
      if (a.y < -15) {
        a.y = this.height + 15;
        a.x = Math.random() * this.width;
      }

      const pulse = 0.35 + 0.65 * Math.abs(Math.sin(a.phase));
      const color = colors[i % colors.length];
      ctx.globalAlpha = pulse * 0.78;
      ctx.fillStyle = color;

      if (i % 3 === 0) {
        ctx.save();
        ctx.translate(a.x, a.y);
        this.drawMiniStar(ctx, 0, 0, 4, a.radius * 2.4 * pulse, a.radius * 0.45 * pulse);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius * (0.7 + 0.5 * pulse), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawMiniStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }
    ctx.closePath();
  }
}
