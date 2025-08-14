import { Inject, Injectable, NotFoundException, Res } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from '../database/drizzle.module';
import { aiOutputs, materials } from '../database/schema';
import { FlashcardContent, SummaryAiOutputContent } from '../utils/types';
import * as stringify from 'csv-stringify';
import * as PDFDocument from 'pdfkit';
import { join } from 'path';
import { existsSync } from 'fs';
import { Response } from 'express';

@Injectable()
export class ExportService {
  constructor(@Inject('DRIZZLE') private drizzle: typeof db) {}

  private resolveFontsDir(): string {
    const distFonts = join(__dirname, '..', 'assets', 'fonts');
    if (existsSync(distFonts)) return distFonts;

    const srcFonts = join(process.cwd(), 'src', 'assets', 'fonts');
    return srcFonts;
  }

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

    console.log(flashcards[0].ai_outputs.content);
    const content = flashcards[0].ai_outputs.content as {
      flashcards: FlashcardContent;
    };
    console.log(content);
    const records = content.flashcards.flashcards.map((item) => {
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

  async exportSummary(
    userId: string,
    aiOutputId: string,
    @Res() res: Response,
  ) {
    const summary = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(
        and(
          eq(aiOutputs.type, 'summary'),
          eq(aiOutputs.id, aiOutputId),
          eq(materials.userId, userId),
        ),
      );

    if (summary.length === 0) {
      throw new NotFoundException('Summary not found');
    }

    res.setHeader('Content-Type', 'application/pdf; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="summary-${summary[0].ai_outputs.id}.pdf"`,
    );

    const content = summary[0].ai_outputs.content as SummaryAiOutputContent;
    const fontsDir = this.resolveFontsDir();
    const fontPath = join(fontsDir, 'Inter-Regular.ttf');
    const fontPathBold = join(fontsDir, 'Inter-Bold.ttf');

    const doc = new PDFDocument({ margin: 50 });
    doc.registerFont('Inter', fontPath);
    doc.registerFont('Inter Bold', fontPathBold);
    doc.font('Inter Bold');
    doc.pipe(res);
    doc.fontSize(20).text(content.title, { align: 'center' });
    doc.moveDown(1.5);
    doc.font('Inter');
    content.chapters.forEach((chapter, index) => {
      const chapterHeader = `${index + 1}. ${chapter.name}`;

      doc.fontSize(16).text(chapterHeader, { underline: false });
      doc.moveDown(0.5);

      chapter.bullet_points.forEach((point) => {
        doc.fontSize(12).text(`• ${point}`, { indent: 20 });
      });
      doc.moveDown(1);
    });

    doc.end();
  }
}
