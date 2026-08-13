import { defineType, defineField } from "sanity";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";

export const sponsor = defineType({
  name: "sponsor",
  title: "Auspiciante",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: "sponsor" }),
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
