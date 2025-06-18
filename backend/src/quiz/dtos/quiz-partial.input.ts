import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class QuestionAndAnswer {
  @Field(() => Int)
  question: number;

  @Field(() => String)
  answer: string;
}

@InputType()
export class QuizPartialInput {
  @Field(() => Int)
  currentQuestionIndex: number;

  @Field(() => [QuestionAndAnswer])
  questionsAndAnswers: QuestionAndAnswer[];
}
