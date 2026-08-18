---
name: ad-campaigns
description: "Анализ рекламных кампаний Яндекс.Директ"
argument-hint: <campaign_id or keyword>
allowed-tools:
  - Bash
  - Read
---

# /ad-campaigns

Анализ эффективности кампаний Яндекс.Директ через MCP-инструменты сервера yandex-direct.

1. Вызови `list_campaigns` (фильтр `status: "ACCEPTED"`) — получить активные кампании.
2. Вызови `get_statistics` для выбранной кампании за нужный период (показы, клики, расход, CTR, CPC; деньги — в рублях).
3. Вызови `list_ad_groups` → `list_keywords`, чтобы оценить ставки и статусы фраз.
4. Сформируй сводку: расход, клики, CTR, средняя ставка, проблемные фразы.
5. При необходимости предложи действия: `set_keyword_bids` (скорректировать ставки), `set_campaign_negative_keywords` (добавить минус-фразы), `manage_keywords` (остановить неэффективные).
