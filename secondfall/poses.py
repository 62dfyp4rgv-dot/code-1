"""Forward-kinematics pose builder. Angles are in degrees measured from straight down, + = toward screen right."""
from __future__ import annotations

import math

import numpy as np

from .body import Figure

V = lambda *a: np.asarray(a, np.float32)


def dirv(deg: float, z: float = 0.0) -> np.ndarray:
    a = math.radians(deg)
    v = np.array([math.sin(a), math.cos(a), z], np.float32)
    return v / (np.linalg.norm(v) + 1e-6)


def pose(fig: Figure, pel, spine: float = 0.0, twist: float = 0.0, head_off=(0.0, 0.0), arms=((20, 15), (-20, -15)), legs=((5, 0), (-5, 0)),
         arm_z=((0.0, 0.0), (0.0, 0.0)), leg_z=((0.0, 0.0), (0.0, 0.0)), z: float = 0.0, crouch: float = 0.0, flip: bool = False, torso_len: float = 1.0) -> Figure:
    """Build joints from the pelvis position. arms/legs = ((upper_l, lower_l), (upper_r, lower_r)) angles; z-lists give depth (toward the viewer +).
    `spine` leans the torso (deg, + = toward screen right); `flip` turns the figure upside-down (spine points down)."""
    h = fig.h
    sp = fig.spec
    pel = V(pel[0], pel[1], z)
    s = math.radians(spine)
    up = V(math.sin(s), -math.cos(s), 0) * (-1 if flip else 1)
    right = V(math.cos(s), math.sin(s), 0) * (-1 if flip else 1)
    sw = 0.62 * h * sp.sw
    chest = pel + up * 1.5 * h * torso_len
    neck = pel + up * 2.65 * h * torso_len
    head = neck + up * 0.8 * h + V(head_off[0] * h, head_off[1] * h, 0)
    c, sn = math.cos(math.radians(twist)), math.sin(math.radians(twist))
    sh_l = neck - right * sw * c * 1.02 + V(0, 0.18 * h * (-1 if flip else 1), -sw * sn)
    sh_r = neck + right * sw * c * 1.02 + V(0, 0.18 * h * (-1 if flip else 1), sw * sn)
    J = dict(pelvis=pel, chest=chest, neck=neck, head=head, sh_l=sh_l, sh_r=sh_r)
    for name, sh, (a1, a2), (z1, z2), sg in (("l", sh_l, arms[0], arm_z[0], -1), ("r", sh_r, arms[1], arm_z[1], 1)):
        a1, a2 = sg * a1, sg * a2                                    # angles are outward-positive for both sides
        el = sh + dirv(a1, z1) * 1.45 * h
        wr = el + dirv(a1 + a2, z2) * 1.25 * h
        J["el_" + name], J["wr_" + name] = el, wr
    for name, sd, (a1, a2), (z1, z2) in (("l", -1, legs[0], leg_z[0]), ("r", 1, legs[1], leg_z[1])):
        a1, a2 = sd * a1, sd * a2
        hip = pel + (right * sd * 0.52 * h * sp.sw) + up * -0.15 * h
        kn = hip + dirv(a1, z1) * 1.9 * h
        an = kn + dirv(a1 + a2, z2) * 1.8 * h
        J["hip_" + name], J["kn_" + name], J["an_" + name] = hip, kn, an
        J["toe_" + name] = an + V(sd * 0.25 * h, 0.12 * h, 0.7 * h)
    fig.J.update(J)
    return fig
