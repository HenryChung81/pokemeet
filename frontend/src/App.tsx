// React Routerから、URLに応じて表示するページを
// 切り替えるための機能を読み込む
import { Routes, Route } from "react-router-dom";

// ログイン画面
import LoginPage from "./pages/LoginPage";

// ユーザー一覧画面
import UsersPage from "./pages/UsersPage";

// マイプロフィール画面
import ProfilePage from "./pages/ProfilePage";

// ユーザー詳細ページ
import UserDetailPage from "./pages/UserDetailPage";


// PokeMeet全体のページ切り替えを管理するコンポーネント
function App() {
  return (
    // Routesの中に、アプリで使用するURLを定義する
    <Routes>

      {/*
        「/」にアクセスした場合、
        LoginPageを表示する
      */}
      <Route
        path="/"
        element={<LoginPage />}
      />

      {/*
        「/users」にアクセスした場合、
        UsersPageを表示する
      */}
      <Route
        path="/users"
        element={<UsersPage />}
      />

      <Route
        path="/users/:userId"
        element={<UserDetailPage />}
      />

      {/*
        「/profile」にアクセスした場合、
        ProfilePageを表示する
      */}
      <Route
        path="/profile"
        element={<ProfilePage />}
      />

    </Routes>
  );
}


// Appコンポーネントを他のファイルから
// 使用できるようにする
export default App;