import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { PayloadDto } from 'src/auth/dtos/payload.dto';

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}
    
    @UseInterceptors(FileInterceptor('file'))
    @UseGuards(AuthGuard('jwt'))
    @Post()
    uploadFile(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: PayloadDto) {
       
        return this.uploadService.uploadFile(file, user.id);
    }
}
