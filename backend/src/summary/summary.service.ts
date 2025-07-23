import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../database/drizzle.module';
import { aiOutputs, materials } from '../database/schema';
import { toAIOutputGraphQL } from '../mappers/ai-output.mapper';
import { OpenAiService } from '../open-ai/open-ai.service';
import { toMaterialGraphQL } from '../materials/graphql/materials.mapper';
import { SummaryAiOutputContent } from '../utils/types';
import { BillingService } from '../billing/billing.service';
import { parsePublicPdfFromS3 } from '../helpers/parse-pdf';

@Injectable()
export class SummaryService {
  constructor(
    @Inject('DRIZZLE') private drizzle: typeof db,
    private readonly openAiService: OpenAiService,
    private readonly billingService: BillingService,
  ) {}

  async getSummaryByMaterial(materialId: string, userId: string) {
    const materialAccess = await this.drizzle
      .select()
      .from(materials)
      .where(and(eq(materials.id, materialId), eq(materials.userId, userId)));
    if (materialAccess.length === 0) {
      throw new UnauthorizedException('Material not found or access denied');
    }

    const summaries = await this.drizzle
      .select()
      .from(aiOutputs)
      .where(
        and(
          eq(aiOutputs.materialId, materialId),
          eq(aiOutputs.type, 'summary'),
        ),
      );

    if (summaries.length === 0) {
      throw new NotFoundException('No summaries found for this material');
    }

    return toAIOutputGraphQL(summaries[0]);
  }

  async getSummariesByUser(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'createdAt-desc',
  ) {
    const summaries = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(and(eq(materials.userId, userId), eq(aiOutputs.type, 'summary')))
      .orderBy(
        sortBy === 'createdAt-desc'
          ? desc(aiOutputs.createdAt)
          : sortBy === 'createdAt-asc'
            ? aiOutputs.createdAt
            : sortBy === 'title-desc'
              ? desc(materials.title)
              : materials.title,
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(and(eq(aiOutputs.type, 'summary'), eq(materials.userId, userId)));

    const totalItems = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalItems === 0) {
      return {
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        pageSize,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    if (summaries.length === 0) {
      return {
        data: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: page,
        pageSize,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
    const data = summaries.map((summary) => {
      const content = summary.ai_outputs.content as SummaryAiOutputContent;
      const chaptersCount = content.chapters.length;
      let bulletPointsCount = 0;

      content.chapters.forEach((chapter) => {
        bulletPointsCount += chapter.bullet_points.length;
      });
      return {
        ...toAIOutputGraphQL(summary.ai_outputs),
        chaptersCount,
        title: content.title,
        bulletPointsCount,
        material: toMaterialGraphQL(summary.materials),
      };
    });

    return {
      data,
      totalItems,
      totalPages,
      currentPage: page,
      pageSize,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async getSummaryById(id: string, userId: string) {
    const summary = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(
        and(
          eq(aiOutputs.id, id),
          eq(aiOutputs.type, 'summary'),
          eq(materials.userId, userId),
        ),
      );

    if (summary.length === 0) {
      throw new NotFoundException('Summary not found');
    }

    const content = summary[0].ai_outputs.content as SummaryAiOutputContent;
    const chaptersCount = content.chapters.length;
    let bulletPointsCount = 0;

    content.chapters.forEach((chapter) => {
      bulletPointsCount += chapter.bullet_points.length;
    });
    return {
      ...toAIOutputGraphQL(summary[0].ai_outputs),
      chaptersCount,
      title: content.title,
      bulletPointsCount,
      material: toMaterialGraphQL(summary[0].materials),
    };
  }

  async markChapterAsKnown(
    summaryId: string,
    chapterIndex: number,
    userId: string,
  ) {
    const summary = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(
        and(
          eq(aiOutputs.id, summaryId),
          eq(aiOutputs.type, 'summary'),
          eq(materials.userId, userId),
        ),
      );

    if (summary.length === 0) {
      throw new NotFoundException('Summary not found');
    }

    const content = summary[0].ai_outputs.content as SummaryAiOutputContent;

    if (chapterIndex < 0 || chapterIndex >= content.chapters.length) {
      throw new NotFoundException('Chapter index out of bounds');
    }

    if (content.chapters[chapterIndex].isKnown) {
      content.chapters[chapterIndex].isKnown = false;
    } else {
      content.chapters[chapterIndex].isKnown = true;
    }

    await this.drizzle
      .update(aiOutputs)
      .set({ content: content })
      .where(eq(aiOutputs.id, summaryId));

    return true;
  }

  async markChapterAsImportant(
    summaryId: string,
    chapterIndex: number,
    userId: string,
  ) {
    const summary = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(
        and(
          eq(aiOutputs.id, summaryId),
          eq(aiOutputs.type, 'summary'),
          eq(materials.userId, userId),
        ),
      );
    if (summary.length === 0) {
      throw new NotFoundException('Summary not found');
    }

    const content = summary[0].ai_outputs.content as SummaryAiOutputContent;

    if (chapterIndex < 0 || chapterIndex >= content.chapters.length) {
      throw new NotFoundException('Chapter index out of bounds');
    }

    if (content.chapters[chapterIndex].isImportant) {
      content.chapters[chapterIndex].isImportant = false;
    } else {
      content.chapters[chapterIndex].isImportant = true;
    }

    await this.drizzle
      .update(aiOutputs)
      .set({ content: content })
      .where(eq(aiOutputs.id, summaryId));

    return true;
  }

  async createSummary(materialId: string, userId: string) {
    const material = await this.drizzle
      .select()
      .from(materials)
      .where(and(eq(materials.id, materialId), eq(materials.userId, userId)));
    if (material.length === 0) {
      throw new UnauthorizedException('Material not found or access denied');
    }

    const existingSummary = await this.drizzle
      .select()
      .from(aiOutputs)
      .where(
        and(
          eq(aiOutputs.materialId, materialId),
          eq(aiOutputs.type, 'summary'),
        ),
      );

    if (existingSummary.length > 0) {
      throw new Error('Summary already exists for this material');
    }

    await this.billingService.useTokens(userId, 2);

    const pdfContent = await parsePublicPdfFromS3(material[0].content);

    if (!pdfContent) {
      throw new NotFoundException('PDF content not found');
    }

    const summary = await this.openAiService.generateSummary(pdfContent);

    if (!summary) {
      throw new Error('Failed to generate quiz');
    }

    const summaryContent = summary.chapters.map((chapter) => ({
      name: chapter.name,
      bullet_points: chapter.bullet_points,
      isKnown: false,
      isImportant: false,
    }));

    await this.drizzle.insert(aiOutputs).values({
      materialId: materialId,
      type: 'summary',
      content: {
        title: summary.title,
        chapters: summaryContent,
      },
      createdAt: new Date(),
    });

    return true;
  }

  async deleteSummary(id: string, userId: string) {
    const summary = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(
        and(
          eq(aiOutputs.id, id),
          eq(aiOutputs.type, 'summary'),
          eq(materials.userId, userId),
        ),
      );

    if (summary.length === 0) {
      throw new NotFoundException('Summary not found');
    }

    await this.drizzle.delete(aiOutputs).where(eq(aiOutputs.id, id));

    return true;
  }

  async regenerateSummary(
    materialId: string,
    userId: string,
  ): Promise<boolean> {
    const summary = await this.drizzle
      .select()
      .from(aiOutputs)
      .where(
        and(
          eq(aiOutputs.materialId, materialId),
          eq(aiOutputs.type, 'summary'),
        ),
      );

    if (summary.length === 0) {
      throw new NotFoundException('Summary not found');
    }

    const removalOfSummary = await this.deleteSummary(summary[0].id, userId);

    if (!removalOfSummary) {
      return false;
    }

    return await this.createSummary(materialId, userId);
  }
}
