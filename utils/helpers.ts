/**
 * Utility functions for TrustEnd
 */

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time to readable string
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Generate a random 6-character organization code
 */
export function generateOrgCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a point is within a radius of a center point
 */
export function isWithinRadius(
  pointLat: number,
  pointLon: number,
  centerLat: number,
  centerLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(pointLat, pointLon, centerLat, centerLon);
  return distance <= radiusMeters;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function isValidBssid(value: string): boolean {
  return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(value.trim());
}

export function isValidWorkTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

export function ipv4ToNumber(ipAddress: string) {
  const parts = ipAddress.trim().split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return null;
  }

  return parts.reduce((acc, part) => ((acc << 8) + part) >>> 0, 0);
}

export function isIpInRange(ipAddress?: string | null, range?: string | null) {
  if (!range || !ipAddress) return true;

  const normalizedRange = range.trim();
  if (normalizedRange.includes('/')) {
    const [baseIp, cidrText] = normalizedRange.split('/');
    const cidr = Number(cidrText);
    const ipNumber = ipv4ToNumber(ipAddress);
    const baseNumber = ipv4ToNumber(baseIp);

    if (ipNumber === null || baseNumber === null || !Number.isInteger(cidr) || cidr < 0 || cidr > 32) {
      return false;
    }

    const mask = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
    return (ipNumber & mask) === (baseNumber & mask);
  }

  if (normalizedRange.includes('-')) {
    const [startIp, endIp] = normalizedRange.split('-').map((part) => part.trim());
    const ipNumber = ipv4ToNumber(ipAddress);
    const startNumber = ipv4ToNumber(startIp);
    const endNumber = ipv4ToNumber(endIp);

    if (ipNumber === null || startNumber === null || endNumber === null) return false;
    return ipNumber >= startNumber && ipNumber <= endNumber;
  }

  return ipv4ToNumber(normalizedRange) !== null && ipAddress.trim() === normalizedRange;
}

export function isValidIpRange(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return true;

  if (normalized.includes('/')) {
    const [baseIp, cidrText] = normalized.split('/');
    const cidr = Number(cidrText);
    return ipv4ToNumber(baseIp) !== null && Number.isInteger(cidr) && cidr >= 0 && cidr <= 32;
  }

  if (normalized.includes('-')) {
    const [startIp, endIp] = normalized.split('-').map((part) => part.trim());
    const startNumber = ipv4ToNumber(startIp);
    const endNumber = ipv4ToNumber(endIp);
    return startNumber !== null && endNumber !== null && startNumber <= endNumber;
  }

  return ipv4ToNumber(normalized) !== null;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  return phone;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
