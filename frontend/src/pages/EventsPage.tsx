
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Event } from "../types/event";

import ikebukuroImage from "../assets/cities/ikebukuro.png";
import shinjukuImage from "../assets/cities/shinjuku.png";
import shibuyaImage from "../assets/cities/shibuya.png";
import uenoImage from "../assets/cities/ueno.png";
import nagoyaImage from "../assets/cities/nagoya.png";
import osakaImage from "../assets/cities/osaka.png";
import akihabaraImage from "../assets/cities/akihabara.png";
import nakanoImage from "../assets/cities/nakano.png";
import taipeiImage from "../assets/cities/taipei.png";
import yokohamaImage from "../assets/cities/yokohama.png";
import kichijojiImage from "../assets/cities/kichijoji.png";
import defaultImage from "../assets/cities/default.png";

import "../App.css";

/* =========================
   開催地ごとの画像
   ========================= */
function getCityImage(location: string): string | null {
  if (location.includes("池袋")) return ikebukuroImage;
  if (location.includes("新宿")) return shinjukuImage;
  if (location.includes("渋谷")) return shibuyaImage;
  if (location.includes("上野")) return uenoImage;
  if (location.includes("名古屋")) return nagoyaImage;
  if (location.includes("大阪")) return osakaImage;
  if (location.includes("秋葉原")) return akihabaraImage;
  if (location.includes("中野")) return nakanoImage;
  if (location.includes("台北")) return taipeiImage;
  if (location.includes("横浜")) return yokohamaImage;
  if (location.includes("吉祥寺")) return kichijojiImage;

  return defaultImage;
}

/* =========================
   開催地ごとのCSSクラス
   ========================= */
function getCityClass(location: string): string {
  if (location.includes("池袋")) return "city-ikebukuro";
  if (location.includes("新宿")) return "city-shinjuku";
  if (location.includes("渋谷")) return "city-shibuya";
  if (location.includes("上野")) return "city-ueno";
  if (location.includes("名古屋")) return "city-nagoya";
  if (location.includes("大阪")) return "city-osaka";
  if (location.includes("秋葉原")) return "city-akihabara";
  if (location.includes("中野")) return "city-nakano";

  return "city-default";
}

/* =========================
   日付表示
   ========================= */
function formatEventDate(dateString: string): string {
  const date = new Date(dateString);

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================
   開催済みかどうか
   ========================= */
function isPastEvent(dateString: string): boolean {
  const eventTime = new Date(dateString).getTime();

  return (
    Number.isFinite(eventTime) &&
    eventTime < Date.now()
  );
}

/* =========================
   交流会一覧ページ
   ========================= */
function EventsPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 管理者かどうか
  const [isAdmin, setIsAdmin] = useState(false);

  // 検索条件
  const [keyword, setKeyword] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  // 初期表示は開催予定のみ
  const [dateFilter, setDateFilter] = useState<
    "all" | "upcoming" | "past"
  >("upcoming");

  /* =========================
     交流会取得
     ========================= */
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://127.0.0.1:8000/events"
        );

        if (!response.ok) {
          throw new Error("交流会の取得に失敗しました");
        }

        const data: Event[] = await response.json();

        setEvents(data);
      } catch (error) {
        console.error(error);
        setError("交流会の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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

        const data = await response.json();

        setIsAdmin(data.role === "admin");
      } catch (error) {
        console.error(error);
      }
    };

    fetchCurrentUser();
  }, []);

  /* =========================
     開催地の選択肢を作成
     ========================= */
  const availableLocations = useMemo(() => {
    return Array.from(
      new Set(
        events
          .map((event) => event.location.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "ja"));
  }, [events]);

  /* =========================
     検索条件に合う交流会を抽出
     ========================= */
  const filteredEvents = useMemo(() => {
    const normalizedKeyword = keyword
      .trim()
      .toLocaleLowerCase();

    const now = Date.now();

    return events.filter((event) => {
      // 交流会名・開催場所・説明文を検索
      const searchableText = [
        event.title,
        event.location,
        event.description ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase();

      const matchesKeyword =
        normalizedKeyword === "" ||
        searchableText.includes(normalizedKeyword);

      // 開催場所で絞り込み
      const matchesLocation =
        locationFilter === "all" ||
        event.location === locationFilter;

      // 開催日で絞り込み
      const eventTime = new Date(
        event.event_date
      ).getTime();

      const hasValidDate = Number.isFinite(eventTime);

      const matchesDate =
        dateFilter === "all" ||
        (
          dateFilter === "upcoming" &&
          hasValidDate &&
          eventTime >= now
        ) ||
        (
          dateFilter === "past" &&
          hasValidDate &&
          eventTime < now
        );

      return (
        matchesKeyword &&
        matchesLocation &&
        matchesDate
      );
    });
  }, [
    events,
    keyword,
    locationFilter,
    dateFilter,
  ]);

  /* =========================
     検索条件をリセット
     初期状態の「開催予定」に戻す
     ========================= */
  const resetSearch = () => {
    setKeyword("");
    setLocationFilter("all");
    setDateFilter("upcoming");
  };

  // 初期状態から変更されているか
  const hasSearchConditions =
    keyword.trim() !== "" ||
    locationFilter !== "all" ||
    dateFilter !== "upcoming";

  return (
    <main className="page">
      <div className="page-container">

        {/* =========================
            ページタイトル
            ========================= */}
        <div className="page-header">
          <div className="page-title-area">
            <span className="page-title-ball"></span>

            <div>
              <h1 className="page-title">
                交流会を探す
              </h1>

              <p className="page-description">
                ポケモン好きが集まる交流会を探してみよう！
              </p>
            </div>
          </div>

          {/* 管理者のみ表示 */}
          {isAdmin && (
            <button
              className="button button-primary"
              onClick={() =>
                navigate("/events/create")
              }
            >
              ＋ 交流会を作成
            </button>
          )}
        </div>

        {/* =========================
            検索エリア・バッジのスタイル
            ========================= */}
        <style>{`
          .event-search-panel {
            margin: 24px 0 28px;
            padding: 20px 22px;
            background: #ffffff;
            border: 1px solid #e8edf5;
            border-radius: 18px;
            box-shadow: 0 5px 20px rgba(35, 70, 130, 0.045);
          }

          .event-search-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 16px;
          }

          .event-search-heading-main {
            display: flex;
            align-items: center;
            gap: 11px;
            min-width: 0;
          }

          .event-search-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 42px;
            height: 42px;
            border-radius: 13px;
            background: #edf4ff;
            color: #2563eb;
            font-size: 21px;
          }

          .event-search-title {
            margin: 0;
            color: #172033;
            font-size: 17px;
            font-weight: 750;
            letter-spacing: -0.3px;
          }

          .event-search-subtitle {
            margin: 4px 0 0;
            color: #7b879a;
            font-size: 12px;
            line-height: 1.5;
          }

          .event-search-count {
            flex-shrink: 0;
            padding: 7px 11px;
            border-radius: 999px;
            background: #f0f5ff;
            color: #245edb;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
          }

          .event-search-fields {
            display: grid;
            grid-template-columns: minmax(220px, 1.8fr) minmax(150px, 1fr) minmax(150px, 1fr);
            gap: 12px;
            align-items: end;
          }

          .event-search-field {
            display: block;
            min-width: 0;
          }

          .event-search-label {
            display: block;
            margin-bottom: 7px;
            color: #475569;
            font-size: 12px;
            font-weight: 700;
          }

          .event-search-control {
            box-sizing: border-box;
            display: block;
            width: 100%;
            height: 44px;
            padding: 0 12px;
            border: 1px solid #e1e7f0;
            border-radius: 11px;
            outline: none;
            background: #f9fbfe;
            color: #263449;
            font: inherit;
            font-size: 13px;
            transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
          }

          .event-search-control:hover {
            border-color: #c8d6ed;
            background: #ffffff;
          }

          .event-search-control:focus {
            border-color: #5288f5;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.11);
          }

          .event-search-keyword-wrap {
            position: relative;
          }

          .event-search-keyword-wrap .event-search-control {
            padding-left: 38px;
          }

          .event-search-keyword-icon {
            position: absolute;
            top: 50%;
            left: 13px;
            transform: translateY(-50%);
            color: #8190a7;
            font-size: 15px;
            pointer-events: none;
          }

          .event-search-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
            padding-top: 13px;
            border-top: 1px solid #f0f3f8;
          }

          .event-search-result {
            margin: 0;
            color: #78869b;
            font-size: 12px;
          }

          .event-search-result strong {
            margin: 0 3px;
            color: #2563eb;
            font-size: 14px;
          }

          .event-search-reset {
            padding: 5px 0;
            border: none;
            background: transparent;
            color: #5473a8;
            font: inherit;
            font-size: 12px;
            font-weight: 650;
            cursor: pointer;
            transition: color 0.18s ease;
          }

          .event-search-reset:hover {
            color: #1d4ed8;
            text-decoration: underline;
          }

          .event-search-reset:focus-visible {
            outline: 2px solid #5288f5;
            outline-offset: 4px;
            border-radius: 3px;
          }

          /* 開催終了バッジ */
          .event-status-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            padding: 6px 11px;
            border: 1px solid rgba(255, 255, 255, 0.65);
            border-radius: 999px;
            background: rgba(241, 245, 249, 0.94);
            color: #596579;
            font-size: 11px;
            font-weight: 650;
            line-height: 1.4;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
            backdrop-filter: blur(6px);
          }

          @media (max-width: 680px) {
            .event-search-panel {
              margin: 20px 0 24px;
              padding: 16px;
              border-radius: 15px;
            }

            .event-search-heading {
              align-items: flex-start;
            }

            .event-search-icon {
              width: 38px;
              height: 38px;
              border-radius: 11px;
            }

            .event-search-title {
              font-size: 16px;
            }

            .event-search-subtitle {
              font-size: 11px;
            }

            .event-search-count {
              padding: 6px 8px;
              font-size: 11px;
            }

            .event-search-fields {
              grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
              gap: 12px 10px;
            }

            .event-search-keyword-field {
              grid-column: 1 / -1;
            }

            .event-search-control {
              height: 43px;
              font-size: 13px;
            }

            .event-status-badge {
              top: 9px;
              right: 9px;
              padding: 5px 9px;
              font-size: 10px;
            }
          }

          @media (max-width: 360px) {
            .event-search-heading {
              flex-wrap: wrap;
            }

            .event-search-fields {
              grid-template-columns: minmax(0, 1fr);
            }

            .event-search-keyword-field {
              grid-column: auto;
            }
          }
        `}</style>

        {/* =========================
            読み込み中
            ========================= */}
        {loading && (
          <div className="empty-message">
            交流会を読み込んでいます...
          </div>
        )}

        {/* =========================
            エラー
            ========================= */}
        {!loading && error && (
          <div className="message">
            {error}
          </div>
        )}

        {/* =========================
            検索エリア
            ========================= */}
        {!loading && !error && events.length > 0 && (
          <section
            className="event-search-panel"
            aria-label="交流会検索"
          >
            <div className="event-search-heading">
              <div className="event-search-heading-main">
                <div
                  className="event-search-icon"
                  aria-hidden="true"
                >
                  ⌕
                </div>

                <div>
                  <h2 className="event-search-title">
                    交流会を見つけよう
                  </h2>

                  <p className="event-search-subtitle">
                    気になるイベントを探してみよう！
                  </p>
                </div>
              </div>

              <span className="event-search-count">
                {filteredEvents.length} / {events.length} 件
              </span>
            </div>

            <div className="event-search-fields">
              {/* キーワード検索 */}
              <label className="event-search-field event-search-keyword-field">
                <span className="event-search-label">
                  キーワード
                </span>

                <div className="event-search-keyword-wrap">
                  <span
                    className="event-search-keyword-icon"
                    aria-hidden="true"
                  >
                    🔍
                  </span>

                  <input
                    type="search"
                    className="event-search-control"
                    value={keyword}
                    onChange={(event) =>
                      setKeyword(event.target.value)
                    }
                    placeholder="交流会名・場所・キーワード"
                    aria-label="交流会をキーワードで検索"
                  />
                </div>
              </label>

              {/* 開催場所 */}
              <label className="event-search-field">
                <span className="event-search-label">
                  📍 開催場所
                </span>

                <select
                  className="event-search-control"
                  value={locationFilter}
                  onChange={(event) =>
                    setLocationFilter(event.target.value)
                  }
                  aria-label="開催場所で絞り込む"
                >
                  <option value="all">
                    すべての場所
                  </option>

                  {availableLocations.map((location) => (
                    <option
                      key={location}
                      value={location}
                    >
                      {location}
                    </option>
                  ))}
                </select>
              </label>

              {/* 開催日 */}
              <label className="event-search-field">
                <span className="event-search-label">
                  📅 開催日
                </span>

                <select
                  className="event-search-control"
                  value={dateFilter}
                  onChange={(event) =>
                    setDateFilter(
                      event.target.value as
                        | "all"
                        | "upcoming"
                        | "past"
                    )
                  }
                  aria-label="開催日で絞り込む"
                >
                  <option value="upcoming">
                    開催予定
                  </option>

                  <option value="all">
                    すべての日程
                  </option>

                  <option value="past">
                    開催済み
                  </option>
                </select>
              </label>
            </div>

            <div className="event-search-footer">
              <p
                className="event-search-result"
                aria-live="polite"
              >
                {dateFilter === "upcoming"
                  ? "開催予定の交流会"
                  : dateFilter === "past"
                    ? "開催済みの交流会"
                    : "該当する交流会"}
                <strong>{filteredEvents.length}</strong>
                件を表示中
              </p>

              {hasSearchConditions && (
                <button
                  type="button"
                  className="event-search-reset"
                  onClick={resetSearch}
                >
                  条件をクリア ↗
                </button>
              )}
            </div>
          </section>
        )}

        {/* =========================
            交流会データなし
            ========================= */}
        {!loading && !error && events.length === 0 && (
          <div className="empty-message">
            現在、交流会はありません。
          </div>
        )}

        {/* =========================
            検索結果なし
            ========================= */}
        {!loading &&
          !error &&
          events.length > 0 &&
          filteredEvents.length === 0 && (
            <div className="empty-message">
              {dateFilter === "upcoming" &&
              keyword.trim() === "" &&
              locationFilter === "all" ? (
                <>
                  現在、開催予定の交流会はありません。
                  <br />
                  過去の交流会は「開催日」から「開催済み」を選ぶと確認できます。
                </>
              ) : (
                <>
                  条件に一致する交流会が見つかりませんでした。
                  <br />
                  キーワードや開催場所を変更してみてください。
                </>
              )}
            </div>
          )}

        {/* =========================
            交流会一覧
            ========================= */}
        {!loading &&
          !error &&
          filteredEvents.length > 0 && (
            <div className="event-grid">
              {filteredEvents.map((event) => {
                const cityImage = event.image_url
                  ? `http://127.0.0.1:8000${event.image_url}`
                  : getCityImage(event.location);

                const cityClass = getCityClass(
                  event.location
                );

                const pastEvent = isPastEvent(
                  event.event_date
                );

                return (
                  <article
                    key={event.id}
                    className={`event-card ${cityClass}`}
                  >
                    {/* 都市イラスト */}
                    {cityImage && (
                      <div
                        className="event-city-image"
                        style={{ position: "relative" }}
                      >
                        <img
                          src={cityImage}
                          alt={`${event.location}の街並み`}
                        />

                        <div className="city-label">
                          <span className="city-label-ball"></span>
                          {event.location}
                        </div>

                        {/* 開催終了バッジ */}
                        {pastEvent && (
                          <span
                            className="event-status-badge"
                            aria-label="開催終了"
                          >
                            開催終了
                          </span>
                        )}
                      </div>
                    )}

                    {/* カード本文 */}
                    <div className="event-card-content">
                      <h2 className="event-card-title">
                        {event.title}
                      </h2>

                      {/* イベント情報 */}
                      <div className="event-info">
                        <div className="event-info-chip">
                          <span className="event-info-icon">
                            📅
                          </span>

                          <span>
                            {formatEventDate(
                              event.event_date
                            )}
                          </span>
                        </div>

                        <div className="event-info-chip">
                          <span className="event-info-icon">
                            📍
                          </span>

                          <span>
                            {event.location}
                          </span>
                        </div>

                        <div className="event-info-chip">
                          <span className="event-info-icon">
                            👥
                          </span>

                          <span>
                            定員 {event.capacity}名
                          </span>
                        </div>
                      </div>

                      {/* 説明 */}
                      {event.description && (
                        <p className="event-description">
                          {event.description}
                        </p>
                      )}

                      {/* 詳細ボタン */}
                      <div className="event-button-area">
                        <button
                          className="button button-primary"
                          onClick={() =>
                            navigate(`/events/${event.id}`)
                          }
                        >
                          <span
                            className="button-ball"
                            aria-hidden="true"
                          ></span>

                          <span>詳細を見る</span>

                          <span className="button-arrow">
                            →
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </div>
    </main>
  );
}

export default EventsPage;
