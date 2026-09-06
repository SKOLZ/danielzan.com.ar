import { defineType, defineField } from "sanity";
import { extractYouTubeId } from "../../lib/youtube";

export const video = defineType({
  name: "video",
  title: "Video",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "youtubeUrl",
      title: "URL de YouTube",
      type: "string",
      description:
        "Pegá el enlace del video: https://www.youtube.com/watch?v=…, https://youtu.be/…, /embed/…, /shorts/… o /live/…",
      validation: (rule) =>
        rule.required().custom((value) => {
          if (typeof value !== "string" || !value.trim()) return true;
          return extractYouTubeId(value)
            ? true
            : "Ingresá una URL de YouTube válida (youtube.com/watch, youtu.be, /embed, /shorts o /live).";
        }),
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
      subtitle: "category",
    },
  },
});
