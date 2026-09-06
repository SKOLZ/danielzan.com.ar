import { defineConfig } from "sanity";
import {
  structureTool,
  type StructureBuilder,
  type StructureResolver,
  type StructureResolverContext,
} from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import { esESLocale } from "@sanity/locale-es-es";
import { schemaTypes } from "./schemaTypes";
import { DocumentTable } from "./components/DocumentTable";

const ORDERABLE_TYPES = ["team", "sponsor", "song"];

const TABLE_TYPES: Record<string, string> = {
  raceResult: "Resultados",
  post: "Noticias",
  season: "Temporadas",
  video: "Videos",
  photoGallery: "Galerías",
};

function tableItems(S: StructureBuilder, context: StructureResolverContext) {
  return Object.entries(TABLE_TYPES).map(([type, title]) => {
    const icon = context.schema.get(type)?.icon;
    return S.listItem()
      .id(`table-${type}`)
      .title(title)
      .icon(icon)
      .child(S.component(DocumentTable).id(type).title(title).options({ type }));
  });
}

const structure: StructureResolver = (S, context) =>
  S.list()
    .title("Contenido")
    .items([
      orderableDocumentListDeskItem({ type: "team", title: "Equipo", S, context }),
      orderableDocumentListDeskItem({ type: "sponsor", title: "Auspiciantes", S, context }),
      orderableDocumentListDeskItem({ type: "song", title: "Canciones", S, context }),
      S.divider(),
      ...tableItems(S, context),
      ...S.documentTypeListItems().filter(
        (item) =>
          !ORDERABLE_TYPES.includes(item.getId() ?? "") &&
          !Object.keys(TABLE_TYPES).includes(item.getId() ?? "")
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
    esESLocale(),
  ],
  schema: {
    types: schemaTypes,
  },
});