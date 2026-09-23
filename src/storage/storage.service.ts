import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const accountId =
      this.configService.getOrThrow<string>('storage.accountId');
    this.bucket = this.configService.getOrThrow<string>('storage.bucket');
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>(
          'storage.accessKeyId',
        ),
        secretAccessKey: this.configService.getOrThrow<string>(
          'storage.secretAccessKey',
        ),
      },
    });
  }

  async upload(buffer: Buffer, extension: string): Promise<string> {
    const key = `${randomUUID()}${extension}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
      }),
    );
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const chunks: Buffer[] = [];
    for await (const chunk of result.Body as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
