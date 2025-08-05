
/**
 * @fileOverview A utility for parsing Sri Lankan National Identity Card (NIC) numbers.
 *
 * - parseNIC - A function that extracts birthdate and gender from an NIC number.
 */

interface ParseResult {
  birthday?: string;
  gender?: 'Male' | 'Female';
  error?: string;
  steps?: string[];
}

/**
 * Parses a Sri Lankan NIC number (both old and new formats) to extract
 * the holder's birthday and gender, providing a step-by-step breakdown.
 * @param nic The NIC number as a string.
 */
export function parseNIC(nic: string): ParseResult {
  const steps: string[] = [];
  let yearStr, dddStr, formatType;

  const cleanedNic = nic.trim().toUpperCase();

  // Step 1: Determine format and extract year and day-of-year string
  if (cleanedNic.length === 10 && cleanedNic.endsWith('V')) {
    formatType = 'Old (10-digit)';
    yearStr = '19' + cleanedNic.substring(0, 2);
    dddStr = cleanedNic.substring(2, 5);
  } else if (cleanedNic.length === 12 && /^\d+$/.test(cleanedNic)) {
    formatType = 'New (12-digit)';
    yearStr = cleanedNic.substring(0, 4);
    dddStr = cleanedNic.substring(4, 7);
  } else {
    return { error: 'Invalid NIC format.', steps: ['NIC format is not valid.'] };
  }
  steps.push(`NIC format detected: ${formatType}.`);
  steps.push(`Extracted Year: ${yearStr}`);
  steps.push(`Extracted Day Number: ${dddStr}`);

  const year = parseInt(yearStr, 10);
  let dayOfYear = parseInt(dddStr, 10);

  if (isNaN(year) || isNaN(dayOfYear)) {
    return { error: 'NIC contains non-numeric characters.', steps };
  }

  // Step 2: Determine gender and adjust day number if female
  const gender = dayOfYear > 500 ? 'Female' : 'Male';
  if (gender === 'Female') {
    dayOfYear -= 500;
  }
  steps.push(`Gender: ${gender} (since ${dddStr} ${gender === 'Female' ? '>' : '<='} 500). Adjusted day: ${dayOfYear}.`);
  steps.push(`Day number for calculation: ${dayOfYear}`);

  // Step 3: Check if the year is a leap year
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

  // Step 4: Validate day of year
  const maxDays = isLeapYear ? 366 : 365;
  if (dayOfYear < 1 || dayOfYear > maxDays) {
    const errorMsg = `Invalid day number for year ${year}.`;
    steps.push(`Error: ${errorMsg}`);
    return { error: errorMsg, steps, gender };
  }

  // Step 5: Construct date from year and adjusted dayOfYear
  const date = new Date(year, 0); // Start with Jan 1st of the year
  date.setDate(date.getDate() + dayOfYear - 1); // Add days (Date is 1-based, so subtract 1)

  const birthday = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  const formattedDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  steps.push(`Calculated Date: ${formattedDate}.`);

  return { birthday, gender, steps };
}
