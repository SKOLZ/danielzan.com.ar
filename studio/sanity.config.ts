import { defineConfig } from "sanity";
import { structureTool, type StructureResolver } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import { schemaTypes } from "./schemaTypes";

const ORDERABLE_TYPES = ["team", "sponsor", "song"];

const structure: StructureResolver = (S, context) =>
  S.list()
    .title("Contenido")
    .items([
      orderableDocumentListDeskItem({ type: "team", title: "Equipo", S, context }),
      orderableDocumentListDeskItem({ type: "sponsor", title: "Auspiciantes", S, context }),
      orderableDocumentListDeskItem({ type: "song", title: "Canciones", S, context }),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => !ORDERABLE_TYPES.includes(item.getId())
      ),
    ]);

export default defineConfig({
  name: "default",
  title: "Danielzan Studio",
  projectId: "6iq5dy0j",
  dataset: "production",
  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
});