import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const isCloudflare = process.env.CLOUDFLARE_BUILD === "true";

const cloudflareAdapter = isCloudflare
  ? (await import("@astrojs/cloudflare")).default
  : undefined;

export default defineConfig({
  ...(isGitHubPages
    ? {
        site: "https://ezuoju2-maker.github.io",
        base: "/my-site",
        output: "static",
      }
    : isCloudflare
      ? {
          output: "server",
          adapter: cloudflareAdapter(),
        }
      : {
          output: "static",
        }),
  markdown: {
    processor: unified(),
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
