import { ConstructorIng } from "../interfaces/ing-publish";
import { IngInsights } from "./insights-ing";

export class MetaIng extends IngInsights {
  constructor(constructorPage: ConstructorIng) {
    super(constructorPage);
  }
}
