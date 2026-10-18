from datetime import date, datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field, model_validator


class CalendarEvent(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default='', max_length=10000)
    start: str = Field(max_length=200)
    end: str = Field(max_length=200)
    allDay: bool = False
    calendarId: str | None = None
    calendarIds: list[str] | None = None
    meta: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode='after')
    def validate_range(self):
        if self.allDay:
            start, end = date.fromisoformat(self.start), date.fromisoformat(self.end)
        else:
            start = datetime.fromisoformat(self.start.split('[')[0])
            end = datetime.fromisoformat(self.end.split('[')[0])
        try:
            invalid_range = end <= start
        except TypeError as error:
            raise ValueError('Start and end must use matching timezone formats') from error
        if invalid_range:
            raise ValueError('Event end must be after its start')
        return self


class CalendarChanges(BaseModel):
    upsert: list[CalendarEvent] = Field(default_factory=list, max_length=1000)
    delete: list[str] = Field(default_factory=list, max_length=1000)


class CalendarSettings(BaseModel):
    calendars: list[dict[str, Any]] = Field(max_length=100)
    groups: list[str] = Field(default_factory=list)

    @model_validator(mode='after')
    def validate_calendars(self):
        ids = [calendar.get('id') for calendar in self.calendars]
        if any(not isinstance(value, str) or not value for value in ids) or len(set(ids)) != len(ids):
            raise ValueError('Calendar IDs must be unique nonempty strings')
        if any(not calendar.get('name') or not isinstance(calendar.get('colors'), dict) for calendar in self.calendars):
            raise ValueError('Each calendar needs a name and colors')
        return self
