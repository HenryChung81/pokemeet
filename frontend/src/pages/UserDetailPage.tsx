
 // Reactの状態管理と、
 // ページ表示時に処理を実行するための機能
import { useEffect, useState } from "react";

// React Routerから、URLのパラメータと
// ページ移動に使う機能を読み込む
import {
  useNavigate,
  useParams,
} from "react-router-dom";

// 共通のUser型を読み込む
import type { User } from "../types/user";
import "./ProfilePages.css";

// APIから取得するユーザー情報を拡張する。
// 既存のUser型を残し、詳細画面で使用する追加項目を定義する。
type UserDetail = User & {
  favorite_pokemon_list?: string[] | null;
  gender?: string | null;
  friend_code?: string | null;
  avatar_type?: string | null;
  avatar_preset?: string | null;
  avatar_url?: string | null;
  game_slugs?: string[] | null;
  play_style_slugs?: string[] | null;
};

// ゲームのslugと画面表示名を対応させる
const GAME_OPTIONS = [
  { value: "pokemon-sv", label: "ポケモン スカーレット・バイオレット" },
  { value: "pokemon-go", label: "Pokémon GO" },
  { value: "pokemon-sleep", label: "Pokémon Sleep" },
  { value: "pokemon-tcg-pocket", label: "Pokémon TCG Pocket" },
  { value: "pokemon-legends-za", label: "Pokémon LEGENDS Z-A" },
  { value: "pokemon-unite", label: "Pokémon UNITE" },
  { value: "pokemon-masters-ex", label: "Pokémon Masters EX" },
] as const;

// プレイスタイルのslugと画面表示名を対応させる
const PLAY_STYLE_OPTIONS = [
  { value: "battle", label: "対戦" },
  { value: "trading", label: "ポケモン交換" },
  { value: "co-op", label: "協力プレイ" },
  { value: "raids", label: "レイド" },
  { value: "pokedex", label: "図鑑完成" },
  { value: "shiny-hunting", label: "色違い厳選" },
  { value: "pokemon-go-walking", label: "ポケモンGOの散歩" },
  { value: "casual", label: "のんびりプレイ" },
] as const;

// プリセットアイコン一覧
// マイプロフィール画面と同じ画像を使用する。
const AVATAR_PRESETS = [
  {
    value: "pokeball",
    label: "モンスターボール",
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
  },
  {
    value: "pikachu",
    label: "ピカチュウ",
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
  },
  {
    value: "eevee",
    label: "イーブイ",
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png",
  },
  {
    value: "venusaur",
    label: "フシギバナ",
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png",
  },
  {
    value: "charizard",
    label: "リザードン",
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
  },
  {
    value: "blastoise",
    label: "カメックス",
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png",
  },
] as const;

// FastAPIのベースURL
const API_BASE_URL = "http://127.0.0.1:8000";

// プリセット名から画像URLを取得する
function getAvatarPresetImageUrl(
  preset: string | null | undefined,
): string {
  return (
    AVATAR_PRESETS.find((item) => item.value === preset)?.imageUrl ??
    AVATAR_PRESETS[0].imageUrl
  );
}

// プリセット名から表示名を取得する
function getAvatarPresetLabel(
  preset: string | null | undefined,
): string {
  return (
    AVATAR_PRESETS.find((item) => item.value === preset)?.label ??
    AVATAR_PRESETS[0].label
  );
}

// アップロード画像のURLを組み立てる
function getAvatarImageUrl(
  url: string | null | undefined,
): string {
  if (!url) {
    return "";
  }

  // すでに完全なURLの場合はそのまま使用する
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // 相対パスの場合はFastAPIのURLを付ける
  return `${API_BASE_URL}${url}`;
}

// slug一覧を画面表示用の名前に変換する
function getOptionLabels(
  slugs: string[] | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>,
): string[] {
  if (!Array.isArray(slugs)) {
    return [];
  }

  return slugs.map(
    (slug) =>
      options.find((option) => option.value === slug)?.label ?? slug,
  );
}

// 好きなポケモン一覧を取得する
// 新しい一覧がない場合は、従来のfavorite_pokemonを使用する。
function getFavoritePokemonList(user: UserDetail): string[] {
  if (
    Array.isArray(user.favorite_pokemon_list) &&
    user.favorite_pokemon_list.length > 0
  ) {
    return user.favorite_pokemon_list;
  }

  return user.favorite_pokemon
    ? [user.favorite_pokemon]
    : [];
}

// ユーザー詳細画面
function UserDetailPage() {
  // URLからuserIdを取得する
  //
  // 例えば /users/5 なら、
  // userId = "5" となる。
  const { userId } = useParams();

  // ユーザー情報を保存するstate
  // APIから取得する前はnull。
  const [user, setUser] = useState<UserDetail | null>(null);

  // エラーメッセージなどを保存するstate
  const [message, setMessage] = useState("");

  // 読み込み中かどうか
  const [isLoading, setIsLoading] = useState(true);

  // React Routerを使って別のページへ移動する
  const navigate = useNavigate();

  // ページが表示されたときにユーザー情報を取得する
  useEffect(() => {
    const getUser = async (): Promise<void> => {
      // URLから取得したuserIdが存在しない場合
      if (!userId) {
        setMessage("ユーザーIDが指定されていません");
        setIsLoading(false);
        return;
      }

      // ログイン時に保存したJWTを取得する
      const token = localStorage.getItem("access_token");

      if (!token) {
        setMessage("ログインしてください");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setMessage("");
        setUser(null);

        // FastAPIのユーザー詳細APIへアクセスする
        const response = await fetch(
          `${API_BASE_URL}/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // FastAPIから返されたJSONを取得する
        const data: UserDetail | { detail: string } =
          await response.json();

        // HTTPステータスが200番台ではない場合
        if (!response.ok) {
          if (
            "detail" in data &&
            typeof data.detail === "string"
          ) {
            setMessage(data.detail);
          } else {
            setMessage("ユーザー情報の取得に失敗しました");
          }

          return;
        }

        // ユーザー情報をstateに保存する
        if ("id" in data) {
          setUser(data);
        } else {
          setMessage("ユーザー情報を正しく取得できませんでした");
        }
      } catch (error) {
        // 通信エラーなどが発生した場合
        console.error(error);
        setMessage("通信エラーが発生しました。APIサーバーを確認してください。");
      } finally {
        setIsLoading(false);
      }
    };

    // ユーザー情報を取得する
    void getUser();
  }, [userId]);

  // 取得したユーザーの表示用データを準備する
  const favoritePokemonList = user
    ? getFavoritePokemonList(user)
    : [];

  const gameLabels = user
    ? getOptionLabels(user.game_slugs, GAME_OPTIONS)
    : [];

  const playStyleLabels = user
    ? getOptionLabels(user.play_style_slugs, PLAY_STYLE_OPTIONS)
    : [];

  // アップロード画像がある場合はアップロード画像を表示する
  const hasUploadedAvatar = Boolean(
    user &&
      (user.avatar_type === "upload" ||
        user.avatar_type === "uploaded") &&
      user.avatar_url,
  );

  // 画面に表示する内容
  return (
    <main className="pm-profile-page">
      {/* ページのタイトル */}
      <header className="pm-page-heading">
        <p className="pm-eyebrow">POKEMEET / TRAINER CARD</p>
        <h1>トレーナープロフィール</h1>
        <p>ポケモン好きなトレーナーのプロフィールです。</p>
      </header>

      {/* 読み込み中の表示 */}
      {isLoading && (
        <section className="pm-card pm-empty-state">
          <p>プロフィールを読み込み中...</p>
        </section>
      )}

      {/* エラーメッセージがある場合だけ表示 */}
      {!isLoading && message && (
        <p className="pm-message" role="status">
          {message}
        </p>
      )}

      {/* ユーザー情報が取得できた場合だけ表示 */}
      {!isLoading && user && (
        <>
          {/* ニックネーム・アイコン・ユーザーID */}
          <section className="pm-card pm-profile-hero">
            <div className="pm-avatar">
              {hasUploadedAvatar ? (
                <img
                  className="pm-avatar-image"
                  src={getAvatarImageUrl(user.avatar_url)}
                  alt={`${user.nickname}のプロフィール画像`}
                />
              ) : (
                <img
                  className="pm-avatar-image pm-avatar-preset-image"
                  src={getAvatarPresetImageUrl(user.avatar_preset)}
                  alt={getAvatarPresetLabel(user.avatar_preset)}
                />
              )}
            </div>

            <div className="pm-profile-hero-text">
              <p className="pm-eyebrow">POKEMEET TRAINER</p>

              <h2>{user.nickname}</h2>

              <p className="pm-muted">
                トレーナー ID：{user.id}
              </p>

              {user.language && (
                <p className="pm-muted">
                  使用言語：{user.language}
                </p>
              )}
            </div>
          </section>

          {/* プロフィール情報 */}
          <section className="pm-profile-info-grid">
            {/* 好きなポケモン */}
            <article className="pm-card pm-info-card">
              <span className="pm-info-icon" aria-hidden="true">
                ⭐
              </span>

              <p className="pm-info-label">
                好きなポケモン
              </p>

              {favoritePokemonList.length > 0 ? (
                <p className="pm-introduction">
                  {favoritePokemonList.join("、")}
                </p>
              ) : (
                <p className="pm-muted">未設定</p>
              )}
            </article>

            {/* プレイしているゲーム */}
            <article className="pm-card pm-info-card">
              <span className="pm-info-icon" aria-hidden="true">
                🎮
              </span>

              <p className="pm-info-label">
                プレイしているゲーム
              </p>

              {gameLabels.length > 0 ? (
                <p className="pm-introduction">
                  {gameLabels.join("、")}
                </p>
              ) : (
                <p className="pm-muted">未設定</p>
              )}
            </article>

            {/* プレイスタイル */}
            <article className="pm-card pm-info-card">
              <span className="pm-info-icon" aria-hidden="true">
                🤝
              </span>

              <p className="pm-info-label">
                プレイスタイル
              </p>

              {playStyleLabels.length > 0 ? (
                <p className="pm-introduction">
                  {playStyleLabels.join("、")}
                </p>
              ) : (
                <p className="pm-muted">未設定</p>
              )}
            </article>

            {/* 使用言語 */}
            <article className="pm-card pm-info-card">
              <span className="pm-info-icon" aria-hidden="true">
                🌐
              </span>

              <p className="pm-info-label">
                使用言語
              </p>

              {user.language ? (
                <h3>{user.language}</h3>
              ) : (
                <p className="pm-muted">未設定</p>
              )}
            </article>

            {/* 性別 */}
            <article className="pm-card pm-info-card">
              <span className="pm-info-icon" aria-hidden="true">
                👤
              </span>

              <p className="pm-info-label">
                性別
              </p>

              {user.gender ? (
                <h3>{user.gender}</h3>
              ) : (
                <p className="pm-muted">
                  未設定または非公開
                </p>
              )}
            </article>

            {/* フレンドコード */}
            <article className="pm-card pm-info-card">
              <span className="pm-info-icon" aria-hidden="true">
                🔑
              </span>

              <p className="pm-info-label">
                フレンドコード
              </p>

              {user.friend_code ? (
                <h3>{user.friend_code}</h3>
              ) : (
                <p className="pm-muted">
                  未設定または非公開
                </p>
              )}
            </article>

            {/* 自己紹介 */}
            <article className="pm-card pm-info-card pm-introduction-card">
              <span className="pm-info-icon" aria-hidden="true">
                💬
              </span>

              <p className="pm-info-label">
                自己紹介
              </p>

              {user.introduction ? (
                <p className="pm-introduction">
                  {user.introduction}
                </p>
              ) : (
                <p className="pm-muted">
                  自己紹介はまだ設定されていません。
                </p>
              )}
            </article>
          </section>
        </>
      )}

      {/* ユーザー一覧に戻るボタン */}
      <div className="pm-page-footer">
        <button
          className="pm-button pm-button-secondary"
          type="button"
          onClick={() => navigate("/users")}
        >
          ← ユーザー一覧に戻る
        </button>
      </div>
    </main>
  );
}

// UserDetailPageを他のファイルから使用できるようにする
export default UserDetailPage;
