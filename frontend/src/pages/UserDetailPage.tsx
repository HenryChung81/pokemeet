
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
import "./ProfilePages.css";


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

  // 読み込み中かどうか
  const [isLoading, setIsLoading] = useState(true);


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

        setIsLoading(false);
        return;
      }


      // ログイン時に保存したJWTを取得する
      const token = localStorage.getItem("access_token");

      if (!token) {
        setMessage("ログインしてください");
        setIsLoading(false);
        return;
      }


      try {

        // FastAPIのユーザー詳細APIへアクセスする
        //
        // 例えばuserIdが5なら、
        // GET /users/5
        // になる。
        const response = await fetch(
          `http://127.0.0.1:8000/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
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

      } finally {

        setIsLoading(false);
      }
    };


    // ユーザー情報を取得する
    void getUser();

  }, [userId]);


  // 画面に表示する内容
  return (
    <main className="pm-profile-page">

      {/* ページのタイトル */}
      <header className="pm-page-heading">
        <p className="pm-eyebrow">POKEMEET / TRAINER CARD</p>
        <h1>トレーナープロフィール</h1>
        <p>ポケモン好きなトレーナーのプロフィールです。</p>
      </header>


      {/* 読み込み中の表示 */}
      {isLoading && (
        <div className="pm-card">
          プロフィールを読み込み中...
        </div>
      )}


      {/* エラーメッセージがある場合だけ表示 */}
      {!isLoading && message && (
        <p className="pm-message" role="status">
          {message}
        </p>
      )}


      {/* ユーザー情報が取得できた場合だけ表示 */}
      {user && (
        <>

          {/* ニックネームとユーザーID */}
          <section className="pm-card pm-profile-hero">

            <div className="pm-avatar" aria-hidden="true">
              ⚡
            </div>

            <div className="pm-profile-hero-text">
              <p className="pm-eyebrow">POKEMEET TRAINER</p>

              <h2>
                {user.nickname}
              </h2>

              <p className="pm-muted">
                トレーナー ID：{user.id}
              </p>
            </div>

          </section>


          {/* 好きなポケモン・言語・自己紹介 */}
          <section className="pm-profile-info-grid">

            {/* 好きなポケモン */}
            <article className="pm-card pm-info-card">

              <span className="pm-info-icon" aria-hidden="true">
                🎮
              </span>

              <p className="pm-info-label">
                好きなポケモン
              </p>

              <h3>
                {user.favorite_pokemon || "未設定"}
              </h3>

            </article>


            {/* 使用言語 */}
            <article className="pm-card pm-info-card">

              <span className="pm-info-icon" aria-hidden="true">
                🌐
              </span>

              <p className="pm-info-label">
                使用言語
              </p>

              <h3>
                {user.language || "未設定"}
              </h3>

            </article>


            {/* 自己紹介 */}
            <article className="pm-card pm-info-card pm-introduction-card">

              <span className="pm-info-icon" aria-hidden="true">
                💬
              </span>

              <p className="pm-info-label">
                自己紹介
              </p>

              <p className="pm-introduction">
                {user.introduction || "自己紹介はまだ設定されていません。"}
              </p>

            </article>

          </section>

        </>
      )}


      {/* ユーザー一覧に戻るボタン */}
      <div className="pm-page-footer">

        <button
          className="pm-button pm-button-secondary"
          type="button"
          onClick={() => navigate("/users")}
        >
          ← ユーザー一覧に戻る
        </button>

      </div>

    </main>
  );
}


// UserDetailPageを他のファイルから使用できるようにする
export default UserDetailPage;
