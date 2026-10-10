"""Joint-driven bodies and hands built as smooth SDF volumes (so shoulders melt into arms, thighs into hips),
dressed with wrestling gear (trunks, tights with a leg stripe, knee pads, boots, wrist tape)."""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional

import numpy as np

from .head import Head, HeadSpec
from .r3d import Buf, _rotmat
from .sdf import SDF

V = lambda *a: np.asarray(a, np.float32)


@dataclass
class BodySpec:
    skin: tuple = (0.66, 0.55, 0.49)
    sw: float = 1.0               # shoulder width multiplier
    muscle: float = 0.6           # 0 wiry .. 1 massive
    belly: float = 0.2            # 0 flat .. 1 heavy
    leg: float = 1.0              # thigh/calf thickness multiplier
    arm: float = 1.0
    outfit: str = "trunks"        # trunks | tights | none | shirt | suit | ref | hoodie
    color: tuple = (0.45, 0.12, 0.10)    # main outfit colour
    stripe: Optional[tuple] = None       # leg stripe colour
    pads: bool = True
    boots: tuple = (0.07, 0.06, 0.06)
    tape: bool = True
    tape_color: tuple = (0.86, 0.84, 0.78)
    belt: Optional[tuple] = None
    shirt_text: bool = False
    seed: int = 1


def lerp(a, b, t):
    return np.asarray(a, np.float32) * (1 - t) + np.asarray(b, np.float32) * t


class Figure:
    """Holds the 3-D joints of one body and builds its SDF; the head is placed separately through Head."""

    def __init__(self, h: float, spec: BodySpec, head: HeadSpec):
        self.h = float(h)                 # head height in px (a 7.5-head figure is 7.5 * h tall)
        self.spec = spec
        self.head = Head(head)
        self.J: dict[str, np.ndarray] = {}

    # ------------------------------------------------------------------ pose helpers
    def pose(self, **joints) -> "Figure":
        for k, v in joints.items():
            self.J[k] = np.asarray(v, np.float32)
        return self

    def stand(self, x: float, y_feet: float, z: float = 0.0, lean: float = 0.0, twist: float = 0.0, arms=(0.12, 0.12), elbow=(0.05, 0.05),
              legs=(0.10, 0.10), knee=(0.0, 0.0), arm_z=(0.0, 0.0), crouch: float = 0.0, sy: float = 1.0) -> "Figure":
        """A standing pose from a few numbers: x, the y of the soles, lean (rad, + = toward screen right), twist of the shoulders,
        arms (angle of each upper arm from vertical, + outward, in turns of h), elbow bend, leg spread, crouch."""
        h = self.h * sy
        H = 7.5 * self.h
        sw = 0.62 * h * self.spec.sw
        feet_y = y_feet
        hip_y = feet_y - (3.55 - crouch * 0.9) * h
        pel = V(x, hip_y, z)
        up = V(math.sin(lean), -math.cos(lean), 0)
        chest = pel + up * 1.5 * h
        neck = pel + up * 2.65 * h
        hc = pel + up * 3.45 * h
        c, s = math.cos(twist), math.sin(twist)
        right = V(math.cos(lean), math.sin(lean), 0)
        sh_l = neck - right * sw * c * 1.02 + V(0, 0.18 * h, -sw * s)
        sh_r = neck + right * sw * c * 1.02 + V(0, 0.18 * h, sw * s)
        self.J.update(pelvis=pel, chest=chest, neck=neck, head=hc, sh_l=sh_l, sh_r=sh_r)
        for side, sh, a, e, az in ((-1, sh_l, arms[0], elbow[0], arm_z[0]), (1, sh_r, arms[1], elbow[1], arm_z[1])):
            ang = a * 2 * math.pi
            el = sh + V(math.sin(ang) * side * 1.45 * h * 0.9 + side * 0.0, math.cos(ang) * 1.45 * h, az * h)
            bend = (e) * 2 * math.pi
            wr = el + V(math.sin(ang + bend * -side) * side * 1.25 * h, math.cos(ang + bend * -side) * 1.25 * h, az * h * 0.5)
            self.J[f"el_{'l' if side < 0 else 'r'}"] = el
            self.J[f"wr_{'l' if side < 0 else 'r'}"] = wr
        for side, sp, kn in ((-1, legs[0], knee[0]), (1, legs[1], knee[1])):
            hip = pel + V(side * 0.52 * h * self.spec.sw, 0.15 * h, 0)
            ank = V(x + side * (0.42 + 6 * sp) * h * 0.9, feet_y - 0.28 * h, z)
            kne = lerp(hip, ank, 0.5) + V(side * (0.15 + kn) * h, 0, 0.4 * h)
            self.J[f"hip_{'l' if side < 0 else 'r'}"] = hip
            self.J[f"kn_{'l' if side < 0 else 'r'}"] = kne
            self.J[f"an_{'l' if side < 0 else 'r'}"] = ank
            self.J[f"toe_{'l' if side < 0 else 'r'}"] = ank + V(side * 0.15 * h, 0.2 * h, 0.7 * h)
        return self

    # ------------------------------------------------------------------ geometry
    def sculpt(self, sdf: SDF, hand_fn=None) -> None:
        sp, h, J = self.spec, self.h, self.J
        sk = sp.skin
        m = sp.muscle
        grp = 1

        def cone(a, b, r1, r2, k=0.0, color=sk, mat="skin", prio=0, cw=5.0, spec=0.0):
            sdf.cone(tuple(a), tuple(b), r1, r2, k, False, color, mat, spec, cw, grp, prio)

        def ell(c, r, k=0.0, color=sk, mat="skin", rot=(0, 0, 0), prio=0, cw=5.0, spec=0.0):
            sdf.ellipsoid(tuple(c), tuple(r), rot, k, False, color, mat, spec, cw, grp, prio)

        pel, chest, neck = J["pelvis"], J["chest"], J["neck"]
        shl, shr = J["sh_l"], J["sh_r"]
        swp = float(np.linalg.norm(shr - shl)) / 2
        torso_ang = math.atan2(neck[0] - pel[0], pel[1] - neck[1])
        # torso: chest barrel (wide at the shoulders), ribcage, abdomen, pelvis
        bel = 0.55 + 0.9 * sp.belly
        ell(lerp(neck, chest, 0.40) + V(0, 0, 0), (swp * 1.05, 0.95 * h, 0.46 * h * (0.85 + 0.25 * m)), 0.5 * h, rot=(0, 0, torso_ang))
        ell(lerp(chest, pel, 0.35), (swp * 0.92, 0.95 * h, 0.46 * h * bel), 0.55 * h, rot=(0, 0, torso_ang))
        ell(lerp(chest, pel, 0.78) + V(0, 0.1 * h, 0.04 * h), (swp * 0.86, 0.6 * h, 0.42 * h * bel), 0.4 * h, rot=(0, 0, torso_ang * 0.6))
        # pecs and traps for a muscular look
        for sd, sh in ((-1, shl), (1, shr)):
            ell(lerp(sh, chest, 0.55) + V(0, 0.15 * h, 0.30 * h), (0.40 * h * (0.7 + 0.5 * m), 0.30 * h, 0.17 * h), 0.2 * h)
            cone(neck + V(0, -0.15 * h, -0.1 * h), lerp(sh, neck, 0.25) + V(0, -0.02 * h, -0.1 * h), 0.20 * h, 0.16 * h, 0.2 * h)
            ell(sh + V(0, 0.02 * h, 0), (0.30 * h * (0.8 + 0.4 * m), 0.34 * h, 0.30 * h), 0.3 * h)   # deltoid cap
        # neck
        cone(J["head"] + V(0, 0.7 * h, -0.15 * h), neck + V(0, 0.15 * h, -0.05 * h), 0.40 * h * self.head.s.neck * 0.5, 0.52 * h * self.head.s.neck * 0.5, 0.3 * h)
        # arms
        for sd in ("l", "r"):
            sh, el, wr = J["sh_" + sd], J["el_" + sd], J["wr_" + sd]
            a = sp.arm
            cone(sh, el, 0.30 * h * a * (0.9 + 0.3 * m), 0.24 * h * a, 0.25 * h)
            ell(lerp(sh, el, 0.38) + V(0, 0, 0.06 * h), (0.29 * h * a * (0.8 + 0.4 * m), 0.50 * h, 0.27 * h), 0.2 * h)            # biceps / triceps belly
            cone(el, wr, 0.23 * h * a, 0.17 * h * a, 0.18 * h)
            ell(lerp(el, wr, 0.25), (0.23 * h * a, 0.42 * h, 0.21 * h), 0.18 * h)                                              # forearm belly
            if hand_fn is not None:
                hand_fn(sdf, sd, wr, el)
            else:
                d = wr - el
                d = d / (np.linalg.norm(d) + 1e-6)
                ell(wr + d * 0.28 * h, (0.23 * h, 0.30 * h, 0.17 * h), 0.12 * h, rot=(0, 0, math.atan2(d[0], -d[1])))
        # legs
        for sd in ("l", "r"):
            hip, kn, an, toe = J["hip_" + sd], J["kn_" + sd], J["an_" + sd], J["toe_" + sd]
            L = sp.leg
            cone(hip, kn, 0.50 * h * L * (0.9 + 0.3 * m), 0.33 * h * L, 0.3 * h)
            ell(lerp(hip, kn, 0.45) + V(0, 0, 0.08 * h), (0.46 * h * L, 0.95 * h, 0.42 * h * L), 0.3 * h)          # quads
            cone(kn, an, 0.30 * h * L, 0.18 * h, 0.22 * h)
            ell(lerp(kn, an, 0.28) + V(0, 0, -0.08 * h), (0.27 * h * L, 0.60 * h, 0.27 * h * L), 0.2 * h)           # calf
        self._dress(sdf)

    def _dress(self, sdf: SDF) -> None:
        sp, h, J = self.spec, self.h, self.J
        o = sp.outfit
        col = sp.color

        def cone(a, b, r1, r2, color, k=0.0, mat="cloth", prio=1, cw=3.0, spec=0.0):
            sdf.cone(tuple(a), tuple(b), r1, r2, k, False, color, mat, spec, cw, 1, prio)

        def ell(c, r, color, k=0.0, mat="cloth", rot=(0, 0, 0), prio=1, cw=3.0):
            sdf.ellipsoid(tuple(c), tuple(r), rot, k, False, color, mat, 0.0, cw, 1, prio)

        pel = J["pelvis"]
        if o in ("trunks", "tights", "ref"):
            ell(pel + V(0, 0.12 * h, 0), (0.80 * h * sp.sw, 0.66 * h, 0.52 * h), col, 0.25 * h)
            for sd in ("l", "r"):
                hip, kn, an = J["hip_" + sd], J["kn_" + sd], J["an_" + sd]
                if o == "tights":
                    cone(hip, kn, 0.54 * h * sp.leg, 0.36 * h * sp.leg, col, 0.1 * h)
                    cone(kn, an, 0.33 * h * sp.leg, 0.21 * h, col, 0.1 * h)
                    if sp.stripe is not None and sd == "l":                                          # one stripe, down the outside of the left leg
                        side = -1
                        off = V(side * 0.46 * h, 0, 0.10 * h)
                        cone(hip + off * 0.7, kn + off * 0.7, 0.14 * h, 0.12 * h, sp.stripe, 0.0, prio=2)
                        cone(kn + off * 0.6, an + off * 0.55, 0.12 * h, 0.1 * h, sp.stripe, 0.0, prio=2)
                else:
                    cone(hip, lerp(hip, kn, 0.35), 0.56 * h * sp.leg, 0.48 * h * sp.leg, col, 0.1 * h)
                if sp.pads:
                    ell(kn + V(0, 0.02 * h, 0.38 * h), (0.28 * h, 0.26 * h, 0.17 * h), (0.86, 0.85, 0.80) if o == "tights" else (0.12, 0.1, 0.1), 0.05 * h, prio=3)
                # boots
                toe = J["toe_" + sd]
                cone(an + V(0, -0.45 * h, 0), an + V(0, 0.2 * h, 0), 0.24 * h, 0.22 * h, sp.boots, 0.05 * h, prio=3)
                ell(lerp(an, toe, 0.55) + V(0, 0.12 * h, 0), (0.22 * h, 0.16 * h, 0.45 * h), sp.boots, 0.08 * h, prio=3)
            if sp.belt is not None:
                ell(pel + V(0, -0.3 * h, 0), (0.93 * h * sp.sw, 0.13 * h, 0.66 * h), sp.belt, 0.0, prio=3)
        if sp.tape:
            for sd in ("l", "r"):
                wr, el = J["wr_" + sd], J["el_" + sd]
                d = (wr - el) / (np.linalg.norm(wr - el) + 1e-6)
                cone(wr - d * 0.2 * h, wr + d * 0.16 * h, 0.19 * h, 0.19 * h, sp.tape_color, 0.02 * h, mat="tape", prio=3)

    # ------------------------------------------------------------------ render
    def render_into(self, buf: Buf, head_yaw=0.0, head_pitch=0.0, head_roll=0.0, res: float = 0.6, hand_fn=None, head_h: Optional[float] = None) -> dict:
        """Build one SDF holding body + head and march it into `buf`. Returns the head's landmarks."""
        sdf = SDF()
        self.sculpt(sdf, hand_fn)
        hd = self.head
        hh = head_h or self.h
        hc = self.J["head"]
        part = buf.new_part()
        lm = hd.build(buf, tuple(hc), hh, head_yaw, head_pitch, head_roll, neck_to=None, part=part, sdf=sdf, march=False)
        pts = np.array(list(self.J.values()))
        pad = 1.6 * self.h
        x0, y0 = pts[:, 0].min() - pad, pts[:, 1].min() - 1.0 * self.h
        x1, y1 = pts[:, 0].max() + pad, pts[:, 1].max() + 0.8 * self.h
        z0, z1 = pts[:, 2].min() - 1.6 * self.h, pts[:, 2].max() + 1.6 * self.h
        sdf.march(buf, (x0, y0, x1, y1), (z0, z1), part=part, res=res)
        self.part = part
        return lm


# ----------------------------------------------------------------------------------------------- hands
def hand_builder(h: float, skin, fingers=(0.0, 0.0, 0.0, 0.0, 0.0), spread: float = 0.0, palm_facing: float = 0.0):
    """Return a `hand_fn(sdf, side, wrist, elbow)` that adds a hand with five fingers.
    fingers: curl of (thumb, index, middle, ring, pinky) in 0..1 (0 straight, 1 fist)."""

    def fn(sdf: SDF, side: str, wr: np.ndarray, el: np.ndarray) -> None:
        d = wr - el
        d = d / (np.linalg.norm(d) + 1e-6)
        n = V(-d[1], d[0], 0)                                    # across the hand in screen space
        zf = V(0, 0, 1)
        sgn = -1.0 if side == "l" else 1.0
        palm_c = wr + d * 0.36 * h
        sdf.ellipsoid(tuple(palm_c), (0.27 * h, 0.34 * h, 0.15 * h), (0, 0, math.atan2(d[0], -d[1])), 0.06 * h, False, skin, "skin", 0.0, 4.0, 1, 0)
        # finger roots across the knuckle line
        names = [-0.9, -0.3, 0.2, 0.7]                          # index .. pinky positions across the palm (index on the thumb side)
        for i, off in enumerate(names):
            curl = fingers[i + 1]
            base = wr + d * 0.62 * h + n * off * 0.17 * h * sgn * -1
            lens = [0.34, 0.26, 0.2]
            rad = [0.075, 0.066, 0.058]
            if i == 1:
                lens = [0.37, 0.29, 0.21]
            if i == 3:
                lens = [0.27, 0.2, 0.16]
            p = base
            ang = 0.0
            for j in range(3):
                ang += curl * (1.05 if j else 0.75) + spread * (off) * 0.12 * (1 if j == 0 else 0)
                dirv = d * math.cos(ang) + zf * math.sin(ang) * (-1.0) + n * math.sin(spread * off * 0.3) * 0.1
                dirv = dirv / (np.linalg.norm(dirv) + 1e-6)
                q = p + dirv * lens[j] * h
                sdf.cone(tuple(p), tuple(q), rad[j] * h, (rad[j] * 0.9 if j < 2 else rad[j] * 0.8) * h, 0.03 * h, False, skin, "skin", 0.0, 4.0, 1, 0)
                p = q
        # thumb from the side of the palm
        base = wr + d * 0.28 * h + n * 0.22 * h * sgn * -1
        curl = fingers[0]
        ang = -0.45 + curl * 1.1
        dirv = d * math.cos(ang) + n * math.sin(ang) * sgn * -1 * -1
        dirv = dirv / (np.linalg.norm(dirv) + 1e-6)
        q = base + dirv * 0.30 * h
        sdf.cone(tuple(base), tuple(q), 0.095 * h, 0.075 * h, 0.04 * h, False, skin, "skin", 0.0, 4.0, 1, 0)
        r = q + (dirv + d * (0.4 - curl * 0.5)) * 0.2 * h
        sdf.cone(tuple(q), tuple(r), 0.075 * h, 0.065 * h, 0.03 * h, False, skin, "skin", 0.0, 4.0, 1, 0)

    return fn
