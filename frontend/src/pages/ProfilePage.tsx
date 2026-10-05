// Reactの状態管理と副作用を使うための機能を読み込む
import {
  useEffect,
  useState,
} from "react";

// React Routerからページ移動に使う機能を読み込む
import { useNavigate } from "react-router-dom";


// FastAPIから取得するユーザー情報の型
interface User {

  // ユーザーID
  id: number;

  // ニックネーム
  nickname: string;

  // 好きなポケモン
  favorite_pokemon: string | null;

  // 使用言語
  language: string | null;

  // 自己紹介
  introduction: string | null;
}


// プロフィール更新APIへ送るデータの型
interface UserUpdate {

  // ニックネーム
  nickname: string;

  // 好きなポケモン
  favorite_pokemon: string | null;

  // 使用言語
  language: string | null;

  // 自己紹介
  introduction: string | null;
}


// FastAPIの更新APIが返すデータの型
interface UpdateResponse {

  // APIから返されるメッセージ
  message?: string;

  // エラー時のメッセージ
  detail?: string;
}


// マイプロフィール画面
function ProfilePage() {

  // 現在のユーザー情報を管理する
  const [user, setUser] =
    useState<User | null>(null);


  // エラーメッセージなどを管理する
  const [message, setMessage] =
    useState("");


  // 編集モードかどうかを管理する
  const [isEditing, setIsEditing] =
    useState(false);


  // 編集中のニックネーム
  const [nickname, setNickname] =
    useState("");


  // 編集中の好きなポケモン
  const [favoritePokemon, setFavoritePokemon] =
    useState("");


  // 編集中の言語
  const [language, setLanguage] =
    useState("");


  // 編集中の自己紹介
  const [introduction, setIntroduction] =
    useState("");


  // ページ移動に使う
  const navigate = useNavigate();


  // プロフィールを取得する関数
  const getMyProfile = async (): Promise<void> => {

    // localStorageからJWTを取得する
    const token =
      localStorage.getItem("access_token");


    // JWTがない場合
    if (!token) {

      setMessage("ログインしてください");

      return;
    }


    try {

      // FastAPIから自分のプロフィールを取得する
      const response = await fetch(
        "http://127.0.0.1:8000/me",
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      // FastAPIからJSONを取得する
      const data: User | {
        detail?: string;
      } = await response.json();


      // エラーの場合
      if (!response.ok) {

        setMessage(
          "detail" in data && data.detail
            ? data.detail
            : "プロフィールの取得に失敗しました"
        );

        return;
      }


      // ユーザー情報として保存する
      setUser(data as User);


      // 編集フォームにも現在の値を入れる
      const profile = data as User;

      setNickname(
        profile.nickname
      );

      setFavoritePokemon(
        profile.favorite_pokemon ?? ""
      );

      setLanguage(
        profile.language ?? ""
      );

      setIntroduction(
        profile.introduction ?? ""
      );

    } catch (error) {

      // 通信エラーなどをコンソールに表示
      console.error(error);

      setMessage(
        "通信エラーが発生しました"
      );
    }
  };


  // ページを開いたときにプロフィールを取得する
  useEffect(() => {

    getMyProfile();

  }, []);


  // プロフィールを更新する関数
  const handleUpdate = async (): Promise<void> => {

    // localStorageからJWTを取得する
    const token =
      localStorage.getItem("access_token");


    // JWTがない場合
    if (!token) {

      setMessage("ログインしてください");

      return;
    }


    // ニックネームが空の場合
    if (!nickname.trim()) {

      setMessage(
        "ニックネームを入力してください"
      );

      return;
    }


    try {

      // FastAPIのプロフィール更新APIへ送信する
      const response = await fetch(
        "http://127.0.0.1:8000/me",
        {
          // 更新なのでPUT
          method: "PUT",

          // JSONを送信する
          headers: {
            "Content-Type": "application/json",

            // JWTを送信する
            Authorization: `Bearer ${token}`,
          },

          // 更新するプロフィール情報
          body: JSON.stringify({
            nickname: nickname.trim(),

            favorite_pokemon:
              favoritePokemon.trim() || null,

            language:
              language.trim() || null,

            introduction:
              introduction.trim() || null,
          } satisfies UserUpdate),
        }
      );


      // FastAPIからJSONを取得する
      const data: UpdateResponse =
        await response.json();


      // 更新に失敗した場合
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


      // 編集モードを終了する
      setIsEditing(false);


      // 最新のプロフィールを取得する
      await getMyProfile();

    } catch (error) {

      // 通信エラーなどをコンソールに表示
      console.error(error);

      setMessage(
        "通信エラーが発生しました"
      );
    }
  };


  // 編集をキャンセルする
  const handleCancel = (): void => {

    // ユーザー情報が存在する場合
    if (user) {

      // 編集前の値に戻す
      setNickname(
        user.nickname
      );

      setFavoritePokemon(
        user.favorite_pokemon ?? ""
      );

      setLanguage(
        user.language ?? ""
      );

      setIntroduction(
        user.introduction ?? ""
      );
    }


    // 編集モードを終了する
    setIsEditing(false);


    // メッセージを消す
    setMessage("");
  };


  // 画面表示
  return (
    <div>

      {/* アプリタイトル */}
      <h1>PokeMeet</h1>


      {/* ページタイトル */}
      <h2>マイプロフィール</h2>


      {/* メッセージ */}
      {message && (
        <p>{message}</p>
      )}


      {/* ユーザー情報が取得できている場合 */}
      {user && (

        <div>

          {/* =========================
              表示モード
              ========================= */}

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
                {user.favorite_pokemon ||
                  "未設定"}
              </p>


              <p>
                言語：
                {user.language ||
                  "未設定"}
              </p>


              <p>
                自己紹介：
                {user.introduction ||
                  "未設定"}
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


          {/* =========================
              編集モード
              ========================= */}

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
              >
                保存する
              </button>


              {/* キャンセルボタン */}
              <button
                onClick={handleCancel}
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