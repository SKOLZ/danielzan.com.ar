import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schema } from "./src/sanity/schemaTypes";
import { customPublishAction } from "./src/sanity/lib/customPublishAction";
import { esESLocale } from "@sanity/locale-es-es";

export default defineConfig({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  plugins: [structureTool(), esESLocale()],
  schema,
  document: {
    actions: (prev, context) =>
      prev.map((originalAction) =>
        originalAction.action === "publish" && context.schemaType === "post" ? customPublishAction(originalAction) : originalAction
      ),
  },
});
