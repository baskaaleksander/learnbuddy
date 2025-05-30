import { Field, ObjectType, registerEnumType } from "@nestjs/graphql";

export enum FlashcardProgressStatus {
    known = 'known',
    review = 'review'
}

registerEnumType(FlashcardProgressStatus, {
    name: 'FlashcardProgressStatus',
});

ObjectType()
export class FlashcardProgressType {

    @Field()
    id: string;

    @Field()
    userId: string;

    @Field()
    flashcardId: string;

    @Field(() => FlashcardProgressStatus)
    status: FlashcardProgressStatus;

    @Field()
    updatedAt: Date;

}
