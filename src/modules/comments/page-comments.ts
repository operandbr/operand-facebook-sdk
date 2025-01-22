import { ConstructorPage } from "../../interfaces/page-publish";
import { PagePublish } from "../publish/page-publish";

export class PageComments extends PagePublish {
  constructor(constructorPage: ConstructorPage) {
    super(constructorPage);
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
