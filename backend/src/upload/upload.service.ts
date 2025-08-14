import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { db } from '../database/drizzle.module';
import { materials } from '../database/schema';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor(
    private configService: ConfigService,
    @Inject('DRIZZLE') private drizzle: typeof db,
  ) {
    this.region = this.configService.get('AWS_REGION') || '';
    this.bucket = this.configService.get('AWS_S3_BUCKET_NAME') || '';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async uploadFile(file: Express.Multer.File, userId: string): Promise<any> {
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed for upload');
    }
    const fileKey = `${uuid()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      throw new Error('Error uploading file to S3', error);
    }

    const material = await this.drizzle
      .insert(materials)
      .values({
        title: file.originalname,
        userId: userId,
        content: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`,
        status: 'pending',
      })
      .returning()
      .catch((err) => {
        throw new Error('Error creating material', err);
      });

    return {
      message: 'Material uploaded successfully',
      filename: fileKey,
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`,
      materialId: material[0].id,
    };
  }
}
