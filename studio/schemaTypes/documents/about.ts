import { defineType, defineField } from "sanity";

export const about = defineType({
  name: "about",
  title: "Sobre mí",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Cuerpo",
      type: "blockContent",
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
  },
});
