import { buildStats, DEFAULT_ORDINAL, DEFAULT_REPO, DEFAULT_USER } from "./noiceboard.mjs";

export async function fetchGitHubStats({
  user = DEFAULT_USER,
  token = "",
  repoOrdinal = DEFAULT_ORDINAL,
  targetRepoName = DEFAULT_REPO,
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("No fetch implementation is available.");
  }

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "noiceboard"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const profile = await requestJson(fetchImpl, `https://api.github.com/users/${encodeURIComponent(user)}`, headers);
  const repos = [];

  for (let page = 1; page <= 10; page += 1) {
    const pageRepos = await requestJson(
      fetchImpl,
      `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&page=${page}&sort=created&direction=asc&type=owner`,
      headers
    );
    repos.push(...pageRepos);
    if (!Array.isArray(pageRepos) || pageRepos.length < 100) {
      break;
    }
  }

  return buildStats({
    user: {
      login: profile.login,
      name: profile.name,
      avatarUrl: profile.avatar_url,
      htmlUrl: profile.html_url,
      bio: profile.bio,
      publicRepos: profile.public_repos
    },
    repos,
    repoOrdinal,
    targetRepoName
  });
}

async function requestJson(fetchImpl, url, headers) {
  const response = await fetchImpl(url, { headers });
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`GitHub API request failed (${response.status}) for ${url}: ${details.slice(0, 240)}`);
  }
  return response.json();
}
