import assert from "node:assert/strict";
import test from "node:test";
import { buildDemoStats, buildStats, renderProfileSnippet, renderSvg } from "../src/noiceboard.mjs";

test("demo stats make noiceboard the 69th repo", () => {
  const stats = buildDemoStats({ user: "vaishakh3" });

  assert.equal(stats.niceRepo.name, "noiceboard");
  assert.equal(stats.niceRepo.ordinal, 69);
  assert.equal(stats.totals.repos, 69);
});

test("rendered SVG escapes unsafe profile text", () => {
  const stats = buildStats({
    user: { login: "maker", name: "<script>alert(1)</script>" },
    repos: [
      {
        name: "noiceboard",
        description: "repo & readme",
        html_url: "https://github.com/maker/noiceboard",
        language: "JavaScript",
        stargazers_count: 1,
        forks_count: 0,
        created_at: "2026-01-01T00:00:00Z",
        pushed_at: "2026-01-02T00:00:00Z"
      }
    ]
  });
  const svg = renderSvg(stats);

  assert.doesNotMatch(svg, /<script>alert/);
  assert.match(svg, /&lt;script&gt;alert/);
  assert.match(svg, /repo &amp; readme/);
});

test("profile snippet points to the raw SVG and GitHub Pages board", () => {
  const snippet = renderProfileSnippet("vaishakh3", "noiceboard");

  assert.match(snippet, /raw\.githubusercontent\.com\/vaishakh3\/noiceboard\/main\/data\/noiceboard\.svg/);
  assert.match(snippet, /vaishakh3\.github\.io\/noiceboard/);
});
