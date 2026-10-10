import { GoogleGenAI, Type } from '@google/genai';
import { envConfig } from '../config/env.js';

export interface ExtractedPatientInfo {
  name?: string;
  dob?: string;
  age?: string;
}

export interface ExtractedMeasurement {
  parameter: string;
  raw_value: string;
  normalized_value: string;
  unit: string;
  normalized_unit: string;
  source_page: string;
  source_text: string;
  extraction_confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ExtractedReportData {
  patient_info: ExtractedPatientInfo;
  measurements: ExtractedMeasurement[];
}

export class GeminiAIError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 500) {
    super(message);
    this.name = 'GeminiAIError';
    this.code = code;
    this.status = status;
  }
}

class AIService {
  private client: GoogleGenAI | null = null;
  private readonly defaultModel = 'gemini-2.5-flash';

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    if (envConfig.IS_GEMINI_CONFIGURED && envConfig.GEMINI_API_KEY) {
      try {
        this.client = new GoogleGenAI({
          apiKey: envConfig.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'meditrack-v3.1-app',
            }
          }
        });
      } catch (err: any) {
        console.warn('[AI Service] Failed to initialize GoogleGenAI client:', err.message);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  public isConfigured(): boolean {
    return this.client !== null && !!envConfig.GEMINI_API_KEY;
  }

  public getHealth(): {
    status: 'CONFIGURED' | 'NOT_CONFIGURED';
    provider: string;
    model: string;
    message: string;
  } {
    if (!this.isConfigured()) {
      return {
        status: 'NOT_CONFIGURED',
        provider: 'Google Gemini',
        model: this.defaultModel,
        message: 'GEMINI_API_KEY is not configured. AI OCR and extraction features are currently unavailable.'
      };
    }
    return {
      status: 'CONFIGURED',
      provider: 'Google Gemini',
      model: this.defaultModel,
      message: 'Gemini AI integration is active and configured.'
    };
  }

  public async extractMedicalReport(
    fileBuffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<ExtractedReportData> {
    if (!this.isConfigured() || !this.client) {
      throw new GeminiAIError(
        'GEMINI_NOT_CONFIGURED',
        'Gemini AI API key is not configured on this server. Please provide GEMINI_API_KEY in your .env file to enable document OCR biomarker extraction.',
        503
      );
    }

    const base64Data = fileBuffer.toString('base64');
    let effectiveMime = mimeType;
    if (!effectiveMime || effectiveMime === 'application/octet-stream') {
      effectiveMime = filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    }

    let retries = 3;
    let delay = 1500;
    let lastError: any = null;

    while (retries > 0) {
      try {
        const response = await this.client.models.generateContent({
          model: this.defaultModel,
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType: effectiveMime } },
              {
                text: "Extract the medical measurements (like blood pressure, heart rate, LDL, glucose, HbA1c, BMI, etc.) and patient identifiers (name, dob, age) from this report. Only output a valid JSON object with 'patient_info' and 'measurements' array."
              }
            ]
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                patient_info: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    dob: { type: Type.STRING },
                    age: { type: Type.STRING }
                  }
                },
                measurements: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      parameter: { type: Type.STRING, description: 'Name of the medical parameter' },
                      raw_value: { type: Type.STRING, description: 'Raw value as it appears in the report' },
                      normalized_value: { type: Type.STRING, description: 'Normalized value' },
                      unit: { type: Type.STRING, description: 'Unit of measurement' },
                      normalized_unit: { type: Type.STRING, description: 'Normalized unit' },
                      source_page: { type: Type.STRING, description: 'Page number' },
                      source_text: { type: Type.STRING, description: 'Source text snippet' },
                      extraction_confidence: { type: Type.STRING, description: 'HIGH, MEDIUM, or LOW' }
                    },
                    required: [
                      'parameter',
                      'raw_value',
                      'normalized_value',
                      'unit',
                      'normalized_unit',
                      'source_page',
                      'source_text',
                      'extraction_confidence'
                    ]
                  }
                }
              }
            }
          }
        });

        const textResponse = response?.text || '{}';
        let parsed: any;
        try {
          parsed = JSON.parse(textResponse);
        } catch (parseErr) {
          throw new GeminiAIError(
            'INVALID_JSON_RESPONSE',
            'Failed to parse structured JSON from AI provider response',
            502
          );
        }

        return {
          patient_info: parsed.patient_info || {},
          measurements: Array.isArray(parsed.measurements) ? parsed.measurements : []
        };
      } catch (err: any) {
        lastError = err;
        const msg = (err.message || '').toLowerCase();

        // Permanent failures: Fail fast without useless retries
        if (
          msg.includes('api_key_invalid') ||
          msg.includes('invalid api key') ||
          msg.includes('permission_denied') ||
          msg.includes('unauthenticated') ||
          err.status === 401 ||
          err.status === 403
        ) {
          throw new GeminiAIError(
            'INVALID_API_KEY',
            'The configured Gemini API key is invalid or lacks necessary permissions.',
            401
          );
        }

        if (msg.includes('resource_exhausted') || msg.includes('quota') || err.status === 429) {
          // If quota exhausted, retry once or throw clear error
          retries--;
          if (retries === 0) {
            throw new GeminiAIError(
              'RATE_LIMIT_EXCEEDED',
              'Gemini AI API rate limit or quota exceeded. Please wait a moment and try again.',
              429
            );
          }
        } else {
          retries--;
          if (retries === 0) {
            throw new GeminiAIError(
              'AI_EXTRACTION_FAILED',
              `Gemini AI document extraction failed: ${err.message || 'Unknown error'}`,
              500
            );
          }
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new GeminiAIError(
      'AI_EXTRACTION_FAILED',
      `Gemini extraction failed: ${lastError?.message || 'Exhausted retries'}`,
      500
    );
  }
}

export const aiService = new AIService();
