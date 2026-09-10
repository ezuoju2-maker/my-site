const isGitHubPages = import.meta.env.GITHUB_PAGES === "true";

export const API_BASE_URL = isGitHubPages
  ? "https://my-site-n7j.pages.dev"
  : "";
