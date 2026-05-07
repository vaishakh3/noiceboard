const LANGUAGE_COLORS = {
  JavaScript: "#f6c945",
  TypeScript: "#69d2e7",
  Python: "#4f9dff",
  Java: "#ff6b4a",
  HTML: "#ff7a59",
  CSS: "#63e6a4",
  SCSS: "#ff84b7",
  PHP: "#9b8cff",
  "C++": "#f36d8d",
  C: "#9fb3c8",
  Go: "#55d6be",
  Rust: "#e58f65",
  Swift: "#ff9f43",
  Kotlin: "#b978ff",
  Dart: "#3ddbd9",
  Shell: "#d7fbe8",
  Vue: "#42d392",
  Svelte: "#ff5a35",
  Ruby: "#f05b5b",
  Jupyter: "#f37726"
};

const FALLBACK_COLORS = ["#2de38c", "#ff6b4a", "#f6c945", "#69d2e7", "#d7fbe8"];

const DEMO_NAMES = [
  "pixel-ledger",
  "tiny-router",
  "mood-cli",
  "weatherline",
  "habit-ink",
  "focus-lane",
  "paper-cuts",
  "api-garden",
  "shell-spark",
  "night-shift",
  "maple-notes",
  "build-bell",
  "signal-studio",
  "token-tide",
  "quiet-cache",
  "canvas-kit",
  "route-radar",
  "fresh-start",
  "bug-binder",
  "commit-clock",
  "theme-press",
  "table-talk",
  "edge-notes",
  "lucid-lists",
  "deploy-day",
  "pulse-ping",
  "query-quill",
  "readme-runner",
  "stack-shelf",
  "trace-trail",
  "uptime-ink",
  "vector-vault",
  "window-well",
  "yardstick",
  "zen-mode",
  "alpha-grid",
  "branch-book",
  "cloud-cabin",
  "delta-dash",
  "ember-edit",
  "frame-flow",
  "git-garden",
  "hover-hall",
  "index-ink",
  "jump-jet",
  "kernel-key",
  "layout-lab",
  "matrix-mint",
  "node-nook",
  "orbit-ops",
  "patch-path",
  "queue-quartz",
  "release-rope",
  "source-signal",
  "task-tower",
  "union-ui",
  "value-vault",
  "wave-watch",
  "xray-xterm",
  "yield-yard",
  "zero-zest",
  "atlas-arc",
  "binary-bloom",
  "carbon-calm",
  "drift-docs",
  "echo-engine",
  "flux-file",
  "graph-glow"
];

export const DEFAULT_USER = "vaishakh3";
export const DEFAULT_REPO = "noiceboard";
export const DEFAULT_ORDINAL = 69;

export function buildStats({
  user = {},
  repos = [],
  generatedAt = new Date().toISOString(),
  repoOrdinal = DEFAULT_ORDINAL,
  targetRepoName = DEFAULT_REPO
} = {}) {
  const normalizedRepos = repos.map(normalizeRepo);
  const createdOrder = [...normalizedRepos].sort(compareCreated);
  const targetIndex = createdOrder.findIndex((repo) => repo.name.toLowerCase() === targetRepoName.toLowerCase());
  const ordinalIndex = Math.max(0, repoOrdinal - 1);
  const niceRepo = targetIndex >= 0 ? createdOrder[targetIndex] : createdOrder[ordinalIndex] || makePlaceholderRepo(targetRepoName);
  const actualPublicOrdinal = targetIndex >= 0 ? targetIndex + 1 : null;
  const sourceRepos = createdOrder.length > 0 ? createdOrder : [niceRepo];

  return {
    generatedAt,
    repoOrdinal,
    targetRepoName,
    user: {
      login: user.login || DEFAULT_USER,
      name: user.name || user.login || "GitHub maker",
      avatarUrl: user.avatarUrl || user.avatar_url || "",
      htmlUrl: user.htmlUrl || user.html_url || `https://github.com/${user.login || DEFAULT_USER}`,
      bio: user.bio || "",
      publicRepos: Number(user.publicRepos || user.public_repos || normalizedRepos.length)
    },
    totals: {
      repos: normalizedRepos.length || Number(user.publicRepos || user.public_repos || 0),
      stars: sum(normalizedRepos, "stars"),
      forks: sum(normalizedRepos, "forks"),
      openIssues: sum(normalizedRepos, "openIssues"),
      archived: normalizedRepos.filter((repo) => repo.archived).length,
      activeThisYear: normalizedRepos.filter((repo) => isThisYear(repo.pushedAt)).length
    },
    niceRepo: {
      ...niceRepo,
      ordinal: repoOrdinal,
      actualPublicOrdinal
    },
    languages: summarizeLanguages(sourceRepos),
    topRepos: topRepos(sourceRepos),
    freshestRepos: freshestRepos(sourceRepos),
    constellation: createConstellation(sourceRepos),
    cadence: buildCadence(sourceRepos)
  };
}

export function buildDemoStats({ user = DEFAULT_USER, name = "Vaishakh Suresh" } = {}) {
  const languages = ["JavaScript", "TypeScript", "Python", "HTML", "CSS", "Shell", "Go", "Java"];
  const repos = Array.from({ length: DEFAULT_ORDINAL }, (_, index) => {
    const repoNumber = index + 1;
    const nameForRepo = repoNumber === DEFAULT_ORDINAL ? DEFAULT_REPO : DEMO_NAMES[index] || `repo-${repoNumber}`;
    const created = new Date(Date.UTC(2020, 0, 1 + index * 18, 8, 0, 0));
    const pushed = new Date(Date.UTC(2026, index % 5, (index % 26) + 1, 12, 30, 0));

    return {
      name: nameForRepo,
      description:
        repoNumber === DEFAULT_ORDINAL
          ? "A noice embeddable GitHub profile dashboard."
          : `Small polished experiment number ${repoNumber}.`,
      html_url: `https://github.com/${user}/${nameForRepo}`,
      language: languages[index % languages.length],
      stargazers_count: repoNumber === DEFAULT_ORDINAL ? 69 : (index * 7) % 43,
      forks_count: (index * 3) % 11,
      open_issues_count: index % 9 === 0 ? 1 : 0,
      created_at: created.toISOString(),
      pushed_at: pushed.toISOString(),
      archived: false,
      fork: false
    };
  });

  return buildStats({
    user: {
      login: user,
      name,
      html_url: `https://github.com/${user}`,
      public_repos: repos.length,
      bio: "Building small things with unreasonable polish."
    },
    repos
  });
}

export function renderSvg(stats, options = {}) {
  const width = Number(options.width || 960);
  const height = Number(options.height || 420);
  const user = stats.user || {};
  const niceRepo = stats.niceRepo || makePlaceholderRepo(DEFAULT_REPO);
  const languages = (stats.languages || []).slice(0, 4);
  const constellation = (stats.constellation || []).slice(0, 30);
  const generated = formatDate(stats.generatedAt);
  const displayName = truncate(user.name || user.login || "GitHub maker", 26);
  const login = truncate(user.login || DEFAULT_USER, 22);
  const niceName = truncate(niceRepo.name || DEFAULT_REPO, 28);
  const niceDescription = truncate(niceRepo.description || "A noice little dashboard for the profile.", 58);
  const starText = formatNumber(stats.totals?.stars || 0);
  const forkText = formatNumber(stats.totals?.forks || 0);
  const repoText = formatNumber(stats.totals?.repos || 0);
  const activeText = formatNumber(stats.totals?.activeThisYear || 0);
  const title = `${displayName}'s Noiceboard`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">Animated GitHub profile card highlighting repo number ${escapeXml(String(niceRepo.ordinal || DEFAULT_ORDINAL))}: ${escapeXml(niceName)}.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#06110c"/>
      <stop offset="0.48" stop-color="#102018"/>
      <stop offset="1" stop-color="#251513"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2de38c"/>
      <stop offset="0.55" stop-color="#f6c945"/>
      <stop offset="1" stop-color="#ff6b4a"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#2de38c" stop-opacity="0.36"/>
      <stop offset="0.55" stop-color="#2de38c" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#2de38c" stop-opacity="0"/>
    </radialGradient>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <style>
      .label { fill: #9fbea9; font: 700 12px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0; }
      .tiny { fill: #9fbea9; font: 500 11px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0; }
      .title { fill: #f2fff7; font: 800 38px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0; }
      .subtitle { fill: #d7fbe8; font: 600 17px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0; }
      .metric { fill: #f8fff9; font: 800 24px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0; }
      .metric-label { fill: #8cad98; font: 600 11px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0; }
      .repo { fill: #f8fff9; font: 750 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0; }
      .muted { fill: #a9c9b4; font: 500 12px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0; }
      .ring { animation: ring 9s linear infinite; transform-origin: 692px 206px; }
      .float { animation: float 5s ease-in-out infinite; }
      .pulse { animation: pulse 2.8s ease-in-out infinite; }
      .draw { stroke-dasharray: 6 12; animation: dash 13s linear infinite; }
      @keyframes ring { to { transform: rotate(360deg); } }
      @keyframes dash { to { stroke-dashoffset: -140; } }
      @keyframes pulse { 0%, 100% { opacity: .56; } 50% { opacity: 1; } }
      @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
    </style>
  </defs>

  <rect width="${width}" height="${height}" rx="0" fill="url(#bg)"/>
  <path d="M0 342 C154 296 244 404 390 344 C520 291 615 284 754 330 C846 361 896 328 960 303 L960 420 L0 420 Z" fill="#10281e" opacity="0.78"/>
  <path d="M0 363 C128 326 242 382 362 360 C493 336 581 292 738 350 C845 390 902 354 960 335 L960 420 L0 420 Z" fill="#3b1f17" opacity="0.34"/>
  <rect x="22" y="22" width="916" height="376" rx="8" fill="#07130e" opacity="0.72" stroke="#244634"/>
  <rect x="34" y="34" width="892" height="352" rx="8" fill="none" stroke="#2de38c" opacity="0.16"/>

  <g transform="translate(52 58)">
    <text class="label" x="0" y="0">NOICEBOARD / ${escapeXml(login)}</text>
    <text class="title" x="0" y="52">${escapeXml(displayName)}</text>
    <text class="subtitle" x="0" y="86">Repo #${escapeXml(String(niceRepo.ordinal || DEFAULT_ORDINAL))} went noice: ${escapeXml(niceName)}</text>
    <text class="muted" x="0" y="112">${escapeXml(niceDescription)}</text>

    <g transform="translate(0 158)">
      ${metricBlock(0, repoText, "public repos")}
      ${metricBlock(112, starText, "stars")}
      ${metricBlock(224, forkText, "forks")}
      ${metricBlock(336, activeText, "active in 2026")}
    </g>

    <g transform="translate(0 258)">
      <text class="label" x="0" y="0">LANGUAGE SIGNAL</text>
      ${languageBars(languages)}
    </g>
  </g>

  <g transform="translate(568 42)">
    <rect x="0" y="0" width="326" height="322" rx="8" fill="#08160f" opacity="0.82" stroke="#315642"/>
    <circle cx="164" cy="164" r="126" fill="url(#halo)" class="pulse"/>
    <circle cx="164" cy="164" r="114" fill="none" stroke="#34523f" stroke-width="1"/>
    <circle cx="164" cy="164" r="82" fill="none" stroke="#f6c945" stroke-opacity="0.28" stroke-width="1" class="ring"/>
    <circle cx="164" cy="164" r="46" fill="none" stroke="#ff6b4a" stroke-opacity="0.28" stroke-width="1" class="ring"/>
    <line x1="50" y1="164" x2="278" y2="164" stroke="#315642" stroke-opacity="0.55"/>
    <line x1="164" y1="50" x2="164" y2="278" stroke="#315642" stroke-opacity="0.55"/>
    ${constellationLines(constellation)}
    ${constellationDots(constellation)}
    <g class="float">
      <circle cx="164" cy="164" r="39" fill="#0e261b" stroke="url(#accent)" stroke-width="2" filter="url(#softGlow)"/>
      <text x="164" y="155" fill="#f8fff9" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="28" font-weight="900" letter-spacing="0">69</text>
      <text x="164" y="181" fill="#d7fbe8" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="11" font-weight="800" letter-spacing="0">NOICE</text>
    </g>
  </g>

  <g transform="translate(568 384)">
    <text class="tiny" x="0" y="0">Generated ${escapeXml(generated)}.</text>
    <text class="tiny" x="326" y="0" text-anchor="end">Open the repo for the full board.</text>
  </g>

</svg>`;
}

export function renderProfileSnippet(username = DEFAULT_USER, repoName = DEFAULT_REPO) {
  const raw = `https://raw.githubusercontent.com/${username}/${repoName}/main/data/noiceboard.svg`;
  const pages = `https://${username}.github.io/${repoName}/`;

  return `<div align="center">
  <a href="${pages}">
    <img src="${raw}" width="960" alt="Noiceboard GitHub profile dashboard for ${username}" />
  </a>
</div>`;
}

function normalizeRepo(repo) {
  return {
    name: repo.name || "untitled-repo",
    description: repo.description || "",
    url: repo.html_url || repo.url || "",
    language: repo.language || "Other",
    stars: Number(repo.stargazers_count ?? repo.stars ?? 0),
    forks: Number(repo.forks_count ?? repo.forks ?? 0),
    openIssues: Number(repo.open_issues_count ?? repo.openIssues ?? 0),
    createdAt: repo.created_at || repo.createdAt || new Date(0).toISOString(),
    pushedAt: repo.pushed_at || repo.pushedAt || repo.updated_at || repo.updatedAt || new Date(0).toISOString(),
    archived: Boolean(repo.archived),
    fork: Boolean(repo.fork)
  };
}

function compareCreated(a, b) {
  const dateDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  return dateDiff || a.name.localeCompare(b.name);
}

function makePlaceholderRepo(name) {
  return {
    name,
    description: "Waiting for the noice launch.",
    url: "",
    language: "JavaScript",
    stars: 0,
    forks: 0,
    openIssues: 0,
    createdAt: new Date().toISOString(),
    pushedAt: new Date().toISOString(),
    archived: false,
    fork: false
  };
}

function summarizeLanguages(repos) {
  const counts = new Map();
  for (const repo of repos) {
    const language = repo.language || "Other";
    counts.set(language, (counts.get(language) || 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((acc, count) => acc + count, 0) || 1;

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count], index) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
      color: LANGUAGE_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
    }));
}

function topRepos(repos) {
  return [...repos]
    .filter((repo) => !repo.archived)
    .sort((a, b) => b.stars - a.stars || b.forks - a.forks || new Date(b.pushedAt) - new Date(a.pushedAt))
    .slice(0, 6);
}

function freshestRepos(repos) {
  return [...repos].sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt)).slice(0, 6);
}

function buildCadence(repos) {
  const sorted = [...repos].sort(compareCreated);
  return {
    firstRepo: sorted[0]?.name || "",
    latestRepo: sorted.at(-1)?.name || "",
    oldestCreatedAt: sorted[0]?.createdAt || "",
    latestCreatedAt: sorted.at(-1)?.createdAt || ""
  };
}

function createConstellation(repos) {
  const picked = [...repos]
    .sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name))
    .slice(0, 28);

  return picked.map((repo, index) => {
    const seed = hashString(repo.name);
    const angle = (index / Math.max(1, picked.length)) * Math.PI * 2 + ((seed % 37) / 100);
    const radius = 48 + (seed % 83);
    const x = 164 + Math.cos(angle) * radius;
    const y = 164 + Math.sin(angle) * (radius * 0.78);

    return {
      name: repo.name,
      x: clamp(Math.round(x), 25, 303),
      y: clamp(Math.round(y), 32, 294),
      r: clamp(2 + Math.round(Math.log2(repo.stars + 2)), 2, 7),
      color: LANGUAGE_COLORS[repo.language] || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      opacity: repo.name === DEFAULT_REPO ? 1 : 0.72
    };
  });
}

function constellationDots(points) {
  return points
    .map(
      (point, index) =>
        `<circle cx="${point.x}" cy="${point.y}" r="${point.r}" fill="${point.color}" opacity="${point.opacity}" class="${index % 3 === 0 ? "pulse" : ""}"/>`
    )
    .join("\n    ");
}

function constellationLines(points) {
  return points
    .slice(1)
    .map((point, index) => {
      const previous = points[index];
      return `<line x1="${previous.x}" y1="${previous.y}" x2="${point.x}" y2="${point.y}" stroke="#5c7e68" stroke-opacity="0.24" stroke-width="1" class="draw"/>`;
    })
    .join("\n    ");
}

function languageBars(languages) {
  if (languages.length === 0) {
    return `<text class="muted" x="0" y="28">No public language data yet.</text>`;
  }

  return languages
    .map((language, index) => {
      const y = 24 + index * 23;
      const width = Math.max(18, Math.round(language.percentage * 2.34));
      return `<g transform="translate(0 ${y})">
        <text class="muted" x="0" y="0">${escapeXml(truncate(language.name, 16))}</text>
        <rect x="118" y="-10" width="236" height="8" rx="4" fill="#1a3326"/>
        <rect x="118" y="-10" width="${width}" height="8" rx="4" fill="${language.color}"/>
        <text class="tiny" x="366" y="0">${language.percentage}%</text>
      </g>`;
    })
    .join("\n      ");
}

function metricBlock(x, value, label) {
  return `<g transform="translate(${x} 0)">
    <text class="metric" x="0" y="0">${escapeXml(String(value))}</text>
    <text class="metric-label" x="0" y="22">${escapeXml(label)}</text>
  </g>`;
}

function sum(repos, key) {
  return repos.reduce((acc, repo) => acc + Number(repo[key] || 0), 0);
}

function isThisYear(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getUTCFullYear() === 2026;
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en", { notation: Number(value) >= 10000 ? "compact" : "standard" }).format(Number(value) || 0);
}

function formatDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "just now";
  }
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

function truncate(value, max) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
