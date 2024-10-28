export interface PostItem {
  created_time: string;
  message: string;
  id: string;
}

export interface Cursors {
  before: string;
  after: string;
}

export interface Paging {
  cursors: Cursors;
}

export interface GetPosts {
  data: PostItem[];
  paging: Paging;
}

export interface PostPost {
  id: string;
  post_id?: string;
}

export interface UpdatePost {
  success: boolean;
}

export interface DeletePost {
  success: boolean;
}

export interface PostMediaStorage {
  id: string;
}

export interface PostPhotoStories {
  success: boolean;
  post_id: string;
}
