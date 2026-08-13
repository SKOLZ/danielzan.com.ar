import { defineType, defineField, defineArrayMember } from "sanity";

export const photoGallery = defineType({
  name: "photoGallery",
  title: "Galería",
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
      options: { source: "title" },
    }),
    defineField({
      name: "photos",
      title: "Fotos",
      type: "array",
      of: [
        defineArrayMember({
          name: "photo",
          title: "Foto",
          type: "object",
          fields: [
            defineField({
              name: "image",
              title: "Imagen",
              type: "image",
              options: { hotspot: true },
            }),
            defineField({
              name: "caption",
              title: "Leyenda",
              type: "string",
            }),
          ],
          preview: {
            select: {
              media: "image",
              title: "caption",
            },
          },
        }),
      ],
    }),
    defineField({
      name: "category",
      title: "Categoría",
      type: "string",
      options: {
        list: ["Formula 4", "Sport Prototipo", "General"],
      },
      initialValue: "General",
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "photos.0.image",
    },
  },
});
