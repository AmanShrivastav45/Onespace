import asyncio
import logging
import os
import smtplib
from datetime import date as Date, datetime, timedelta
from email.message import EmailMessage
from app.core.config import TZ
from app.repositories import json_store as store

def send_reminders():
    if not all(os.getenv(k) for k in ['SMTP_HOST', 'SMTP_FROM', 'REMINDER_EMAIL']):
        return
    with store.LOCK:
        items = store.read()
        changed = False
        today = datetime.now(TZ).date()
        for item in items:
            if item.get('demo'):
                continue
            if item['kind'] != 'deadline' or item['status'] == 'done' or not item.get('date') or item.get('reminder_sent'):
                continue
            due = Date.fromisoformat(item['date'])
            if today < due - timedelta(days=item['reminder_days']):
                continue
            msg = EmailMessage()
            msg['From'], msg['To'] = os.environ['SMTP_FROM'], os.environ['REMINDER_EMAIL']
            msg['Subject'] = f"Onespace reminder: {item['title']}"
            msg.set_content(f"Due {due.isoformat()}\n\n{item['description']}\n\nContact: {item['person'] or 'Not specified'}")
            try:
                with smtplib.SMTP(os.environ['SMTP_HOST'], int(os.getenv('SMTP_PORT', '587')), timeout=20) as smtp:
                    smtp.starttls()
                    if os.getenv('SMTP_USER'):
                        smtp.login(os.environ['SMTP_USER'], os.environ['SMTP_PASSWORD'])
                    smtp.send_message(msg)
                item['reminder_sent'] = datetime.now(TZ).isoformat()
                changed = True
            except Exception as error:
                logging.warning('Reminder delivery failed (%s); will retry next minute', type(error).__name__)
        if changed:
            store.write(items)

async def reminder_loop():
    while True:
        await asyncio.to_thread(send_reminders)
        await asyncio.sleep(60)

