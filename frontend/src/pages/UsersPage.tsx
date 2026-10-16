
 // Reactの状態管理機能と、ページ表示時の処理に使う機能を読み込む
import { useCallback, useEffect, useState } from "react";

// React Routerから、別のページへ移動するための機能を読み込む
import { useNavigate } from "react-router-dom";

// 共通のユーザー情報の型を読み込む
import type { User } from "../types/user";

// ユーザー一覧APIから取得する追加プロフィール項目
// 共通のUser型が古い場合でも、この画面で追加項目を安全に扱えるようにする。
interface UserListItem extends User {
  favorite_pokemon_list?: string[] | null;
  avatar_type?: string | null;
  avatar_preset?: string | null;
  avatar_url?: string | null;
  game_slugs?: string[] | null;
  play_style_slugs?: string[] | null;
}

// プロフィール画像のプリセット一覧
const AVATAR_PRESETS: Record<string, string> = {
  pokeball:
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
  pikachu:
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
  eevee:
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png",
  venusaur:
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png",
  charizard:
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
  blastoise:
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png",
};

// プロフィール画面と同じゲーム名を使用する
const GAME_OPTIONS = [
  { value: "pokemon-sv", label: "ポケモン スカーレット・バイオレット" },
  { value: "pokemon-go", label: "Pokémon GO" },
  { value: "pokemon-sleep", label: "Pokémon Sleep" },
  { value: "pokemon-tcg-pocket", label: "Pokémon TCG Pocket" },
  { value: "pokemon-legends-za", label: "Pokémon LEGENDS Z-A" },
  { value: "pokemon-unite", label: "Pokémon UNITE" },
  { value: "pokemon-masters-ex", label: "Pokémon Masters EX" },
] as const;

// プロフィール画面と同じプレイスタイル名を使用する
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

// FastAPIのベースURL
const API_BASE_URL = "http://127.0.0.1:8000";

// アップロード画像のURLが相対パスなら、FastAPIのURLを付ける
function getAvatarImageUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}

// ユーザーのプロフィール画像URLを取得する
function getUserAvatarUrl(user: UserListItem): string {
  if (user.avatar_type === "upload" && user.avatar_url) {
    return getAvatarImageUrl(user.avatar_url);
  }

  return (
    AVATAR_PRESETS[user.avatar_preset || "pokeball"] ||
    AVATAR_PRESETS.pokeball
  );
}

// 新形式の好きなポケモン一覧を優先し、旧形式にも対応する
function getFavoritePokemonList(user: UserListItem): string[] {
  if (
    Array.isArray(user.favorite_pokemon_list) &&
    user.favorite_pokemon_list.length > 0
  ) {
    return user.favorite_pokemon_list;
  }

  return user.favorite_pokemon ? [user.favorite_pokemon] : [];
}

// ゲームslugを画面表示用の名前に変換する
function getGameLabel(slug: string): string {
  return GAME_OPTIONS.find((item) => item.value === slug)?.label || slug;
}

// プレイスタイルslugを画面表示用の名前に変換する
function getPlayStyleLabel(slug: string): string {
  return (
    PLAY_STYLE_OPTIONS.find((item) => item.value === slug)?.label || slug
  );
}

// ユーザー一覧画面
function UsersPage() {
  // ユーザー一覧を保存するstate
  const [users, setUsers] = useState<UserListItem[]>([]);

  // エラーメッセージなどを保存するstate
  const [message, setMessage] = useState("");

  // 読み込み中かどうかを保存するstate
  const [isLoading, setIsLoading] = useState(false);

  // 検索キーワードを保存するstate
  const [searchText, setSearchText] = useState("");

  // ページ移動に使う
  const navigate = useNavigate();

  // ログアウト処理
  const handleLogout = (): void => {
    // localStorageに保存しているJWTを削除する
    localStorage.removeItem("access_token");

    // ログイン画面へ移動する
    navigate("/");
  };

  // ユーザー一覧を取得する処理
  const getUsers = useCallback(async (): Promise<void> => {
    // localStorageからJWTを取得する
    const token = localStorage.getItem("access_token");

    // JWTがない場合
    if (!token) {
      setMessage("ログインしてください");
      setUsers([]);
      return;
    }

    try {
      // 読み込み中にする
      setIsLoading(true);

      // エラーメッセージをクリアする
      setMessage("");

      // FastAPIのユーザー一覧APIへアクセスする
      const response = await fetch("http://127.0.0.1:8000/users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // FastAPIから返されたJSONを取得する
      const data: UserListItem[] | { detail?: string } =
        await response.json();

      // HTTPステータスが200番台ではない場合
      if (!response.ok) {
        if (response.status === 401) {
          setMessage(
            "ログインの有効期限が切れています。再ログインしてください。",
          );
          setUsers([]);
          return;
        }

        setMessage(
          "detail" in data && data.detail
            ? data.detail
            : "ユーザー一覧の取得に失敗しました",
        );
        setUsers([]);
        return;
      }

      // 取得したユーザー一覧をstateに保存する
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
        setMessage("ユーザー一覧のデータ形式が正しくありません");
      }
    } catch (error) {
      // 通信エラーなどが発生した場合
      console.error(error);
      setMessage("通信エラーが発生しました");
    } finally {
      // 読み込み中を解除する
      setIsLoading(false);
    }
  }, []);

  // ページを開いたときにユーザー一覧を取得する
  useEffect(() => {
    void getUsers();
  }, [getUsers]);

  // 検索キーワードに一致するユーザーだけを表示する
  const keyword = searchText.trim().toLowerCase();

  const filteredUsers = users.filter((user) => {
    const favoritePokemon = getFavoritePokemonList(user).join(" ");
    const games = (user.game_slugs || []).map(getGameLabel).join(" ");
    const playStyles = (user.play_style_slugs || [])
      .map(getPlayStyleLabel)
      .join(" ");

    const searchableText = [
      user.nickname,
      user.favorite_pokemon || "",
      favoritePokemon,
      user.language || "",
      user.introduction || "",
      games,
      playStyles,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(keyword);
  });

  // 画面に表示する内容
  return (
    <>
      {/* ユーザー一覧画面専用のデザイン */}
      <style>{`
        .users-page {
          min-height: calc(100vh - 80px);
          padding: 38px 24px 64px;
          background: #f5f7fc;
          color: #172033;
          box-sizing: border-box;
        }

        .users-container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
        }

        .users-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .users-eyebrow {
          margin: 0 0 8px;
          color: #3267f6;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 2px;
        }

        .users-heading h1 {
          margin: 0;
          color: #172033;
          font-size: clamp(26px, 3vw, 34px);
          font-weight: 850;
          letter-spacing: -0.8px;
        }

        .users-subtitle {
          margin: 8px 0 0;
          color: #7b879c;
          font-size: 14px;
          line-height: 1.7;
        }

        .users-actions {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
        }

        .users-button {
          border: 1px solid #e0e7f3;
          border-radius: 12px;
          padding: 11px 15px;
          background: #ffffff;
          color: #344054;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s, transform 0.18s;
        }

        .users-button:hover {
          transform: translateY(-1px);
          border-color: #c7d7ff;
          background: #f9fbff;
        }

        .users-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
          padding: 14px 16px;
          border: 1px solid #e5eaf4;
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 5px 18px rgba(23, 32, 51, 0.025);
        }

        .users-search {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 560px;
          padding: 0 13px;
          border: 1px solid #e1e8f5;
          border-radius: 12px;
          background: #f8faff;
          box-sizing: border-box;
          transition: border-color 0.18s, box-shadow 0.18s;
        }

        .users-search:focus-within {
          border-color: #8eafff;
          box-shadow: 0 0 0 3px rgba(50, 103, 246, 0.09);
        }

        .users-search-icon {
          color: #7d8ba5;
          font-size: 20px;
        }

        .users-search input {
          width: 100%;
          min-width: 0;
          padding: 12px 0;
          border: 0;
          outline: none;
          background: transparent;
          color: #172033;
          font-size: 14px;
        }

        .users-search input::placeholder {
          color: #9aa5b8;
        }

        .users-count {
          color: #7b879c;
          font-size: 13px;
          white-space: nowrap;
        }

        .users-count strong {
          margin-right: 4px;
          color: #172033;
          font-size: 21px;
          font-weight: 850;
        }

        .users-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
          gap: 18px;
        }

        .user-card {
          position: relative;
          display: flex;
          min-width: 0;
          flex-direction: column;
          padding: 20px;
          overflow: hidden;
          border: 1px solid #e4eaf5;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 7px 22px rgba(23, 32, 51, 0.035);
          transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
        }

        .user-card::before {
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          height: 4px;
          background: linear-gradient(90deg, #4b79ff, #9bb7ff);
          content: "";
          opacity: 0;
          transition: opacity 0.18s;
        }

        .user-card:hover {
          transform: translateY(-3px);
          border-color: #cbd9ff;
          box-shadow: 0 13px 28px rgba(42, 76, 150, 0.09);
        }

        .user-card:hover::before {
          opacity: 1;
        }

        .user-card-top {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          margin-bottom: 17px;
        }

        .user-avatar {
          position: relative;
          display: flex;
          width: 66px;
          height: 66px;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          border: 1px solid #e1e9ff;
          border-radius: 19px;
          background: linear-gradient(145deg, #edf3ff, #e3ebff);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .user-avatar-fallback {
          color: #3267f6;
          font-size: 26px;
          font-weight: 850;
        }

        .user-avatar-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          padding: 5px;
          box-sizing: border-box;
          object-fit: contain;
        }

        .user-avatar-image.is-upload {
          padding: 0;
          object-fit: cover;
        }

        .user-card-identity {
          min-width: 0;
          flex: 1;
        }

        .user-card-name {
          margin: 0;
          overflow-wrap: anywhere;
          color: #172033;
          font-size: 17px;
          font-weight: 850;
          line-height: 1.45;
        }

        .user-card-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
          margin-top: 5px;
        }

        .user-card-id {
          margin: 0;
          color: #98a2b3;
          font-size: 11px;
        }

        .user-language {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 999px;
          background: #f1f5ff;
          color: #5571aa;
          font-size: 10px;
          font-weight: 750;
        }

        .user-card-content {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 15px;
        }

        .user-card-block {
          min-width: 0;
        }

        .user-card-label {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 0 0 8px;
          color: #7c879b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.2px;
        }

        .user-card-label-icon {
          font-size: 13px;
        }

        .user-chip-list {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          flex-wrap: wrap;
        }

        .user-chip {
          display: inline-flex;
          max-width: 100%;
          align-items: center;
          padding: 6px 9px;
          overflow: hidden;
          border: 1px solid #e5ebf8;
          border-radius: 9px;
          background: #f7f9ff;
          color: #45536d;
          font-size: 11px;
          font-weight: 650;
          line-height: 1.4;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-chip-more {
          background: #eef3ff;
          color: #3267d9;
        }

        .user-card-empty {
          margin: 0;
          color: #a0a9b8;
          font-size: 12px;
        }

        .user-card-introduction {
          margin: 0;
          color: #58657b;
          font-size: 12px;
          line-height: 1.75;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }

        .user-card-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          margin-top: 19px;
          padding: 13px 14px;
          border: 1px solid #e1eaff;
          border-radius: 12px;
          background: #f4f7ff;
          color: #3267e8;
          font-size: 12px;
          font-weight: 850;
          text-align: left;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
        }

        .user-card-link:hover {
          border-color: #b9ccff;
          background: #eaf0ff;
        }

        .user-card-link-arrow {
          font-size: 17px;
          transition: transform 0.18s;
        }

        .user-card-link:hover .user-card-link-arrow {
          transform: translateX(3px);
        }

        .users-message {
          padding: 14px 16px;
          margin: 0 0 20px;
          border: 1px solid #ffd8d5;
          border-radius: 13px;
          background: #fff4f3;
          color: #b42318;
          font-size: 14px;
        }

        .users-empty {
          padding: 54px 20px;
          border: 1px dashed #d5deed;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.8);
          text-align: center;
        }

        .users-empty-icon {
          margin-bottom: 12px;
          font-size: 34px;
        }

        .users-empty h2 {
          margin: 0 0 8px;
          color: #263247;
          font-size: 18px;
        }

        .users-empty p {
          margin: 0;
          color: #8490a4;
          font-size: 13px;
          line-height: 1.8;
        }

        @media (max-width: 1000px) {
          .users-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .users-page {
            padding: 28px 16px 44px;
          }

          .users-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .users-actions {
            width: 100%;
          }

          .users-actions .users-button {
            flex: 1;
          }
        }

        @media (max-width: 560px) {
          .users-page {
            padding: 22px 12px 36px;
          }

          .users-heading h1 {
            font-size: 26px;
          }

          .users-toolbar {
            align-items: stretch;
            flex-direction: column;
            padding: 12px;
          }

          .users-search {
            max-width: none;
          }

          .users-count {
            text-align: right;
          }

          .users-grid {
            grid-template-columns: 1fr;
            gap: 13px;
          }

          .user-card {
            padding: 17px;
          }

          .user-avatar {
            width: 60px;
            height: 60px;
          }
        }
      `}</style>

      <main className="users-page">
        <div className="users-container">
          {/* ページタイトルと操作ボタン */}
          <header className="users-heading">
            <div>
              <p className="users-eyebrow">POKEMEET / TRAINERS</p>
              <h1>トレーナーを探す</h1>
              <p className="users-subtitle">
                好きなポケモンやプレイスタイルから、仲間を見つけよう。
              </p>
            </div>

            <div className="users-actions">
              <button
                className="users-button"
                type="button"
                onClick={() => navigate("/profile")}
              >
                マイプロフィール
              </button>

              <button
                className="users-button"
                type="button"
                onClick={handleLogout}
              >
                ログアウト
              </button>
            </div>
          </header>

          {/* 検索欄とユーザー数 */}
          <section className="users-toolbar">
            <label className="users-search">
              <span className="users-search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="名前・好きなポケモン・ゲームで検索"
                aria-label="ユーザーを検索"
              />
            </label>

            <div className="users-count" aria-live="polite">
              <strong>{filteredUsers.length}</strong>人
            </div>
          </section>

          {/* エラーメッセージを表示 */}
          {message && (
            <div className="users-message" role="alert">
              {message}
            </div>
          )}

          {/* 読み込み中の表示 */}
          {isLoading && users.length === 0 && !message && (
            <div className="users-empty">
              <div className="users-empty-icon" aria-hidden="true">
                ⏳
              </div>
              <h2>トレーナーを読み込んでいます</h2>
              <p>少しお待ちください。</p>
            </div>
          )}

          {/* ユーザーが存在する場合だけ一覧を表示 */}
          {!isLoading && !message && filteredUsers.length > 0 && (
            <div className="users-grid">
              {filteredUsers.map((user) => {
                const favoritePokemon = getFavoritePokemonList(user);
                const games = user.game_slugs || [];
                const avatarUrl = getUserAvatarUrl(user);
                const isUploadedAvatar = user.avatar_type === "upload";

                return (
                  <article className="user-card" key={user.id}>
                    {/* アイコンとニックネーム */}
                    <div className="user-card-top">
                      <div className="user-avatar">
                        <span
                          className="user-avatar-fallback"
                          aria-hidden="true"
                        >
                          {user.nickname?.charAt(0) || "?"}
                        </span>
                        {avatarUrl && (
                          <img
                            className={`user-avatar-image ${
                              isUploadedAvatar ? "is-upload" : ""
                            }`}
                            src={avatarUrl}
                            alt={`${user.nickname}のプロフィール画像`}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>

                      <div className="user-card-identity">
                        <h2 className="user-card-name">{user.nickname}</h2>
                        <div className="user-card-meta">
                          <p className="user-card-id">
                            TRAINER ID：{user.id}
                          </p>
                          {user.language && (
                            <span className="user-language">
                              🌐 {user.language}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="user-card-content">
                      {/* 好きなポケモン */}
                      <section className="user-card-block">
                        <p className="user-card-label">
                          <span
                            className="user-card-label-icon"
                            aria-hidden="true"
                          >
                            ⭐
                          </span>
                          好きなポケモン
                        </p>
                        {favoritePokemon.length > 0 ? (
                          <div className="user-chip-list">
                            {favoritePokemon.slice(0, 3).map((pokemon) => (
                              <span className="user-chip" key={pokemon}>
                                {pokemon}
                              </span>
                            ))}
                            {favoritePokemon.length > 3 && (
                              <span className="user-chip user-chip-more">
                                +{favoritePokemon.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="user-card-empty">
                            まだ設定されていません
                          </p>
                        )}
                      </section>

                      {/* プレイしているゲーム */}
                      <section className="user-card-block">
                        <p className="user-card-label">
                          <span
                            className="user-card-label-icon"
                            aria-hidden="true"
                          >
                            🎮
                          </span>
                          プレイしているゲーム
                        </p>
                        {games.length > 0 ? (
                          <div className="user-chip-list">
                            {games.slice(0, 2).map((slug) => (
                              <span className="user-chip" key={slug}>
                                {getGameLabel(slug)}
                              </span>
                            ))}
                            {games.length > 2 && (
                              <span className="user-chip user-chip-more">
                                +{games.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="user-card-empty">ゲーム未設定</p>
                        )}
                      </section>

                      {/* 自己紹介 */}
                      <section className="user-card-block">
                        <p className="user-card-label">
                          <span
                            className="user-card-label-icon"
                            aria-hidden="true"
                          >
                            💬
                          </span>
                          自己紹介
                        </p>
                        <p className="user-card-introduction">
                          {user.introduction || "自己紹介はまだありません。"}
                        </p>
                      </section>

                      {/* プロフィール詳細へ移動 */}
                      <button
                        className="user-card-link"
                        type="button"
                        onClick={() => navigate(`/users/${user.id}`)}
                      >
                        <span>トレーナープロフィールを見る</span>
                        <span
                          className="user-card-link-arrow"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* 検索結果が0件の場合 */}
          {!isLoading && !message && filteredUsers.length === 0 && (
            <div className="users-empty">
              <div className="users-empty-icon" aria-hidden="true">
                🔎
              </div>
              <h2>
                {users.length === 0
                  ? "トレーナーがまだいません"
                  : "トレーナーが見つかりません"}
              </h2>
              <p>
                {users.length === 0
                  ? "ユーザーが登録されると、ここに表示されます。"
                  : "別のキーワードで検索してみてください。"}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// UsersPageを他のファイルから使用できるようにする
export default UsersPage;
