import { useEffect, useState } from "react";

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
  if (location.includes("池袋")) {
    return ikebukuroImage;
  }

  if (location.includes("新宿")) {
    return shinjukuImage;
  }

  if (location.includes("渋谷")) {
    return shibuyaImage;
  }

  if (location.includes("上野")) {
    return uenoImage;
  }

  if (location.includes("名古屋")) {
    return nagoyaImage;
  }

  if (location.includes("大阪")) {
    return osakaImage;
  }

  if (location.includes("秋葉原")) {
    return akihabaraImage;
  }

  if (location.includes("中野")) {
    return nakanoImage;
  }
    if (location.includes("台北")) {
    return taipeiImage;
  }

  if (location.includes("横浜")) {
    return yokohamaImage;
  }

  if (location.includes("吉祥寺")) {
    return kichijojiImage;
  }

  return defaultImage;
}


/* =========================
  開催地ごとのCSSクラス
  ========================= */

function getCityClass(location: string): string {
  if (location.includes("池袋")) {
    return "city-ikebukuro";
  }

  if (location.includes("新宿")) {
    return "city-shinjuku";
  }

  if (location.includes("渋谷")) {
    return "city-shibuya";
  }

  if (location.includes("上野")) {
    return "city-ueno";
  }

  if (location.includes("名古屋")) {
    return "city-nagoya";
  }

  if (location.includes("大阪")) {
    return "city-osaka";
  }

  if (location.includes("秋葉原")) {
    return "city-akihabara";
  }

  if (location.includes("中野")) {
    return "city-nakano";
  }

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
  交流会一覧ページ
  ========================= */

function EventsPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 管理者かどうか
  const [isAdmin, setIsAdmin] = useState(false);


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
          throw new Error(
            "交流会の取得に失敗しました"
          );
        }

        const data: Event[] =
          await response.json();

        setEvents(data);
      } catch (error) {
        console.error(error);

        setError(
          "交流会の取得に失敗しました。"
        );
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


          {/* =========================
              管理者のみ表示
              ========================= */}

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
            交流会なし
            ========================= */}

        {!loading &&
          !error &&
          events.length === 0 && (
            <div className="empty-message">
              現在、開催予定の交流会はありません。
            </div>
          )}


        {/* =========================
            交流会一覧
            ========================= */}

        {!loading &&
          !error &&
          events.length > 0 && (
            <div className="event-grid">

              {events.map((event) => {

                const cityImage =
                  getCityImage(
                    event.location
                  );

                const cityClass =
                  getCityClass(
                    event.location
                  );

                return (
                  <article
                    key={event.id}
                    className={`event-card ${cityClass}`}
                  >


                    {/* =========================
                        都市イラスト
                        ========================= */}

                    {cityImage && (
                      <div className="event-city-image">

                        <img
                          src={cityImage}
                          alt={`${event.location}の街並み`}
                        />

                        <div className="city-label">
                          <span className="city-label-ball"></span>
                          {event.location}
                        </div>

                      </div>
                    )}


                    {/* =========================
                        カード本文
                        ========================= */}

                    <div className="event-card-content">

                      <h2 className="event-card-title">
                        {event.title}
                      </h2>


                      {/* =========================
                          イベント情報
                          ========================= */}

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


                      {/* =========================
                          説明
                          ========================= */}

                      {event.description && (
                        <p className="event-description">
                          {event.description}
                        </p>
                      )}


                      {/* =========================
                          詳細ボタン
                          ========================= */}

                      <div className="event-button-area">

                        <button
                          className="button button-primary"
                          onClick={() =>
                            navigate(
                              `/events/${event.id}`
                            )
                          }
                        >

                          <span
                            className="button-ball"
                            aria-hidden="true"
                          ></span>

                          <span>
                            詳細を見る
                          </span>

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