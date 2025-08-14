

interface Location {
  id: string;
  name_en: string;
}

const QA_API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';

// Location APIs
export const getAllCities = async (): Promise<Location[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/cities`);
    if (!response.ok) {
        throw new Error('Failed to fetch cities');
    }
    const data = await response.json();
    // The API returns an object, so we convert it to an array
    return Object.values(data);
};

export const getAllDistricts = async (): Promise<Location[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/districts`);
    if (!response.ok) {
        throw new Error('Failed to fetch districts');
    }
     const data = await response.json();
    // The API returns an object, so we convert it to an array
    return Object.values(data);
};
