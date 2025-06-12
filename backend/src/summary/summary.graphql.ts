import { ObjectType } from "@nestjs/graphql";
import { AIOutputType } from "src/graphql/ai-output.graphql";

@ObjectType()
export class SummaryType extends AIOutputType {}