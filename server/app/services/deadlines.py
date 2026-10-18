"""Limited date extraction when an LLM is unavailable; never invent a due date."""
import re
from datetime import date, timedelta


def note_date(note: str, today: date):
    explicit = re.search(r'\b\d{4}-\d{2}-\d{2}\b', note)
    if explicit:
        try:
            return date.fromisoformat(explicit.group())
        except ValueError:
            return None
    if re.search(r'\btomorrow\b', note, re.I):
        return today + timedelta(days=1)
    if re.search(r'\btoday\b', note, re.I):
        return today
    weekday = re.search(r'\b(?:(upcoming|next|this)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b', note, re.I)
    if weekday:
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        offset = (days.index(weekday.group(2).lower()) - today.weekday()) % 7
        if offset == 0 and weekday.group(1) and weekday.group(1).lower() in ('upcoming', 'next'):
            offset = 7
        return today + timedelta(days=offset)
    return None


def note_reminder(note: str):
    match = re.search(r'\bremind(?:\s+me)?\s+(\d+)\s+days?\s+before\b', note, re.I)
    return int(match.group(1)) if match else 3
