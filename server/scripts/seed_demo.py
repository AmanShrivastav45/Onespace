"""Run from server: python -m scripts.seed_demo [--remove]."""
import argparse
import json
from datetime import datetime, timedelta
from uuid import NAMESPACE_URL, uuid5

from app.core.config import SERVER_ROOT, TZ
from app.models.item import Item
from app.repositories import json_store as store


def build_demo_items():
    now = datetime.now(TZ)
    fixtures = json.loads((SERVER_ROOT / 'fixtures' / 'demo_items.json').read_text(encoding='utf-8'))
    result = []
    for kind, rows in fixtures.items():
        for index, row in enumerate(rows):
            title, description, offset, person, priority, *extras = row
            status = extras[0] if extras else 'open'
            steps = extras[1] if len(extras) > 1 else []
            item_id = 'demo-' + str(uuid5(NAMESPACE_URL, f'onespace/{kind}/{index}'))
            item = Item(
                kind=kind, title=title, description='Demo item. ' + description,
                date=now.date() + timedelta(days=offset) if offset is not None else None,
                person=person, priority=priority, status=status,
                reminder_days=[3, 1, 0, 2][index % 4],
                subtasks=[{
                    'id': str(uuid5(NAMESPACE_URL, f'{item_id}/{step}')),
                    'title': step,
                    'done': status == 'done' or step_index == 0,
                    'created_at': now.isoformat(),
                } for step_index, step in enumerate(steps)],
            ).model_dump(mode='json')
            result.append({**item, 'id': item_id, 'created_at': now.isoformat(),
                           'demo': True, 'reminder_sent': 'disabled-for-demo'})
    return result


def seed(remove=False):
    with store.LOCK:
        existing = store.read()
        if remove:
            remaining = [item for item in existing if not item.get('demo')]
            store.write(remaining)
            return len(existing) - len(remaining)
        known_ids = {item['id'] for item in existing}
        additions = [item for item in build_demo_items() if item['id'] not in known_ids]
        store.write(existing + additions)
        return len(additions)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Add or remove clearly marked demo records; existing personal items are preserved.')
    parser.add_argument('--remove', action='store_true', help='Remove only records marked as demos.')
    args = parser.parse_args()
    count = seed(remove=args.remove)
    print(f"{'Removed' if args.remove else 'Added'} {count} demo records.")
