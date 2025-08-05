/**
 * @fileOverview A utility for parsing Sri Lankan National Identity Card (NIC) numbers.
 *
 * - parseNIC - A function that extracts birthdate and gender from an NIC number.
 */

// Helper function to check for leap years.
// This will be kept internal to the module.
function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

interface ParseResult {
  birthday?: string;
  gender?: 'Male' | 'Female';
  error?: string;
  dayOfYear?: number;
}

/**
 * Parses a Sri Lankan NIC number (both old and new formats) to extract
 * the holder's birthday and gender.
 * @param nic The NIC number as a string.
 */
export function parseNIC(nic: string): ParseResult {
  let yearStr, dddStr;

  if (nic.length === 10) {
    // Old format: e.g. "98025xxxxV"
    yearStr = '19' + nic.slice(0, 2);
    dddStr = nic.slice(2, 5);
  } else if (nic.length === 12) {
    // New format: e.g. "199880201032"
    yearStr = nic.slice(0, 4);
    dddStr = nic.slice(4, 7);
  } else {
    return { error: 'Invalid NIC length' };
  }

  const year = parseInt(yearStr, 10);
  let dayOfYear = parseInt(dddStr, 10);
  const gender = dayOfYear > 500 ? 'Female' : 'Male';
  if (dayOfYear > 500) dayOfYear -= 500;

  const leap = isLeap(year);
  const maxDay = leap ? 366 : 365;
  if (dayOfYear < 1 || dayOfYear > maxDay) {
    return { error: `Invalid day number for year ${year}` };
  }
  
  // Handle the specific user request: if not a leap year, day 60 should be Feb 28.
  if (!leap && dayOfYear === 60) {
      return { birthday: `${year}-02-28`, gender, dayOfYear };
  }

  // Manually calculate month and day to avoid Date constructor issues
  const daysInMonth = [
    31, leap ? 29 : 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31
  ];

  let month = 0;
  let dayOfMonth = dayOfYear;
  
  while (month < 12 && dayOfMonth > daysInMonth[month]) {
    dayOfMonth -= daysInMonth[month];
    month++;
  }

  month += 1; // Adjust month to be 1-based (January is 1)
  
  const monthStr = month < 10 ? '0' + month : String(month);
  const dayStr = dayOfMonth < 10 ? '0' + dayOfMonth : String(dayOfMonth);
  
  const birthday = `${year}-${monthStr}-${dayStr}`;

  return { birthday, gender, dayOfYear };
}
