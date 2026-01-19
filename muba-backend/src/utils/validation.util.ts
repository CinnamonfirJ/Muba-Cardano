
/**
 * Validates institutional matriculation numbers.
 * Format: [A-Z]\d{2}[A-Z]{2}\d{4} (e.g., U21CO1024)
 * Rules:
 * - Must NOT contain emails, names, spaces, or special characters outside the format.
 */
export const isValidMatricNumber = (matric: string): boolean => {
    if (!matric) return false;
    
    // Strict institutional format: starts with a letter, 2 digits, 2 letters, 4 digits
    // Adjusting based on common Nigerian university formats if "U21CO1024" is the template.
    // Let's use a regex that matches the provided example strictly.
    const matricRegex = /^[A-Z]\d{2}[A-Z]{2}\d{4}$/;
    
    // Check for spaces or other invalid chars just in case the regex isn't strict enough
    if (/\s/.test(matric)) return false;
    
    return matricRegex.test(matric.toUpperCase());
};
