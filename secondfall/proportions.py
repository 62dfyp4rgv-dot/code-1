"""Facial-proportion check. Measures a HeadSpec's landmarks (in head units) against classical human ratios and prints a report.
    python -m secondfall.proportions            # table for the cast + a long-haired heroine
    python -m secondfall.proportions guide.png  # also renders a front view with guide lines"""
from __future__ import annotations

import sys

from .head import Head, HeadSpec

TOP, BROW, MOUTH, SKULL_HW = -0.55, -0.108, 0.285, 0.34


def measure(s: HeadSpec) -> dict:
    ex, ey, ew, eh = Head(s).eye_dims()
    hairline = Head.hairline_top("short") - 0.09               # the plain (non-fringe) hairline for a neutral style
    nose = 0.195 * s.nose_len
    chin = 0.51
    face_w = 2 * SKULL_HW * s.head_w
    eye_len = 2 * ew * 0.96
    iod = 2 * (ex - ew * 0.92)
    mouth_w = 2 * 0.105 * (0.5 + 0.5 * s.head_w)
    return {
        "forehead : midface : lower (thirds)": ((BROW - hairline), (nose - BROW), (chin - nose)),
        "eye line, fraction of head height": (ey - TOP) / (chin - TOP),
        "eye length / face width": eye_len / face_w,
        "gap between eyes / eye length": iod / eye_len,
        "mouth width / pupil distance": mouth_w / (2 * ex),
        "mouth position, nose-to-chin fraction": (MOUTH - nose) / (chin - nose),
        "head height / width": (chin - TOP) / face_w,
    }


RANGES = {
    "eye line, fraction of head height": (0.46, 0.54),
    "eye length / face width": (0.19, 0.26),
    "gap between eyes / eye length": (0.85, 1.35),
    "mouth width / pupil distance": (0.60, 0.85),
    "mouth position, nose-to-chin fraction": (0.27, 0.40),
    "head height / width": (1.30, 1.65),
}


def report(s: HeadSpec) -> list[str]:
    problems = []
    for k, v in measure(s).items():
        if isinstance(v, tuple):
            a, b, c = v
            m = (a + b + c) / 3
            ok = all(abs(x - m) / m < 0.18 for x in v)
            print(f"  {k:40s} {a:.3f} : {b:.3f} : {c:.3f}   {'ok' if ok else 'OFF'}")
            if not ok:
                problems.append(k)
        else:
            lo, hi = RANGES[k]
            ok = lo <= v <= hi
            print(f"  {k:40s} {v:.3f}   (ideal {lo}-{hi})   {'ok' if ok else 'OFF'}")
            if not ok:
                problems.append(k)
    return problems


BODY_RANGES = {
    "figure height in heads": (7.3, 7.7),
    "shoulder joint width in heads": (1.1, 1.5),
    "arm incl. hand in heads (fingertips reach mid-thigh)": (3.2, 3.7),
    "leg incl. ankle in heads (crotch at half height)": (3.4, 3.9),
    "visible neck in heads": (0.25, 0.5),
}


def measure_body(spec) -> dict:
    import numpy as np
    from .body import Figure
    f = Figure(100, spec, HeadSpec())
    f.stand(0, 750)
    J = f.J
    d = lambda a, b: float(np.linalg.norm(J[a] - J[b])) / 100
    return {
        "figure height in heads": (750 - (J["head"][1] - 50)) / 100,
        "shoulder joint width in heads": d("sh_l", "sh_r"),
        "arm incl. hand in heads (fingertips reach mid-thigh)": d("sh_l", "el_l") + d("el_l", "wr_l") + 0.75,
        "leg incl. ankle in heads (crotch at half height)": d("hip_l", "kn_l") + d("kn_l", "an_l") + 0.28,
        "visible neck in heads": ((J["neck"][1] + 0.18 * 100) - (J["head"][1] + 0.51 * 100)) / 100,       # shoulder line to chin
    }


def report_body(spec) -> list[str]:
    problems = []
    for k, v in measure_body(spec).items():
        lo, hi = BODY_RANGES[k]
        ok = lo <= v <= hi
        print(f"  {k:52s} {v:.2f}   (ideal {lo}-{hi})   {'ok' if ok else 'OFF'}")
        if not ok:
            problems.append(k)
    return problems


if __name__ == "__main__":
    from . import cast
    specs = {n: cast.make(n, 100).head.s for n in ("tommy", "brody", "eli", "ref", "promoter")}
    specs["heroine"] = HeadSpec(name="heroine", eye="almond", lid=0.1, jaw=0.92, head_w=1.0)
    bad = 0
    for n, s in specs.items():
        print(n)
        bad += len(report(s))
    for n in ("tommy", "brody", "eli"):
        print(n, "body")
        bad += len(report_body(cast.make(n, 100).spec))
    print("OFF count:", bad)
    sys.exit(1 if bad else 0)
