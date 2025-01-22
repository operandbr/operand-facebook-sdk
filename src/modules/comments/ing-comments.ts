import { ConstructorIng } from "../../interfaces/ing-publish";
import { IngPublish } from "../publish/ing-publish";

export class IngComments extends IngPublish {
  constructor(constructorIng: ConstructorIng) {
    super(constructorIng);
  }

  public async createComment(postId: string, message: string): Promise<string> {
    const response = await this.api.post<{ id: string }>(
      `/${postId}/comments`,
      {
        message,
        access_token: this.pageAccessToken,
      },
    );

    return response.data.id;
  }
}
