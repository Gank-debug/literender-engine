  // ---- Long Neck x Shroud (drafts). opt.arch: 'tilt' (straight neck, head lolled), 'hook' (neck arches over and the hood hangs down at you), 'reach' (neck stretched forward, low)
  const hollowNS = (face = 0, pose = 'idle', frame = 0, opt = {}) => { frame %= H3F[pose] || 1; const arch = opt.arch || 'hook', key = 'HNS' + arch + face + pose + frame; const hit = cache.get(key); if (hit) return hit;
    const S = new Surf(170, 190, 85, 166); S.face(Math.PI / 4 + face * Math.PI / 4);
    const rb = [70, 64, 60], rag = [112, 104, 94], inner = [8, 6, 8], skin = [178, 170, 158], gum = [60, 26, 30], ht = 1.3, SH = 7, WD = 1.18, T = frame / (H3F[pose] || 1) * 6.2832;
    const snap = pose === 'idle' && frame === 2, walk = pose === 'walk', lift = 3 + (walk ? Math.sin(T) * .4 : 0), sway = walk ? Math.sin(T + 1) * 1.2 : 0, hunch = 1.4;
    const Z = z => z * ht + lift, W0 = Z(30), U = z => W0 + (z - 30) * ht;
    const fold = th => { const f = Math.abs(Math.sin(th * 5 + .7)); return f < .08 ? -.24 : f < .2 ? -.07 : 0; };
    const cloth = th => [rb, fold(th)];
    // body: shroud-grey habit, slightly stooped, ragged hem
    S.ell(Z(-5), W0, 4.6 * WD, 5.4 * WD, 3.4 * WD, 4.2 * WD, (th, z) => (z < Z(4) && z < Z(-3) + hs(Math.floor(th * 11 + (walk ? frame * 2 : 0)), 3) * 12) ? null : cloth(th), sway * .2, hunch * .4, 3);
    S.ell(W0, U(41.6), 3.4 * WD, 4.2 * WD, 3.7 * WD, SH - .5, cloth, hunch * .4, hunch, 3.5);
    S.ell(U(41.6), U(43.6), 3.7 * WD, SH - .5, 1.6, 1.8, cloth, hunch, hunch, 3);
    // the neck: a spine of wrapped cloth, sampled along a curve
    const base = [hunch + .2, 0, U(43)], L = arch === 'reach' ? 14 : 17;
    const at = t => { if (arch === 'tilt') { const a = snap ? -.75 : .5; return [base[0] + t * 1.5, Math.sin(a) * L * t * t * .45, base[2] + L * t * (1 - .12 * t)]; }
      if (arch === 'reach') return [base[0] + L * .9 * t, 0, base[2] + 5 * Math.sin(t * 2.2) - t * 2 + (snap ? 1.5 * t : 0)];
      const a = t * (snap ? 2.5 : 2.15); return [base[0] + Math.sin(a) * L * .55, (snap ? 1.8 : 0) * t * t, base[2] + (1 - Math.cos(a)) * 0 + Math.sin(a * .5) * L * .9 * (t < .6 ? 1 : 1) - (t > .6 ? (t - .6) * 6 : 0)]; };
    const N = 22; for (let k = 0; k <= N; k++) { const t = k / N, p = at(t), r = 1.35 - t * .25; S.sph(p[0], p[1], p[2], r, r, r * 1.1, () => [k % 4 === 0 ? rag.map(q => q * .8) : rb, k % 4 === 0 ? -.14 : -.02]); }
    // hood at the end of the neck. Its axis follows the neck's last segment, so on the hook it hangs face-down
    const e = at(1), e0 = at(.92), ax = [e[0] - e0[0], e[1] - e0[1], e[2] - e0[2]], an = Math.hypot(...ax), u = ax.map(q => q / an);
    const fwd = arch === 'hook' ? [u[0] * .5 + .6, u[1], u[2] * .6 - .7] : arch === 'reach' ? [1, 0, -.2] : [1, 0, .1], fn = Math.hypot(...fwd), F = fwd.map(q => q / fn);
    const hc = [e[0] + u[0] * 2.2, e[1] + u[1] * 2.2, e[2] + u[2] * 2.2];
    S.sph(hc[0], hc[1], hc[2], 3.6, 3.4, 4, (dx, dy, dz) => { const d = dx * F[0] + dy * F[1] + dz * F[2]; return d > .5 ? [inner, -.6] : [rb, dz > .5 ? .05 : -.04]; });
    // the shroud's beak: the cowl droops past the face
    S.tube([hc[0] - F[0] * .5, hc[1], hc[2] + 2.6], [hc[0] + F[0] * 4.2, hc[1] + F[1] * 4.2, hc[2] + F[2] * 4.2 - 1.2], 2, .5, [rb, .04]);
    // pale face deep in the hood: two hollows, a mouth open too wide
    const fc = [hc[0] + F[0] * 1.6, hc[1] + F[1] * 1.6, hc[2] + F[2] * 1.6 - .2];
    S.sph(fc[0], fc[1], fc[2], 1.4, 1.9, 2.4, (dx, dy, dz) => { if (dx * F[0] + dy * F[1] + dz * F[2] < .15) return null; if (dz < -.25 && dz > -.75 && Math.abs(dy) < .55 - (dz + .5) * (dz + .5) * .8) return [gum, -.5]; if (dz > .12 && dz < .42 && Math.abs(Math.abs(dy) - .38) < .17) return [[40, 34, 34], -.4]; return [skin, 0]; });
    // torn strips: off the body, and trailing from the neck like bandages
    for (let k = 0; k < 20; k++) { const th = hs(k, 1) * 6.2832, z0 = Z(6 + hs(k, 2) * 30), len = 14 + hs(k, 3) * 20, r = 4.6 * WD, flap = Math.sin(T + k) * (walk ? 1.6 : .6);
      S.tube([Math.cos(th) * r + hunch * .3, Math.sin(th) * r, z0], [Math.cos(th) * (r + 2.4) - 1.5 - flap, Math.sin(th) * (r + 2.4), Math.max(Z(-10), z0 - len)], .7, .3, [hs(k, 4) < .5 ? rag : rb.map(q => q * .8), -.02]); }
    for (let k = 0; k < 7; k++) { const t = .2 + k * .11, p = at(t), len = 6 + hs(k, 11) * 9, fl = Math.sin(T + k * 1.3) * (walk ? 1.4 : .5); S.tube(p, [p[0] - 1.2 - fl, p[1] + (hs(k, 12) - .5) * 3, p[2] - len], .5, .2, [hs(k, 13) < .5 ? rag : rb, -.02]); }
    // sleeves drag on the floor; long pale fingers trail out of them
    const A = pose === 'reach' ? [[4, SH - .4, 40, 10 + frame, SH - 2, 41 + frame], [4, SH - .4, 40, 9.5 + frame, -(SH - 3.5), 40]] : walk ? [[-1 - sway * .3, SH + .5, 30, 1 - sway * .6, SH + 1, 8], [1 + sway * .3, SH + .5, 30, 1.6 + sway * .6, SH + 1, 8]] : [[.6, SH + .6, 30, 2.4, SH + 1.2, 6.5], [.6, SH + .6, 30, 2.4, SH + 1.2, 6.5]];
    [1, -1].forEach((s, i) => { const a = A[i], sh0 = [hunch * .9, s * (SH - .4), U(41.4)], el = [a[0] + hunch * .5, s * a[1], U(a[2])], hd = [a[3] + hunch * .3, s * a[4], Math.max(Z(-4), U(a[5]))];
      S.tube(sh0, el, 1.9, 2, [rb, -.04]); S.tube(el, hd, 2, 3, [rb, -.07]); const d = [hd[0] - el[0], hd[1] - el[1], hd[2] - el[2]], n = Math.hypot(...d), w = d.map(q => q / n);
      S.sph(hd[0] + w[0] * .5, hd[1] + w[1] * .5, hd[2] + w[2] * .5, 2.3, 2.3, 2.3, () => [inner, -.7]);
      for (let f = -1.5; f <= 1.5; f++) S.tube([hd[0] + w[0] * 1.2, hd[1] + f * .4, hd[2] + w[2] * 1.2], [hd[0] + w[0] * 1.2 + (pose === 'reach' ? w[0] * 4 : 1.5), hd[1] + f * .55 + (pose === 'reach' ? w[1] * 4 : 0), hd[2] + (pose === 'reach' ? w[2] * 4 : -2.8) - Math.abs(f) * .3], .26, .16, [skin, -.02]); });
    S.paint('clay');
    const SK = (skin[0] & 255) << 16 | (skin[1] & 255) << 8 | (skin[2] & 255);
    for (let k = 0; k < S.w * S.h; k++) if (S.bc[k] === SK && S.c[k * 4 + 3]) { S.c[k * 4] *= .62; S.c[k * 4 + 1] *= .62; S.c[k * 4 + 2] *= .66; S.c[k * 4 + 3] = 254; }
    let x0 = S.w, y0 = S.h, x1 = -1, y1 = -1; for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) if (S.c[(j * S.w + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) { x0 = y0 = x1 = y1 = 0; } const cw = x1 - x0 + 1, ch = y1 - y0 + 1, cd = new Uint8ClampedArray(cw * ch * 4); for (let j = 0; j < ch; j++) cd.set(S.c.subarray(((j + y0) * S.w + x0) * 4, ((j + y0) * S.w + x0 + cw) * 4), j * cw * 4);
    const out = { w: cw, h: ch, ox: -S.ax + x0, oy: -S.ay + y0, data: cd }; cache.set(key, out); return out; };
