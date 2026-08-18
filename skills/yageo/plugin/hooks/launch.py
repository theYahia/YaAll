#!/usr/bin/env python3
"""
YaGEO MCP launcher для Claude Code plugin.

Запускается из `plugin/.mcp.json` как `python ./hooks/launch.py` (cwd = корень плагина). При установке
через `/plugin install` зависимости (natasha и пр.) НЕ ставятся автоматически — поэтому launcher
лениво создаёт `.venv` в корне репозитория и ставит пакет с extra `[mcp]`, затем запускает MCP-сервер
из этого venv.

Дисциплина stdout: stdout этого процесса = пайп MCP-клиента под JSON-RPC. Поэтому ВЕСЬ вывод pip/venv
направляется в stderr, а сервер запускается как дочерний процесс с наследованием stdin/stdout/stderr
(child напрямую владеет пайпами клиента). subprocess.run (а не os.execv) — корректно и на Windows.

Первый запуск качает natasha (~77MB) — может занять пару минут; если клиент отвалился по таймауту,
переподключите MCP (второй запуск мгновенный — стоит marker-файл).
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

# plugin/hooks/launch.py → корень репо = parents[2]
REPO_ROOT = Path(__file__).resolve().parents[2]
VENV = REPO_ROOT / ".venv"
VENV_PY = VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
MARKER = VENV / ".yageo-mcp-installed"


def _log(msg: str) -> None:
    print(f"yageo-mcp/launch: {msg}", file=sys.stderr, flush=True)


def _ensure_venv() -> None:
    if MARKER.exists() and VENV_PY.exists():
        return
    if not VENV_PY.exists():
        _log(f"создаю venv в {VENV} …")
        subprocess.run([sys.executable, "-m", "venv", str(VENV)],
                       check=True, stdout=sys.stderr, stderr=sys.stderr)
    _log("ставлю зависимости (.[mcp]) — первый раз скачает natasha ~77MB, подождите …")
    subprocess.run([str(VENV_PY), "-m", "pip", "install", "-q", "--upgrade", "pip"],
                   check=True, stdout=sys.stderr, stderr=sys.stderr)
    subprocess.run([str(VENV_PY), "-m", "pip", "install", "-q", "-e", f"{REPO_ROOT}[mcp]"],
                   check=True, stdout=sys.stderr, stderr=sys.stderr)
    MARKER.write_text("ok", encoding="utf-8")
    _log("зависимости готовы.")


def main() -> None:
    _ensure_venv()
    if "--bootstrap-only" in sys.argv[1:]:
        return
    # Запускаем сервер из venv, наследуя stdio (child напрямую владеет пайпами клиента).
    proc = subprocess.run([str(VENV_PY), "-m", "scripts.mcp_server"], cwd=str(REPO_ROOT))
    sys.exit(proc.returncode)


if __name__ == "__main__":
    main()
