# @theyahia/yandexgpt-mcp

MCP-сервер для Yandex GPT API — генерация текста, эмбеддинги, классификация, суммаризация, токенизация. **8 инструментов.**

[![npm](https://img.shields.io/npm/v/@theyahia/yandexgpt-mcp)](https://www.npmjs.com/package/@theyahia/yandexgpt-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Часть серии [Russian API MCP](https://github.com/theYahia/russian-mcp) (50 серверов) by [@theYahia](https://github.com/theYahia).

## Установка

### Claude Desktop

```json
{
  "mcpServers": {
    "yandexgpt": {
      "command": "npx",
      "args": ["-y", "@theyahia/yandexgpt-mcp"],
      "env": { "YANDEX_API_KEY": "your-api-key", "YANDEX_FOLDER_ID": "your-folder-id" }
    }
  }
}
```

### Claude Code

```bash
claude mcp add yandexgpt -e YANDEX_API_KEY=your-api-key -e YANDEX_FOLDER_ID=your-folder-id -- npx -y @theyahia/yandexgpt-mcp
```

### VS Code / Cursor

```json
{ "servers": { "yandexgpt": { "command": "npx", "args": ["-y", "@theyahia/yandexgpt-mcp"], "env": { "YANDEX_API_KEY": "your-api-key", "YANDEX_FOLDER_ID": "your-folder-id" } } } }
```

> Требуется `YANDEX_API_KEY` и `YANDEX_FOLDER_ID`. Получите в [консоли Yandex Cloud](https://console.cloud.yandex.ru/).

## Инструменты (8)

| Инструмент | Описание |
|------------|----------|
| `complete` | Синхронная генерация текста через YandexGPT |
| `complete_async` | Асинхронная генерация, возвращает ID операции |
| `get_operation` | Проверить статус асинхронной операции |
| `embed_text` | Получить эмбеддинг одного текста |
| `embed_documents` | Batch-эмбеддинги для массива текстов |
| `classify` | Zero-shot классификация текста по меткам |
| `summarize` | Суммаризация текста |
| `tokenize` | Токенизация текста, подсчёт токенов |

## Демо-промпты

```
Сгенерируй текст через YandexGPT: "Напиши стихотворение о весне"
Запусти асинхронную генерацию длинного текста и проверь статус операции
Получи эмбеддинг для текста "Машинное обучение"
Получи эмбеддинги для 5 описаний товаров
Классифицируй отзыв "Доставка опоздала на 3 дня" по меткам: позитивный, негативный, нейтральный
Суммаризируй статью из 2000 слов в 3 предложения
Посчитай количество токенов в тексте "Привет, мир!"
```

## Лицензия

MIT
