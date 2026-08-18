"""Data structures for the ЭПОС scorer (extracted from epos_scorer.py).

Pure dataclasses with no config / network dependency. Imported and re-exported
by ``scripts.epos_scorer`` so existing ``from scripts.epos_scorer import EposScore``
keeps working unchanged.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict


@dataclass
class Recommendation:
    action: str
    impact: int  # expected score delta
    criterion: str  # Э / П / О / С


@dataclass
class EposScore:
    url: str
    e: int = 0  # Экспертность
    p: int = 0  # Полезность
    o: int = 0  # Оригинальность
    s: int = 0  # Содержательность
    overall: int = 0
    signals: dict = field(default_factory=dict)
    recommendations: list[Recommendation] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["recommendations"] = [asdict(r) for r in self.recommendations]
        return d
