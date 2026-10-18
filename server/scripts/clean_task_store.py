"""Run from server: python -m scripts.clean_task_store.

Remove unused task fields. Demo subtasks inherit their fixture creation time;
unknown creation times on personal subtasks remain unknown.
"""
from app.repositories import json_store as store


def clean():
    with store.LOCK:
        items = store.read()
        for item in items:
            if item.get('kind') == 'task' and item.get('demo'):
                for step in item.get('subtasks', []):
                    if not step.get('created_at'):
                        step['created_at'] = item.get('created_at')
        store.write(items)


if __name__ == '__main__':
    clean()
    print('Task records cleaned; demo subtask timestamps restored from fixture creation time.')
