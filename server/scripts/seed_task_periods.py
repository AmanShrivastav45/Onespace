"""Add demo tasks across current date filters: python -m scripts.seed_task_periods."""
from datetime import datetime, timedelta
from uuid import NAMESPACE_URL, uuid5
from app.core.config import TZ
from app.repositories import json_store as store


def build_tasks(now=None):
    now = now or datetime.now(TZ)
    monday = now - timedelta(days=now.weekday())
    month = now.replace(day=1)
    year = now.replace(month=1, day=1)
    groups = [
        ('today', now, ['Review Release components', 'Check the latest static analysis results',
                        'Organize meeting notes', 'Review pending code changes']),
        ('week', monday, ['Review QA findings', 'Update local development setup',
                         'Collect release checklist links', 'Tidy up Jira saved filters']),
        ('month', month, ['Document the deployment process', 'Review API error handling',
                         'Clean up unused feature branches', 'Update onboarding notes']),
        ('year', year, ['Review service dependencies', 'Organize architecture notes',
                       'Document recurring support issues', 'Review developer tooling']),
    ]
    result = []
    for group, date, titles in groups:
        for index, title in enumerate(titles):
            item_id = 'demo-' + str(uuid5(NAMESPACE_URL, f'onespace/task-periods/{group}/{index}'))
            created_at = date.replace(hour=9 + index, minute=15, second=0, microsecond=0).isoformat()
            done = index == 3
            steps = [] if index % 2 else [
                {'id': str(uuid5(NAMESPACE_URL, f'{item_id}/{step_index}')),
                 'title': step, 'done': step_index == 0, 'created_at': created_at}
                for step_index, step in enumerate(('Gather the relevant links', 'Review and record next steps'))
            ]
            result.append({'id': item_id, 'kind': 'task', 'title': title,
                           'status': 'done' if done else 'open', 'created_at': created_at,
                           'subtasks': steps, 'demo': True})
    return result


def seed():
    with store.LOCK:
        items = store.read()
        known = {item['id'] for item in items}
        additions = [item for item in build_tasks() if item['id'] not in known]
        store.write(items + additions)
        return len(additions)


if __name__ == '__main__':
    print(f'Added {seed()} demo tasks across today, week, month and year.')
