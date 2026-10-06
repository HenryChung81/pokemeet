// React Routerから、
// URLに応じて表示するページを切り替えるための機能を読み込む
import {
  Routes,
  Route,
} from "react-router-dom";


// 各ページを読み込む
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UsersPage from "./pages/UsersPage";
import ProfilePage from "./pages/ProfilePage";
import UserDetailPage from "./pages/UserDetailPage";
import EventsPage from "./pages/EventsPage";


// ログインが必要なページを保護するコンポーネント
import ProtectedRoute from "./components/ProtectedRoute";


// PokeMeetのページルーティングを管理するコンポーネント
function App() {

  return (
    <Routes>

      {/* =========================
          ログイン画面
          ========================= */}

      <Route
        path="/"
        element={<LoginPage />}
      />


      {/* =========================
          新規登録画面
          ========================= */}

      {/*
        新規登録はログインしていなくても
        アクセスできる。
      */}
      <Route
        path="/register"
        element={<RegisterPage />}
      />


      {/* =========================
          ユーザー一覧
          ========================= */}

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

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />


      {/* =========================
          交流会一覧
          ========================= */}

      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <EventsPage />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}


// Appを他のファイルから使用できるようにする
export default App;