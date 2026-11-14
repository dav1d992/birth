export interface OxytocinItem {
  id: string;
  text: string;
  done: boolean;
}

export interface OxytocinListMeta {
  title: string;
  salt: string;
  createdAt: number;
}

export interface OxytocinListData {
  iv: string;
  ct: string;
  updatedAt: number;
}

export interface RememberedList {
  id: string;
  title: string;
}

export interface RateLimitState {
  count: number;
  at: number;
}
