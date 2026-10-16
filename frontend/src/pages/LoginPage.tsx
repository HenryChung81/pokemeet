
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

// FastAPIのログインAPIが返すデータの型
interface LoginResponse {
  access_token?: string;
  token_type?: string;
  message?: string;
  detail?: string;
}

// 参考画像に近いボールのロゴ
function LoginBall() {
  return (
    <svg
      className="login-brand-ball"
      viewBox="0 0 100 100"
      role="img"
      aria-label="PokeMeetのボールロゴ"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* ボール本体の立体感 */}
        <radialGradient
          id="login-ball-body"
          cx="32%"
          cy="25%"
          r="78%"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="48%" stopColor="#e6edf5" />
          <stop offset="82%" stopColor="#cbd5e2" />
          <stop offset="100%" stopColor="#aebaca" />
        </radialGradient>

        {/* 赤い部分のグラデーション */}
        <linearGradient
          id="login-ball-red"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ff6b61" />
          <stop offset="48%" stopColor="#ed3d32" />
          <stop offset="100%" stopColor="#c92c26" />
        </linearGradient>

        {/* 中央の白いボタン */}
        <radialGradient
          id="login-ball-center"
          cx="35%"
          cy="25%"
          r="80%"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dce4ee" />
        </radialGradient>

        <clipPath id="login-ball-clip">
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>

      {/* ボール本体 */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="url(#login-ball-body)"
        stroke="#d5deea"
        strokeWidth="1"
      />

      <g clipPath="url(#login-ball-clip)">
        {/* 中央を横切る赤い帯 */}
        <rect
          x="0"
          y="46.5"
          width="100"
          height="7"
          fill="url(#login-ball-red)"
        />

        {/* ボール表面の光 */}
        <ellipse
          cx="28"
          cy="17"
          rx="19"
          ry="7"
          fill="#ffffff"
          opacity="0.22"
          transform="rotate(-35 28 17)"
        />

        {/* 右下の影 */}
        <ellipse
          cx="76"
          cy="81"
          rx="23"
          ry="11"
          fill="#8393a8"
          opacity="0.08"
          transform="rotate(-35 76 81)"
        />
      </g>

      {/* 中央の赤いリング */}
      <circle
        cx="50"
        cy="50"
        r="20"
        fill="url(#login-ball-red)"
      />

      {/* リングの内側 */}
      <circle
        cx="50"
        cy="50"
        r="12.2"
        fill="#202733"
      />

      {/* 中央のボタン */}
      <circle
        cx="50"
        cy="50"
        r="10"
        fill="url(#login-ball-center)"
        stroke="#111827"
        strokeWidth="1.3"
      />

      {/* ボタンの小さな反射光 */}
      <ellipse
        cx="46.5"
        cy="46.5"
        rx="3"
        ry="1.5"
        fill="#ffffff"
        opacity="0.75"
        transform="rotate(-35 46.5 46.5)"
      />

      {/* 左上の縁のハイライト */}
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

// ログイン画面
function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // ログイン処理
  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            login_id: loginId,
            password: password,
          }),
        }
      );

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            data.message ||
            "ログインに失敗しました。入力内容を確認してください。"
        );
        return;
      }

      if (!data.access_token) {
        setMessage(
          "ログイン情報を取得できませんでした。もう一度お試しください。"
        );
        return;
      }

      // JWTを保存
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      // ログイン後はユーザー一覧へ移動
      navigate("/users");
    } catch (error) {
      console.error("ログインエラー:", error);

      setMessage(
        "サーバーとの通信に失敗しました。サーバーが起動しているか確認してください。"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <style>{`
        .login-page {
          --login-blue: #3269ed;
          --login-text: #172033;
          --login-muted: #7b879a;

          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 100vh;
          padding: 36px 20px;
          overflow: hidden;
          isolation: isolate;
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
          color: var(--login-text);
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            "Noto Sans JP",
            sans-serif;
        }

        .login-page *,
        .login-page *::before,
        .login-page *::after {
          box-sizing: border-box;
        }

        .login-decoration {
          position: absolute;
          z-index: -1;
          border: 1px solid rgba(90, 139, 235, 0.12);
          border-radius: 50%;
          pointer-events: none;
        }

        .login-decoration-one {
          top: -150px;
          right: -100px;
          width: 390px;
          height: 390px;
        }

        .login-decoration-two {
          bottom: -200px;
          left: -120px;
          width: 460px;
          height: 460px;
        }

        .login-card {
          width: 100%;
          max-width: 430px;
          padding: 38px 38px 30px;
          border: 1px solid rgba(224, 232, 244, 0.95);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow:
            0 24px 70px rgba(42, 72, 124, 0.09),
            0 3px 12px rgba(42, 72, 124, 0.035);
          animation: login-card-appear 0.4s ease-out;
        }

        @keyframes login-card-appear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          margin-bottom: 34px;
        }

        /* 参考画像風のボールロゴ */
        .login-brand-ball {
          display: block;
          flex: 0 0 46px;
          width: 46px;
          height: 46px;
          filter: drop-shadow(
            0 3px 3px rgba(30, 45, 70, 0.15)
          );
        }

        .login-brand-name {
          margin: 0;
          color: #172033;
          font-size: 28px;
          font-weight: 850;
          letter-spacing: -1.1px;
          line-height: 1.2;
        }

        .login-heading {
          margin: 0;
          color: var(--login-text);
          font-size: 27px;
          font-weight: 800;
          letter-spacing: -0.8px;
          line-height: 1.4;
          text-align: center;
        }

        .login-description {
          margin: 10px 0 30px;
          color: var(--login-muted);
          font-size: 13px;
          line-height: 1.9;
          text-align: center;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-width: 0;
        }

        .login-label {
          color: #344054;
          font-size: 13px;
          font-weight: 700;
        }

        .login-input-wrap {
          position: relative;
        }

        .login-input-icon {
          position: absolute;
          top: 50%;
          left: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          color: #8a98ad;
          pointer-events: none;
          transform: translateY(-50%);
        }

        .login-input-icon svg {
          width: 19px;
          height: 19px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.7;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .login-input {
          display: block;
          width: 100%;
          height: 50px;
          padding: 0 14px 0 46px;
          border: 1px solid #dfe6f0;
          border-radius: 12px;
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

        .login-input::placeholder {
          color: #a0aaba;
        }

        .login-input:hover {
          border-color: #c4d2e7;
        }

        .login-input:focus {
          border-color: var(--login-blue);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(50, 105, 237, 0.1);
        }

        .login-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          min-height: 51px;
          margin-top: 5px;
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

        .login-button:hover:not(:disabled) {
          box-shadow: 0 10px 20px rgba(50, 105, 237, 0.28);
          transform: translateY(-1px);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:focus-visible {
          outline: 3px solid rgba(50, 105, 237, 0.35);
          outline-offset: 3px;
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .login-button-arrow {
          font-size: 18px;
          font-weight: 500;
          line-height: 1;
        }

        .login-error {
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

        .login-footer {
          margin: 26px 0 0;
          padding-top: 20px;
          border-top: 1px solid #eef1f6;
          color: #8a96a8;
          font-size: 11px;
          line-height: 1.8;
          text-align: center;
        }

        .login-footer-mark {
          display: inline-block;
          margin-right: 5px;
          color: #4779e8;
        }

        @media (max-width: 480px) {
          .login-page {
            padding: 22px 15px;
          }

          .login-card {
            padding: 30px 23px 24px;
            border-radius: 20px;
          }

          .login-brand {
            margin-bottom: 29px;
          }

          .login-brand-ball {
            flex-basis: 42px;
            width: 42px;
            height: 42px;
          }

          .login-brand-name {
            font-size: 25px;
          }

          .login-heading {
            font-size: 24px;
          }

          .login-description {
            margin-bottom: 26px;
            font-size: 12px;
          }

          .login-input {
            height: 48px;
          }

          .login-button {
            min-height: 49px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-card {
            animation: none;
          }

          .login-input,
          .login-button {
            transition: none;
          }
        }
      `}</style>

      <div
        className="login-decoration login-decoration-one"
        aria-hidden="true"
      />

      <div
        className="login-decoration login-decoration-two"
        aria-hidden="true"
      />

      <section
        className="login-card"
        aria-labelledby="login-heading"
      >
        {/* ロゴ */}
        <div className="login-brand">
          <LoginBall />

          <p className="login-brand-name">
            PokeMeet
          </p>
        </div>

        {/* タイトル */}
        <h1
          id="login-heading"
          className="login-heading"
        >
          おかえりなさい！
        </h1>

        <p className="login-description">
          ポケモン好きの仲間とつながろう。
          <br />
          ログインして交流会を見つけよう！
        </p>

        {/* ログインフォーム */}
        <form
          className="login-form"
          onSubmit={handleLogin}
        >
          <div className="login-field">
            <label
              className="login-label"
              htmlFor="login-id"
            >
              ログインID
            </label>

            <div className="login-input-wrap">
              <span
                className="login-input-icon"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4.5 20c.7-4 3.4-6 7.5-6s6.8 2 7.5 6" />
                </svg>
              </span>

              <input
                id="login-id"
                className="login-input"
                type="text"
                name="login_id"
                autoComplete="username"
                placeholder="ログインIDを入力"
                value={loginId}
                onChange={(event) =>
                  setLoginId(event.target.value)
                }
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="login-field">
            <label
              className="login-label"
              htmlFor="login-password"
            >
              パスワード
            </label>

            <div className="login-input-wrap">
              <span
                className="login-input-icon"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24">
                  <rect
                    x="4.5"
                    y="10"
                    width="15"
                    height="11"
                    rx="2"
                  />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  <path d="M12 14.5v2.5" />
                </svg>
              </span>

              <input
                id="login-password"
                className="login-input"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {message && (
            <p className="login-error" role="alert">
              {message}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={isLoading}
          >
            <span>
              {isLoading ? "ログイン中..." : "ログイン"}
            </span>

            {!isLoading && (
              <span
                className="login-button-arrow"
                aria-hidden="true"
              >
                →
              </span>
            )}
          </button>
        </form>

        <p className="login-footer">
          <span
            className="login-footer-mark"
            aria-hidden="true"
          >
            ●
          </span>
          ポケモン好きが集まるコミュニティ
          <br />
          PokeMeet
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
