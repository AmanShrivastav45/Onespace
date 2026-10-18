import json
import os
import re
from typing import Literal
import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field
from app.core.config import SERVER_ROOT


class TaskNote(BaseModel):
    note: str = Field(min_length=3, max_length=10000)


class TaskEdit(TaskNote):
    priority: Literal['low', 'medium', 'high'] | None = None


def infer_priority(note: str, current_priority: str = 'medium'):
    matches = list(re.finditer(r'\b(high|low|medium)[ -]+priority\b|\bpriority\s*(?:is|:|=)?\s*(high|low|medium)\b', note, re.I))
    return next((group.lower() for group in matches[-1].groups() if group), current_priority) if matches else current_priority


async def polish_task(note: str, *, parent_title: str | None = None, current_priority: str = 'medium', backlog_subtask: bool = False):
    limit = 10000 if backlog_subtask else 500 if parent_title is not None else 200
    if not os.getenv('OPENAI_API_KEY'):
        title = note.strip() if backlog_subtask else ' '.join(note.split())
        if not title or len(title) > limit:
            raise HTTPException(422, f'Without an LLM, keep the note between 3 and {limit} characters. Configure OPENAI_API_KEY to polish longer notes.')
        priority = infer_priority(note, current_priority)
        return title, 'manual', priority
    prompt_file = 'backlog_subtask_polishing.md' if backlog_subtask else 'subtask_polishing.md' if parent_title is not None else 'task_polishing.md'
    prompt = (SERVER_ROOT / 'prompts' / prompt_file).read_text(encoding='utf-8')
    content = json.dumps({'parent_task': parent_title, 'note': note}) if parent_title is not None else json.dumps({'note': note, 'current_priority': current_priority})
    try:
        async with httpx.AsyncClient(timeout=35) as client:
            response = await client.post('https://api.openai.com/v1/chat/completions',
                headers={'Authorization': f"Bearer {os.environ['OPENAI_API_KEY']}"},
                json={'model': os.getenv('OPENAI_MODEL', 'gpt-4.1-mini'), 'response_format': {'type': 'json_object'},
                      'messages': [{'role': 'system', 'content': prompt}, {'role': 'user', 'content': content}]})
            response.raise_for_status()
            result = json.loads(response.json()['choices'][0]['message']['content'])
            title = result['description' if backlog_subtask else 'title']
            if not isinstance(title, str):
                raise ValueError('Invalid task title')
            title = title.strip() if backlog_subtask else ' '.join(title.split())
            if not title or len(title) > limit:
                raise ValueError('Invalid task title')
            priority = result.get('priority', current_priority) if parent_title is None else current_priority
            if priority not in ('low', 'medium', 'high'):
                raise ValueError('Invalid task priority')
            return title, 'ai', priority
    except (httpx.HTTPError, ValueError, KeyError, TypeError, IndexError):
        raise HTTPException(502, 'Task polishing is unavailable. Your note has not been saved. Try again.') from None
