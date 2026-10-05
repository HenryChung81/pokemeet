// Reactの状態管理と、
// ページ表示時に処理を実行するための機能
import { useEffect, useState } from "react";

// React Routerから、URLのパラメータと
// ページ移動に使う機能を読み込む
import {
  useNavigate,
  useParams,
} from "react-router-dom";

// 共通のUser型を読み込む
import type { User } from "../types/user";


// ユーザー詳細画面
function UserDetailPage() {

  // URLからuserIdを取得する
  //
  // 例えば、
  // /users/5
  //
  // なら、
  // userId = "5"
  //
  // となる。
  const { userId } = useParams();


  // ユーザー情報を保存するstate
  //
  // APIから取得する前はnull。
  // 取得後はUser型のデータが入る。
  const [user, setUser] = useState<User | null>(
    null
  );


  // エラーメッセージなどを保存するstate
  const [message, setMessage] = useState("");


  // React Routerを使って
  // 別のページへ移動するための関数
  const navigate = useNavigate();


  // ページが表示されたときに
  // ユーザー情報を取得する
  useEffect(() => {

    const getUser = async (): Promise<void> => {

      // URLから取得したuserIdが存在しない場合
      if (!userId) {

        setMessage(
          "ユーザーIDが指定されていません"
        );

        return;
      }


      try {

        // FastAPIのユーザー詳細APIへアクセスする
        //
        // 例えばuserIdが5なら、
        // GET /users/5
        // になる。
        const response = await fetch(
          `http://127.0.0.1:8000/users/${userId}`
        );


        // FastAPIから返されたJSONを取得する
        const data: User | { detail: string } =
          await response.json();


        // HTTPステータスが200番台ではない場合
        if (!response.ok) {

          // FastAPIのHTTPExceptionの場合、
          // detailにエラーメッセージが入っている。
          if ("detail" in data) {

            setMessage(data.detail);

          } else {

            setMessage(
              "ユーザー情報の取得に失敗しました"
            );
          }

          return;
        }


        // ユーザー情報をstateに保存する
        if ("id" in data) {

          setUser(data);
        }

      } catch (error) {

        // 通信エラーなどが発生した場合
        console.error(error);

        setMessage(
          "通信エラーが発生しました"
        );
      }
    };


    // ユーザー情報を取得する
    getUser();

  }, [userId]);


  // 画面に表示する内容
  return (
    <div>

      {/* アプリのタイトル */}
      <h1>PokeMeet</h1>


      {/* ページのタイトル */}
      <h2>ユーザー詳細</h2>


      {/* エラーメッセージがある場合だけ表示 */}
      {message && (
        <p>{message}</p>
      )}


      {/* ユーザー情報が取得できた場合だけ表示 */}
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


      {/* ユーザー一覧に戻るボタン */}
      <button
        onClick={() => navigate("/users")}
      >
        ユーザー一覧に戻る
      </button>

    </div>
  );
}


// UserDetailPageを他のファイルから使用できるようにする
export default UserDetailPage;