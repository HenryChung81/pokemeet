// React Routerから、
// URLに応じて表示するページを切り替えるための機能を読み込む
import {
  Routes,
  Route,
} from "react-router-dom";


// 各ページを読み込む
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import ProfilePage from "./pages/ProfilePage";
import UserDetailPage from "./pages/UserDetailPage";


// ログインが必要なページを保護するコンポーネント
import ProtectedRoute from "./components/ProtectedRoute";


// PokeMeetのページルーティングを管理するコンポーネント
function App() {

  return (
    <Routes>

      {/* =========================
          ログイン画面
          ========================= */}

      {/* 
        ログイン画面は、
        ログインしていなくてもアクセスできる。
      */}
      <Route
        path="/"
        element={<LoginPage />}
      />


      {/* =========================
          ユーザー一覧
          ========================= */}

      {/* 
        ユーザー一覧はログインが必要。

        ProtectedRouteで囲むことで、
        JWTがない場合はログイン画面へ戻す。
      */}
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />


      {/* =========================
          ユーザー詳細
          ========================= */}

      {/* 
        /users/5
        /users/10
        のようなURL。

        ここもログインが必要。
      */}
      <Route
        path="/users/:userId"
        element={
          <ProtectedRoute>
            <UserDetailPage />
          </ProtectedRoute>
        }
      />


      {/* =========================
          マイプロフィール
          ========================= */}

      {/* 
        自分のプロフィールを見る場合も
        ログインが必要。
      */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}


// Appを他のファイルから使用できるようにする
export default App;