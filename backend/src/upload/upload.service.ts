import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UploadService {
    private s3Client: S3Client;
    private bucket: string;
    private region: string;

    constructor(private configService: ConfigService) {
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

    async uploadFile(file: Express.Multer.File): Promise<any> {
        const fileKey = `${uuid()}-${file.originalname}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await this.s3Client.send(command);

        return {
            message: 'File uploaded successfully',
            filename: fileKey,
            url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`,
        };
    }
}
