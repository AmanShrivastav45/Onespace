import json
import threading
from app.core.config import SERVER_ROOT

DATA = SERVER_ROOT / "data" / "store.json"
LOCK = threading.RLock()


def task_record(item):
    """Keep task/backlog fields compact; preserve demo marks for demo removal."""
    if item.get('kind') not in ('task', 'backlog'):
        return item
    fields = ('id', 'kind', 'title', 'status', 'priority', 'created_at', 'subtasks', 'demo')
    result = {key: item[key] for key in fields if key in item}
    result.setdefault('priority', 'medium')
    if item['kind'] == 'backlog':
        result['description'] = item.get('description', '')
        result['subtasks'] = [
            {**{key: step[key] for key in ('id', 'done', 'created_at') if key in step},
             'description': step.get('description') or step.get('title', '')}
            for step in item.get('subtasks', [])
        ]
        return result
    result['subtasks'] = [
        {key: step[key] for key in ('id', 'title', 'done', 'created_at') if key in step}
        for step in item.get('subtasks', [])
    ]
    return result

def read():
    with LOCK:
        return json.loads(DATA.read_text(encoding='utf-8')) if DATA.exists() else []

def write(items):
    DATA.parent.mkdir(exist_ok=True)
    temp = DATA.with_suffix('.tmp')
    temp.write_text(json.dumps([task_record(item) for item in items], indent=2, ensure_ascii=False), encoding='utf-8')
    temp.replace(DATA)

