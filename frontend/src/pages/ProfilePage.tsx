// Reactの状態管理と、
// コンポーネント表示後に処理を実行するための機能を読み込む
import { useEffect, useState } from "react";

// React Routerから、別のページへ移動するための機能を読み込む
import { useNavigate } from "react-router-dom";


// FastAPIから取得するユーザー情報の型
//
// UsersPage.tsxでも同じようなUser型を作った。
// 本来は後で共通ファイルにまとめる。
interface User {
  // ユーザーID
  id: number;

  // ニックネーム
  nickname: string;

  // 好きなポケモン
  //
  // DBの値がNULLになる可能性があるため、
  // stringまたはnullとして定義する
  favorite_pokemon: string | null;

  // 使用言語
  language: string | null;

  // 自己紹介
  introduction: string | null;
}


// FastAPIのエラーレスポンスの型
//
// FastAPIでHTTPExceptionを発生させた場合、
// {"detail": "..."}という形式で返ってくる
interface ErrorResponse {
  detail: string;
}


// マイプロフィール画面のコンポーネント
function ProfilePage() {

  // ログイン中のユーザー情報を保存するstate
  //
  // 最初はまだユーザー情報を取得していないためnull。
  //
  // 「Userまたはnull」が入るので、
  // User | nullと書く。
  const [user, setUser] = useState<User | null>(null);


  // エラーメッセージなどを保存するstate
  const [message, setMessage] = useState("");


  // React Routerを使って別ページへ移動するための関数
  const navigate = useNavigate();


  // ページが表示されたときにプロフィールを取得する
  //
  // useEffectの第2引数を[]にすると、
  // コンポーネントが最初に表示されたときに
  // 基本的に1回実行される。
  useEffect(() => {

    // 自分のプロフィールを取得する関数
    const getMyProfile = async (): Promise<void> => {

      // ブラウザに保存しているJWTを取得する
      const token = localStorage.getItem(
        "access_token"
      );


      // JWTが存在しない場合
      //
      // ログインしていない状態なので、
      // APIを呼び出さずに処理を終了する。
      if (!token) {

        setMessage(
          "ログインしてください"
        );

        return;
      }


      try {

        // FastAPIの「自分のプロフィール取得API」にアクセスする
        const response = await fetch(
          "http://127.0.0.1:8000/me",
          {
            // HTTPメソッドはGET
            method: "GET",

            // JWTをAuthorizationヘッダーに入れる
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );


        // FastAPIから返ってきたJSONを取得する
        const data: User | ErrorResponse =
          await response.json();


        // HTTPステータスが200番台ではない場合
        if (!response.ok) {

          // ErrorResponseの場合はdetailを表示する
          if ("detail" in data) {
            setMessage(data.detail);
          } else {
            setMessage(
              "プロフィールの取得に失敗しました"
            );
          }

          return;
        }


        // APIから取得したユーザー情報をstateに保存する
        //
        // response.okがtrueの場合は
        // User型のデータが返ってくる想定
        if ("id" in data) {
          setUser(data);
        }

      } catch (error) {

        // ネットワークエラーなどが発生した場合
        console.error(error);

        setMessage(
          "通信エラーが発生しました"
        );
      }
    };


    // プロフィール取得処理を実行する
    getMyProfile();

  }, []);


  // 画面に表示する内容
  return (
    <div>

      {/* アプリのタイトル */}
      <h1>PokeMeet</h1>


      {/* ページのタイトル */}
      <h2>マイプロフィール</h2>


      {/* メッセージがある場合だけ表示する */}
      {message && (
        <p>{message}</p>
      )}


      {/* userがnullではない場合だけプロフィールを表示する */}
      {user && (
        <div>

          {/* ニックネーム */}
          <h3>
            {user.nickname}
          </h3>


          {/* ユーザーID */}
          <p>
            ID：{user.id}
          </p>


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

        </div>
      )}


      {/* ユーザー一覧ページに戻るボタン */}
      <button
        onClick={() => navigate("/users")}
      >
        ユーザー一覧に戻る
      </button>

    </div>
  );
}


// ProfilePageを他のファイルから使用できるようにする
export default ProfilePage;