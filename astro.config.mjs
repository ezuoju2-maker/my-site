import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  ...(isGitHubPages
    ? {
        site: "https://ezuoju2-maker.github.io",
        base: "/my-site",
      }
    : {}),
  markdown: {
    processor: unified(),
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
