<div align="center">
  <a href="https://vaishakh3.github.io/noiceboard/">
    <img src="https://raw.githubusercontent.com/vaishakh3/noiceboard/main/data/noiceboard.svg" width="960" alt="Noiceboard GitHub profile dashboard for vaishakh3" />
  </a>
</div>

# Noiceboard

A noice little dashboard for the GitHub profile moment that deserved a proper artifact: repo number 69.

Noiceboard ships two things:

- an animated SVG card that can be embedded in a GitHub profile README
- a static GitHub Pages dashboard for exploring the same repo signal

## Use It

```md
<div align="center">
  <a href="https://vaishakh3.github.io/noiceboard/">
    <img src="https://raw.githubusercontent.com/vaishakh3/noiceboard/main/data/noiceboard.svg" width="960" alt="Noiceboard GitHub profile dashboard for vaishakh3" />
  </a>
</div>
```

## Run Locally

```bash
npm run generate:demo
npm test
npm start
```

Then open `http://localhost:4173`.

## Live Refresh

The included GitHub Action refreshes `data/noiceboard.svg`, `data/stats.json`, and `data/profile-snippet.md` every 12 hours, on push, and on manual dispatch.
Another workflow deploys the static dashboard to GitHub Pages on every push to `main`.

For another account, set these environment variables before generation:

```bash
GITHUB_USER=yourname NICE_REPO=noiceboard REPO_ORDINAL=69 npm run generate
```

Noiceboard uses only public GitHub API data. `GITHUB_TOKEN` is optional locally and provided automatically inside GitHub Actions.
