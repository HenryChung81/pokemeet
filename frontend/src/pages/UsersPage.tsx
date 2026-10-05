// Reactの状態管理機能を読み込む
import { useState } from "react";

// React Routerから、別のページへ移動するための機能を読み込む
import { useNavigate } from "react-router-dom";

// ユーザー情報の型を読み込む
import type { User } from "../types/user";


// ユーザー一覧画面
function UsersPage() {

  // ユーザー一覧を保存するstate
  const [users, setUsers] = useState<User[]>([]);

  // エラーメッセージなどを保存するstate
  const [message, setMessage] = useState("");


  // ページ移動に使う
  const navigate = useNavigate();


  // ログアウト処理
  const handleLogout = (): void => {

    // localStorageに保存しているJWTを削除する
    //
    // ログイン時に保存したaccess_tokenを削除することで、
    // ログイン状態を解除する。
    localStorage.removeItem("access_token");


    // ログイン画面へ移動する
    navigate("/");
  };


  // ユーザー一覧を取得する処理
  const getUsers = async (): Promise<void> => {

    try {

      // FastAPIのユーザー一覧APIへアクセスする
      const response = await fetch(
        "http://127.0.0.1:8000/users"
      );


      // FastAPIから返されたJSONを取得する
      const data: User[] = await response.json();


      // HTTPステータスが200番台ではない場合
      if (!response.ok) {

        setMessage(
          "ユーザー一覧の取得に失敗しました"
        );

        return;
      }


      // 取得したユーザー一覧をstateに保存する
      setUsers(data);

    } catch (error) {

      // 通信エラーなどが発生した場合
      console.error(error);

      setMessage(
        "通信エラーが発生しました"
      );
    }
  };


  // 画面に表示する内容
  return (
    <div>

      <h1>PokeMeet</h1>

      <h2>ユーザー一覧</h2>


      {/* マイプロフィールページへ移動するボタン */}
      <button
        onClick={() => navigate("/profile")}
      >
        マイプロフィール
      </button>


      {/* ログアウトボタン */}
      <button
        onClick={handleLogout}
      >
        ログアウト
      </button>


      <br />
      <br />


      {/* ユーザー一覧を取得するボタン */}
      <button onClick={getUsers}>
        ユーザーを読み込む
      </button>


      {/* エラーメッセージを表示 */}
      <p>{message}</p>


      {/* ユーザーが存在する場合だけ一覧を表示 */}
      {users.length > 0 && (
        <div>

          {users.map((user) => (

            <div key={user.id}>

              {/* ユーザー詳細ページへ移動 */}
              <h3
                onClick={() =>
                  navigate(`/users/${user.id}`)
                }
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


// UsersPageを他のファイルから使用できるようにする
export default UsersPage;