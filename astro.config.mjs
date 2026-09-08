import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  markdown: {
    processor: unified(),
  },

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});