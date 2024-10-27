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

export interface GetStatusPosts {
  data: PostItem[];
  paging: Paging;
}
