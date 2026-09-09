import { defineType, defineField } from "sanity";

export const post = defineType({
  name: "post",
  title: "Noticia",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Fecha de publicación",
      type: "datetime",
      description: "Se establece automáticamente al publicar si se deja vacío",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "body",
      title: "Cuerpo",
      type: "blockContent",
    }),
    defineField({
      name: "category",
      title: "Categoría",
      type: "reference",
      to: [{ type: "category" }],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "publishedAt",
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? "Sin título",
        subtitle: subtitle ? new Date(subtitle).toLocaleDateString("es-AR") : "",
      };
    },
  },
});
