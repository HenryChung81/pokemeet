// Reactの状態管理機能を読み込む
import { useState } from "react";

// React Routerから、別のページへ移動するための機能を読み込む
import { useNavigate } from "react-router-dom";


// FastAPIのログインAPIが返してくるデータの型
//
// TypeScriptでは「このデータには何が入っているか」を
// あらかじめ定義しておくことができる
interface LoginResponse {

  // ログイン成功時にFastAPIから返されるJWT
  access_token?: string;

  // トークンの種類
  token_type?: string;

  // ログイン成功メッセージ
  message?: string;

  // FastAPIのエラーメッセージ
  detail?: string;
}


// ログイン画面のコンポーネント
function LoginPage() {

  // ログインIDを管理するstate
  //
  // loginIdにはユーザーが入力したログインIDが入る
  const [loginId, setLoginId] = useState("");


  // パスワードを管理するstate
  const [password, setPassword] = useState("");


  // ログイン結果などのメッセージを管理するstate
  const [message, setMessage] = useState("");


  // React Routerを使って別ページへ移動するための関数
  const navigate = useNavigate();


  // ログインボタンを押したときに実行する関数
  const handleLogin = async (): Promise<void> => {

    try {

      // FastAPIのログインAPIへリクエストを送る
      const response = await fetch(
        "http://127.0.0.1:8000/login",
        {
          // HTTPメソッドはPOST
          method: "POST",

          // JSON形式でデータを送ることを指定
          headers: {
            "Content-Type": "application/json",
          },

          // login_idとpasswordをJSONに変換して送る
          body: JSON.stringify({
            login_id: loginId,
            password: password,
          }),
        }
      );


      // FastAPIから返ってきたJSONを取得する
      const data: LoginResponse =
        await response.json();


      // HTTPステータスが200番台ではない場合
      //
      // 例えば、
      // 401 Unauthorized
      // などの場合
      if (!response.ok) {

        // FastAPIのdetailに入っている
        // エラーメッセージを表示する
        setMessage(
          data.detail ||
          data.message ||
          "ログインに失敗しました"
        );

        return;
      }


      // ログイン成功
      //
      // FastAPIから受け取ったJWTを
      // ブラウザのlocalStorageに保存する
      if (data.access_token) {

        localStorage.setItem(
          "access_token",
          data.access_token
        );

      }


      // ログイン成功後、
      // ユーザー一覧ページへ移動する
      navigate("/users");

    } catch (error) {

      // 通信エラーなどが発生した場合
      console.error(error);

      // ユーザーにエラーメッセージを表示
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


      {/* ページのタイトル */}
      <h2>ログイン</h2>


      {/* ログインID入力欄 */}
      <div>

        <label>ログインID</label>

        <input
          type="text"

          // inputの現在の値
          value={loginId}

          // 入力内容が変更されたらloginIdを更新する
          onChange={(event) =>
            setLoginId(event.target.value)
          }
        />

      </div>


      {/* パスワード入力欄 */}
      <div>

        <label>パスワード</label>

        <input
          type="password"

          // inputの現在の値
          value={password}

          // 入力内容が変更されたらpasswordを更新する
          onChange={(event) =>
            setPassword(event.target.value)
          }
        />

      </div>


      {/* ログインボタン */}
      <button onClick={handleLogin}>
        ログイン
      </button>


      {/* ログイン結果やエラーメッセージを表示 */}
      <p>{message}</p>

    </div>
  );
}


// LoginPageを他のファイルから使用できるようにする
export default LoginPage;