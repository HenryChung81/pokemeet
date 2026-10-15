
 // Reactの状態管理機能と、ページ表示時の処理に使う機能を読み込む
import { useCallback, useEffect, useState } from "react";

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

  // 読み込み中かどうかを保存するstate
  const [isLoading, setIsLoading] = useState(false);

  // 検索キーワードを保存するstate
  const [searchText, setSearchText] = useState("");


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
  const getUsers = useCallback(async (): Promise<void> => {

    // localStorageからJWTを取得する
    const token = localStorage.getItem("access_token");

    // JWTがない場合
    if (!token) {
      setMessage("ログインしてください");
      setUsers([]);
      return;
    }

    try {

      // 読み込み中にする
      setIsLoading(true);

      // エラーメッセージをクリアする
      setMessage("");

      // FastAPIのユーザー一覧APIへアクセスする
      const response = await fetch(
        "http://127.0.0.1:8000/users",
        {
          method: "GET",
          headers: {
            // ログイントークンを送信する
            Authorization: `Bearer ${token}`,
          },
        }
      );


      // FastAPIから返されたJSONを取得する
      const data: User[] | { detail?: string } =
        await response.json();


      // HTTPステータスが200番台ではない場合
      if (!response.ok) {

        // 認証エラーの場合
        if (response.status === 401) {
          setMessage(
            "ログインの有効期限が切れています。再ログインしてください。"
          );
          setUsers([]);
          return;
        }

        // APIから返されたエラーメッセージを表示する
        setMessage(
          "detail" in data && data.detail
            ? data.detail
            : "ユーザー一覧の取得に失敗しました"
        );

        setUsers([]);
        return;
      }


      // 取得したユーザー一覧をstateに保存する
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
        setMessage("ユーザー一覧のデータ形式が正しくありません");
      }

    } catch (error) {

      // 通信エラーなどが発生した場合
      console.error(error);

      setMessage("通信エラーが発生しました");

    } finally {

      // 読み込み中を解除する
      setIsLoading(false);
    }
  }, []);


  // ページを開いたときにユーザー一覧を取得する
  useEffect(() => {
    void getUsers();
  }, [getUsers]);


  // 検索キーワードに一致するユーザーだけを表示する
  const filteredUsers = users.filter((user) => {

    // ニックネーム・好きなポケモン・言語で検索する
    const keyword = searchText.trim().toLowerCase();

    return (
      user.nickname.toLowerCase().includes(keyword) ||
      (user.favorite_pokemon || "").toLowerCase().includes(keyword) ||
      (user.language || "").toLowerCase().includes(keyword)
    );
  });


  // 画面に表示する内容
  return (
    <>
      {/* ユーザー一覧画面専用のデザイン */}
      <style>{`
        .users-page {
          min-height: calc(100vh - 80px);
          padding: 40px 24px 64px;
          background: #f5f7fc;
          color: #172033;
          box-sizing: border-box;
        }

        .users-container {
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
        }

        .users-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .users-title-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .users-title-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: #e7efff;
          color: #285df5;
          font-size: 25px;
          flex-shrink: 0;
        }

        .users-heading h1 {
          margin: 0 0 5px;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.6px;
        }

        .users-subtitle {
          margin: 0;
          color: #748096;
          font-size: 14px;
        }

        .users-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .users-button {
          border: 0;
          border-radius: 12px;
          padding: 12px 17px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s, background 0.15s;
        }

        .users-button:hover {
          transform: translateY(-1px);
        }

        .users-button-primary {
          color: #ffffff;
          background: #285df5;
          box-shadow: 0 5px 14px rgba(40, 93, 245, 0.18);
        }

        .users-button-primary:hover {
          background: #194bd7;
        }

        .users-button-secondary {
          color: #344054;
          background: #ffffff;
          border: 1px solid #e2e8f0;
        }

        .users-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
          padding: 18px;
          border: 1px solid #e8edf5;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 4px 18px rgba(23, 32, 51, 0.03);
        }

        .users-search {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 470px;
          padding: 0 14px;
          border: 1px solid #dfe6f1;
          border-radius: 12px;
          background: #f9fbff;
          box-sizing: border-box;
        }

        .users-search-icon {
          color: #7b879c;
          font-size: 19px;
        }

        .users-search input {
          width: 100%;
          min-width: 0;
          padding: 13px 0;
          border: 0;
          outline: none;
          background: transparent;
          color: #172033;
          font-size: 14px;
        }

        .users-search input::placeholder {
          color: #9aa4b5;
        }

        .users-count {
          color: #657188;
          font-size: 14px;
          white-space: nowrap;
        }

        .users-count strong {
          color: #172033;
          font-size: 20px;
          margin-right: 4px;
        }

        .users-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .user-card {
          min-width: 0;
          padding: 22px;
          border: 1px solid #e7ecf4;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 5px 20px rgba(23, 32, 51, 0.035);
          transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
        }

        .user-card:hover {
          transform: translateY(-3px);
          border-color: #c7d7ff;
          box-shadow: 0 12px 26px rgba(23, 32, 51, 0.08);
        }

        .user-card-top {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 20px;
        }

        .user-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 16px;
          background: #eaf0ff;
          color: #285df5;
          font-size: 23px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .user-card-name {
          min-width: 0;
          margin: 0;
          overflow-wrap: anywhere;
          font-size: 17px;
          font-weight: 800;
          color: #172033;
        }

        .user-card-id {
          margin: 4px 0 0;
          color: #8993a5;
          font-size: 12px;
        }

        .user-card-section {
          padding: 13px 0;
          border-top: 1px solid #edf0f6;
        }

        .user-card-label {
          margin: 0 0 6px;
          color: #8a94a6;
          font-size: 12px;
          font-weight: 700;
        }

        .user-card-value {
          margin: 0;
          color: #48546a;
          font-size: 14px;
          line-height: 1.7;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        .user-card-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          margin-top: 15px;
          padding: 12px 0 0;
          border: 0;
          border-top: 1px solid #edf0f6;
          background: transparent;
          color: #285df5;
          font-size: 13px;
          font-weight: 800;
          text-align: left;
          cursor: pointer;
        }

        .users-message {
          padding: 15px 18px;
          margin: 0 0 20px;
          border-radius: 12px;
          background: #fff1f0;
          color: #b42318;
          font-size: 14px;
        }

        .users-empty {
          padding: 56px 20px;
          border: 1px dashed #d6deeb;
          border-radius: 18px;
          background: #ffffff;
          text-align: center;
        }

        .users-empty-icon {
          margin-bottom: 12px;
          color: #9aa8c0;
          font-size: 36px;
        }

        .users-empty h2 {
          margin: 0 0 8px;
          color: #263247;
          font-size: 18px;
        }

        .users-empty p {
          margin: 0;
          color: #8490a4;
          font-size: 14px;
          line-height: 1.7;
        }

        @media (max-width: 900px) {
          .users-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .users-heading {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 600px) {
          .users-page {
            padding: 26px 14px 40px;
          }

          .users-heading h1 {
            font-size: 24px;
          }

          .users-toolbar {
            align-items: stretch;
            flex-direction: column;
            padding: 14px;
          }

          .users-search {
            max-width: none;
          }

          .users-count {
            text-align: right;
          }

          .users-grid {
            grid-template-columns: 1fr;
            gap: 13px;
          }

          .user-card {
            padding: 18px;
          }

          .users-actions {
            width: 100%;
          }

          .users-actions .users-button {
            flex: 1;
          }
        }
      `}</style>


      <main className="users-page">
        <div className="users-container">

          {/* ページタイトルと操作ボタン */}
          <header className="users-heading">
            <div className="users-title-group">
              <div className="users-title-icon">
                👥
              </div>

              <div>
                <h1>ユーザー一覧</h1>
                <p className="users-subtitle">
                  ポケモン好きな仲間を見つけよう
                </p>
              </div>
            </div>

            <div className="users-actions">
              {/* マイプロフィールページへ移動するボタン */}
              <button
                className="users-button users-button-secondary"
                onClick={() => navigate("/profile")}
              >
                マイプロフィール
              </button>

              {/* ログアウトボタン */}
              <button
                className="users-button users-button-secondary"
                onClick={handleLogout}
              >
                ログアウト
              </button>
            </div>
          </header>


          {/* 検索欄とユーザー数 */}
          <section className="users-toolbar">
            <label className="users-search">
              <span className="users-search-icon">⌕</span>

              <input
                type="search"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                placeholder="ニックネーム・好きなポケモン・言語で検索"
                aria-label="ユーザーを検索"
              />
            </label>

            <div className="users-count">
              <strong>{filteredUsers.length}</strong>
              人のユーザー
            </div>
          </section>


          {/* エラーメッセージを表示 */}
          {message && (
            <div className="users-message" role="alert">
              {message}
            </div>
          )}


          {/* 読み込み中の表示 */}
          {isLoading && users.length === 0 && !message && (
            <div className="users-empty">
              <div className="users-empty-icon">⏳</div>
              <h2>ユーザーを読み込んでいます</h2>
              <p>少しお待ちください。</p>
            </div>
          )}


          {/* ユーザーが存在する場合だけ一覧を表示 */}
          {!isLoading && !message && filteredUsers.length > 0 && (
            <div className="users-grid">

              {filteredUsers.map((user) => (

                <article className="user-card" key={user.id}>

                  <div className="user-card-top">

                    {/* ユーザーアイコン */}
                    <div className="user-avatar">
                      {user.nickname?.charAt(0) || "?"}
                    </div>

                    <div>
                      {/* ニックネーム */}
                      <h2 className="user-card-name">
                        {user.nickname}
                      </h2>

                      {/* ユーザーID */}
                      <p className="user-card-id">
                        USER ID：{user.id}
                      </p>
                    </div>

                  </div>


                  {/* 好きなポケモン */}
                  <div className="user-card-section">
                    <p className="user-card-label">
                      好きなポケモン
                    </p>

                    <p className="user-card-value">
                      {user.favorite_pokemon || "未設定"}
                    </p>
                  </div>


                  {/* 使用言語 */}
                  <div className="user-card-section">
                    <p className="user-card-label">
                      使用言語
                    </p>

                    <p className="user-card-value">
                      {user.language || "未設定"}
                    </p>
                  </div>


                  {/* 自己紹介 */}
                  <div className="user-card-section">
                    <p className="user-card-label">
                      自己紹介
                    </p>

                    <p className="user-card-value">
                      {user.introduction || "自己紹介はまだありません"}
                    </p>
                  </div>


                  {/* ユーザー詳細ページへ移動 */}
                  <button
                    className="user-card-link"
                    onClick={() =>
                      navigate(`/users/${user.id}`)
                    }
                  >
                    プロフィールを見る
                    <span aria-hidden="true">→</span>
                  </button>

                </article>

              ))}

            </div>
          )}


          {/* 検索結果が0件の場合 */}
          {!isLoading && !message && filteredUsers.length === 0 && (
            <div className="users-empty">
              <div className="users-empty-icon">🔎</div>

              <h2>
                {users.length === 0
                  ? "ユーザーがまだいません"
                  : "ユーザーが見つかりません"}
              </h2>

              <p>
                {users.length === 0
                  ? "ユーザー情報が登録されると、ここに表示されます。"
                  : "別のキーワードで検索してみてください。"}
              </p>
            </div>
          )}

        </div>
      </main>
    </>
  );
}


// UsersPageを他のファイルから使用できるようにする
export default UsersPage;
