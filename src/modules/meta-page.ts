import { ConstructorPage } from "../interfaces/page-publish";
import { PageInsights } from "./insights/insights-page";

export class MetaPage extends PageInsights {
  constructor(constructorPage: ConstructorPage) {
    super(constructorPage);
  }
}
