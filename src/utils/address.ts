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
 * Returns: "Street, City, State, Zipcode" format
 * Filters out township, county, neighbourhood, and other unnecessary details
 */
export const formatAddressShort = (
  displayName: string,
  addressDetails?: AddressComponents
): string => {
  // Keywords to filter out (township, county, etc.)
  const filterKeywords = [
    'township',
    'county',
    'neighbourhood',
    'suburb',
    'borough',
    'district',
    'parish',
    'united states',
    'usa'
  ];

  if (!addressDetails) {
    // Fallback: parse display_name intelligently, filtering unwanted parts
    const parts = displayName.split(',').map(p => p.trim());
    
    if (parts.length <= 2) {
      return displayName;
    }
    
    // Filter out parts containing unwanted keywords
    const filteredParts = parts.filter(part => {
      const lowerPart = part.toLowerCase();
      return !filterKeywords.some(keyword => lowerPart.includes(keyword));
    });
    
    // Take up to first 4 meaningful parts (street, city, state, zipcode)
    return filteredParts.slice(0, 4).join(', ');
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

  // Add city/town (skip suburb, neighbourhood, county, township)
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

  // If we got components, use them; otherwise fall back to filtered display_name
  if (components.length > 0) {
    return components.join(', ');
  }

  // Last resort: filter the display_name
  const parts = displayName.split(',').map(p => p.trim());
  const filteredParts = parts.filter(part => {
    const lowerPart = part.toLowerCase();
    return !filterKeywords.some(keyword => lowerPart.includes(keyword));
  });
  
  return filteredParts.slice(0, 4).join(', ');
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
