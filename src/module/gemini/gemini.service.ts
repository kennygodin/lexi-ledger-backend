import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import {
  TransactionCategory,
  TransactionType,
} from '../../generated/prisma/enums';
import { EXTRACT_TRANSACTIONS_PROMPT, GEMINI_MODEL } from './gemini.constants';

export interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  confidence: number;
}

@Injectable()
export class GeminiService {
  private readonly client: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.getOrThrow<string>('gemini.apiKey'),
    });
  }

  async extractTransactions(
    statementText: string,
  ): Promise<ExtractedTransaction[]> {
    const interaction = await this.client.interactions.create({
      model: GEMINI_MODEL,
      input: `${EXTRACT_TRANSACTIONS_PROMPT}\n\n${statementText}`,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'ISO 8601 date' },
              description: { type: 'string' },
              amount: {
                type: 'number',
                description: 'Absolute value, no currency symbol',
              },
              type: { type: 'string', enum: Object.values(TransactionType) },
              category: {
                type: 'string',
                enum: Object.values(TransactionCategory),
              },
              confidence: { type: 'number', description: '0 to 1' },
            },
            required: [
              'date',
              'description',
              'amount',
              'type',
              'category',
              'confidence',
            ],
          },
        },
      },
    });

    return JSON.parse(interaction.output_text ?? '[]');
  }
}
