export const positionClass = (pos: string) => {
  const p = pos.toLowerCase();
  if (p.includes("subcampeón")) return "silver";
  if (p.includes("campeón") || p.includes("1")) return "gold";
  if (p.includes("3")) return "bronze";
  return "";
};
