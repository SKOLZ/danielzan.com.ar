import { defineField, defineType } from "sanity";

export const postType = defineType({
  name: "post",
  type: "document",
  title: "Notas",
  orderings: [
    {
      name: "firstPublishedDesc",
      title: "Fecha de publicación (descendente)",
      by: [
        {
          field: "firstPublished",
          direction: "desc",
        },
      ],
    },
    {
      name: "firstPublishedAsc",
      title: "Fecha de publicación (ascendente)",
      by: [
        {
          field: "firstPublished",
          direction: "asc",
        },
      ],
    },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Título",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      validation: (Rule) => Rule.required(),
      options: {
        source: "title",
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
    }),
    defineField({
      name: "firstPublished",
      type: "datetime",
      title: "Fecha de publicación inicial",
    }),
    defineField({
      name: "body",
      validation: (Rule) => Rule.required(),
      type: "blockContent",
      title: "Contenido",
    }),
  ],

  preview: {
    select: {
      title: "title",
      firstPublished: "firstPublished",
    },
    prepare(selection) {
      const { title, firstPublished } = selection;
      return {
        title: title,
        subtitle: new Date(firstPublished).toLocaleDateString("es-AR"),
      };
    },
  },
});
