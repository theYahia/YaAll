#!/usr/bin/env bash
# YaGEOinstaller — Windows (Git Bash)

set -e

PYTHON="python"

if ! $PYTHON --version &>/dev/null; then
    echo "ERROR: Python не найден. Установи с https://python.org"
    exit 1
fi

PY_VER=$($PYTHON -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "==> Python $PY_VER обнаружен"

echo "==> Создаю venv (.venv)..."
$PYTHON -m venv .venv

echo "==> Устанавливаю зависимости..."
.venv/Scripts/python -m pip install -q --upgrade pip
.venv/Scripts/python -m pip install -q -e ".[dev]"

echo "==> Проверяю Natasha..."
.venv/Scripts/python -W ignore -c "from natasha import NewsEmbedding; NewsEmbedding(); print('natasha OK')"

echo ""
echo "Установка завершена!"
echo "Активируй окружение:  source .venv/Scripts/activate"
echo "Проверка:             yageo-epos https://gosmax.ru/"
