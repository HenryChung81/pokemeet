
 // Reactの状態管理・初回処理に使用する機能
import { useEffect, useState } from "react";

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
        "http://127.0.0.1:8000/me",
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
        "http://127.0.0.1:8000/me/profile-visibility",
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
        "http://127.0.0.1:8000/me",
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
        "http://127.0.0.1:8000/me/profile-visibility",
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

              <div className="pm-avatar" aria-hidden="true">
                ⚡
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
