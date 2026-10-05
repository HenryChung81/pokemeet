import { useState } from "react";
import { useNavigate } from "react-router-dom";


function LoginPage() {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // 画面移動に使う
  const navigate = useNavigate();


  const handleLogin = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            nickname: nickname,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "ログインに失敗しました"
        );
        return;
      }

      // JWTを保存
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      // ユーザー一覧ページへ移動
      navigate("/users");

    } catch (error) {
      console.error(error);

      setMessage(
        "サーバーとの通信に失敗しました"
      );
    }
  };


  return (
    <div>
      <h1>PokeMeet</h1>

      <h2>ログイン</h2>

      <div>
        <label>ニックネーム</label>

        <input
          type="text"
          value={nickname}
          onChange={(event) =>
            setNickname(event.target.value)
          }
        />
      </div>

      <div>
        <label>パスワード</label>

        <input
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
        />
      </div>

      <button onClick={handleLogin}>
        ログイン
      </button>

      <p>{message}</p>
    </div>
  );
}

export default LoginPage;