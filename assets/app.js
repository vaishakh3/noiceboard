const DEFAULT_USER = "vaishakh3";
const DEFAULT_REPO = "noiceboard";
const COLORS = {
  JavaScript: "#f6c945",
  TypeScript: "#69d2e7",
  Python: "#4f9dff",
  Java: "#ff6b4a",
  HTML: "#ff7a59",
  CSS: "#63e6a4",
  Shell: "#d7fbe8",
  Go: "#55d6be",
  Other: "#2de38c"
};

const elements = {
  form: document.querySelector("#lookupForm"),
  input: document.querySelector("#usernameInput"),
  cardPreview: document.querySelector("#cardPreview"),
  svgLink: document.querySelector("#svgLink"),
  copyButton: document.querySelector("#copyButton"),
  embedSnippet: document.querySelector("#embedSnippet"),
  repoCount: document.querySelector("#repoCount"),
  starCount: document.querySelector("#starCount"),
  forkCount: document.querySelector("#forkCount"),
  activeCount: document.querySelector("#activeCount"),
  niceRepoTitle: document.querySelector("#niceRepoTitle"),
  niceRepoDescription: document.querySelector("#niceRepoDescription"),
  languageList: document.querySelector("#languageList"),
  topRepos: document.querySelector("#topRepos"),
  toast: document.querySelector("#toast")
};

let currentSnippet = profileSnippet(DEFAULT_USER);

boot();

async function boot() {
  try {
    const response = await fetch("data/stats.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Generated stats are not available yet.");
    }
    renderStats(await response.json(), { staticSvg: "data/noiceboard.svg" });
  } catch {
    await loadLive(DEFAULT_USER);
  }
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = elements.input.value.trim() || DEFAULT_USER;
  await loadLive(username);
});

elements.copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(currentSnippet);
  showToast("Profile embed copied.");
});

async function loadLive(username) {
  setBusy(true);
  try {
    const stats = await fetchStats(username);
    renderStats(stats, { staticSvg: false });
    showToast(`Loaded ${stats.user.login}.`);
  } catch (error) {
    showToast(error.message || "Could not load that profile.");
  } finally {
    setBusy(false);
  }
}

async function fetchStats(username) {
  const headers = { Accept: "application/vnd.github+json" };
  const profileResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
  if (!profileResponse.ok) {
    throw new Error("GitHub profile not found.");
  }
  const profile = await profileResponse.json();
  const repos = [];

  for (let page = 1; page <= 10; page += 1) {
    const reposResponse = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=created&direction=asc&type=owner`,
      { headers }
    );
    if (!reposResponse.ok) {
      throw new Error("GitHub repo data is rate-limited right now.");
    }
    const pageRepos = await reposResponse.json();
    repos.push(...pageRepos);
    if (pageRepos.length < 100) {
      break;
    }
  }

  return buildClientStats(profile, repos);
}

function buildClientStats(profile, repos) {
  const normalized = repos.map((repo) => ({
    name: repo.name,
    description: repo.description || "",
    url: repo.html_url,
    language: repo.language || "Other",
    stars: Number(repo.stargazers_count || 0),
    forks: Number(repo.forks_count || 0),
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
    archived: Boolean(repo.archived)
  }));
  const createdOrder = [...normalized].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const targetIndex = createdOrder.findIndex((repo) => repo.name.toLowerCase() === DEFAULT_REPO);
  const niceRepo = createdOrder[targetIndex] || createdOrder[68] || {
    name: DEFAULT_REPO,
    description: "Waiting for the noice launch.",
    url: `https://github.com/${profile.login}/${DEFAULT_REPO}`,
    language: "JavaScript",
    stars: 0,
    forks: 0,
    createdAt: new Date().toISOString(),
    pushedAt: new Date().toISOString()
  };
  const languages = summarizeLanguages(normalized);

  return {
    generatedAt: new Date().toISOString(),
    user: {
      login: profile.login,
      name: profile.name || profile.login,
      htmlUrl: profile.html_url,
      publicRepos: profile.public_repos
    },
    totals: {
      repos: normalized.length,
      stars: normalized.reduce((sum, repo) => sum + repo.stars, 0),
      forks: normalized.reduce((sum, repo) => sum + repo.forks, 0),
      activeThisYear: normalized.filter((repo) => new Date(repo.pushedAt).getUTCFullYear() === 2026).length
    },
    niceRepo: {
      ...niceRepo,
      ordinal: 69,
      actualPublicOrdinal: targetIndex >= 0 ? targetIndex + 1 : null
    },
    languages,
    topRepos: [...normalized].sort((a, b) => b.stars - a.stars || b.forks - a.forks).slice(0, 6)
  };
}

function renderStats(stats, { staticSvg }) {
  const username = stats.user?.login || DEFAULT_USER;
  currentSnippet = profileSnippet(username);
  elements.embedSnippet.textContent = currentSnippet;
  elements.input.value = username;
  elements.repoCount.textContent = formatNumber(stats.totals?.repos || 0);
  elements.starCount.textContent = formatNumber(stats.totals?.stars || 0);
  elements.forkCount.textContent = formatNumber(stats.totals?.forks || 0);
  elements.activeCount.textContent = formatNumber(stats.totals?.activeThisYear || 0);
  elements.niceRepoTitle.textContent = `${stats.niceRepo?.name || DEFAULT_REPO} · #${stats.niceRepo?.ordinal || 69}`;
  elements.niceRepoDescription.textContent = stats.niceRepo?.description || "A noice embeddable GitHub profile dashboard.";

  renderLanguages(stats.languages || []);
  renderRepos(stats.topRepos || []);

  if (staticSvg) {
    elements.cardPreview.src = staticSvg;
    elements.svgLink.href = staticSvg;
  } else {
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderMiniSvg(stats))}`;
    elements.cardPreview.src = svgUrl;
    elements.svgLink.href = svgUrl;
  }
}

function renderLanguages(languages) {
  elements.languageList.replaceChildren(
    ...languages.slice(0, 5).map((language) => {
      const row = document.createElement("div");
      row.className = "language-row";
      const name = document.createElement("span");
      name.textContent = language.name;
      const track = document.createElement("span");
      track.className = "language-track";
      const fill = document.createElement("span");
      fill.className = "language-fill";
      fill.style.width = `${Math.max(4, language.percentage)}%`;
      fill.style.background = language.color || COLORS[language.name] || COLORS.Other;
      const percentage = document.createElement("span");
      percentage.textContent = `${language.percentage}%`;
      track.append(fill);
      row.append(name, track, percentage);
      return row;
    })
  );
}

function renderRepos(repos) {
  elements.topRepos.replaceChildren(
    ...repos.slice(0, 6).map((repo) => {
      const item = document.createElement("article");
      item.className = "repo-item";
      const link = document.createElement("a");
      link.href = repo.url || "#";
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = repo.name;
      const description = document.createElement("p");
      description.textContent = repo.description || "No description yet.";
      const meta = document.createElement("div");
      meta.className = "repo-meta";
      meta.innerHTML = `<span>${repo.language || "Other"}</span><span>${formatNumber(repo.stars || 0)} stars</span><span>${formatNumber(repo.forks || 0)} forks</span>`;
      item.append(link, description, meta);
      return item;
    })
  );
}

function summarizeLanguages(repos) {
  const counts = new Map();
  for (const repo of repos) {
    counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0) || 1;
  return Array.from(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
      color: COLORS[name] || COLORS.Other
    }));
}

function renderMiniSvg(stats) {
  const user = escapeXml(stats.user?.name || stats.user?.login || DEFAULT_USER);
  const repo = escapeXml(stats.niceRepo?.name || DEFAULT_REPO);
  const ordinal = escapeXml(String(stats.niceRepo?.ordinal || 69));
  const repos = formatNumber(stats.totals?.repos || 0);
  const stars = formatNumber(stats.totals?.stars || 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="420" viewBox="0 0 960 420" role="img">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#06110c"/><stop offset=".58" stop-color="#102018"/><stop offset="1" stop-color="#251513"/>
      </linearGradient>
    </defs>
    <rect width="960" height="420" fill="url(#g)"/>
    <rect x="24" y="24" width="912" height="372" rx="8" fill="#07130e" stroke="#315642"/>
    <text x="54" y="78" fill="#f6c945" font-family="ui-sans-serif, system-ui" font-size="14" font-weight="800">NOICEBOARD</text>
    <text x="54" y="146" fill="#f2fff7" font-family="ui-sans-serif, system-ui" font-size="56" font-weight="900">${user}</text>
    <text x="54" y="198" fill="#d7fbe8" font-family="ui-sans-serif, system-ui" font-size="25" font-weight="800">Repo #${ordinal} went noice: ${repo}</text>
    <text x="54" y="284" fill="#f2fff7" font-family="ui-sans-serif, system-ui" font-size="36" font-weight="900">${repos} repos  /  ${stars} stars</text>
    <circle cx="752" cy="206" r="112" fill="none" stroke="#2de38c" stroke-opacity=".36"/>
    <circle cx="752" cy="206" r="66" fill="none" stroke="#f6c945" stroke-opacity=".42"/>
    <circle cx="752" cy="206" r="42" fill="#0e261b" stroke="#ff6b4a" stroke-width="2"/>
    <text x="752" y="217" fill="#f2fff7" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="38" font-weight="900">69</text>
  </svg>`;
}

function profileSnippet(username) {
  return `<div align="center">
  <a href="https://github.com/${username}/${DEFAULT_REPO}">
    <img src="https://raw.githubusercontent.com/${username}/${DEFAULT_REPO}/main/data/noiceboard.svg" width="960" alt="Noiceboard GitHub profile dashboard for ${username}" />
  </a>
</div>`;
}

function setBusy(isBusy) {
  elements.form.querySelector("button").disabled = isBusy;
  elements.form.querySelector("button").textContent = isBusy ? "Loading" : "Load";
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.setTimeout(() => elements.toast.classList.remove("visible"), 2200);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en", { notation: Number(value) >= 10000 ? "compact" : "standard" }).format(Number(value) || 0);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
