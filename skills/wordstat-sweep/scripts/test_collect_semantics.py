"""test_collect_semantics.py — снежный ком: порог раскрытия, насыщение, кэш без повторных вызовов."""
import tempfile
import unittest
import urllib.error
from collections import defaultdict
from pathlib import Path
from unittest import mock

import collect_semantics as cs


class SnowballTest(unittest.TestCase):
    def run_snowball(self, graph, depth=3, min_expand=0):
        p2s = defaultdict(set, {"сид": {"сид"}, "a": {"сид"}, "b": {"сид"}})
        vol = {"сид": 1000, "a": 500, "b": 5}
        src = {"сид": "сид", "a": "сид", "b": "сид"}
        calls = []

        def fetch(p):
            calls.append(p)
            return graph.get(p, [])

        cs.snowball(["a", "b"], p2s, vol, src, fetch, depth, min_expand)
        return calls, vol, src

    def test_min_expand_skips_small_and_goes_deeper(self):
        graph = {"a": [{"phrase": "a1", "count": 300}], "a1": [{"phrase": "a2", "count": 200}]}
        calls, vol, src = self.run_snowball(graph, min_expand=100)
        self.assertEqual(calls, ["a", "a1"])  # «b» (5) ниже порога, a1 раскрыт на уровне 3
        self.assertEqual(vol["a2"], 200)
        self.assertEqual(src["a2"], "сид")

    def test_saturation_stops_early(self):
        frontier = [f"p{i}" for i in range(200)]
        p2s = defaultdict(set, {p: {"сид"} for p in frontier})
        vol = {p: 10_000 for p in frontier}
        calls = []
        cs.snowball(frontier, p2s, vol, {}, lambda p: calls.append(p) or [], 2, 0)
        self.assertEqual(len(calls), cs.SATURATION_WINDOW)  # 50 пустых раскрытий подряд → стоп

    def test_no_saturation_expands_whole_frontier(self):
        frontier = [f"p{i}" for i in range(200)]
        p2s = defaultdict(set, {p: {"сид"} for p in frontier})
        calls = []
        cs.snowball(frontier, p2s, {p: 10_000 for p in frontier}, {}, lambda p: calls.append(p) or [], 2, 0,
                    saturation=False)
        self.assertEqual(len(calls), 200)

    def test_noise_not_expanded_and_assoc_absorbed(self):
        graph = {"макс чат": [{"phrase": "макс чат бот", "count": 400}]}
        cs._ASSOC.clear()
        cs._ASSOC["макс чат"] = [{"phrase": "макс веб", "count": 900},      # про мессенджер — берём
                                 {"phrase": "телеграм", "count": 99_000},   # чужой бренд — нет
                                 {"phrase": "айфон 16 про макс", "count": 800}]  # шум — нет
        p2s = defaultdict(set, {"макс чат": {"сид"}, "айфон 15 про макс": {"сид"}})
        vol = {"макс чат": 1000, "айфон 15 про макс": 5000}
        calls = []
        cs.snowball(list(p2s), p2s, vol, {}, lambda p: calls.append(p) or graph.get(p, []), 3, 100,
                    saturation=False)
        cs._ASSOC.clear()
        self.assertNotIn("айфон 15 про макс", calls)
        self.assertEqual(vol["макс веб"], 900)
        self.assertNotIn("телеграм", vol)
        self.assertIn("макс веб", calls)  # ассоциация раскрыта на следующем уровне


class StopTest(unittest.TestCase):
    def test_403_stops_run_instead_of_losing_seed(self):
        err = urllib.error.HTTPError("u", 403, "Forbidden", {}, None)
        with mock.patch.object(cs, "_post", mock.Mock(side_effect=err)):
            with self.assertRaises(SystemExit) as ctx:
                cs.top_requests("max чат", "k", "f")
        self.assertEqual(ctx.exception.code, 2)


class CacheTest(unittest.TestCase):
    def test_second_call_hits_disk_cache(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "c.jsonl"
            api = mock.Mock(return_value=[{"phrase": "x", "count": 1}])
            with mock.patch.object(cs, "top_requests", api):
                cs._CACHE = None
                cs.cached_top_requests("q", "k", "f", path)
                cs._CACHE = None  # как новый процесс: читаем только с диска
                self.assertEqual(cs.cached_top_requests("q", "k", "f", path), [{"phrase": "x", "count": 1}])
            self.assertEqual(api.call_count, 1)
            cs._CACHE = None

    def test_empty_answer_not_cached(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "c.jsonl"
            with mock.patch.object(cs, "top_requests", mock.Mock(return_value=[])):
                cs._CACHE = None
                cs.cached_top_requests("q", "k", "f", path)
            self.assertFalse(path.exists())
            cs._CACHE = None


if __name__ == "__main__":
    unittest.main()
