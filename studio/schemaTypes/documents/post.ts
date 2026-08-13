import { defineType, defineField } from "sanity";

export const post = defineType({
  name: "post",
  title: "Entrada",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "publishedAt",
      title: "Fecha de publicación",
      type: "datetime",
    }),
    defineField({
      name: "body",
      title: "Cuerpo",
      type: "blockContent",
    }),
    defineField({
      name: "excerpt",
      title: "Extracto",
      type: "text",
    }),
    defineField({
      name: "mainImage",
      title: "Imagen principal",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Texto alternativo",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "year",
      title: "Año",
      type: "number",
    }),
    defineField({
      name: "category",
      title: "Categoría",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "author",
      title: "Autor",
      type: "reference",
      to: [{ type: "author" }],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "year",
      media: "mainImage",
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title ?? "Sin título",
        subtitle: subtitle ? String(subtitle) : "",
        media,
      };
    },
  },
});
