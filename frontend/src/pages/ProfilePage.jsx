import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const getMyProfile = async () => {
      const token = localStorage.getItem("access_token");

      console.log("access_token:", token);

      if (!token) {
        setMessage("ログインしてください");
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("status:", response.status);

        const data = await response.json();

        console.log("profile data:", data);

        if (!response.ok) {
          setMessage(
            data.detail || "プロフィールの取得に失敗しました"
          );
          return;
        }

        setUser(data);
      } catch (error) {
        console.error(error);
        setMessage("通信エラーが発生しました");
      }
    };

    getMyProfile();
  }, []);

  return (
    <div>
      <h1>PokeMeet</h1>

      <h2>マイプロフィール</h2>

      {message && <p>{message}</p>}

      {user && (
        <div>
          <h3>{user.nickname}</h3>

          <p>
            ID：{user.id}
          </p>

          <p>
            好きなポケモン：{user.favorite_pokemon}
          </p>

          <p>
            言語：{user.language}
          </p>

          <p>
            自己紹介：{user.introduction}
          </p>
        </div>
      )}

      <button onClick={() => navigate("/users")}>
        ユーザー一覧に戻る
      </button>
    </div>
  );
}

export default ProfilePage;
