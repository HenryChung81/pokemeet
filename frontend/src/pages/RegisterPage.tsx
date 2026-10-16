
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

interface RegisterResponse {
  message?: string;
  detail?: string;
}

function RegisterBall() {
  return (
    <svg
      className="register-brand-ball"
      viewBox="0 0 100 100"
      role="img"
      aria-label="PokeMeetのボールロゴ"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient
          id="register-ball-body"
          cx="32%"
          cy="25%"
          r="78%"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="48%" stopColor="#e6edf5" />
          <stop offset="82%" stopColor="#cbd5e2" />
          <stop offset="100%" stopColor="#aebaca" />
        </radialGradient>

        <linearGradient
          id="register-ball-red"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ff6b61" />
          <stop offset="48%" stopColor="#ed3d32" />
          <stop offset="100%" stopColor="#c92c26" />
        </linearGradient>

        <radialGradient
          id="register-ball-center"
          cx="35%"
          cy="25%"
          r="80%"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dce4ee" />
        </radialGradient>

        <clipPath id="register-ball-clip">
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>

      <circle
        cx="50"
        cy="50"
        r="46"
        fill="url(#register-ball-body)"
        stroke="#d5deea"
        strokeWidth="1"
      />

      <g clipPath="url(#register-ball-clip)">
        <rect
          x="0"
          y="46.5"
          width="100"
          height="7"
          fill="url(#register-ball-red)"
        />

        <ellipse
          cx="28"
          cy="17"
          rx="19"
          ry="7"
          fill="#ffffff"
          opacity="0.22"
          transform="rotate(-35 28 17)"
        />
      </g>

      <circle
        cx="50"
        cy="50"
        r="20"
        fill="url(#register-ball-red)"
      />

      <circle
        cx="50"
        cy="50"
        r="12.2"
        fill="#202733"
      />

      <circle
        cx="50"
        cy="50"
        r="10"
        fill="url(#register-ball-center)"
        stroke="#111827"
        strokeWidth="1.3"
      />

      <ellipse
        cx="46.5"
        cy="46.5"
        rx="3"
        ry="1.5"
        fill="#ffffff"
        opacity="0.75"
        transform="rotate(-35 46.5 46.5)"
      />

      <path
        d="M 19 18 A 43 43 0 0 0 8 43"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function RegisterPage() {
  const [loginId, setLoginId] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [favoritePokemon, setFavoritePokemon] = useState("");
  const [language, setLanguage] = useState("");
  const [introduction, setIntroduction] = useState("");

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // 新規登録処理
  const handleRegister = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setMessage("");
    setIsSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            login_id: loginId.trim(),
            nickname: nickname.trim(),
            password: password,
            favorite_pokemon:
              favoritePokemon.trim() || null,
            language: language.trim() || null,
            introduction: introduction.trim() || null,
          }),
        }
      );

      const data: RegisterResponse =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "ユーザー登録に失敗しました"
        );
        return;
      }

      setIsSuccess(true);
      setMessage(
        data.message || "ユーザーを登録しました"
      );

      // 登録成功後、ログイン画面へ移動
      window.setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("新規登録エラー:", error);

      setMessage(
        "サーバーとの通信に失敗しました。サーバーが起動しているか確認してください。"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="register-page">
      <style>{`
        .register-page {
          --register-blue: #3269ed;
          --register-text: #172033;
          --register-muted: #7b879a;

          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 100vh;
          padding: 36px 20px;
          box-sizing: border-box;
          background:
            radial-gradient(
              ellipse at 12% 12%,
              rgba(194, 218, 255, 0.65) 0,
              transparent 38%
            ),
            radial-gradient(
              ellipse at 90% 88%,
              rgba(207, 226, 255, 0.7) 0,
              transparent 35%
            ),
            #f4f7fc;
          color: var(--register-text);
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            "Noto Sans JP",
            sans-serif;
        }

        .register-page *,
        .register-page *::before,
        .register-page *::after {
          box-sizing: border-box;
        }

        .register-card {
          width: 100%;
          max-width: 680px;
          padding: 36px 42px 30px;
          border: 1px solid #e1e9f4;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.97);
          box-shadow:
            0 24px 70px rgba(42, 72, 124, 0.09),
            0 3px 12px rgba(42, 72, 124, 0.035);
          animation: register-card-appear 0.35s ease-out;
        }

        @keyframes register-card-appear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .register-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 28px;
        }

        .register-brand-ball {
          display: block;
          flex: 0 0 43px;
          width: 43px;
          height: 43px;
          filter: drop-shadow(
            0 3px 3px rgba(30, 45, 70, 0.15)
          );
        }

        .register-brand-name {
          margin: 0;
          color: #172033;
          font-size: 27px;
          font-weight: 850;
          letter-spacing: -1px;
          line-height: 1.2;
        }

        .register-eyebrow {
          margin: 0 0 8px;
          color: var(--register-blue);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-align: center;
        }

        .register-heading {
          margin: 0;
          color: var(--register-text);
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.7px;
          line-height: 1.4;
          text-align: center;
        }

        .register-description {
          margin: 10px 0 30px;
          color: var(--register-muted);
          font-size: 13px;
          line-height: 1.9;
          text-align: center;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .register-fields-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px 18px;
        }

        .register-field {
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-width: 0;
        }

        .register-field-full {
          grid-column: 1 / -1;
        }

        .register-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #344054;
          font-size: 13px;
          font-weight: 700;
        }

        .register-required {
          padding: 3px 6px;
          border-radius: 5px;
          background: #fff0ef;
          color: #d84343;
          font-size: 10px;
          font-weight: 750;
        }

        .register-optional {
          color: #9aa5b5;
          font-size: 11px;
          font-weight: 500;
        }

        .register-input,
        .register-textarea {
          display: block;
          width: 100%;
          border: 1px solid #dfe6f0;
          border-radius: 11px;
          outline: none;
          background: #f9fbfe;
          color: #172033;
          font-family: inherit;
          font-size: 14px;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
        }

        .register-input {
          height: 48px;
          padding: 0 14px;
        }

        .register-textarea {
          min-height: 110px;
          padding: 13px 14px;
          resize: vertical;
          line-height: 1.8;
        }

        .register-input::placeholder,
        .register-textarea::placeholder {
          color: #a0aaba;
        }

        .register-input:hover,
        .register-textarea:hover {
          border-color: #c4d2e7;
        }

        .register-input:focus,
        .register-textarea:focus {
          border-color: var(--register-blue);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(50, 105, 237, 0.1);
        }

        .register-help {
          margin: -2px 0 0;
          color: #8a96a8;
          font-size: 11px;
          line-height: 1.6;
        }

        .register-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          min-height: 51px;
          margin-top: 2px;
          padding: 13px 18px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(
            135deg,
            #3978f6 0%,
            #285ee3 100%
          );
          box-shadow: 0 7px 15px rgba(50, 105, 237, 0.22);
          color: #ffffff;
          font-family: inherit;
          font-size: 15px;
          font-weight: 750;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            opacity 0.18s ease;
        }

        .register-submit:hover:not(:disabled) {
          box-shadow: 0 10px 20px rgba(50, 105, 237, 0.28);
          transform: translateY(-1px);
        }

        .register-submit:focus-visible,
        .register-back-button:focus-visible {
          outline: 3px solid rgba(50, 105, 237, 0.35);
          outline-offset: 3px;
        }

        .register-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .register-message {
          margin: 0;
          padding: 12px 14px;
          border: 1px solid #f4caca;
          border-radius: 10px;
          background: #fff5f5;
          color: #b42318;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .register-message-success {
          border-color: #b7e4c7;
          background: #f0fdf4;
          color: #18794e;
        }

        .register-back {
          margin-top: 23px;
          padding-top: 21px;
          border-top: 1px solid #eef1f6;
          text-align: center;
        }

        .register-back-text {
          margin: 0 0 11px;
          color: #7b879a;
          font-size: 12px;
        }

        .register-back-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 8px 12px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #3269ed;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.18s ease;
        }

        .register-back-button:hover {
          background: #f1f5ff;
        }

        .register-footer {
          margin: 23px 0 0;
          color: #9aa5b5;
          font-size: 11px;
          line-height: 1.8;
          text-align: center;
        }

        @media (max-width: 600px) {
          .register-page {
            align-items: flex-start;
            padding: 20px 14px;
          }

          .register-card {
            padding: 28px 22px 24px;
            border-radius: 20px;
          }

          .register-brand {
            margin-bottom: 24px;
          }

          .register-brand-ball {
            flex-basis: 39px;
            width: 39px;
            height: 39px;
          }

          .register-brand-name {
            font-size: 25px;
          }

          .register-heading {
            font-size: 24px;
          }

          .register-description {
            margin-bottom: 25px;
            font-size: 12px;
          }

          .register-fields-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 18px;
          }

          .register-field-full {
            grid-column: auto;
          }

          .register-form {
            gap: 18px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .register-card {
            animation: none;
          }

          .register-input,
          .register-textarea,
          .register-submit,
          .register-back-button {
            transition: none;
          }
        }
      `}</style>

      <section
        className="register-card"
        aria-labelledby="register-heading"
      >
        {/* PokeMeetロゴ */}
        <div className="register-brand">
          <RegisterBall />

          <p className="register-brand-name">
            PokeMeet
          </p>
        </div>

        {/* ページタイトル */}
        <p className="register-eyebrow">
          JOIN THE COMMUNITY
        </p>

        <h1
          id="register-heading"
          className="register-heading"
        >
          新しい仲間を見つけよう
        </h1>

        <p className="register-description">
          アカウントを作成して、
          <br />
          ポケモン好きの仲間との交流を始めよう！
        </p>

        {/* 登録フォーム */}
        <form
          className="register-form"
          onSubmit={handleRegister}
        >
          <div className="register-fields-grid">
            <div className="register-field">
              <label
                className="register-label"
                htmlFor="register-login-id"
              >
                ログインID
                <span className="register-required">
                  必須
                </span>
              </label>

              <input
                id="register-login-id"
                className="register-input"
                type="text"
                name="login_id"
                autoComplete="username"
                placeholder="ログインに使うID"
                value={loginId}
                onChange={(event) =>
                  setLoginId(event.target.value)
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="register-field">
              <label
                className="register-label"
                htmlFor="register-nickname"
              >
                ニックネーム
                <span className="register-required">
                  必須
                </span>
              </label>

              <input
                id="register-nickname"
                className="register-input"
                type="text"
                name="nickname"
                autoComplete="nickname"
                placeholder="表示する名前"
                value={nickname}
                onChange={(event) =>
                  setNickname(event.target.value)
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="register-field register-field-full">
              <label
                className="register-label"
                htmlFor="register-password"
              >
                パスワード
                <span className="register-required">
                  必須
                </span>
              </label>

              <input
                id="register-password"
                className="register-input"
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                disabled={isLoading}
              />

              <p className="register-help">
                パスワードは他の人に教えないようにしましょう。
              </p>
            </div>

            <div className="register-field">
              <label
                className="register-label"
                htmlFor="register-favorite-pokemon"
              >
                好きなポケモン
                <span className="register-optional">
                  任意
                </span>
              </label>

              <input
                id="register-favorite-pokemon"
                className="register-input"
                type="text"
                name="favorite_pokemon"
                placeholder="例：ピカチュウ"
                value={favoritePokemon}
                onChange={(event) =>
                  setFavoritePokemon(event.target.value)
                }
                disabled={isLoading}
              />
            </div>

            <div className="register-field">
              <label
                className="register-label"
                htmlFor="register-language"
              >
                使用言語
                <span className="register-optional">
                  任意
                </span>
              </label>

              <input
                id="register-language"
                className="register-input"
                type="text"
                name="language"
                placeholder="例：日本語、中国語"
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value)
                }
                disabled={isLoading}
              />
            </div>

            <div className="register-field register-field-full">
              <label
                className="register-label"
                htmlFor="register-introduction"
              >
                自己紹介
                <span className="register-optional">
                  任意
                </span>
              </label>

              <textarea
                id="register-introduction"
                className="register-textarea"
                name="introduction"
                placeholder="好きなゲームや、交流したいことなどを書いてみよう"
                value={introduction}
                onChange={(event) =>
                  setIntroduction(event.target.value)
                }
                disabled={isLoading}
              />
            </div>
          </div>

          {message && (
            <p
              className={
                isSuccess
                  ? "register-message register-message-success"
                  : "register-message"
              }
              role="status"
            >
              {message}
            </p>
          )}

          <button
            className="register-submit"
            type="submit"
            disabled={isLoading || isSuccess}
          >
            {isLoading
              ? "登録中..."
              : isSuccess
                ? "登録しました"
                : "アカウントを作成する"}

            {!isLoading && !isSuccess && (
              <span aria-hidden="true">→</span>
            )}
          </button>
        </form>

        {/* ログイン画面へ戻る */}
        <div className="register-back">
          <p className="register-back-text">
            すでにアカウントをお持ちですか？
          </p>

          <button
            className="register-back-button"
            type="button"
            onClick={() => navigate("/")}
          >
            ← ログイン画面へ戻る
          </button>
        </div>

        <p className="register-footer">
          PokeMeet · ポケモン好きが集まるコミュニティ
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;
