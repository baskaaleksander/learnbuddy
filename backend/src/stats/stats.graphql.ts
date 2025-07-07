import { Field, ObjectType } from '@nestjs/graphql';
import { AIOutputType } from 'src/graphql/ai-output.graphql';
import { MaterialType } from 'src/materials/materials.graphql';

@ObjectType()
export class UserStats {
  @Field(() => Number)
  materialsCount: number;

  @Field(() => Number)
  quizzesCount: number;

  @Field(() => Number)
  flashcardsCount: number;

  @Field(() => Number)
  summariesCount: number;

  @Field(() => Number)
  totalQuizResults: number;

  @Field(() => Number)
  totalFlashcardKnown: number;

  @Field(() => Number)
  totalFlashcardsToReview: number;

  @Field(() => [AIOutputType])
  recentlyCreatedAiOutputs: AIOutputType[];

  @Field(() => [MaterialType])
  recentlyCreatedMaterials: MaterialType[];

  @Field(() => [String])
  quizPartialsIds: string[];
}
