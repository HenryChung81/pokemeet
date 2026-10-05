// ReactのStrictModeを使用するためにimportする
// StrictModeは、開発中に問題を見つけやすくするための機能
import { StrictMode } from "react";

// ReactアプリをHTML上に表示するための機能
import { createRoot } from "react-dom/client";

// URLに応じてReactのページを切り替えるために使用する
import { BrowserRouter } from "react-router-dom";

// アプリ全体で使用するCSSを読み込む
import "./index.css";

// PokeMeetのメインコンポーネント
import App from "./App";


// index.htmlの中にある「root」という要素を取得する
const rootElement = document.getElementById("root");


// root要素が存在しない場合はエラーにする
//
// TypeScriptでは、getElementById()の結果が
// nullになる可能性があるため、ここで確認する
if (!rootElement) {
  throw new Error("root要素が見つかりません");
}


// root要素の中にReactアプリを表示する
createRoot(rootElement).render(
  <StrictMode>
    {/* BrowserRouter：URLに応じてReactのページを切り替える */}
    <BrowserRouter>

      {/* PokeMeet本体 */}
      <App />

    </BrowserRouter>
  </StrictMode>
);