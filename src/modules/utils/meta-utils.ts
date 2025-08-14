import { Meta } from "../meta";
import { ConstructorMain } from "../../interfaces/meta";
import axios from "axios";
import { GetInstagramDiscoveryResponse } from "@/interfaces/meta-response";

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

  public static async getInstagramProfileByUsername(
    username: string,
    userId: string,
    token: string,
  ) {
    return (
      await axios.get<GetInstagramDiscoveryResponse>(
        `https://graph.facebook.com/${userId}`,
        {
          params: {
            fields: `business_discovery.username(${username}){followers_count,media_count,profile_picture_url.as(picture)}`,
            access_token: token,
          },
        },
      )
    ).data;
  }
}
