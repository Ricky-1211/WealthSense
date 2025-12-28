/**
 * OCR Utilities for Receipt Scanning
 * Note: This is a basic implementation. For production, use a proper OCR service like:
 * - Tesseract.js (client-side)
 * - Google Cloud Vision API
 * - AWS Textract
 * - Azure Computer Vision
 */

// Basic OCR simulation (extract text from image)
// In production, replace with actual OCR service
export const extractTextFromImage = async (imageFile: File): Promise<string> => {
  // This is a placeholder - in production, use Tesseract.js or an OCR API
  return new Promise((resolve) => {
    // Simulate OCR processing
    setTimeout(() => {
      // Mock extracted text
      resolve('Receipt extracted text would appear here. Amount: $XX.XX, Date: XX/XX/XXXX');
    }, 1000);
  });
};

// Extract amount from OCR text
export const extractAmount = (text: string): number | null => {
  const amountRegex = /(\$|₹|Rs\.?)\s*(\d+\.?\d*)/gi;
  const matches = text.match(amountRegex);
  if (matches && matches.length > 0) {
    const amountStr = matches[0].replace(/[^\d.]/g, '');
    return parseFloat(amountStr) || null;
  }
  return null;
};

// Extract date from OCR text
export const extractDate = (text: string): string | null => {
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g;
  const matches = text.match(dateRegex);
  if (matches && matches.length > 0) {
    // Convert to ISO format
    const dateStr = matches[0];
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return null;
};

// Extract merchant name from OCR text
export const extractMerchant = (text: string): string | null => {
  // Simple heuristic - first line or line with common merchant keywords
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    return lines[0].trim();
  }
  return null;
};

// Process receipt image and extract structured data
export interface ReceiptData {
  amount: number | null;
  date: string | null;
  merchant: string | null;
  text: string;
}

export const processReceiptImage = async (imageFile: File): Promise<ReceiptData> => {
  const text = await extractTextFromImage(imageFile);
  return {
    amount: extractAmount(text),
    date: extractDate(text) || new Date().toISOString().split('T')[0],
    merchant: extractMerchant(text),
    text
  };
};

// Convert image to base64 for storage
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

