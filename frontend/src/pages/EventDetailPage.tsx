import { useEffect, useState } from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";


import type { CSSProperties } from "react";


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





/* =========================================================
  都市画像
  ========================================================= */

function getCityImage(
  location: string
): string {


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





/* =========================================================
  都市カラー
  ========================================================= */

function getCityClass(
  location: string
): string {


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





/* =========================================================
  日時表示
  ========================================================= */

function formatEventDate(
  dateString: string
): string {


  const date = new Date(dateString);


  return date.toLocaleString(
    "ja-JP",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}





/* =========================================================
  料金表示
  ========================================================= */

function formatParticipationFee(
  fee: number
): string {


  if (fee === 0) {
    return "無料";
  }


  return `${fee.toLocaleString("ja-JP")}円`;
}





/* =========================================================
  イベント詳細ページ
  ========================================================= */

function EventDetailPage() {


  const { eventId } = useParams();


  const navigate = useNavigate();


  const [event, setEvent] =
    useState<Event | null>(null);


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  const [joining, setJoining] =
    useState(false);





  /* =======================================================
     イベント取得
     ======================================================= */

  useEffect(() => {


    const fetchEvent = async () => {


      try {


        setLoading(true);
        setError("");


        if (!eventId) {


          setError(
            "交流会が見つかりません。"
          );


          return;
        }


        const token =
          localStorage.getItem(
            "access_token"
          );


        const response =
          await fetch(
            `http://127.0.0.1:8000/events/${eventId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        const data =
          await response.json();


        if (!response.ok) {


          throw new Error(
            data.detail ||
              "交流会の取得に失敗しました"
          );
        }


        setEvent(data);


      } catch (error) {


        console.error(error);


        setError(
          error instanceof Error
            ? error.message
            : "交流会の取得に失敗しました。"
        );


      } finally {


        setLoading(false);
      }
    };


    fetchEvent();


  }, [eventId]);





  /* =======================================================
     参加登録
     ======================================================= */

  const handleJoinEvent =
    async () => {


      if (!event) {
        return;
      }


      if (event.is_joined) {
        return;
      }


      if (event.remaining_slots <= 0) {
        return;
      }


      try {


        setJoining(true);
        setError("");


        const token =
          localStorage.getItem(
            "access_token"
          );


        const response =
          await fetch(
            `http://127.0.0.1:8000/events/${event.id}/join`,
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        const data =
          await response.json();


        if (!response.ok) {


          throw new Error(
            data.detail ||
              "交流会への参加に失敗しました"
          );
        }





        /* -----------------------------------------------
           参加後に最新情報を取得
           ----------------------------------------------- */

        const eventResponse =
          await fetch(
            `http://127.0.0.1:8000/events/${event.id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        const updatedEvent =
          await eventResponse.json();


        if (!eventResponse.ok) {


          throw new Error(
            updatedEvent.detail ||
              "参加情報の取得に失敗しました"
          );
        }


        setEvent(updatedEvent);


      } catch (error) {


        console.error(error);


        setError(
          error instanceof Error
            ? error.message
            : "交流会への参加に失敗しました"
        );


      } finally {


        setJoining(false);
      }


    };





  /* =======================================================
     読み込み中
     ======================================================= */

  if (loading) {


    return (
      <main className="page">


        <div className="page-container">


          <div className="empty-message">
            交流会を読み込んでいます...
          </div>


        </div>


      </main>
    );
  }





  /* =======================================================
     エラー
     ======================================================= */

  if (error || !event) {


    return (
      <main className="page">


        <div className="page-container">


          <div className="message">
            {error ||
              "交流会が見つかりません。"}
          </div>


          <div className="page-actions">


            <button
              className="button button-secondary"
              onClick={() =>
                navigate("/events")
              }
            >
              ← 交流会一覧に戻る
            </button>


          </div>


        </div>


      </main>
    );
  }





  /* =======================================================
     表示用データ
     ======================================================= */

const cityImage =
  event.image_url
    ? `http://127.0.0.1:8000${event.image_url}`
    : getCityImage(
        event.location
      );

  const cityClass =
    getCityClass(event.location);





  const participantPercentage =
    event.capacity > 0
      ? Math.min(
          100,
          Math.round(
            (event.participant_count /
              event.capacity) *
              100
          )
        )
      : 0;





  /*
   * CSSのカスタムプロパティとして
   * 背景画像を渡す。
   */

  const imageStyle =
    cityImage
      ? ({
          "--detail-image":
            `url(${cityImage})`,
        } as CSSProperties)
      : undefined;





  /* =======================================================
     画面
     ======================================================= */

  return (
    <main className="page">


      <div className="page-container">





        {/* =================================================
            戻る
            ================================================= */}

        <button
          className="back-link"
          onClick={() =>
            navigate("/events")
          }
        >
          ← 交流会一覧に戻る
        </button>





        {/* =================================================
            詳細カード
            ================================================= */}

        <article
          className={
            `event-detail-card ${cityClass}`
          }
        >





          {/* ===============================================
              街画像
              =============================================== */}

          {cityImage && (


            <div
              className="event-detail-image"
              style={imageStyle}
            >


              <img
                src={cityImage}
                alt={`${event.location}の街並み`}
              />


              <div className="city-label">


                <span
                  className="city-label-ball"
                ></span>


                {event.location}


              </div>


            </div>
          )}





          {/* ===============================================
              本文
              =============================================== */}

          <div className="event-detail-content">





            {/* =============================================
                タイトル
                ============================================= */}

            <div className="event-detail-heading">


              <span
                className="event-detail-category"
              >
                ポケモン交流会
              </span>


              <h1 className="event-detail-title">
                {event.title}
              </h1>


            </div>





            {/* =============================================
                基本情報
                ============================================= */}

            <div className="event-detail-info">





              {/* 日時 */}

              <div className="event-detail-info-item">


                <span
                  className="event-detail-info-icon"
                >
                  📅
                </span>


                <div>


                  <span
                    className="event-detail-info-label"
                  >
                    開催日時
                  </span>


                  <strong>
                    {formatEventDate(
                      event.event_date
                    )}
                  </strong>


                </div>


              </div>





              {/* 場所 */}

              <div className="event-detail-info-item">


                <span
                  className="event-detail-info-icon"
                >
                  📍
                </span>


                <div>


                  <span
                    className="event-detail-info-label"
                  >
                    開催場所
                  </span>


                  <strong>
                    {event.location}
                  </strong>


                </div>


              </div>





              {/* 定員 */}

              <div className="event-detail-info-item">


                <span
                  className="event-detail-info-icon"
                >
                  👥
                </span>


                <div>


                  <span
                    className="event-detail-info-label"
                  >
                    定員
                  </span>


                  <strong>
                    {event.capacity}名
                  </strong>


                </div>


              </div>





              {/* 参加料金 */}

              <div className="event-detail-info-item">


                <span
                  className="event-detail-info-icon"
                >
                  💰
                </span>


                <div>


                  <span
                    className="event-detail-info-label"
                  >
                    参加料金
                  </span>


                  <strong>
                    {formatParticipationFee(
                      event.participation_fee
                    )}
                  </strong>


                </div>


              </div>


            </div>





            {/* =============================================
                参加者状況
                ============================================= */}

            <section className="event-detail-section">


              <h2>
                👥 参加者状況
              </h2>





              <div className="participant-status">





                <div className="participant-count">


                  <strong>
                    {event.participant_count}
                  </strong>


                  <span>
                    / {event.capacity}名
                  </span>


                </div>





                <div className="participant-bar">


                  <div
                    className="participant-bar-fill"
                    style={{
                      width:
                        `${participantPercentage}%`,
                    }}
                  ></div>


                </div>





                <p className="participant-remaining">


                  {event.remaining_slots > 0
                    ? `あと${event.remaining_slots}名参加できます`
                    : "満員です"}


                </p>


              </div>


            </section>





            {/* =============================================
                交流会について
                ============================================= */}

            <section className="event-detail-section">


              <h2>
                この交流会について
              </h2>


              <p>
                {event.description ||
                  "この交流会の詳細情報はまだ登録されていません。"}
              </p>


            </section>





            {/* =============================================
                交流会情報
                ============================================= */}

            <section className="event-detail-section">


              <h2>
                交流会情報
              </h2>


              <div className="event-meta">


                <div>


                  <span>
                    交流会ID
                  </span>


                  <strong>
                    #{event.id}
                  </strong>


                </div>





                <div>


                  <span>
                    作成者ID
                  </span>


                  <strong>
                    #{event.created_by}
                  </strong>


                </div>


              </div>


            </section>





            {/* =============================================
                操作ボタン
                ============================================= */}

            <div className="event-detail-actions">





              <button
                className="button button-primary event-join-button"
                onClick={handleJoinEvent}
                disabled={
                  joining ||
                  event.is_joined ||
                  event.remaining_slots <= 0
                }
              >


                <span
                  className="button-ball"
                  aria-hidden="true"
                ></span>





                {joining
                  ? "参加処理中..."
                  : event.is_joined
                    ? "参加済み"
                    : event.remaining_slots <= 0
                      ? "満員"
                      : "交流会に参加する"}





                <span className="button-arrow">
                  →
                </span>


              </button>





              <button
                className="button button-secondary"
                onClick={() =>
                  navigate("/events")
                }
              >
                一覧に戻る
              </button>


            </div>


          </div>


        </article>


      </div>


    </main>
  );
}


export default EventDetailPage;