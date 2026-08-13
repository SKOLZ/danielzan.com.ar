import { defineType, defineField } from "sanity";

export const author = defineType({
  name: "author",
  title: "Autor",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nombre",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
    }),
    defineField({
      name: "bio",
      title: "Biografía",
      type: "text",
    }),
    defineField({
      name: "image",
      title: "Imagen",
      type: "image",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "slug",
      media: "image",
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title ?? "Sin nombre",
        subtitle: subtitle?.current ?? "",
        media,
      };
    },
  },
});
