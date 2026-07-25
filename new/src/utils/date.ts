// function that formats a date to DD.MM.YYYY format

export const formatDate = (unformattedDate: string) => {
  const date = new Date(unformattedDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};
