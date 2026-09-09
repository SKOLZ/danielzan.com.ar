import { defineType, defineField } from "sanity";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";

export const song = defineType({
  name: "song",
  title: "Canción",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: "song" }),
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "audio",
      title: "Archivo de audio",
      type: "file",
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
  },
});
