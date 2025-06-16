import { Field, InputType } from '@nestjs/graphql';

@InputType()
class QuestionAndAnswer {
  @Field()
  question: number;

  @Field()
  answer: string;
}
@InputType()
export class QuizPartialInput {
  @Field(() => Number)
  currentQuestionIndex: number;

  @Field(() => [QuestionAndAnswer])
  questionsAndAnswers: QuestionAndAnswer[];

  @Field(() => Date)
  lastUpdated: Date;
}
