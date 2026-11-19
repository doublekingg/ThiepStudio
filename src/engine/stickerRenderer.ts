export function drawStickerArtwork(
  ctx: CanvasRenderingContext2D,
  stickerId: string,
  size: number,
  tint?: string
) {
  ctx.save();
  const half = size / 2;
  ctx.translate(0, 0);

  switch (stickerId) {
    case 'sunflower': {
      const petals = 14;
      for (let i = 0; i < petals; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 * i) / petals);
        ctx.fillStyle = i % 2 === 0 ? (tint || '#FBBF24') : '#F59E0B';
        ctx.beginPath();
        ctx.ellipse(0, -half * 0.58, half * 0.16, half * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#451A03';
      ctx.beginPath();
      ctx.arc(0, 0, half * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#92400E';
      ctx.lineWidth = size * 0.03;
      ctx.stroke();
      break;
    }

    case 'book-pen': {
      // Open book
      ctx.fillStyle = '#FEF3C7';
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = size * 0.035;
      ctx.beginPath();
      ctx.roundRect(-half * 0.72, -half * 0.38, half * 1.44, half * 0.92, size * 0.06);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -half * 0.38);
      ctx.lineTo(0, half * 0.54);
      ctx.stroke();
      // Lines
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = size * 0.022;
      for (let r = -0.15; r <= 0.25; r += 0.16) {
        ctx.beginPath();
        ctx.moveTo(-half * 0.54, half * r);
        ctx.lineTo(-half * 0.14, half * r);
        ctx.moveTo(half * 0.14, half * r);
        ctx.lineTo(half * 0.54, half * r);
        ctx.stroke();
      }
      // Golden fountain pen angled
      ctx.save();
      ctx.rotate(-Math.PI / 5);
      ctx.fillStyle = tint || '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(-half * 0.1, -half * 0.78, half * 0.2, half * 1.15, size * 0.04);
      ctx.fill();
      ctx.fillStyle = '#FFFBEB';
      ctx.beginPath();
      ctx.moveTo(-half * 0.08, half * 0.37);
      ctx.lineTo(half * 0.08, half * 0.37);
      ctx.lineTo(0, half * 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'grad-cap': {
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = tint || '#FBBF24';
      ctx.lineWidth = size * 0.035;
      ctx.beginPath();
      ctx.moveTo(0, -half * 0.55);
      ctx.lineTo(half * 0.82, -half * 0.12);
      ctx.lineTo(0, half * 0.28);
      ctx.lineTo(-half * 0.82, -half * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-half * 0.45, half * 0.06);
      ctx.lineTo(-half * 0.45, half * 0.45);
      ctx.quadraticCurveTo(0, half * 0.64, half * 0.45, half * 0.45);
      ctx.lineTo(half * 0.45, half * 0.06);
      ctx.fill();
      ctx.stroke();

      // Tassel
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.moveTo(half * 0.7, -half * 0.06);
      ctx.lineTo(half * 0.72, half * 0.46);
      ctx.stroke();
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(half * 0.72, half * 0.5, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'chalkboard-2011': {
      ctx.fillStyle = '#064E3B';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = size * 0.06;
      ctx.beginPath();
      ctx.roundRect(-half * 0.78, -half * 0.56, half * 1.56, half * 1.12, size * 0.08);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ECFDF5';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(size * 0.26)}px "Playfair Display", serif`;
      ctx.fillText('20 / 11', 0, -half * 0.06);
      ctx.font = `600 ${Math.round(size * 0.13)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#FDE68A';
      ctx.fillText('TRI ÂN', 0, half * 0.3);
      break;
    }

    case 'apple': {
      ctx.fillStyle = tint || '#EF4444';
      ctx.beginPath();
      ctx.arc(-half * 0.16, half * 0.06, half * 0.42, 0, Math.PI * 2);
      ctx.arc(half * 0.16, half * 0.06, half * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16A34A';
      ctx.beginPath();
      ctx.ellipse(half * 0.16, -half * 0.48, half * 0.22, half * 0.1, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = size * 0.05;
      ctx.beginPath();
      ctx.moveTo(0, -half * 0.25);
      ctx.quadraticCurveTo(half * 0.05, -half * 0.55, -half * 0.05, -half * 0.68);
      ctx.stroke();
      break;
    }

    case 'heart-ribbon': {
      ctx.fillStyle = tint || '#F43F5E';
      ctx.beginPath();
      ctx.moveTo(0, half * 0.62);
      ctx.bezierCurveTo(-half * 0.95, half * 0.1, -half * 0.85, -half * 0.65, 0, -half * 0.25);
      ctx.bezierCurveTo(half * 0.85, -half * 0.65, half * 0.95, half * 0.1, 0, half * 0.62);
      ctx.fill();
      ctx.strokeStyle = '#FFE4E6';
      ctx.lineWidth = size * 0.03;
      ctx.stroke();
      break;
    }

    case 'lantern': {
      // String
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = size * 0.03;
      ctx.beginPath();
      ctx.moveTo(0, -half * 0.85);
      ctx.lineTo(0, -half * 0.52);
      ctx.stroke();
      // Body
      ctx.fillStyle = tint || '#E11D48';
      ctx.beginPath();
      ctx.ellipse(0, -half * 0.05, half * 0.55, half * 0.46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = size * 0.025;
      ctx.beginPath();
      ctx.ellipse(0, -half * 0.05, half * 0.28, half * 0.46, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Caps
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(-half * 0.24, -half * 0.56, half * 0.48, half * 0.11);
      ctx.fillRect(-half * 0.24, half * 0.36, half * 0.48, half * 0.11);
      // Tassels
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = size * 0.03;
      for (const ox of [-half * 0.1, 0, half * 0.1]) {
        ctx.beginPath();
        ctx.moveTo(ox, half * 0.47);
        ctx.lineTo(ox * 1.4, half * 0.82);
        ctx.stroke();
      }
      break;
    }

    case 'apricot-blossom':
    case 'peach-blossom': {
      const isPeach = stickerId === 'peach-blossom';
      // Branch
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = size * 0.05;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-half * 0.78, half * 0.55);
      ctx.quadraticCurveTo(0, half * 0.1, half * 0.76, -half * 0.42);
      ctx.stroke();
      const flowers = [
        { fx: -half * 0.35, fy: half * 0.24, s: 0.28 },
        { fx: half * 0.12, fy: -half * 0.05, s: 0.34 },
        { fx: half * 0.52, fy: -half * 0.35, s: 0.24 },
      ];
      for (const fl of flowers) {
        ctx.save();
        ctx.translate(fl.fx, fl.fy);
        ctx.fillStyle = isPeach ? '#FB7185' : (tint || '#FACC15');
        for (let p = 0; p < 5; p++) {
          ctx.save();
          ctx.rotate((Math.PI * 2 * p) / 5);
          ctx.beginPath();
          ctx.arc(0, -half * fl.s * 0.65, half * fl.s * 0.52, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = isPeach ? '#FEF08A' : '#B45309';
        ctx.beginPath();
        ctx.arc(0, 0, half * fl.s * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    case 'lixi': {
      ctx.fillStyle = tint || '#DC2626';
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = size * 0.035;
      ctx.beginPath();
      ctx.roundRect(-half * 0.46, -half * 0.72, half * 0.92, half * 1.44, size * 0.07);
      ctx.fill();
      ctx.stroke();
      // Flap
      ctx.beginPath();
      ctx.moveTo(-half * 0.46, -half * 0.35);
      ctx.quadraticCurveTo(0, -half * 0.06, half * 0.46, -half * 0.35);
      ctx.stroke();
      // Gold coin center
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(0, half * 0.14, half * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(-half * 0.07, half * 0.07, half * 0.14, half * 0.14);
      break;
    }

    case 'banh-chung': {
      ctx.fillStyle = '#15803D';
      ctx.strokeStyle = '#FEF3C7';
      ctx.lineWidth = size * 0.035;
      ctx.beginPath();
      ctx.roundRect(-half * 0.62, -half * 0.62, half * 1.24, half * 1.24, size * 0.08);
      ctx.fill();
      ctx.stroke();
      // Tie cords
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.moveTo(-half * 0.22, -half * 0.62);
      ctx.lineTo(-half * 0.22, half * 0.62);
      ctx.moveTo(half * 0.22, -half * 0.62);
      ctx.lineTo(half * 0.22, half * 0.62);
      ctx.moveTo(-half * 0.62, -half * 0.22);
      ctx.lineTo(half * 0.62, -half * 0.22);
      ctx.moveTo(-half * 0.62, half * 0.22);
      ctx.lineTo(half * 0.62, half * 0.22);
      ctx.stroke();
      break;
    }

    case 'gold-coin': {
      ctx.fillStyle = tint || '#F59E0B';
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = size * 0.05;
      ctx.beginPath();
      ctx.arc(0, 0, half * 0.68, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-half * 0.18, -half * 0.18, half * 0.36, half * 0.36);
      break;
    }

    case 'firework-badge': {
      const rays = 12;
      ctx.strokeStyle = tint || '#FDE047';
      ctx.lineCap = 'round';
      for (let i = 0; i < rays; i++) {
        const angle = (Math.PI * 2 * i) / rays;
        const r1 = half * 0.22;
        const r2 = i % 2 === 0 ? half * 0.78 : half * 0.54;
        ctx.lineWidth = size * 0.045;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
        ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
        ctx.stroke();
      }
      ctx.fillStyle = '#FFFBEB';
      ctx.beginPath();
      ctx.arc(0, 0, half * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'crown': {
      ctx.fillStyle = tint || '#FBBF24';
      ctx.strokeStyle = '#FEF3C7';
      ctx.lineWidth = size * 0.03;
      ctx.beginPath();
      ctx.moveTo(-half * 0.72, half * 0.42);
      ctx.lineTo(-half * 0.8, -half * 0.28);
      ctx.lineTo(-half * 0.36, half * 0.06);
      ctx.lineTo(0, -half * 0.52);
      ctx.lineTo(half * 0.36, half * 0.06);
      ctx.lineTo(half * 0.8, -half * 0.28);
      ctx.lineTo(half * 0.72, half * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'sparkle-star': {
      ctx.fillStyle = tint || '#FDE68A';
      ctx.beginPath();
      ctx.moveTo(0, -half * 0.8);
      ctx.quadraticCurveTo(0, 0, half * 0.8, 0);
      ctx.quadraticCurveTo(0, 0, 0, half * 0.8);
      ctx.quadraticCurveTo(0, 0, -half * 0.8, 0);
      ctx.quadraticCurveTo(0, 0, 0, -half * 0.8);
      ctx.fill();
      break;
    }

    case 'ribbon-bow': {
      ctx.fillStyle = tint || '#E11D48';
      ctx.strokeStyle = '#FDA4AF';
      ctx.lineWidth = size * 0.03;
      // Left wing
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-half * 0.85, -half * 0.65, -half * 0.85, half * 0.55, 0, half * 0.08);
      ctx.fill();
      ctx.stroke();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(half * 0.85, -half * 0.65, half * 0.85, half * 0.55, 0, half * 0.08);
      ctx.fill();
      ctx.stroke();
      // Tails
      ctx.beginPath();
      ctx.moveTo(-half * 0.08, half * 0.08);
      ctx.lineTo(-half * 0.45, half * 0.68);
      ctx.lineTo(-half * 0.2, half * 0.58);
      ctx.lineTo(0, half * 0.14);
      ctx.lineTo(half * 0.2, half * 0.58);
      ctx.lineTo(half * 0.45, half * 0.68);
      ctx.lineTo(half * 0.08, half * 0.08);
      ctx.fill();
      // Center knot
      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.arc(0, 0, half * 0.15, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'medal': {
      ctx.fillStyle = '#E11D48';
      ctx.fillRect(-half * 0.28, -half * 0.78, half * 0.24, half * 0.55);
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(half * 0.04, -half * 0.78, half * 0.24, half * 0.55);
      ctx.fillStyle = tint || '#F59E0B';
      ctx.strokeStyle = '#FEF3C7';
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.arc(0, half * 0.18, half * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350F';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(size * 0.22)}px "Oswald", sans-serif`;
      ctx.fillText('NO.1', 0, half * 0.2);
      break;
    }

    case 'seal-stamp': {
      ctx.strokeStyle = tint || '#EF4444';
      ctx.lineWidth = size * 0.05;
      ctx.beginPath();
      ctx.arc(0, 0, half * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = size * 0.022;
      ctx.beginPath();
      ctx.arc(0, 0, half * 0.58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = tint || '#EF4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(size * 0.16)}px "Oswald", sans-serif`;
      ctx.fillText('CHÚC MỪNG', 0, 0);
      break;
    }

    case 'binary-chip': {
      ctx.fillStyle = '#064E3B';
      ctx.strokeStyle = tint || '#34D399';
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.roundRect(-half * 0.72, -half * 0.48, half * 1.44, half * 0.96, size * 0.1);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#6EE7B7';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(size * 0.2)}px "JetBrains Mono", monospace`;
      ctx.fillText('0101', 0, -half * 0.12);
      ctx.fillText('1010', 0, half * 0.18);
      break;
    }

    case 'balloon-pair':
    default: {
      // Strings
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = size * 0.025;
      ctx.beginPath();
      ctx.moveTo(-half * 0.26, half * 0.18);
      ctx.quadraticCurveTo(-half * 0.35, half * 0.5, -half * 0.15, half * 0.78);
      ctx.moveTo(half * 0.26, half * 0.05);
      ctx.quadraticCurveTo(half * 0.35, half * 0.42, half * 0.15, half * 0.78);
      ctx.stroke();
      // Left balloon
      ctx.fillStyle = tint || '#38BDF8';
      ctx.beginPath();
      ctx.ellipse(-half * 0.28, -half * 0.18, half * 0.32, half * 0.4, -0.15, 0, Math.PI * 2);
      ctx.fill();
      // Right balloon
      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.ellipse(half * 0.24, -half * 0.3, half * 0.32, half * 0.4, 0.15, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}
