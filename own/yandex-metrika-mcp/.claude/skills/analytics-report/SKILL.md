---
name: analytics-report
description: "Отчёт по посещаемости сайта из Яндекс.Метрики"
argument-hint: <counter_id>
allowed-tools:
  - Bash
  - Read
---

# /analytics-report

1. Get counter ID from user or find via get_counters
2. Call get_visitors for last 7 days
3. Call get_sources for same period
4. Format summary with visits, users, bounce rate, sources
