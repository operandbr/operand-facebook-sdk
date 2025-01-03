import { ConstructorPage } from "@/interfaces/page-publish";
import { PageInsights } from "./insights-page";

export class MetaPage extends PageInsights {
  constructor(constructorPage: ConstructorPage) {
    super(constructorPage);
  }
}
