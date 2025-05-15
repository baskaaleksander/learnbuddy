import { Controller, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}
    
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
      
        return this.uploadService.uploadFile(file);
    }
}
