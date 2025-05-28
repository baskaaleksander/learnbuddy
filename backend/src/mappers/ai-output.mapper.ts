import { InferModel } from "drizzle-orm";
import { aiOutputs } from "src/database/schema";

export type MaterialDb = InferModel<typeof aiOutputs>;

export function toAIOutputGraphQL(aiOutput: MaterialDb) {
    return {
        id: aiOutput.id,
        materialId: aiOutput.materialId,
        type: aiOutput.type,
        content: aiOutput.content,
        createdAt: aiOutput.createdAt,
        errorMessage: aiOutput.errorMessage || null,
    };
}