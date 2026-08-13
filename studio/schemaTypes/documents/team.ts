import { defineType, defineField } from "sanity";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";

export const team = defineType({
  name: "team",
  title: "Equipo",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: "team" }),
    defineField({
      name: "name",
      title: "Nombre",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
    }),
    defineField({
      name: "url",
      title: "Sitio web",
      type: "url",
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "logo",
    },
  },
});
