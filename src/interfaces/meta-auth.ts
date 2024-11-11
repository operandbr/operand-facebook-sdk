export type ApiVersion = "v17.0" | "v18.0" | "v19.0" | "v20.0" | "v21.0";

export type CreateMetaAuth = {
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
  apiVersion: ApiVersion;
  code: string;
};

export type FieldsPage = Array<
  | "id"
  | "name"
  | "about"
  | "category"
  | "category_list"
  | "location"
  | "fan_count"
  | "access_token"
  | "tasks"
  | "picture"
  | "cover"
  | "photos"
  | "videos"
  | "engagement"
  | "is_published"
  | "is_verified"
  | "verification_status"
  | "website"
  | "emails"
  | "phone"
  | "instagram_business_account"
  | "hours"
  | "created_time"
  | "bio"
  | "link"
  | "business"
  | string
>;

export type GetAccounts = {
  fields: FieldsPage;
  accessToken: string;
};
