// Reactの状態管理機能を読み込む
import { useState } from "react";

// React Routerから、別のページへ移動するための機能を読み込む
import { useNavigate } from "react-router-dom";


// FastAPIから取得するユーザー情報の型
//
// 「ユーザーにはどんなデータが入っているか」を
// TypeScriptに教えるための設計図
interface User {
  // ユーザーID
  id: number;

  // ニックネーム
  nickname: string;

  // 好きなポケモン
  //
  // DBではNULLになる可能性があるため、
  // stringまたはnullとして定義する
  favorite_pokemon: string | null;

  // 使用言語
  language: string | null;

  // 自己紹介
  introduction: string | null;
}


// ユーザー一覧画面
function UsersPage() {

  // ユーザー一覧を保存するstate
  //
  // User[]は「User型のデータが複数入った配列」という意味
  const [users, setUsers] = useState<User[]>([]);

  // エラーメッセージなどを保存するstate
  const [message, setMessage] = useState("");


  // React Routerを使って別ページへ移動するための関数
  const navigate = useNavigate();


  // ユーザー一覧を取得する関数
  const getUsers = async (): Promise<void> => {

    try {

      // FastAPIのユーザー一覧APIへアクセスする
      const response = await fetch(
        "http://127.0.0.1:8000/users"
      );


      // FastAPIから返ってきたJSONを取得する
      //
      // User[]として、
      // 「ユーザー情報の配列」であることをTypeScriptに伝える
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

      {/* アプリのタイトル */}
      <h1>PokeMeet</h1>

      {/* ページのタイトル */}
      <h2>ユーザー一覧</h2>


      {/* 自分のプロフィールページへ移動するボタン */}
      <button onClick={() => navigate("/profile")}>
        マイプロフィール
      </button>


      <br />
      <br />


      {/* ユーザー一覧を取得するボタン */}
      <button onClick={getUsers}>
        ユーザーを読み込む
      </button>


      {/* エラーメッセージを表示 */}
      <p>{message}</p>


      {/* ユーザーが1人以上存在する場合だけ一覧を表示 */}
      {users.length > 0 && (
        <div>

          {/* users配列を1件ずつ処理する */}
          {users.map((user) => (

            // Reactでは、一覧を表示するときに
            // 各要素を識別するためのkeyが必要
            <div key={user.id}>

              {/* ユーザーのニックネーム */}
              <h3
                onClick={() =>
                  navigate(`/users/${user.id}`)
                }
                style={{ cursor: "pointer" }}
              >
                {user.nickname}
              </h3>


              {/* 好きなポケモン */}
              <p>
                好きなポケモン：
                {user.favorite_pokemon}
              </p>


              {/* 使用言語 */}
              <p>
                言語：
                {user.language}
              </p>


              {/* 自己紹介 */}
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