// Reactの状態管理機能を読み込む
import { useState } from "react";

// React Routerから、
// ページ移動に使う機能を読み込む
import { useNavigate } from "react-router-dom";


// ユーザー登録APIが返すデータの型
interface RegisterResponse {

  // 登録成功時のメッセージ
  message?: string;

  // FastAPIでエラーが発生した場合のメッセージ
  detail?: string;
}


// ユーザー登録画面
function RegisterPage() {

  // ログインIDを管理するstate
  //
  // ログインするときに使用するID
  const [loginId, setLoginId] = useState("");


  // ニックネームを管理するstate
  //
  // 他のユーザーに表示する名前
  const [nickname, setNickname] = useState("");


  // パスワードを管理するstate
  const [password, setPassword] = useState("");


  // 好きなポケモンを管理するstate
  const [favoritePokemon, setFavoritePokemon] =
    useState("");


  // 使用言語を管理するstate
  const [language, setLanguage] =
    useState("");


  // 自己紹介を管理するstate
  const [introduction, setIntroduction] =
    useState("");


  // エラーメッセージなどを管理するstate
  const [message, setMessage] = useState("");


  // ページ移動に使う
  const navigate = useNavigate();


  // 登録ボタンを押したときに実行する処理
  const handleRegister = async (): Promise<void> => {

    try {

      // FastAPIのユーザー登録APIへアクセスする
      const response = await fetch(
        "http://127.0.0.1:8000/users",
        {
          // ユーザー登録なのでPOSTを使用する
          method: "POST",

          // JSON形式でデータを送信する
          headers: {
            "Content-Type": "application/json",
          },

          // 入力されたユーザー情報をJSONに変換する
          body: JSON.stringify({

            // ログインに使用するID
            login_id: loginId,

            // 他のユーザーに表示する名前
            nickname: nickname,

            // パスワード
            password: password,

            // 空文字ならnullとして送信する
            favorite_pokemon:
              favoritePokemon || null,

            language:
              language || null,

            introduction:
              introduction || null,
          }),
        }
      );


      // FastAPIから返されたJSONを取得する
      const data: RegisterResponse =
        await response.json();


      // HTTPステータスが200番台ではない場合
      if (!response.ok) {

        setMessage(
          data.detail ||
          "ユーザー登録に失敗しました"
        );

        return;
      }


      // 登録成功
      setMessage(
        data.message ||
        "ユーザーを登録しました"
      );


      // 少し待ってからログイン画面へ移動する
      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (error) {

      // 通信エラーなどが発生した場合
      console.error(error);

      setMessage(
        "サーバーとの通信に失敗しました"
      );
    }
  };


  // 画面に表示する内容
  return (
    <div>

      {/* アプリのタイトル */}
      <h1>PokeMeet</h1>


      {/* ページタイトル */}
      <h2>新規登録</h2>


      {/* ログインID */}
      <div>

        <label>
          ログインID
        </label>

        <br />

        <input
          type="text"
          value={loginId}
          onChange={(event) =>
            setLoginId(event.target.value)
          }
        />

      </div>


      <br />


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
            setNickname(event.target.value)
          }
        />

      </div>


      <br />


      {/* パスワード */}
      <div>

        <label>
          パスワード
        </label>

        <br />

        <input
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
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


      {/* 使用言語 */}
      <div>

        <label>
          使用言語
        </label>

        <br />

        <input
          type="text"
          value={language}
          onChange={(event) =>
            setLanguage(event.target.value)
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


      {/* 登録ボタン */}
      <button onClick={handleRegister}>
        登録する
      </button>


      {/* ログイン画面へ戻る */}
      <button
        onClick={() => navigate("/")}
      >
        ログイン画面へ戻る
      </button>


      {/* メッセージ */}
      <p>{message}</p>

    </div>
  );
}


// 他のファイルから使用できるようにする
export default RegisterPage;