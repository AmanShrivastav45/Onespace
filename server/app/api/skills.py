from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from app.core.config import TZ
from app.models.skill import SkillInput, SkillRun
from app.repositories import json_store as store
from app.repositories import skills
from app.services.jira import jira_config, release_components

router = APIRouter(prefix='/api/skills', tags=['skills'])


@router.get('')
def list_skills():
    return {'skills': skills.read(), 'jira_configured': jira_config()[-1]}


@router.post('', status_code=201)
def create_skill(payload: SkillInput):
    with store.LOCK:
        records = skills.read()
        timestamp = datetime.now(TZ).isoformat()
        item = {**payload.model_dump(), 'id': str(uuid4()), 'created_at': timestamp, 'updated_at': timestamp}
        records.append(item)
        skills.write(records)
        return item


@router.put('/{skill_id}')
def update_skill(skill_id: str, payload: SkillInput):
    with store.LOCK:
        records = skills.read()
        for index, item in enumerate(records):
            if item['id'] == skill_id:
                records[index] = {**item, **payload.model_dump(), 'updated_at': datetime.now(TZ).isoformat()}
                skills.write(records)
                return records[index]
    raise HTTPException(404, 'Skill not found')


@router.delete('/{skill_id}', status_code=204)
def delete_skill(skill_id: str):
    with store.LOCK:
        records = skills.read()
        if not any(item['id'] == skill_id for item in records):
            raise HTTPException(404, 'Skill not found')
        skills.write([item for item in records if item['id'] != skill_id])


@router.post('/{skill_id}/run')
async def run_skill(skill_id: str, payload: SkillRun):
    skill = next((item for item in skills.read() if item['id'] == skill_id), None)
    if skill is None:
        raise HTTPException(404, 'Skill not found')
    if skill['executor'] != 'jira_release_components':
        raise HTTPException(422, 'This skill stores instructions only. Select the Jira release components action to run it without an LLM.')
    result = await release_components(payload.project, payload.release)
    result['instructions'] = skill['instructions'].replace('{{project}}', payload.project).replace('{{release}}', payload.release)
    return result
