import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.repositories import json_store as store
from scripts.seed_demo import seed


class DemoTests(unittest.TestCase):
    def test_demo_seed_is_repeatable_and_removal_preserves_personal_items(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(store, 'DATA', Path(folder) / 'store.json'):
            personal = {'id': 'personal', 'title': 'Keep my work'}
            store.write([personal])
            self.assertEqual(seed(), 32)
            self.assertEqual(seed(), 0)
            items = store.read()
            for kind in ['deadline', 'task', 'backlog', 'event']:
                self.assertEqual(sum(item.get('kind') == kind for item in items), 8)
            self.assertEqual(seed(remove=True), 32)
            self.assertEqual(store.read(), [personal])
