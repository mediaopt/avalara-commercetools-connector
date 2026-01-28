// This file contains utility helper functions for the Avalara integration.

// getYearAgoDate returns the date string representing the date one year ago from today
// formatted in 'en-CA' locale (YYYY-MM-DD).

export const getYearAgoDate = (): string => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return new Intl.DateTimeFormat('en-CA').format(date);
};
