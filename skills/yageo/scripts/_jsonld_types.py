"""Data structures for the JSON-LD schema validator (extracted from json_ld_validator.py).

Pure dataclasses, no network / config dependency. Re-exported by
``scripts.json_ld_validator`` so existing imports keep working unchanged.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict


@dataclass
class SchemaIssue:
    schema_type: str
    severity: str       # "error" | "warning" | "info"
    field: str
    message: str


@dataclass
class SchemaInfo:
    schema_type: str
    fields_present: list[str]
    issues: list[SchemaIssue]
    score: int          # 0-100 completeness


@dataclass
class SchemaReport:
    url: str
    found_schemas: list[SchemaInfo] = field(default_factory=list)
    missing_recommended: list[str] = field(default_factory=list)
    generated: list[dict] = field(default_factory=list)  # ready-to-paste JSON-LD
    overall_score: int = 0    # 0-100 weighted schema completeness
    recommendations: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["found_schemas"] = [asdict(s) for s in self.found_schemas]
        return d
