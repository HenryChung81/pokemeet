import { useState } from "react";
import { useNavigate } from "react-router-dom";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const getUsers = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/users"
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage("ユーザー一覧の取得に失敗しました");
        return;
      }

      setUsers(data);
    } catch (error) {
      console.error(error);
      setMessage("通信エラーが発生しました");
    }
  };

  return (
    <div>
      <h1>PokeMeet</h1>

      <h2>ユーザー一覧</h2>

      <button onClick={() => navigate("/profile")}>
        マイプロフィール
      </button>

      <br />
      <br />

      <button onClick={getUsers}>
        ユーザーを読み込む
      </button>

      <p>{message}</p>

      {users.length > 0 && (
        <div>
          {users.map((user) => (
            <div key={user.id}>
              <h3
                onClick={() => navigate(`/users/${user.id}`)}
                style={{ cursor: "pointer" }}
              >
                {user.nickname}
              </h3>

              <p>
                好きなポケモン：
                {user.favorite_pokemon}
              </p>

              <p>
                言語：
                {user.language}
              </p>

              <p>
                自己紹介：
                {user.introduction}
              </p>

              <hr />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UsersPage;
