# clawn

An hourly mutating art website.

More information about the project: <https://nader.io/projects/clawn>

## What it does

- Serves a static site.
- Regenerates `data/hourly.json` every hour.
- An external OpenClaw cron job opens a pull request for each hourly mutation and merges it.
- Keeps a permanent archive of versions on the page.

## Notes

The content generator is intentionally lightweight and deterministic-ish: each UTC hour produces a different mood, text fragment, question, palette, and ambient composition.
