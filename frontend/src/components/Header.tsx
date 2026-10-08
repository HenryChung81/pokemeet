import {
  useEffect,
  useState,
} from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";


function Header() {
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] =
    useState(false);


  /* =========================
     ログインユーザー情報取得
     ========================= */

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/me",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "access_token"
              )}`,
            },
          }
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        setIsAdmin(
          data.role === "admin"
        );

      } catch (error) {
        console.error(error);
      }
    };

    fetchCurrentUser();
  }, []);


  /* =========================
     ログアウト
     ========================= */

  const handleLogout = (): void => {
    localStorage.removeItem(
      "access_token"
    );

    navigate("/");
  };


  return (
    <header className="app-header">

      <div className="app-header-inner">


        {/* =========================
            ロゴ
            ========================= */}

        <NavLink
          to="/events"
          className="app-logo"
        >

          <span
            className={
              isAdmin
                ? "app-logo-icon app-logo-icon-admin"
                : "app-logo-icon"
            }
            aria-label={
              isAdmin
                ? "管理者"
                : "PokeMeet"
            }
          ></span>

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
              isActive
                ? "active"
                : ""
            }
          >
            交流会
          </NavLink>


          <NavLink
            to="/users"
            className={({ isActive }) =>
              isActive
                ? "active"
                : ""
            }
          >
            ユーザー
          </NavLink>


          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive
                ? "active"
                : ""
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


export default Header;