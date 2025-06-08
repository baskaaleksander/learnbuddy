import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { aiOutputs, materials } from 'src/database/schema';
import { toAIOutputGraphQL } from 'src/mappers/ai-output.mapper';
import { OpenAiService } from 'src/open-ai/open-ai.service';

@Injectable()
export class SummaryService {
    constructor(
        @Inject('DRIZZLE') private drizzle: typeof db,
        private readonly openAiService: OpenAiService
    ) {}

    async getSummaryByMaterial(materialId: string, userId: string) {

        const materialAccess = await this.drizzle
                    .select()
                    .from(materials)
                    .where(
                        and(
                            eq(materials.id, materialId),
                            eq(materials.userId, userId)
                        )
                    );
        if (materialAccess.length === 0) {
            throw new UnauthorizedException('Material not found or access denied');
        }
        
        const summaries = await this.drizzle
            .select()
            .from(aiOutputs)
            .where(and(
                eq(aiOutputs.materialId, materialId),
                eq(aiOutputs.type, 'summary'),
            ));
        
        if (summaries.length === 0) {
            throw new NotFoundException('No summaries found for this material');
        }

        return toAIOutputGraphQL(summaries[0]);
    }

    async getSummaryById(id: string, userId: string) {
        const summary = await this.drizzle
            .select()
            .from(aiOutputs)
            .where(
                and(
                    eq(aiOutputs.id, id),                
                )
            );

        if (summary.length === 0) {
            throw new NotFoundException('Summary not found');
        }

        const materialAccess = await this.drizzle
            .select()
            .from(materials)
            .where(
                and(
                    eq(materials.id, summary[0].materialId),
                    eq(materials.userId, userId)
                )
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
            .where(
                and(
                    eq(materials.id, materialId),
                    eq(materials.userId, userId)
                )
            );
        if (material.length === 0) {
            throw new UnauthorizedException('Material not found or access denied');
        }

        // const pdfContent = await parsePublicPdfFromS3(material[0].content);

        // if (!pdfContent) {
        //     throw new NotFoundException('PDF content not found');
        // }

        const pdfContent = "test";
        const summary = await this.openAiService.generateSummary(pdfContent);

        if (!summary) {
            throw new Error('Failed to generate quiz');
        }

        await this.drizzle
            .insert(aiOutputs)
            .values({
                materialId: materialId,
                type: 'summary',
                content: summary,
                createdAt: new Date(),
            })

        return true;
    }

    async deleteSummary(id: string, userId: string) {
        const summary = await this.drizzle
            .select()
            .from(aiOutputs)
            .where(
                and(
                    eq(aiOutputs.id, id),
                )
            );

        if (summary.length === 0) {
            throw new NotFoundException('Summary not found');
        }

        const materialAccess = await this.drizzle
            .select()
            .from(materials)
            .where(
                and(
                    eq(materials.id, summary[0].materialId),
                    eq(materials.userId, userId)
                )
            );
        if (materialAccess.length === 0) {
            throw new UnauthorizedException('Material not found or access denied');
        }

        await this.drizzle
            .delete(aiOutputs)
            .where(eq(aiOutputs.id, id));

        return true;
    }
}
