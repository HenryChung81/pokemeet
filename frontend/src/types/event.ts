// 交流会情報を表す型
export interface Event {

  // 交流会ID
  id: number;

  // 交流会名
  title: string;

  // 交流会の説明
  description: string | null;

  // 開催日時
  event_date: string;

  // 開催場所
  location: string;

  // 定員
  capacity: number;

  // 作成したユーザーのID
  created_by: number;

  // 作成日時
  created_at: string;
}