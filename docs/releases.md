# Releases and rollback

## Saved versions

| Version | Source | Changes |
| --- | --- | --- |
| 0.4.1 | [releases/v0.4.1](https://github.com/Relic-31/TriView/tree/releases/v0.4.1) | Correct horizontal model rotation; released 2026-09-18. |
| 0.4.0 | [releases/v0.4.0](https://github.com/Relic-31/TriView/tree/releases/v0.4.0) | Previous version, commit `40e44421d9070d936293259bcdc3bd8ce5dc25e4`. |

These branches preserve release snapshots. Keep them unchanged when publishing
future updates. GitHub Pages serves `main`.

## Roll back a published update

Revert the single 0.4.1 update commit on `main`. This creates a new commit and
preserves history; it does not reset or force-push the branch.

Run these commands from a clean clone of the repository:

```sh
git fetch origin
git switch main
git pull --ff-only origin main
git log -1 --oneline origin/releases/v0.4.1
git revert origin/releases/v0.4.1
npm test
git push origin main
```

Resolve any conflicts from later changes before testing and pushing. GitHub
Pages deploys the resulting `main` revision. Verify the website after deployment.

The `releases/v0.4.0` branch keeps the original source available for comparison
and recovery. Reverting the complete update also restores version 0.4.0 in
`package.json`; the 0.4.1 changelog and these instructions remain available on
`releases/v0.4.1`.
