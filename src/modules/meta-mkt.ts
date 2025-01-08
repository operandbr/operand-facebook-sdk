import { ConstructorMkt } from "../interfaces/meta-mkt";
import { MktInsights } from "./insights/insights-mkt";

export class MetaMkt extends MktInsights {
  constructor(constructorPage: ConstructorMkt) {
    super(constructorPage);
  }
}
