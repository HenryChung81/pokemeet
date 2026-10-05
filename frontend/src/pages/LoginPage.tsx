// Reactの状態管理機能を読み込む
import { useState } from "react";

// React Routerから、
// 別のページへ移動するための機能を読み込む
import { useNavigate } from "react-router-dom";


// FastAPIのログインAPIが返してくるデータの型
interface LoginResponse {

  // ログイン成功時に返されるJWT
  access_token?: string;

  // トークンの種類
  token_type?: string;

  // ログイン成功メッセージ
  message?: string;

  // FastAPIでエラーが発生した場合
  detail?: string;
}


// ログイン画面のコンポーネント
function LoginPage() {

  // ニックネームを管理するstate
  const [nickname, setNickname] =
    useState("");


  // パスワードを管理するstate
  const [password, setPassword] =
    useState("");


  // ログイン結果などのメッセージ
  const [message, setMessage] =
    useState("");


  // ページ移動に使う
  const navigate = useNavigate();


  // ログインボタンを押したときに実行する
  const handleLogin = async (): Promise<void> => {

    try {

      // FastAPIのログインAPIへアクセスする
      const response = await fetch(
        "http://127.0.0.1:8000/login",
        {
          // ログインなのでPOSTを使用する
          method: "POST",

          // JSON形式で送信する
          headers: {
            "Content-Type": "application/json",
          },

          // ニックネームとパスワードを送信する
          body: JSON.stringify({
            nickname: nickname,
            password: password,
          }),
        }
      );


      // FastAPIから返されたJSONを取得する
      const data: LoginResponse =
        await response.json();


      // ログインに失敗した場合
      if (!response.ok) {

        setMessage(
          data.detail ||
          "ログインに失敗しました"
        );

        return;
      }


      // JWTが存在しない場合
      if (!data.access_token) {

        setMessage(
          "アクセストークンを取得できませんでした"
        );

        return;
      }


      // JWTをlocalStorageに保存する
      localStorage.setItem(
        "access_token",
        data.access_token
      );


      // ログイン成功後、
      // ユーザー一覧ページへ移動する
      navigate("/users");

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
      <h2>ログイン</h2>


      {/* ニックネーム入力欄 */}
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


      {/* パスワード入力欄 */}
      <div>

        <label>
          パスワード
        </label>

        <br />

        <input
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value
            )
          }
        />

      </div>


      <br />


      {/* ログインボタン */}
      <button onClick={handleLogin}>
        ログイン
      </button>


      {/* 新規登録画面へ移動するボタン */}
      <button
        onClick={() => navigate("/register")}
      >
        新規登録
      </button>


      {/* ログイン結果やエラーメッセージ */}
      <p>{message}</p>

    </div>
  );
}


// LoginPageを他のファイルから使用できるようにする
export default LoginPage;