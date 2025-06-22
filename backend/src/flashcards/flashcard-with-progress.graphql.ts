import { Field, ObjectType } from '@nestjs/graphql';
import { FlashcardProgressStatus } from './flashcard-progress.graphql';

@ObjectType()
export class FlashcardWithProgressType {
  @Field()
  id: string;

  @Field()
  aiOutputId: string;

  @Field()
  question: string;

  @Field()
  answer: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => FlashcardProgressStatus)
  status: FlashcardProgressStatus;
}
