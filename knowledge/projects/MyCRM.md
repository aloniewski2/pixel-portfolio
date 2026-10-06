# Project: MyCRM
Summary: Personal CRM that tracks contacts and scores relationship warmth, keeping itself current on a cron. React + Vite front end, Express backend, with Gmail, IMAP, Notion, Slack, Claude and Ollama integrations.
Code: https://github.com/aloniewski2/MyCRM
Languages: JavaScript
Last updated: 2026-08-19

# MyCRM

A personal CRM for relationships you actually have to maintain — mentors, recruiters,
teammates, people you met once and meant to follow up with. It tracks who you know, when
you last spoke, and quietly tells you who's going cold.

## Why

Sales CRMs are built around deals and quotas. The problem for an individual is smaller
and more human: you meet someone useful, you mean to stay in touch, and six months later
the thread is dead. This tracks the last touch and surfaces it before that happens.

## What it does

- Contacts with a warmth score. Every contact is *hot*, *warm*, or *cold* based on
  days since the last interaction — seven, thirty, beyond. It's computed from the
  interaction log, not typed in by hand, so it can't go stale.
- Interaction log — calls, emails, meetings, notes, each linked back to a contact.
- Pipeline of opportunities, so a conversation can become something tracked.
- Tasks and a calendar for follow-ups you commit to.
- A daily briefing that pulls together who to contact and what's due.
- Draft assistance for outreach messages.

## Integrations

| Service | Used for |

| Google | calendar and contact sync |
| IMAP | reading mail to log interactions automatically |
| Notion | syncing notes out to an existing workspace |
| Claude | drafting outreach and generating the daily briefing |
| Slack | notifications |

Each one is optional — the CRM works standalone and each integration switches on when
its credentials are present.

## Stack

React + Vite on the front, Express on the back, with a file-backed store in
`server/data`. No database to provision.

## Status

Working locally and self-hosted; single-user, with no auth layer, so it isn't ready to
be exposed publicly as-is.
