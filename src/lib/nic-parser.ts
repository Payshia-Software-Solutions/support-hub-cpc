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
  let originalDayOfYear = dayOfYear;

  if (isNaN(year) || isNaN(dayOfYear)) {
    return { error: 'NIC contains non-numeric characters.', steps };
  }

  // Step 2: Determine gender and adjust day number if female
  const gender = dayOfYear > 500 ? 'Female' : 'Male';
  if (gender === 'Female') {
    dayOfYear -= 500;
  }
  steps.push(`Gender: ${gender} (since ${originalDayOfYear} ${gender === 'Female' ? '>' : '<='} 500).`);
  
  // Helper to check for leap years
  const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const leap = isLeapYear(year);
  steps.push(`Year ${year} is ${leap ? 'a leap year' : 'not a leap year'}.`);

  // Step 3: Adjust day number for non-leap years after day 59
  if (!leap && dayOfYear > 59) {
    steps.push(`Since it's not a leap year, adjusting day number from ${dayOfYear} to ${dayOfYear - 1}.`);
    dayOfYear--;
  }

  // Step 4: Validate day of year
  const maxDays = leap ? 366 : 365;
  if (dayOfYear < 1 || dayOfYear > maxDays) {
    const errorMsg = `Invalid day number for year ${year}.`;
    steps.push(`Error: ${errorMsg}`);
    return { error: errorMsg, steps, gender };
  }

  // Step 5: Construct date from year and adjusted dayOfYear
  const date = new Date(year, 0, dayOfYear); 
  
  // CORRECTED: Manually build the YYYY-MM-DD string to avoid timezone issues with toISOString()
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const dd = String(date.getDate()).padStart(2, '0');
  const birthday = `${yyyy}-${mm}-${dd}`;
  
  const formattedDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  steps.push(`Calculated Date: ${formattedDate}.`);

  return { birthday, gender, steps };
}
