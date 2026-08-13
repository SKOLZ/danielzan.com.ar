import { defineType, defineField } from "sanity";

export const raceResult = defineType({
  name: "raceResult",
  title: "Resultado",
  type: "document",
  fields: [
    defineField({
      name: "date",
      title: "Fecha",
      type: "date",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "position",
      title: "Posición",
      type: "string",
      options: {
        list: [
          { title: "1°", value: "1°" },
          { title: "2°", value: "2°" },
          { title: "3°", value: "3°" },
          { title: "4°", value: "4°" },
          { title: "5°", value: "5°" },
          { title: "6°", value: "6°" },
          { title: "7°", value: "7°" },
          { title: "8°", value: "8°" },
          { title: "9°", value: "9°" },
          { title: "10°", value: "10°" },
          { title: "11°", value: "11°" },
          { title: "12°", value: "12°" },
          { title: "Abandono", value: "Abandono" },
          { title: "Excluido", value: "Excluido" },
          { title: "Ausente", value: "Ausente" },
          { title: "No clasificó", value: "No clasificó" },
        ],
      },
    }),
    defineField({
      name: "category",
      title: "Categoría",
      type: "string",
    }),
  ],
  preview: {
    select: {
      title: "position",
      subtitle: "date",
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? "Resultado",
        subtitle: subtitle ? subtitle.split("-").reverse().join(".") : "Sin fecha",
      };
    },
  },
});
