import { InferModel } from "drizzle-orm";
import { materials } from "src/database/schema";
import { MaterialStatus, MaterialType } from "./materials.graphql";

export type MaterialDb = InferModel<typeof materials>;

export function toMaterialGraphQL(material: MaterialDb) : MaterialType {
    return {
        id: material.id,
        userId: material.userId,
        title: material.title || '',
        description: material.description || '',
        content: material.content,
        status: material.status as MaterialStatus,
        createdAt: material.createdAt,
    };
}