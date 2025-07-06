import { Inject, Injectable, NotFoundException, Res } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { aiOutputs, materials } from 'src/database/schema';
import { FlashcardContent } from 'src/utils/types';
import * as stringify from 'csv-stringify';
import { Response } from 'express';

@Injectable()
export class ExportService {
  constructor(@Inject('DRIZZLE') private drizzle: typeof db) {}

  async exportFlashcards(
    userId: string,
    aiOutputId: string,
    @Res() res: Response,
  ) {
    const flashcards = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(
        and(
          eq(aiOutputs.type, 'flashcards'),
          eq(aiOutputs.id, aiOutputId),
          eq(materials.userId, userId),
        ),
      );

    if (flashcards.length === 0) {
      throw new NotFoundException('Flashcards not found');
    }

    const content = flashcards[0].ai_outputs.content as FlashcardContent;
    const records = content.flashcards.map((item) => {
      return [item.question, item.answer];
    });

    stringify.stringify(records, (err, output) => {
      if (err) {
        return res.status(500).send('Error generating CSV');
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="flashcards-${aiOutputId}.csv"`,
      );

      res.status(200).send('\uFEFF' + output); // BOM + dane CSV
    });
  }
}
