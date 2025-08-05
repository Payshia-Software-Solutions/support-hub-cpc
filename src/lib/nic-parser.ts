/**
 * @fileOverview A utility for parsing Sri Lankan National Identity Card (NIC) numbers.
 *
 * - parseNIC - A function that extracts birthdate and gender from an NIC number.
 */

interface ParseResult {
  birthday?: string;
  gender?: 'Male' | 'Female';
  error?: string;
}

/**
 * Parses a Sri Lankan NIC number (both old and new formats) to extract
 * the holder's birthday and gender.
 * @param nic The NIC number as a string.
 */
export function parseNIC(nic: string): ParseResult {
  let yearStr, dddStr;

  const cleanedNic = nic.trim().toUpperCase();

  // Determine format and extract year and day-of-year string
  if (cleanedNic.length === 10 && cleanedNic.endsWith('V')) {
    yearStr = '19' + cleanedNic.substring(0, 2);
    dddStr = cleanedNic.substring(2, 5);
  } else if (cleanedNic.length === 12 && /^\d+$/.test(cleanedNic)) {
    yearStr = cleanedNic.substring(0, 4);
    dddStr = cleanedNic.substring(4, 7);
  } else {
    return { error: 'Invalid NIC format.' };
  }

  const year = parseInt(yearStr, 10);
  let dayOfYear = parseInt(dddStr, 10);

  if (isNaN(year) || isNaN(dayOfYear)) {
    return { error: 'NIC contains non-numeric characters.' };
  }

  // Determine gender and adjust day number if female
  const gender = dayOfYear > 500 ? 'Female' : 'Male';
  if (gender === 'Female') {
    dayOfYear -= 500;
  }
  
  // Helper to check for leap years
  const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const leap = isLeapYear(year);

  // Adjust day number for non-leap years after Feb 28th (day 59)
  if (!leap && dayOfYear > 59) {
    dayOfYear--;
  }

  // Validate day of year
  const maxDays = leap ? 366 : 365;
  if (dayOfYear < 1 || dayOfYear > maxDays) {
    return { error: `Invalid day number for year ${year}.`, gender };
  }

  // Construct date from year and adjusted dayOfYear
  const date = new Date(year, 0, dayOfYear); 
  
  // Manually build the YYYY-MM-DD string to avoid timezone issues
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const dd = String(date.getDate()).padStart(2, '0');
  const birthday = `${yyyy}-${mm}-${dd}`;

  return { birthday, gender };
}
