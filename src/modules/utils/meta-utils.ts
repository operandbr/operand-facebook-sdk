import { Meta } from "../meta";
import { ConstructorMain } from "@/interfaces/meta";

export class MetaUtils extends Meta {
  constructor(data: ConstructorMain) {
    super(data);
  }

  public async getTimePageTokenExpires() {
    return this.api.get("debug_token", {
      params: {
        input_token: this.pageAccessToken,
        access_token: this.pageAccessToken,
      },
    });
  }
}
