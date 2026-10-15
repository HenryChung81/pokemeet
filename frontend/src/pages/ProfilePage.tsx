 // Reactの状態管理・初回処理に使用する機能
import { useEffect, useState, type ChangeEvent } from "react";

// React Routerからページ移動に使う機能を読み込む
import { useNavigate } from "react-router-dom";
import "./ProfilePages.css";


// プロフィール情報の型
interface UserProfile {

  // ユーザーID
  id: number;

  // 他のユーザーに表示する名前
  nickname: string;

  // 好きなポケモン
  favorite_pokemon: string | null;

  // 使用する言語
  language: string | null;

  // 自己紹介
  introduction: string | null;

  // プロフィール画像の種類（プリセットまたはアップロード画像）
  avatar_type?: string | null;

  // 選択中のプリセットアイコン
  avatar_preset?: string | null;

  // アップロード画像のURL
  avatar_url?: string | null;
}


// プロフィール更新APIのレスポンス
interface UpdateResponse {

  // 更新成功時のメッセージ
  message?: string;

  // エラー時のメッセージ
  detail?: string;
}


// プロフィール公開設定APIのレスポンス
interface VisibilityResponse {
  message?: string;
  detail?: string;
  is_profile_public?: boolean;
}


// プロフィール画像アップロードAPIのレスポンス
interface AvatarUploadResponse {
  message?: string;
  detail?: string;
  avatar_type?: string;
  avatar_url?: string;
}


// プロフィール画像のプリセット一覧
const AVATAR_PRESETS = [
  { value: "pokeball", label: "モンスターボール", emoji: "⚪" },
  { value: "pikachu", label: "ピカチュウ", emoji: "⚡" },
  { value: "eevee", label: "イーブイ", emoji: "🟤" },
  { value: "charizard", label: "リザードン", emoji: "🔥" },
  { value: "blastoise", label: "カメックス", emoji: "💧" },
] as const;


// FastAPIのベースURL
const API_BASE_URL = "http://127.0.0.1:8000";


// プリセット名から画面表示用の絵文字を取得する
function getAvatarPresetEmoji(preset: string | null | undefined): string {
  return AVATAR_PRESETS.find((item) => item.value === preset)?.emoji ?? "⚪";
}


// 画像URLが相対パスの場合はFastAPIのURLを付ける
function getAvatarImageUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}


// マイプロフィール画面
function ProfilePage() {

  // 現在のユーザー情報
  const [user, setUser] =
    useState<UserProfile | null>(null);


  // ニックネーム入力用
  const [nickname, setNickname] =
    useState("");


  // 好きなポケモン入力用
  const [favoritePokemon, setFavoritePokemon] =
    useState("");


  // 言語入力用
  const [language, setLanguage] =
    useState("");


  // 自己紹介入力用
  const [introduction, setIntroduction] =
    useState("");


  // メッセージ表示用
  const [message, setMessage] =
    useState("");


  // 編集モードかどうか
  const [isEditing, setIsEditing] =
    useState(false);


  // 保存中かどうか
  const [isSaving, setIsSaving] =
    useState(false);


  // プロフィールを公開するかどうか
  const [isProfilePublic, setIsProfilePublic] =
    useState(true);


  // 公開設定の保存中かどうか
  const [isSavingVisibility, setIsSavingVisibility] =
    useState(false);


  // アップロードする画像ファイル
  const [selectedAvatarFile, setSelectedAvatarFile] =
    useState<File | null>(null);

  // 選択した画像のプレビューURL
  const [avatarPreviewUrl, setAvatarPreviewUrl] =
    useState("");

  // 画像アップロード中かどうか
  const [isUploadingAvatar, setIsUploadingAvatar] =
    useState(false);

  // プリセットアイコンの保存中かどうか
  const [isSavingAvatarPreset, setIsSavingAvatarPreset] =
    useState(false);

  // 選択中のプリセットアイコン
  const [selectedAvatarPreset, setSelectedAvatarPreset] =
    useState("pokeball");


  // ページ移動に使用する
  const navigate = useNavigate();


  // 自分のプロフィールを取得する関数
  const getMyProfile = async (): Promise<void> => {

    // localStorageからJWTを取得
    const token =
      localStorage.getItem("access_token");


    // JWTがない場合
    if (!token) {

      setMessage("ログインしてください");

      return;
    }


    try {

      // FastAPIのプロフィール取得APIへアクセス
      const response = await fetch(
        `${API_BASE_URL}/me`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      // FastAPIから返されたJSONを取得
      const data = await response.json();


      // エラーの場合
      if (!response.ok) {

        setMessage(
          data.detail ||
          "プロフィールの取得に失敗しました"
        );

        return;
      }


      // プロフィール情報を保存
      setUser(data);

      // 現在のプリセットアイコンを選択状態にする
      setSelectedAvatarPreset(data.avatar_preset || "pokeball");


      // 編集フォームにも現在の値を設定
      setNickname(data.nickname || "");

      setFavoritePokemon(
        data.favorite_pokemon || ""
      );

      setLanguage(
        data.language || ""
      );

      setIntroduction(
        data.introduction || ""
      );


      // プロフィール公開設定を取得する
      const visibilityResponse = await fetch(
        `${API_BASE_URL}/me/profile-visibility`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      // 公開設定APIから返されたJSON
      const visibilityData: VisibilityResponse =
        await visibilityResponse.json();


      // 公開設定の取得に成功した場合
      if (visibilityResponse.ok) {

        setIsProfilePublic(
          visibilityData.is_profile_public ?? true
        );

      } else {

        setMessage(
          visibilityData.detail ||
          "公開設定の取得に失敗しました"
        );
      }

    } catch (error) {

      // 通信エラー
      console.error(error);

      setMessage(
        "通信エラーが発生しました"
      );
    }
  };


  // ページを開いたときにプロフィールを取得
  useEffect(() => {

    void getMyProfile();

  }, []);


  // プレビュー用に作成した一時URLを解放する
  //
  // ファイルを選び直したときやページを離れたときに、
  // 不要になったObject URLを解放する。
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);


  // 選択した画像ファイルを確認し、プレビューを表示する
  const handleAvatarFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {

    const file = event.target.files?.[0] ?? null;

    // ファイル選択がキャンセルされた場合
    if (!file) {
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl("");
      return;
    }

    // バックエンドと同じ5MB制限を事前に確認する
    if (file.size > 5 * 1024 * 1024) {
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl("");
      setMessage("画像サイズは5MB以下にしてください");
      event.target.value = "";
      return;
    }

    // 対応している画像形式だけを受け付ける
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl("");
      setMessage("JPEG・PNG・WebP形式の画像を選択してください");
      event.target.value = "";
      return;
    }

    // 選択したファイルを保存し、プレビュー用URLを作る
    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setMessage("");

    // 同じファイルを再度選択した場合もchangeイベントが発生するようにする
    event.target.value = "";
  };


  // 選択した画像をプロフィール画像としてアップロードする
  const handleAvatarUpload = async (): Promise<void> => {

    // JWTを取得
    const token = localStorage.getItem("access_token");

    // JWTがない場合
    if (!token) {
      setMessage("ログインしてください");
      return;
    }

    // 画像が選択されていない場合
    if (!selectedAvatarFile) {
      setMessage("アップロードする画像を選択してください");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setMessage("");

      // ファイルアップロードではFormDataを使用する
      const formData = new FormData();
      formData.append("file", selectedAvatarFile);

      // Content-Typeは手動設定しない。
      // ブラウザがmultipart/form-dataの境界情報を設定する。
      const response = await fetch(
        `${API_BASE_URL}/me/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data: AvatarUploadResponse = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
          "プロフィール画像のアップロードに失敗しました"
        );
        return;
      }

      // アップロード成功後、選択中のファイルをクリアする
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl("");

      setMessage(
        data.message ||
        "プロフィール画像をアップロードしました"
      );

      // 最新のプロフィール情報を取得する
      await getMyProfile();

    } catch (error) {
      console.error(error);
      setMessage("通信エラーが発生しました");
    } finally {
      setIsUploadingAvatar(false);
    }
  };


  // 選択したプリセットアイコンをプロフィールに設定する
  const handleAvatarPresetUpdate = async (
    preset: string
  ): Promise<void> => {

    // JWTを取得
    const token = localStorage.getItem("access_token");

    if (!token) {
      setMessage("ログインしてください");
      return;
    }

    if (!user) {
      setMessage("プロフィール情報を取得してください");
      return;
    }

    try {
      setIsSavingAvatarPreset(true);
      setMessage("");

      // UserUpdateではnicknameが必須なので、現在の値も送信する。
      // ほかのプロフィール項目は送信せず、アイコンだけを更新する。
      const response = await fetch(
        `${API_BASE_URL}/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nickname: user.nickname,
            avatar_preset: preset,
          }),
        }
      );

      const data: UpdateResponse = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
          "プロフィールアイコンの変更に失敗しました"
        );
        return;
      }

      setMessage(
        data.message ||
        "プロフィールアイコンを変更しました"
      );

      // 最新のプロフィール情報を取得する
      await getMyProfile();

    } catch (error) {
      console.error(error);
      setMessage("通信エラーが発生しました");
    } finally {
      setIsSavingAvatarPreset(false);
    }
  };


  // プロフィール更新処理
  const handleUpdate = async (): Promise<void> => {

    // JWTを取得
    const token =
      localStorage.getItem("access_token");


    // JWTがない場合
    if (!token) {

      setMessage("ログインしてください");

      return;
    }


    try {

      // 保存中にする
      setIsSaving(true);

      // メッセージをクリア
      setMessage("");


      // FastAPIのプロフィール更新APIへアクセス
      const response = await fetch(
        `${API_BASE_URL}/me`,
        {
          // 更新なのでPUT
          method: "PUT",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          // 更新するプロフィール情報
          //
          // login_idは送らない。
          // login_idは変更できない設計。
          body: JSON.stringify({

            nickname: nickname,

            favorite_pokemon:
              favoritePokemon || null,

            language:
              language || null,

            introduction:
              introduction || null,
          }),
        }
      );


      // FastAPIから返されたJSON
      const data: UpdateResponse =
        await response.json();


      // 更新失敗
      if (!response.ok) {

        setMessage(
          data.detail ||
          "プロフィールの更新に失敗しました"
        );

        return;
      }


      // 更新成功
      setMessage(
        data.message ||
        "プロフィールを更新しました"
      );


      // 編集モードを終了
      setIsEditing(false);


      // 最新プロフィールを再取得
      await getMyProfile();

    } catch (error) {

      // 通信エラー
      console.error(error);

      setMessage(
        "通信エラーが発生しました"
      );

    } finally {

      // 保存中を解除
      setIsSaving(false);
    }
  };


  // プロフィール公開設定の更新処理
  const handleVisibilityUpdate = async (): Promise<void> => {

    // JWTを取得
    const token =
      localStorage.getItem("access_token");


    // JWTがない場合
    if (!token) {

      setMessage("ログインしてください");

      return;
    }


    try {

      // 保存中にする
      setIsSavingVisibility(true);

      // メッセージをクリア
      setMessage("");


      // FastAPIの公開設定更新APIへアクセス
      const response = await fetch(
        `${API_BASE_URL}/me/profile-visibility`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          // 更新する公開設定
          body: JSON.stringify({
            is_profile_public: isProfilePublic,
          }),
        }
      );


      // FastAPIから返されたJSON
      const data: VisibilityResponse =
        await response.json();


      // 更新失敗
      if (!response.ok) {

        setMessage(
          data.detail ||
          "公開設定の更新に失敗しました"
        );

        return;
      }


      // 更新成功
      setIsProfilePublic(
        data.is_profile_public ?? isProfilePublic
      );

      setMessage(
        data.message ||
        "公開設定を更新しました"
      );

    } catch (error) {

      // 通信エラー
      console.error(error);

      setMessage(
        "通信エラーが発生しました"
      );

    } finally {

      // 保存中を解除
      setIsSavingVisibility(false);
    }
  };


  // 編集をキャンセルする処理
  const handleCancel = (): void => {

    // 現在保存されているプロフィールの値に戻す
    if (user) {

      setNickname(
        user.nickname
      );

      setFavoritePokemon(
        user.favorite_pokemon || ""
      );

      setLanguage(
        user.language || ""
      );

      setIntroduction(
        user.introduction || ""
      );
    }


    // 編集モード終了
    setIsEditing(false);

    // メッセージをクリア
    setMessage("");
  };


  return (
    <main className="pm-profile-page">

      {/* アプリのタイトルとページタイトル */}
      <header className="pm-page-heading">
        <p className="pm-eyebrow">POKEMEET / MY PROFILE</p>
        <h1>マイプロフィール</h1>
        <p>プロフィール情報と公開範囲を設定できます。</p>
      </header>


      {/* メッセージ */}
      {message && (
        <p className="pm-message" role="status">
          {message}
        </p>
      )}


      {/* プロフィールが取得できた場合 */}
      {user && (

        <>

          {/* 表示モード */}
          {!isEditing && (

            <section className="pm-card pm-profile-hero">

              <div className="pm-avatar">
                {user.avatar_type === "upload" && user.avatar_url ? (
                  <img
                    className="pm-avatar-image"
                    src={getAvatarImageUrl(user.avatar_url)}
                    alt={`${user.nickname}のプロフィール画像`}
                  />
                ) : (
                  <span aria-hidden="true">
                    {getAvatarPresetEmoji(user.avatar_preset)}
                  </span>
                )}
              </div>

              <div className="pm-profile-hero-text">

                <p className="pm-eyebrow">POKEMEET TRAINER</p>

                <h2>
                  {user.nickname}
                </h2>

                <p className="pm-muted">
                  トレーナー ID：{user.id}
                </p>

              </div>

              {/* 編集ボタン */}
              <button
                className="pm-button pm-button-primary"
                type="button"
                onClick={() =>
                  setIsEditing(true)
                }
              >
                プロフィールを編集
              </button>

            </section>
          )}


          {/* 編集モード */}
          {isEditing && (

            <section className="pm-card">

              <div className="pm-section-heading">
                <h2>プロフィール編集</h2>
                <p className="pm-muted">
                  他のユーザーに表示する情報を編集できます。
                </p>
              </div>

              <div className="pm-profile-form">

                {/* プロフィール画像 */}
                <section className="pm-avatar-editor">
                  <div className="pm-section-heading">
                    <h3>プロフィール画像</h3>
                    <p className="pm-muted">
                      画像をアップロードするか、プリセットアイコンを選択できます。
                    </p>
                  </div>

                  <div className="pm-avatar-editor-main">
                    <div className="pm-avatar pm-avatar-editor-preview">
                      {avatarPreviewUrl ? (
                        <img
                          className="pm-avatar-image"
                          src={avatarPreviewUrl}
                          alt="選択した画像のプレビュー"
                        />
                      ) : user.avatar_type === "upload" && user.avatar_url ? (
                        <img
                          className="pm-avatar-image"
                          src={getAvatarImageUrl(user.avatar_url)}
                          alt={`${user.nickname}のプロフィール画像`}
                        />
                      ) : (
                        <span aria-hidden="true">
                          {getAvatarPresetEmoji(selectedAvatarPreset)}
                        </span>
                      )}
                    </div>

                    <div className="pm-avatar-editor-controls">
                      <label className="pm-form-field">
                        画像ファイル（JPEG・PNG・WebP、5MB以下）
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAvatarFileChange}
                        />
                      </label>

                      <div className="pm-actions">
                        <button
                          className="pm-button pm-button-primary"
                          type="button"
                          onClick={() => void handleAvatarUpload()}
                          disabled={!selectedAvatarFile || isUploadingAvatar}
                        >
                          {isUploadingAvatar
                            ? "アップロード中..."
                            : "画像をアップロード"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pm-avatar-presets">
                    <p className="pm-info-label">プリセットアイコン</p>

                    <div className="pm-avatar-preset-list">
                      {AVATAR_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          className={`pm-avatar-preset ${
                            selectedAvatarPreset === preset.value
                              ? "is-selected"
                              : ""
                          }`}
                          type="button"
                          aria-pressed={selectedAvatarPreset === preset.value}
                          onClick={() => setSelectedAvatarPreset(preset.value)}
                          disabled={isSavingAvatarPreset}
                        >
                          <span
                            className="pm-avatar-preset-emoji"
                            aria-hidden="true"
                          >
                            {preset.emoji}
                          </span>
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>

                    <button
                      className="pm-button pm-button-secondary"
                      type="button"
                      onClick={() =>
                        void handleAvatarPresetUpdate(selectedAvatarPreset)
                      }
                      disabled={isSavingAvatarPreset || isUploadingAvatar}
                    >
                      {isSavingAvatarPreset
                        ? "保存中..."
                        : "選択したアイコンを設定"}
                    </button>
                  </div>
                </section>

                {/* ニックネーム */}
                <label className="pm-form-field">
                  ニックネーム

                  <input
                    type="text"
                    value={nickname}
                    onChange={(event) =>
                      setNickname(
                        event.target.value
                      )
                    }
                  />
                </label>


                {/* 好きなポケモン */}
                <label className="pm-form-field">
                  好きなポケモン

                  <input
                    type="text"
                    value={favoritePokemon}
                    onChange={(event) =>
                      setFavoritePokemon(
                        event.target.value
                      )
                    }
                  />
                </label>


                {/* 言語 */}
                <label className="pm-form-field">
                  言語

                  <input
                    type="text"
                    value={language}
                    onChange={(event) =>
                      setLanguage(
                        event.target.value
                      )
                    }
                  />
                </label>


                {/* 自己紹介 */}
                <label className="pm-form-field">
                  自己紹介

                  <textarea
                    rows={5}
                    value={introduction}
                    onChange={(event) =>
                      setIntroduction(
                        event.target.value
                      )
                    }
                  />
                </label>


                {/* 保存・キャンセルボタン */}
                <div className="pm-actions">

                  <button
                    className="pm-button pm-button-primary"
                    type="button"
                    onClick={() => void handleUpdate()}
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "保存中..."
                      : "プロフィールを保存する"}
                  </button>


                  <button
                    className="pm-button pm-button-secondary"
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    キャンセル
                  </button>

                </div>

              </div>

            </section>
          )}


          {/* プロフィールの公開設定 */}
          <section className="pm-card pm-visibility-card">

            <div className="pm-section-heading">
              <h2>公開設定</h2>
              <p className="pm-muted">
                ユーザー一覧やプロフィール詳細での表示範囲を設定します。
              </p>
            </div>


            {/* 公開・非公開を選択する */}
            <label className="pm-visibility-option">

              <input
                type="checkbox"
                checked={isProfilePublic}
                onChange={(event) =>
                  setIsProfilePublic(
                    event.target.checked
                  )
                }
              />

              <span className="pm-visibility-copy">

                <strong>
                  プロフィールを公開する
                </strong>

                <span>
                  オンにすると、他の一般ユーザーの一覧に表示され、
                  プロフィール詳細も閲覧できるようになります。
                </span>

                <span>
                  オフにすると、管理者と自分以外には表示されません。
                </span>

              </span>

            </label>


            {/* 公開設定の保存ボタン */}
            <button
              className="pm-button pm-button-primary"
              type="button"
              onClick={() => void handleVisibilityUpdate()}
              disabled={isSavingVisibility}
            >
              {isSavingVisibility
                ? "保存中..."
                : "公開設定を保存する"}
            </button>

          </section>

        </>
      )}


      {/* ユーザー一覧へ戻る */}
      <div className="pm-page-footer">

        <button
          className="pm-button pm-button-secondary"
          type="button"
          onClick={() =>
            navigate("/users")
          }
        >
          ← ユーザー一覧に戻る
        </button>

      </div>

    </main>
  );
}


// 他のファイルから使用できるようにする
export default ProfilePage;