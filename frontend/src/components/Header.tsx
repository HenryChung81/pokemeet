// React Routerから、
// 現在のページへのリンクとページ移動に使う機能を読み込む
import {
  NavLink,
  useNavigate,
} from "react-router-dom";


// PokeMeet共通ヘッダー
function Header() {

  // ページ移動に使う
  const navigate = useNavigate();


  // ログアウト処理
  const handleLogout = (): void => {

    // 保存されているJWTを削除する
    localStorage.removeItem(
      "access_token"
    );


    // ログイン画面へ移動する
    navigate("/");
  };


  return (
    <header className="app-header">

      <div className="app-header-inner">

        {/* =========================
            PokeMeetロゴ
            ========================= */}

        <NavLink
          to="/events"
          className="app-logo"
        >

          {/* モンスターボール風アイコン */}
          <span className="app-logo-icon"></span>


          {/* アプリ名 */}
          <span className="app-logo-text">
            PokeMeet
          </span>

        </NavLink>


        {/* =========================
            ナビゲーション
            ========================= */}

        <nav className="app-nav">

          <NavLink
            to="/events"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            交流会
          </NavLink>


          <NavLink
            to="/users"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            ユーザー
          </NavLink>


          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            プロフィール
          </NavLink>


          <button
            className="header-logout"
            onClick={handleLogout}
          >
            ログアウト
          </button>

        </nav>

      </div>

    </header>
  );
}


// 他のファイルから使用できるようにする
export default Header;