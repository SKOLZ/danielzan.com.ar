import { defineConfig } from "astro/config";
import sanity from "@sanity/astro";

export default defineConfig({
  integrations: [
    sanity({
      projectId: "6iq5dy0j",
      dataset: "production",
      useCdn: false,
    }),
  ],
  i18n: {
    defaultLocale: "es",
    locales: ["es"],
  },
  vite: {
    server: {
      allowedHosts: ["danielzan.com.ar", "localhost"],
    },
  },
});
