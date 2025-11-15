/**
 * Address formatting utilities for Grocery Share
 * Handles address truncation and formatting for different contexts and screen sizes
 */

export interface AddressComponents {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

/**
 * Format address for short display (cards, chips)
 * Returns: "Street, City, State" or similar compact format
 */
export const formatAddressShort = (
  displayName: string,
  addressDetails?: AddressComponents
): string => {
  if (!addressDetails) {
    // Fallback: truncate the display_name intelligently
    const parts = displayName.split(',').map(p => p.trim());
    
    if (parts.length <= 2) {
      return displayName;
    }
    
    // Take first part (street) and last 2 parts (city, state/country)
    const street = parts[0];
    const location = parts.slice(-2).join(', ');
    return `${street}, ${location}`;
  }

  // Use structured address details for better formatting
  const components: string[] = [];

  // Add street (road + house number)
  if (addressDetails.road) {
    const street = addressDetails.house_number 
      ? `${addressDetails.house_number} ${addressDetails.road}`
      : addressDetails.road;
    components.push(street);
  }

  // Add city/town
  const locality = addressDetails.city || addressDetails.town || addressDetails.village;
  if (locality) {
    components.push(locality);
  }

  // Add state
  if (addressDetails.state) {
    components.push(addressDetails.state);
  }

  // Add zipcode/postcode
  if (addressDetails.postcode) {
    components.push(addressDetails.postcode);
  }

  return components.length > 0 ? components.join(', ') : displayName;
};

/**
 * Format address for full display (detail pages, inputs)
 * Returns the complete address
 */
export const formatAddressFull = (displayName: string): string => {
  return displayName;
};

/**
 * Format address for mobile display (responsive truncation)
 * Applies ellipsis for very long addresses on small screens
 */
export const formatAddressMobile = (
  displayName: string,
  maxLength: number = 60
): string => {
  if (displayName.length <= maxLength) {
    return displayName;
  }

  // Try to truncate at a comma boundary
  const truncated = displayName.substring(0, maxLength);
  const lastComma = truncated.lastIndexOf(',');
  
  if (lastComma > maxLength / 2) {
    return truncated.substring(0, lastComma) + '...';
  }

  return truncated + '...';
};

/**
 * Extract city from address string
 */
export const extractCity = (displayName: string): string => {
  const parts = displayName.split(',').map(p => p.trim());
  // City is usually the second-to-last or third part
  if (parts.length >= 3) {
    return parts[parts.length - 3] || parts[parts.length - 2] || parts[0];
  }
  return parts[0];
};
