  // ---- "The Thorn-Crowned" (draft): a gaunt shrouded thing with a small grey head in a crown of needles, a tattered poncho,
  // a long thorned staff, spindly clawed legs and roots that coil out from under the hem across the floor.
  const hollowThorn = (face = 0, pose = 'idle', frame = 0, opt = {}) => { frame %= H3F[pose] || 1; const key = 'HTH' + face + pose + frame; const hit = cache.get(key); if (hit) return hit;
    const S = new Surf(210, 220, 105, 170); S.face(Math.PI / 4 + face * Math.PI / 4);
    const cl = [96, 92, 88], dk = [54, 50, 52], hd = [150, 146, 140], wood = [70, 60, 52], claw = [40, 36, 36], T = frame / (H3F[pose] || 1) * 6.2832;
    const snap = pose === 'idle' && frame === 2, walk = pose === 'walk';
    const fold = th => { const f = Math.abs(Math.sin(th * 4 + .7)); return f < .1 ? -.26 : f < .24 ? -.08 : 0; };
    // legs: two thin bent legs under the hem, ending in long-toed claws
    [1, -1].forEach((s, i) => { const st = walk ? Math.sin(T + i * 3.14) * 2.4 : 0, hip = [0, s * 2.2, 22], knee = [3 + st * .5, s * 3.4, 11], ft = [.5 + st, s * 3.2, .6];
      S.tube(hip, knee, .9, .7, [dk, -.04]); S.tube(knee, ft, .7, .55, [dk, -.06]);
      for (let c = -1; c <= 1; c++) S.tube(ft, [ft[0] + 2.6, ft[1] + c * 1.1, 0], .4, .15, [claw, 0]); S.tube(ft, [ft[0] - 1.6, ft[1], .1], .35, .12, [claw, 0]); });
    // roots / tendrils: coil out from under the hem and across the floor, ending in tight curls
    for (let k = 0; k < 8; k++) { const a0 = k / 8 * 6.2832 + .3, len = 22 + hs(k, 2) * 12, curl = (hs(k, 3) < .5 ? 1 : -1) * (1.6 + hs(k, 4)); let p = [Math.cos(a0) * 3.5, Math.sin(a0) * 3.5, 15 + hs(k, 5) * 4], dir = a0, r = 1.15;
      const steps = 34; for (let j = 0; j < steps; j++) { const t = j / steps, seg = len / steps; dir += (t > .6 ? curl * .22 : Math.sin(T + k + t * 4) * .05 + curl * .02); const z = Math.max(.5 * r, p[2] - (t < .3 ? 1.6 : .15));
        const q = [p[0] + Math.cos(dir) * seg, p[1] + Math.sin(dir) * seg, t > .3 ? .5 * r + Math.max(0, Math.sin(t * 9 + k + T) * .8) * (1 - t) : z]; S.tube(p, q, r, r * .97, [dk, -.06]); p = q; r *= .965; } }
    // the poncho: wide at the shoulders, hanging in a ragged cone to mid-thigh, torn into strips at the hem
    const sh = 34, hem = 13, sway = walk ? Math.sin(T) * .8 : Math.sin(T) * .2;
    S.ell(hem, sh, 7.8, 8.6, 4.4, 5.6, (th, z) => { const r = hs(Math.floor(th * 10), 7); if (z < hem + 6 * r && Math.floor(th * 10) % 3 === 0) return null; return [cl, fold(th) - (z < hem + 2 ? .1 : 0)]; }, sway, 0, 2.6);
    S.ell(sh, sh + 2.2, 4.4, 5.6, 2, 2.2, () => [cl, .06], 0, 0, 2.4);
    for (let k = 0; k < 12; k++) { const th = hs(k, 1) * 6.2832, z0 = hem + 2 + hs(k, 2) * 4, len = 5 + hs(k, 3) * 9, r = 7.6; S.tube([Math.cos(th) * r + sway, Math.sin(th) * r * 1.1, z0], [Math.cos(th) * (r + 1) + sway * 1.5, Math.sin(th) * (r + 1) * 1.1, z0 - len], .6, .25, [cl.map(q => q * .85), -.04]); }
    // neck and small elongated head; two dark slits, nothing else
    const tilt = snap ? .5 : .12, hx = Math.sin(tilt) * 1.5, hz = sh + 7.5, hy = Math.sin(tilt) * 1.8;
    S.tube([0, 0, sh + 1.5], [hx * .5, hy * .5, hz - 2.6], .8, .7, [hd.map(q => q * .7), -.05]);
    S.sph(hx, hy, hz, 1.9, 1.7, 2.9, (dx, dy, dz) => (dx > .6 && dz > -.05 && dz < .25 && Math.abs(dy) > .15 && Math.abs(dy) < .55) ? [[20, 16, 18], -.4] : [hd, dz > .5 ? .06 : 0]);
    // crown of needles: thin spikes fanning out around the head like a halo
    for (let k = 0; k < 13; k++) { const a = -1.2 + k / 12 * 2.4 + (snap ? .3 : 0), len = 4.5 + hs(k, 9) * 2.5, d = [-.25, Math.sin(a), Math.cos(a) * .9 + .1], n = Math.hypot(...d);
      S.tube([hx - .3, hy, hz + .8], [hx - .3 + d[0] / n * len, hy + d[1] / n * len, hz + .8 + d[2] / n * len], .28, .08, [[70, 64, 62], 0]); }
    // the staff: held in one long arm, planted ahead, thorned and branching at the foot, its top past the crown
    const hand = [5.5, 6.5, 24], top = [-3.5, 8.5, hz + 10], foot = [10, 5, 0];
    S.tube([1, 6, sh - 1], [4, 7.6, 29], .9, .75, [cl, -.04]); S.tube([4, 7.6, 29], hand, .75, .6, [cl, -.06]); S.sph(hand[0], hand[1], hand[2], .9, .9, .8, () => [hd.map(q => q * .8), 0]);
    S.tube(top, foot, .75, .65, [wood, -.04]);
    for (let k = 0; k < 6; k++) { const t = .55 + k * .07, p = [top[0] + (foot[0] - top[0]) * t, top[1] + (foot[1] - top[1]) * t, top[2] + (foot[2] - top[2]) * t], s = k % 2 ? 1 : -1;
      S.tube(p, [p[0] + 2 + hs(k, 4) * 2, p[1] + s * (2 + hs(k, 5) * 2), p[2] + 2.5 - hs(k, 6) * 3], .4, .12, [wood, -.06]); }
    S.tube([foot[0] - 1, foot[1], 3], [foot[0] + 3, foot[1] - 3, 5.5], .45, .15, [wood, -.06]); S.tube([foot[0] + 3, foot[1] - 3, 5.5], [foot[0] + 4.5, foot[1] - 1.5, 7], .3, .1, [wood, -.06]);
    // second arm hangs, long fingers below the hem
    S.tube([1, -6, sh - 1], [2, -8, 22], .9, .75, [cl, -.04]); S.tube([2, -8, 22], [2.6, -8.4, 12], .7, .5, [hd.map(q => q * .7), -.06]);
    for (let f = -1; f <= 1; f++) S.tube([2.6, -8.4, 12], [3 + f * .4, -8.6 + f * .5, 7.5], .25, .1, [hd.map(q => q * .7), 0]);
    S.paint('clay');
    const SK = (hd[0] & 255) << 16 | (hd[1] & 255) << 8 | (hd[2] & 255);
    for (let k = 0; k < S.w * S.h; k++) if (S.bc[k] === SK && S.c[k * 4 + 3]) { S.c[k * 4] *= .6; S.c[k * 4 + 1] *= .6; S.c[k * 4 + 2] *= .64; S.c[k * 4 + 3] = 254; }
    let x0 = S.w, y0 = S.h, x1 = -1, y1 = -1; for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) if (S.c[(j * S.w + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) { x0 = y0 = x1 = y1 = 0; } const cw = x1 - x0 + 1, ch = y1 - y0 + 1, cd = new Uint8ClampedArray(cw * ch * 4); for (let j = 0; j < ch; j++) cd.set(S.c.subarray(((j + y0) * S.w + x0) * 4, ((j + y0) * S.w + x0 + cw) * 4), j * cw * 4);
    const out = { w: cw, h: ch, ox: -S.ax + x0, oy: -S.ay + y0, data: cd }; cache.set(key, out); return out; };
