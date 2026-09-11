// Backup health check.
// Runs in GitHub Actions (workflow: backup-health.yml).
//
// Behavior:
//   - Find latest d1-backup-* release
//   - If age > 48h OR no backup ever: open GitHub Issue (label: backup-health)
//   - If fresh: close any open alerts
//
// All complex logic in JS, YAML only has 30 lines.

const REPO = process.env.REPO;
const TOKEN = process.env.GH_TOKEN;
const THRESHOLD_HOURS = 48;
const LABEL = "backup-health";

if (!REPO || !TOKEN) {
  console.error("REPO and GH_TOKEN are required");
  process.exit(1);
}

async function api(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// --- 1. Find latest d1-backup-* release ---
const releases = (await api(`/repos/${REPO}/releases?per_page=100`)) || [];
const backups = releases.filter(
  (r) => typeof r.tag_name === "string" && r.tag_name.startsWith("d1-backup-"),
);
const latest = backups[0] || null;

let stale = false;
let reason = "fresh";
let hours = 0;
let latestTag = "(none)";

if (!latest) {
  stale = true;
  reason = "no-backup";
} else {
  latestTag = latest.tag_name;
  hours = Math.floor(
    (Date.now() - new Date(latest.published_at).getTime()) / 3600000,
  );
  if (hours > THRESHOLD_HOURS) {
    stale = true;
    reason = "too-old";
  }
}

console.log(
  `[check] latest=${latestTag} hours=${hours} stale=${stale} reason=${reason}`,
);

// --- 2. Find open alerts ---
const openIssues =
  (await api(`/repos/${REPO}/issues?labels=${LABEL}&state=open&per_page=10`)) ||
  [];

// --- 3. Fresh: close any open alerts ---
if (!stale) {
  for (const issue of openIssues) {
    await api(`/repos/${REPO}/issues/${issue.number}`, {
      method: "PATCH",
      body: JSON.stringify({
        state: "closed",
        state_reason: "completed",
      }),
    });
    console.log(`[close] issue #${issue.number}`);
  }
  process.exit(0);
}

// --- 4. Stale: skip if alert already open ---
if (openIssues.length > 0) {
  console.log(`[skip] alert already open (#${openIssues[0].number})`);
  process.exit(0);
}

// --- 5. Create alert ---
// Ensure label exists (ignore 422 if it already does)
try {
  await api(`/repos/${REPO}/labels`, {
    method: "POST",
    body: JSON.stringify({
      name: LABEL,
      color: "FBCA04",
      description: "Automated backup health alerts",
    }),
  });
} catch {
  // label likely exists
}

const title =
  reason === "no-backup"
    ? "[Backup] No D1 backup has ever been created"
    : `[Backup] D1 backup is stale (${hours}h)`;

const bodyLines = [
  "Automated backup health check.",
  "",
  `- **Reason**: \`${reason}\``,
  `- **Latest backup**: \`${latestTag}\``,
  `- **Age**: ${hours} hours (threshold: ${THRESHOLD_HOURS}h)`,
  "",
  "### Recovery",
  "",
  `1. Open https://github.com/${REPO}/actions/workflows/d1-backup-release.yml`,
  "2. Click **Run workflow**",
  "3. This issue will auto-close after the next successful backup.",
];

const created = await api(`/repos/${REPO}/issues`, {
  method: "POST",
  body: JSON.stringify({
    title,
    body: bodyLines.join("\n"),
    labels: [LABEL],
  }),
});

console.log(`[create] issue #${created.number}`);
