import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { aiOutputs, materials } from 'src/database/schema';
import { toAIOutputGraphQL } from 'src/mappers/ai-output.mapper';
import { OpenAiService } from 'src/open-ai/open-ai.service';
import { toMaterialGraphQL } from '../materials/materials.mapper';
import { SummaryAiOutputContent } from '../utils/types';

@Injectable()
export class SummaryService {
  constructor(
    @Inject('DRIZZLE') private drizzle: typeof db,
    private readonly openAiService: OpenAiService,
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
      .where(and(eq(aiOutputs.id, id)));

    if (summary.length === 0) {
      throw new NotFoundException('Summary not found');
    }

    const materialAccess = await this.drizzle
      .select()
      .from(materials)
      .where(
        and(
          eq(materials.id, summary[0].materialId),
          eq(materials.userId, userId),
        ),
      );
    if (materialAccess.length === 0) {
      throw new UnauthorizedException('Material not found or access denied');
    }

    return toAIOutputGraphQL(summary[0]);
  }

  async createSummary(materialId: string, userId: string) {
    const material = await this.drizzle
      .select()
      .from(materials)
      .where(and(eq(materials.id, materialId), eq(materials.userId, userId)));
    if (material.length === 0) {
      throw new UnauthorizedException('Material not found or access denied');
    }

    // const pdfContent = await parsePublicPdfFromS3(material[0].content);

    // if (!pdfContent) {
    //     throw new NotFoundException('PDF content not found');
    // }

    const pdfContent = 'test';
    const summary = await this.openAiService.generateSummary(pdfContent);

    if (!summary) {
      throw new Error('Failed to generate quiz');
    }

    await this.drizzle.insert(aiOutputs).values({
      materialId: materialId,
      type: 'summary',
      content: summary,
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
          eq(aiOutputs.id, id), // Changed from materials.id to aiOutputs.id
          eq(aiOutputs.type, 'summary'),
          eq(materials.userId, userId),
        ),
      );

    if (summary.length === 0) {
      throw new NotFoundException('Summary not found');
    }

    await this.drizzle.delete(aiOutputs).where(eq(aiOutputs.id, id)); // Use the id parameter directly

    return true;
  }
}
