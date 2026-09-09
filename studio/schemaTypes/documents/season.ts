import { defineType, defineField } from "sanity";

export const season = defineType({
  name: "season",
  title: "Temporada",
  type: "document",
  fields: [
    defineField({
      name: "year",
      title: "Año",
      type: "number",
      validation: (rule) => rule.required().integer(),
    }),
    defineField({
      name: "finalPosition",
      title: "Posición final",
      type: "string",
      options: {
        list: [
          { title: "Campeón", value: "Campeón" },
          { title: "Subcampeón", value: "Subcampeón" },
          { title: "3°", value: "3°" },
          { title: "4°", value: "4°" },
          { title: "5°", value: "5°" },
        ],
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
      title: "year",
      subtitle: "finalPosition",
    },
    prepare({ title, subtitle }) {
      return { title: String(title ?? ""), subtitle: subtitle ?? "Posición no cargada" };
    },
  },
});
