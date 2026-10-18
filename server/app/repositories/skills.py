import json
from datetime import datetime
from app.core.config import TZ
from app.repositories import json_store as store


def write(skills):
    with store.LOCK:
        path = store.DATA.with_name('skills.json')
        path.parent.mkdir(exist_ok=True)
        temporary = path.with_suffix('.tmp')
        temporary.write_text(json.dumps(skills, indent=2, ensure_ascii=False), encoding='utf-8')
        temporary.replace(path)


def read():
    with store.LOCK:
        path = store.DATA.with_name('skills.json')
        if path.exists():
            return json.loads(path.read_text(encoding='utf-8'))
        timestamp = datetime.now(TZ).isoformat()
        example = [{
            'id': 'release-components', 'name': 'Release components',
            'description': 'Retrieve Jira components and issues included in a release.',
            'instructions': 'Retrieve the components associated with issues in project {{project}} and Fix Version {{release}}. Group issues by component. Include issue keys, summaries, statuses, and links. List issues without a component separately. Do not infer release scope from other versions.',
            'executor': 'jira_release_components', 'project': '', 'release': '',
            'created_at': timestamp, 'updated_at': timestamp,
        }]
        write(example)
        return example
