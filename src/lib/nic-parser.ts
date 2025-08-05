
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

  // Step 1: Determine format and extract year and day-of-year string
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

  // Step 2: Determine gender and adjust day number if female
  const gender = dayOfYear > 500 ? 'Female' : 'Male';
  if (gender === 'Female') {
    dayOfYear -= 500;
  }
  
  // Step 3: Check if the year is a leap year
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

  // Step 4: Validate day of year
  const maxDays = isLeapYear ? 366 : 365;
  if (dayOfYear < 1 || dayOfYear > maxDays) {
    return { error: `Invalid day number for year ${year}.` };
  }

  // Step 5: Adjust for non-leap years after Feb 28th
  if (!isLeapYear && dayOfYear > 59) {
    dayOfYear--;
  }

  // Step 6: Create date from year and adjusted dayOfYear
  const date = new Date(year, 0); // Start with Jan 1st of the year
  date.setDate(dayOfYear);       // Add the calculated days. This correctly handles all months and leap years.

  const birthday = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD

  return { birthday, gender };
}
