export const PROCESS_STATEMENT_QUEUE = 'process-statement';
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const STATEMENTS_MESSAGES = {
  ONLY_PDF: 'Only PDF files are accepted',
  STATEMENT_NOT_FOUND: 'Statement not found',
  NO_EXTRACTABLE_TEXT:
    'No extractable text found in PDF (possibly scanned/image-only)',
  INVALID_GEMINI_TRANSACTION: 'Gemini returned an invalid transaction',
} as const;
