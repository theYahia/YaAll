#!/usr/bin/env bash
# YaGEOinstaller — macOS / Linux

set -e

PYTHON="python3.12"

if ! $PYTHON --version &>/dev/null; then
    echo "ERROR: Python 3.12 не найден. Установи с https://python.org"
    exit 1
fi

echo "==> Создаю venv (.venv)..."
$PYTHON -m venv .venv

echo "==> Устанавливаю зависимости..."
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -e ".[dev]"

echo "==> Проверяю Natasha..."
.venv/bin/python -W ignore -c "from natasha import NewsEmbedding; NewsEmbedding(); print('natasha OK')"

echo ""
echo "Установка завершена!"
echo "Активируй окружение:  source .venv/bin/activate"
echo "Проверка:             yageo-epos https://gosmax.ru/"
