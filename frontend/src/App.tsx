// React Routerから、
// URLに応じて表示するページを切り替えるための機能を読み込む
import {
  Routes,
  Route,
} from "react-router-dom";

import "./App.css";


// 各ページを読み込む
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UsersPage from "./pages/UsersPage";
import ProfilePage from "./pages/ProfilePage";
import UserDetailPage from "./pages/UserDetailPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventCreatePage from "./pages/EventCreatePage";


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


      {/* =========================
          交流会詳細
          ========================= */}

      <Route
        path="/events/:eventId"
        element={
          <ProtectedRoute>
            <EventDetailPage />
          </ProtectedRoute>
        }
      />

      {/* =========================
          交流会作成
          ========================= */}

      <Route
        path="/events/create"
        element={
          <ProtectedRoute>
            <EventCreatePage />
          </ProtectedRoute>
        }
      />

    </Routes>

    
  );
}


// Appを他のファイルから使用できるようにする
export default App;