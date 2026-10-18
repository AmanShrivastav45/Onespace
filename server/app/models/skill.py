from typing import Literal
from pydantic import BaseModel, Field


class SkillInput(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default='', max_length=1000)
    instructions: str = Field(min_length=1, max_length=20000)
    executor: Literal['instructions', 'jira_release_components'] = 'instructions'
    project: str = Field(default='', max_length=100)
    release: str = Field(default='', max_length=100)


class SkillRun(BaseModel):
    project: str = Field(min_length=1, max_length=100, pattern=r'^[A-Za-z][A-Za-z0-9_]*$')
    release: str = Field(min_length=1, max_length=100, pattern=r'^[^\x00-\x1f]+$')
