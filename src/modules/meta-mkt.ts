import { ConstructorMkt } from "../interfaces/meta-mkt";
import { MktInsights } from "./insights/mkt-insights";

export class MetaMkt extends MktInsights {
  constructor(constructorPage: ConstructorMkt) {
    super(constructorPage);
  }
}
