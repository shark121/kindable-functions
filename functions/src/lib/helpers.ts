export function isoToYYYYMMDD(isoDateString :string) {
    try {
      const date = new Date(isoDateString);
      if (isNaN(date.getTime())) {
        return "Invalid ISO 8601 date string.";
      }
  
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, '0');
  
      return `${year}-${month}-${day}`;
    } catch (error) {
      return "Invalid ISO 8601 date string.";
    }
  }
  