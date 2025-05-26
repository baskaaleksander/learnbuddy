import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";

export enum MaterialStatus {
    PENDING = 'pending',
    PROCESSED = 'processed',
    FAILED = 'failed'
}

registerEnumType(MaterialStatus, {
    name: 'MaterialStatus',
});



@ObjectType()
export class MaterialType {

    @Field(() => ID)
    id: string;
    
    @Field()
    userId: string;

    @Field()
    title: string;

    @Field()
    content: string;

    @Field(() => MaterialStatus)
    status: MaterialStatus;

    @Field()
    createdAt: Date;
}