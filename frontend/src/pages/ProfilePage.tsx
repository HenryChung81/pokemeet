// Reactの状態管理・初回処理に使用する機能
import { useEffect, useState } from "react";

// React Routerからページ移動に使う機能を読み込む
import { useNavigate } from "react-router-dom";


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

    getMyProfile();

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
    <div>

      {/* アプリのタイトル */}
      <h1>PokeMeet</h1>


      {/* ページタイトル */}
      <h2>マイプロフィール</h2>


      {/* メッセージ */}
      {message && (
        <p>{message}</p>
      )}


      {/* プロフィールが取得できた場合 */}
      {user && (

        <div>

          {/* 表示モード */}
          {!isEditing && (

            <div>

              <h3>
                {user.nickname}
              </h3>


              <p>
                ID：{user.id}
              </p>


              <p>
                好きなポケモン：
                {user.favorite_pokemon || "未設定"}
              </p>


              <p>
                言語：
                {user.language || "未設定"}
              </p>


              <p>
                自己紹介：
                {user.introduction || "未設定"}
              </p>


              {/* 編集ボタン */}
              <button
                onClick={() =>
                  setIsEditing(true)
                }
              >
                プロフィールを編集
              </button>

            </div>
          )}


          {/* 編集モード */}
          {isEditing && (

            <div>

              <h3>
                プロフィール編集
              </h3>


              {/* ニックネーム */}
              <div>

                <label>
                  ニックネーム
                </label>

                <br />

                <input
                  type="text"
                  value={nickname}
                  onChange={(event) =>
                    setNickname(
                      event.target.value
                    )
                  }
                />

              </div>


              <br />


              {/* 好きなポケモン */}
              <div>

                <label>
                  好きなポケモン
                </label>

                <br />

                <input
                  type="text"
                  value={favoritePokemon}
                  onChange={(event) =>
                    setFavoritePokemon(
                      event.target.value
                    )
                  }
                />

              </div>


              <br />


              {/* 言語 */}
              <div>

                <label>
                  言語
                </label>

                <br />

                <input
                  type="text"
                  value={language}
                  onChange={(event) =>
                    setLanguage(
                      event.target.value
                    )
                  }
                />

              </div>


              <br />


              {/* 自己紹介 */}
              <div>

                <label>
                  自己紹介
                </label>

                <br />

                <textarea
                  value={introduction}
                  onChange={(event) =>
                    setIntroduction(
                      event.target.value
                    )
                  }
                />

              </div>


              <br />


              {/* 保存ボタン */}
              <button
                onClick={handleUpdate}
                disabled={isSaving}
              >
                {isSaving
                  ? "保存中..."
                  : "保存する"}
              </button>


              {/* キャンセルボタン */}
              <button
                onClick={handleCancel}
                disabled={isSaving}
              >
                キャンセル
              </button>

            </div>
          )}

        </div>
      )}


      <br />


      {/* ユーザー一覧へ戻る */}
      <button
        onClick={() =>
          navigate("/users")
        }
      >
        ユーザー一覧に戻る
      </button>

    </div>
  );
}


// 他のファイルから使用できるようにする
export default ProfilePage;