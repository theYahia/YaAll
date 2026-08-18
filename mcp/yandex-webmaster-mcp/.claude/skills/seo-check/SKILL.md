---
name: seo-check
description: "Проверка SEO-позиций сайта в Яндексе"
argument-hint: <host or URL>
allowed-tools:
  - Bash
  - Read
---

# /seo-check

1. Call get_hosts to find the site and its host_id
2. Call get_popular_search_queries (host_id; date range defaults to the last 7 days)
3. Call get_indexing for indexing status, and get_indexing_history to spot deindexing
4. Format a summary: top queries with positions/shows/clicks, indexed pages, any trend
