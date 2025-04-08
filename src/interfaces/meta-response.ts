export interface PagePost {
  created_time: string;
  message: string;
  id: string;
}

export interface PaginationCursors {
  before?: string;
  after?: string;
}

export interface PaginationInfo {
  cursors: PaginationCursors;
  next?: string;
}

export interface GetPagePostsResponse {
  data: PagePost[];
  paging: PaginationInfo;
}

export interface CreatePagePostResponse {
  id: string;
  post_id?: string;
}

export interface UpdatePagePostResponse {
  success: boolean;
}

export interface DeletePagePostResponse {
  success: boolean;
}

export interface SaveMediaStorageResponse {
  id: string;
}

export interface CreatePhotoStoriesResponse {
  success: boolean;
  post_id: string;
}

export interface CreateAccessTokenResponse {
  access_token: string;
  token_type: string;
}

export interface FacebookPage {
  id: string;
  name?: string;
  about?: string;
  category?: string;
  category_list?: Array<{ id: string; name: string }>;
  location?: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    street?: string;
    zip?: string;
  };
  fan_count?: number;
  access_token?: string;
  tasks?: string[];
  picture?: {
    data: {
      url: string;
      width?: number;
      height?: number;
      is_silhouette?: boolean;
    };
  };
  cover?: {
    id: string;
    source: string;
    offset_y?: number;
    offset_x?: number;
  };
  photos?: {
    data: Array<{
      id: string;
      name?: string;
      created_time?: string;
      picture?: string;
    }>;
  };
  videos?: {
    data: Array<{
      id: string;
      title?: string;
      description?: string;
      picture?: string;
      source?: string;
    }>;
  };
  engagement?: {
    count?: number;
    social_sentence?: string;
  };
  is_published?: boolean;
  is_verified?: boolean;
  verification_status?: string;
  website?: string;
  emails?: string[];
  phone?: string;
  instagram_business_account?: { id: string; name?: string };
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  created_time?: string;
  bio?: string;
  link?: string;
  business?: {
    id: string;
    name: string;
  };
}

export interface FacebookAdAccount {
  data: Array<{
    account_id: string;
    id: string;
  }>;
  paging: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

export interface GetPageAccountsResponse {
  data: Array<FacebookPage>;
}

export interface CreateStartVideoUploadResponse {
  video_id: string;
  upload_url: string;
}

export interface CreateLoadingVideoUploadResponse {
  success: boolean;
}

export interface CreateFinishVideoUploadResponse {
  success: boolean;
  message: string;
  post_id: string;
}

export interface GetStatusMediaContainerDownloadResponse {
  status_code: "FINISHED" | "ERROR" | "EXPIRED" | "IN_PROGRESS" | "PUBLISHED";
  id: string;
}

export interface PostMediaContainerReelsResponse {
  id: string;
  uri: string;
}

export interface GetFollowersCountResponseCurrent {
  followers_count: number;
  id: string;
}

interface Insights<T> {
  name: string;
  period: string;
  values: T;
  title: string;
  description: string;
  id: string;
  total_value?: {
    value: number;
  };
}

export interface GetInsightsResponse {
  data: Insights<
    {
      value: number;
      end_time?: string;
    }[]
  >[];
  paging: {
    previous: string;
  };
}

export interface GetInsightsPageFollowersAndUnFollowersResponse {
  data: Insights<
    {
      value: {
        follows: 100;
        unfollows: 50;
      };
      end_time?: string;
    }[]
  >[];
  paging: {
    previous: string;
  };
}

export interface GetInsightsPageActionsPostReactionsTotalResponse {
  data: Insights<
    {
      value: {
        like?: number;
        love?: number;
        wow?: number;
        haha?: number;
        sorry?: number;
        anger?: number;
      };
      end_time?: string;
    }[]
  >[];
  paging: {
    previous: string;
  };
}

export interface PostComment {
  id: string;
  message: string;
  created_time: string;
  from: {
    id: string;
    name: string;
  };
}

export interface GetPostCommentsResponse {
  data: PostComment[];
  paging: PaginationInfo;
}

export interface AdMetrics {
  ad_id: string;
  ad_name: string;
  clicks: number;
  inline_link_clicks: number;
  impressions: number;
  reach: number;
}

export interface AdMetricsResponse {
  data: AdMetrics[];
}

export interface GetStoriesPageResponse {
  data: {
    post_id: string;
    status: string;
    creation_time: string;
    media_type: string;
    media_id: string;
    url: string;
  }[];
}

export interface MetaError {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}
