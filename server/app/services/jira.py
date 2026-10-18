import os
import asyncio
from datetime import datetime
from urllib.parse import quote, urlsplit
import httpx
from fastapi import HTTPException
from app.core.config import TZ


def jira_config():
    base = os.getenv('JIRA_BASE_URL', '').strip().rstrip('/')
    token = os.getenv('JIRA_TOKEN', '').strip()
    parsed = urlsplit(base)
    valid = parsed.scheme == 'https' and bool(parsed.netloc) and not parsed.username and not parsed.password and not parsed.query and not parsed.fragment
    mode = os.getenv('JIRA_AUTH_MODE', 'bearer').lower()
    username = os.getenv('JIRA_USERNAME', '').strip()
    configured = bool(valid and token and mode in ('bearer', 'basic') and (mode != 'basic' or username))
    return base, token, mode, username, configured


def jql_string(value):
    return '"' + value.replace('\\', '\\\\').replace('"', '\\"') + '"'


async def release_components(project, release):
    base, token, mode, username, configured = jira_config()
    if not configured:
        raise HTTPException(503, 'Configure JIRA_BASE_URL and JIRA_TOKEN in server/.env, then restart the backend. Company-hosted Jira uses bearer authentication by default.')
    jql = f'project = {jql_string(project)} AND fixVersion = {jql_string(release)} ORDER BY key ASC'
    headers = {'Accept': 'application/json'}
    auth = None
    if mode == 'basic':
        auth = httpx.BasicAuth(username, token)
    else:
        headers['Authorization'] = f'Bearer {token}'
    issues, seen, total = [], set(), None
    start, limit = 0, 5000
    try:
        async with asyncio.timeout(120), httpx.AsyncClient(headers=headers, auth=auth, timeout=30, follow_redirects=False) as client:
            while len(issues) < limit:
                response = await client.get(f'{base}/rest/api/2/search', params={
                    'jql': jql, 'startAt': start, 'maxResults': min(100, limit - len(issues)),
                    'fields': 'summary,status,components,fixVersions',
                })
                if response.status_code in (401, 403):
                    raise HTTPException(502, 'Jira rejected authentication or project access. Check the backend token and its permissions.')
                if response.status_code == 400:
                    raise HTTPException(502, 'Jira rejected the release query. Verify the project key and that this Fix Version exists in that project.')
                if response.status_code == 429:
                    raise HTTPException(503, 'Jira is rate limiting requests. Wait and run the skill again.')
                if response.status_code in (301, 302, 303, 307, 308):
                    raise HTTPException(502, 'Jira redirected the request. Set JIRA_BASE_URL to the direct API host and context path.')
                response.raise_for_status()
                data = response.json()
                page = data.get('issues')
                if not isinstance(page, list):
                    raise ValueError('Invalid search response')
                total = data.get('total', total)
                if not page:
                    if isinstance(total, int) and start < total:
                        raise ValueError('Incomplete pagination')
                    break
                fresh = [issue for issue in page if issue['key'] not in seen]
                if not fresh:
                    raise ValueError('Pagination did not advance')
                issues.extend(fresh)
                seen.update(issue['key'] for issue in fresh)
                start += len(page)
                if isinstance(total, int) and start >= total:
                    break
    except HTTPException:
        raise
    except (httpx.TimeoutException, TimeoutError):
        raise HTTPException(504, 'Jira timed out. Check your company network or VPN connection and try again.') from None
    except (httpx.HTTPError, ValueError, KeyError, TypeError):
        # Do not return upstream bodies, URLs with credentials, or exception details.
        raise HTTPException(502, 'Could not retrieve Jira issues. Check the company Jira URL, API availability, network/VPN, and certificate configuration.') from None
    grouped, unassigned = {}, []
    for issue in issues:
        fields = issue.get('fields') or {}
        entry = {'key': issue['key'], 'summary': fields.get('summary', ''),
                 'status': (fields.get('status') or {}).get('name', 'Unknown'),
                 'url': f"{base}/browse/{quote(issue['key'], safe='')}"}
        components = fields.get('components') or []
        if not components:
            unassigned.append(entry)
        for component in components:
            key = str(component.get('id') or component['name'])
            bucket = grouped.setdefault(key, {'id': key, 'name': component['name'], 'issues': []})
            bucket['issues'].append(entry)
    return {'project': project, 'release': release, 'jql': jql,
            'retrieved_at': datetime.now(TZ).isoformat(), 'issue_count': len(issues), 'total': total,
            'truncated': len(issues) >= limit and (total is None or total > len(issues)),
            'components': sorted(grouped.values(), key=lambda item: item['name'].casefold()),
            'unassigned': unassigned}
