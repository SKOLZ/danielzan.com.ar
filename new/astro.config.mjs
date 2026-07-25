// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import sanity from "@sanity/astro";
import react from "@astrojs/react";
import { loadEnv } from "vite";

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
  process.env.NODE_ENV,
  process.cwd(),
  "",
);

// https://astro.build/config
export default defineConfig({
  image: {
    domains: ["cdn.sanity.io"],
  },
  site: "https://danielzan.com.ar",
  integrations: [
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET,
      useCdn: false,
      studioBasePath: "/studio",
    }),
    react(),
  ],
  //add google as font provider
  fonts: [{
    provider: fontProviders.fontshare(),
    name: "Bebas Neue",
    cssVariable: "--font-bebas-neue",
    fallbacks: ["sans-serif"],
    weights: ["400"]
  }, {
    provider: fontProviders.fontshare(),
    name: "Zodiak",
    cssVariable: "--font-zodiak",
    fallbacks: ["serif"],
    weights: ["300","400"]
  }]
});
