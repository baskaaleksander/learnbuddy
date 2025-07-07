import { Field, ObjectType } from '@nestjs/graphql';
import {
  FlashcardProgressStatus,
  FlashcardStats,
} from '../graphql/flashcard-progress.graphql';
import { MaterialType } from 'src/materials/materials.graphql';

@ObjectType()
export class FlashcardWithProgressType {
  @Field()
  flashcardId: string;

  statusId: string;

  @Field()
  question: string;

  @Field()
  answer: string;

  @Field(() => FlashcardProgressStatus)
  status: FlashcardProgressStatus;

  @Field(() => Date)
  statusUpdatedAt: Date;
}

@ObjectType()
export class FlashcardWithProgressAndStatsType extends FlashcardStats {
  @Field(() => [FlashcardWithProgressType], { nullable: true })
  data: FlashcardWithProgressType[];

  @Field(() => MaterialType, { nullable: true })
  material?: MaterialType;
}
