import { Field, ObjectType } from '@nestjs/graphql';
import { AIOutputType } from 'src/graphql/ai-output.graphql';
import { MaterialType } from 'src/materials/graphql/materials.graphql';

@ObjectType()
export class UserStats {
  @Field(() => Number, { nullable: true })
  materialsCount: number;

  @Field(() => Number, { nullable: true })
  quizzesCount: number;

  @Field(() => Number, { nullable: true })
  flashcardsCount: number;

  @Field(() => Number, { nullable: true })
  summariesCount: number;

  @Field(() => Number, { nullable: true })
  totalQuizResults: number;

  @Field(() => Number, { nullable: true })
  totalFlashcardsKnown: number;

  @Field(() => Number, { nullable: true })
  totalFlashcardsToReview: number;

  @Field(() => [AIOutputType], { nullable: true })
  recentlyCreatedAiOutputs: AIOutputType[];

  @Field(() => [MaterialType], { nullable: true })
  recentlyCreatedMaterials: MaterialType[];

  @Field(() => [String], { nullable: true })
  quizPartialsIds: string[];
}
