// React Routerから、
// ログイン画面へ移動するためのNavigateを読み込む
import { Navigate } from "react-router-dom";

// Reactの「型」としてReactNodeを読み込む
//
// ReactNodeは、
// 「React画面として表示できるもの」を表す型。
import type { ReactNode } from "react";


// ProtectedRouteに渡されるデータの型
interface ProtectedRouteProps {

  // ProtectedRouteの中に表示するページ
  children: ReactNode;
}


// ログインが必要なページを保護するコンポーネント
function ProtectedRoute({
  children,
}: ProtectedRouteProps) {

  // localStorageからJWTを取得する
  const token = localStorage.getItem(
    "access_token"
  );


  // JWTが存在しない場合
  if (!token) {

    // ログイン画面へ移動する
    //
    // replaceをtrueにすることで、
    // ブラウザの「戻る」で
    // 保護されたページへ戻りにくくする。
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  // JWTが存在する場合は、
  // 本来表示するページをそのまま表示する。
  return <>{children}</>;
}


// 他のファイルから使用できるようにする
export default ProtectedRoute;