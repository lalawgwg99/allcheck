import { SystemData } from './storageService';

// JSONBin.io API Configuration
const BASE_URL = 'https://api.jsonbin.io/v3/b';

export interface CloudConfig {
  binId: string;
  apiKey: string;
  storeName: string;
}

// Encode config to a sharable string (Base64)
export const encodeCloudConfig = (config: CloudConfig): string => {
  const json = JSON.stringify(config);
  return btoa(encodeURIComponent(json));
};

// Decode sharable string to config
export const decodeCloudConfig = (code: string): CloudConfig | null => {
  try {
    const json = decodeURIComponent(atob(code));
    return JSON.parse(json);
  } catch (e) {
    console.error("Invalid Store Key");
    return null;
  }
};

// Create a new Bin (Store)
export const createCloudStore = async (apiKey: string, data: SystemData, storeName: string): Promise<CloudConfig | null> => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
        'X-Bin-Name': storeName
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to create store');

    const result = await response.json();
    return {
      binId: result.metadata.id,
      apiKey: apiKey,
      storeName: storeName
    };
  } catch (error) {
    console.error("Cloud Create Error:", error);
    return null;
  }
};

// Read Data
export const fetchCloudData = async (config: CloudConfig): Promise<SystemData | null> => {
  try {
    const response = await fetch(`${BASE_URL}/${config.binId}`, {
      method: 'GET',
      headers: {
        'X-Master-Key': config.apiKey
      }
    });

    if (!response.ok) throw new Error('Failed to fetch data');

    const result = await response.json();
    return result.record as SystemData;
  } catch (error) {
    console.error("Cloud Fetch Error:", error);
    return null;
  }
};

// Update Data
export const updateCloudData = async (config: CloudConfig, data: SystemData): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/${config.binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': config.apiKey
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to update data');
    return true;
  } catch (error) {
    console.error("Cloud Update Error:", error);
    return false;
  }
};