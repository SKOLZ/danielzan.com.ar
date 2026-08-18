import { defineType, defineField, defineArrayMember } from "sanity";
import { GalleryPhotosInput } from "../../components/GalleryPhotosInput";

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
      name: "photos",
      title: "Fotos",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
        }),
      ],
      components: {
        input: GalleryPhotosInput,
      },
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
      media: "photos.0",
    },
  },
});
