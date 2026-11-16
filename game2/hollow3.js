  // ---- Empty Habit, unnerving pass (drafts). opt.v: mimic | hands | backwards | neck | crawl
  // idle is a twitch: it holds still, then snaps. Hot pixels (eyes, flame) are flagged emissive (alpha 254) so the game can keep them lit in the dark.
  const H3F = { idle: 4, walk: 4, reach: 2 };
  const hollow3 = (face = 0, pose = 'idle', frame = 0, opt = {}) => { frame %= H3F[pose] || 1; const v = opt.v || 'mimic', key = 'H3' + v + face + pose + frame; const hit = cache.get(key); if (hit) return hit;
    const S = new Surf(150, 160, 75, 136); S.face(Math.PI / 4 + face * Math.PI / 4); const EM = [];
    const em = (x, y, z, r, c) => { EM.push([x, y, z, r]); S.sph(x, y, z, r, r, r, () => [c, 1.6]); };
    const rb = [42, 36, 42], inner = [8, 6, 8], skin = [178, 170, 158], gum = [60, 26, 30], ht = 1.32, SH = 7.2, WD = 1.24, T = frame / (H3F[pose] || 1) * 6.2832;
    const snap = pose === 'idle' && frame === 2, walk = pose === 'walk';
    const lift = v === 'crawl' ? 0 : 3 + (walk ? Math.sin(T) * .4 : 0), sway = walk ? Math.sin(T + 1) * 1.2 : 0;
    const Z = z => z * ht + lift, W0 = Z(30), U = z => W0 + (z - 30) * ht;
    const fold = th => { const f = Math.abs(Math.sin(th * 5 + .7)); return f < .08 ? -.24 : f < .2 ? -.07 : 0; };
    const cloth = th => [rb, fold(th)];
    // a pale face: no eyes, just two hollows and a mouth that is open too wide
    const faceAt = (cx, cy, cz, dir, tiltA, scale = 1) => { const ca = Math.cos(tiltA), sa = Math.sin(tiltA);
      S.sph(cx, cy, cz, 1.5 * scale, 2.1 * scale, 2.7 * scale, (dx, dy, dz) => { if (dx * dir < .1) return null; const ry = dy * ca - dz * sa, rz = dy * sa + dz * ca;
        if (rz < -.25 && rz > -.75 && Math.abs(ry) < .55 - (rz + .5) * (rz + .5) * .8) return [gum, -.5];      // the mouth
        if (rz > .12 && rz < .42 && Math.abs(Math.abs(ry) - .38) < .17) return [[40, 34, 34], -.4];           // the hollows
        return [skin, rz > .6 ? .05 : 0]; }); };
    const hand = (p, d, len = 2.2, splay = 1) => { S.sph(p[0], p[1], p[2], .7, .7, .55, () => [skin, 0]); for (let f = -1.5; f <= 1.5; f++) { const q = [p[0] + d[0] * len + f * .25 * splay * d[2], p[1] + d[1] * len + f * .35 * splay, p[2] + d[2] * len - Math.abs(f) * .2]; S.tube(p, q, .26, .17, [skin, -.02]); } };
    if (v === 'crawl') {
      // bent at the waist, on all fours: sleeves are forelegs, the hood hangs near the floor and looks up
      const st = walk ? Math.sin(T) : 0, hip = [-6, 0, 14], sh = [6, 0, 11 + (snap ? 1.5 : 0)];
      S.ell(0, 14, 4.2, 4.8, 3, 3.6, (th) => cloth(th), -6, -6, 3);                     // the skirt hanging from the hips
      for (let k = 0; k <= 12; k++) { const t = k / 12, c = [hip[0] + (sh[0] - hip[0]) * t, 0, hip[2] + (sh[2] - hip[2]) * t + Math.sin(t * 3.14) * 3]; S.sph(c[0], 0, c[2], 4 - t * .6, 4.2 - t * .4, 3.6 - t * .4, (dx, dy, dz) => [rb, dz > .5 ? .04 : fold(dy * 3)]); }   // the bent back
      [1, -1].forEach((s, i) => { const ph = i ? -st : st, el = [sh[0] + 3 + ph, s * 5.5, 8], ft = [sh[0] + 7 + ph * 2.4, s * 5.2, .3]; S.tube([sh[0], s * 3.4, sh[2]], el, 1.7, 1.8, [rb, -.04]); S.tube(el, ft, 1.8, 2.4, [rb, -.07]); hand([ft[0] + 1, ft[1], .5], [1, s * .25, 0], 3.2, 1.6); });
      const hh = [sh[0] + 5.5, 0, 6.5 + (snap ? 2 : 0)]; S.sph(hh[0] - 1, 0, hh[2], 3.4, 3.2, 3.6, (dx, dy, dz) => dx > .45 && Math.abs(dy) < .75 && dz > -.8 && dz < .6 ? [inner, -.6] : [rb, dz > .4 ? .05 : 0]);
      faceAt(hh[0] + .2, 0, hh[2], 1, snap ? 1.2 : .25, .9);
      S.tube([-9, 0, 2], [-13 - st, 0, .3], 2, .6, [rb, -.1]); }
    else {
      const neck = v === 'neck' ? 13 : 0, back = v === 'backwards' ? -1 : 1;
      S.ell(Z(-5), W0, 4.6 * WD, 5.4 * WD, 3.4 * WD, 4.2 * WD, (th, z) => (z < Z(3) && z < Z(-2) + hs(Math.floor(th * 11 + (walk ? frame * 2 : 0)), 3) * 6) ? null : cloth(th), sway * .2, 0, 3);
      S.ell(W0, U(41.6), 3.4 * WD, 4.2 * WD, 3.7 * WD, SH - .5, cloth, 0, 0, 3.5);
      S.ell(U(41.6), U(43.6), 3.7 * WD, SH - .5, 1.8 * WD, 2 * WD, cloth, 0, 0, 3);
      S.ell(W0 - .2, W0 + .8, 3.45 * WD, 4.25 * WD, 3.45 * WD, 4.25 * WD, () => [[80, 66, 48], 0], 0, 0, 3);
      // the hood: on a neck that is far too long, or turned all the way round
      const tiltA = v === 'neck' ? (snap ? -.9 : .55) : v === 'mimic' ? (snap ? 1.4 : .18) : snap ? .6 : 0;
      const nx = 0, hz = U(50.5) + neck - (v === 'neck' ? Math.abs(Math.sin(tiltA)) * 3 : 0), hy = v === 'neck' ? Math.sin(tiltA) * 6 : 0, hx = .4;
      if (neck) for (let k = 0; k <= 14; k++) { const t = k / 14; S.sph(nx + .3, hy * t * t, U(43) + (hz - 3 - U(43)) * t, 1.25, 1.25, 1.1, () => [rb, -.02 + (k % 3 === 0 ? -.12 : 0)]); }
      const op = (dx, dy, dz) => dx * back > .42 && dz < .62 && dz > -.78 && Math.abs(dy) < .78;
      S.sph(hx - .6 * back, hy, hz + .4, 3.6 * 1.12, 3.3 * 1.08, 4.3 * 1.14, (dx, dy, dz) => op(dx, dy, dz) ? [inner, -.6] : [rb, dx * back > .25 ? -.15 : dz > .55 ? .05 : 0]);
      S.tube([hx - 2.2 * back, hy, hz + 3.4], [hx - 3.6 * back, hy, hz + 6.2], 1.5, .5, [rb, .04]);
      if (!neck) S.ell(U(41.2), U(46), 3.9 * WD, SH - .3, 2.4 * WD, 2.8 * WD, (th, z) => (z > U(44) && (back > 0 ? (th < .7 || th > 5.58) : Math.abs(th - 3.14) < .7)) ? null : [rb, .02], 0, 0, 2.6);
      const fx = hx - .6 * back + 3.6 * 1.12 * .8 * back;
      if (v === 'mimic' || v === 'backwards' || v === 'neck') faceAt(fx - .6 * back, hy, hz - .2, back, tiltA, v === 'mimic' ? 1.05 : .95);
      if (v === 'hands') { for (const s of [-1, 1]) em(fx + .3, s * 1.05, hz - .1, .45, [230, 230, 220]);   // two cold points, not embers
        // fingers curled over the rim of the hood from inside
        for (let f = -2; f <= 2; f++) S.tube([fx - .2, f * .55, hz + 2.4], [fx + .5, f * .6, hz + 1.6], .28, .22, [skin, .05]); }
      // sleeves
      const hang = [.2, SH + .4, 32, .8, SH + .2, 23.5], rev = v === 'backwards' ? -1 : 1;
      const A = pose === 'reach' ? [[3.4 * rev, SH - .2, 41, (8.6 + frame) * rev, SH - 1.6, 43.5 + frame], [3.4 * rev, SH - .2, 41, (8.2 + frame) * rev, -(SH - 3.2), 42.5]] : walk ? [[-1 - sway * .3, SH + .5, 32, -1.6 - sway * .6, SH + .6, 24], [1 + sway * .3, SH + .5, 32, 1.4 + sway * .6, SH + .6, 24]] : [hang, hang];
      [1, -1].forEach((s, i) => { const a = A[i], sh0 = [.2, s * (SH - .4), U(41.4)], el = [a[0], s * a[1], U(a[2])], hd = [a[3], s * a[4], U(a[5])];
        S.tube(sh0, el, 1.9, 2, [rb, -.04]); S.tube(el, hd, 2, 2.9, [rb, -.07]); const d = [hd[0] - el[0], hd[1] - el[1], hd[2] - el[2]], n = Math.hypot(...d), u = d.map(q => q / n);
        S.sph(hd[0] + u[0] * .5, hd[1] + u[1] * .5, hd[2] + u[2] * .5, 2.2, 2.2, 2.2, () => [inner, -.7]);
        if (v === 'hands') { for (let k = 0; k < 3; k++) { const off = [(k - 1) * .9, (k - 1) * .5 * s, (k - 1) * .4]; hand([hd[0] + u[0] * .9 + off[0], hd[1] + u[1] * .9 + off[1], hd[2] + u[2] * .9 + off[2]], [u[0] + off[0] * .2, u[1] + off[1] * .3, u[2] - .3], 2.6 + k * .6, 1.2); } }
        else if (pose === 'reach' || v === 'mimic') hand([hd[0] + u[0] * 1.1, hd[1] + u[1] * 1.1, hd[2] + u[2] * 1.1], u, v === 'mimic' ? 3.6 : 2.6, 1); });
      // hands pressing out through the cloth from inside: fingertips poking through the weave
      if (v === 'hands') for (let k = 0; k < 9; k++) { const th = (hs(k, 3) - .5) * 2.4 + (k % 2 ? 0 : 3.14) * (hs(k, 8) < .25 ? 1 : 0), z = Z(2 + hs(k, 5) * 34), r = (z < W0 ? 4.4 : 3.8) * WD, c = Math.cos(th), sn = Math.sin(th), p = [c * r, sn * r, z];
        for (let f = -1.5; f <= 1.5; f++) S.tube([p[0] - c * .4, p[1] - sn * .4 + f * .4 * c, p[2] + f * .4 * sn * 0 + f * .25], [p[0] + c * 1.1, p[1] + sn * 1.1 + f * .45 * c, p[2] - .5 + Math.abs(f) * .1], .24, .17, [skin, -.04]); }
      for (let k = 0; k < 10; k++) { const a = hs(k, 7) * 6.28, r = 2 + hs(k, 9) * 4.5, zz = Z(-5) - 1 - hs(k, frame + 3) * (lift + 2); S.sph(Math.cos(a) * r, Math.sin(a) * r, zz, .6, .6, .45, () => [[30, 26, 34], -.3]); } }
    S.paint('clay');
    // flag emissive pixels: anything drawn by em() that survived the depth test
    for (const [x, y, z, r] of EM) { const [sx, sy] = S.proj(x, y, z); for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const X = sx + i, Y = sy + j; if (X < 0 || Y < 0 || X >= S.w || Y >= S.h) continue; const k = Y * S.w + X; if (S.c[k * 4 + 3] && S.c[k * 4] > 180) S.c[k * 4 + 3] = 254; } }
    let x0 = S.w, y0 = S.h, x1 = -1, y1 = -1; for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) if (S.c[(j * S.w + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) { x0 = y0 = x1 = y1 = 0; } const cw = x1 - x0 + 1, ch = y1 - y0 + 1, cd = new Uint8ClampedArray(cw * ch * 4); for (let j = 0; j < ch; j++) cd.set(S.c.subarray(((j + y0) * S.w + x0) * 4, ((j + y0) * S.w + x0 + cw) * 4), j * cw * 4);
    const out = { w: cw, h: ch, ox: -S.ax + x0, oy: -S.ay + y0, data: cd }; cache.set(key, out); return out; };
