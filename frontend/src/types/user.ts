// PokeMeetで使用する
// ユーザー情報の型を定義する


// FastAPIから取得するユーザー情報の型
//
// ユーザー一覧、プロフィール、
// ユーザー詳細などで共通して使用する。
export interface User {

  // ユーザーID
  id: number;

  // ニックネーム
  nickname: string;

  // 好きなポケモン
  //
  // データベースではNULLになる可能性があるため、
  // stringまたはnullとして定義する。
  favorite_pokemon: string | null;

  // 使用言語
  language: string | null;

  // 自己紹介
  introduction: string | null;

  // プロフィール画像の種類（プリセットまたはアップロード画像）
  // APIの旧レスポンスとの互換性のため任意項目にする
  avatar_type?: string | null;

  // 選択中のプリセットアイコン
  avatar_preset?: string | null;

  // アップロード画像のURL
  avatar_url?: string | null;
}