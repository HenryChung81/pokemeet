// 交流会情報を表す型
export interface Event {
  id: number;
  title: string;
  description: string | null;
  event_date: string;
  location: string;
  capacity: number;
  participation_fee: number;
  created_by: number;
  created_at: string;

  participant_count: number;
  remaining_slots: number;
  is_joined: boolean;
  image_url: string | null;
}