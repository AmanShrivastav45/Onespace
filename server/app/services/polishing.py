import json
import logging
import os
from datetime import datetime
import httpx
from fastapi import HTTPException
from app.core.config import TZ, PROMPT_PATH
from app.models.item import Item, Note
from app.services.tasks import infer_priority

async def polish(payload: Note):
    if not os.getenv('OPENAI_API_KEY'):
        return {'title': payload.note.strip().split('\n')[0][:200], 'description': payload.note.strip(), 'date': None, 'person': '', 'priority': infer_priority(payload.note), 'source': 'manual'}
    prompt_path = PROMPT_PATH.with_name(f'{payload.kind}_polishing.md') if payload.kind in ('deadline', 'backlog') else PROMPT_PATH
    prompt = prompt_path.read_text(encoding="utf-8") + f'\nToday: {datetime.now(TZ).date()}. Timezone: {TZ}.'
    try:
        async with httpx.AsyncClient(timeout=35) as client:
            response = await client.post('https://api.openai.com/v1/chat/completions', headers={'Authorization': f"Bearer {os.environ['OPENAI_API_KEY']}"}, json={'model': os.getenv('OPENAI_MODEL', 'gpt-4.1-mini'), 'response_format': {'type': 'json_object'}, 'messages': [{'role': 'system', 'content': prompt}, {'role': 'user', 'content': json.dumps(payload.model_dump())}]})
            response.raise_for_status()
            result = json.loads(response.json()['choices'][0]['message']['content'])
            validated = Item(kind=payload.kind, **{k: v for k, v in result.items() if k in ['title', 'description', 'date', 'person', 'priority', 'reminder_days']})
            return {**validated.model_dump(mode='json'), 'source': 'ai'}
    except Exception as error:
        # Validation errors can contain the original note or generated content.
        logging.warning('AI polishing failed (%s)', type(error).__name__)
        raise HTTPException(502, 'Polishing is unavailable. Your note is preserved; you can fill in the fields manually.')
