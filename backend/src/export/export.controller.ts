import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ExportService } from './export.service';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../decorators/current-user.decorator';
import { PayloadDto } from '../auth/dtos/payload.dto';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('flashcards/:aiOutputId')
  async exportFlashcards(
    @Param('aiOutputId') aiOutputId: string,
    @Res() res: Response,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.exportService.exportFlashcards(user.id, aiOutputId, res);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('summary/:aiOutputId')
  async exportSummary(
    @Param('aiOutputId') aiOutputId: string,
    @Res() res: Response,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.exportService.exportSummary(user.id, aiOutputId, res);
  }
}
