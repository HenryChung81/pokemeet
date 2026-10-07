// Reactの状態管理と、
// ページ表示時に処理を実行するための機能
import {
  useEffect,
  useState,
} from "react";

// React Routerから、
// URLのパラメータとページ移動に使う機能を読み込む
import {
  useNavigate,
  useParams,
} from "react-router-dom";

// 交流会情報の型を読み込む
import type { Event } from "../types/event";


// 交流会詳細画面
function EventDetailPage() {

  // URLから交流会IDを取得する
  //
  // /events/1
  // ↓
  // eventId = "1"
  const { eventId } = useParams();


  // 交流会情報を保存するstate
  const [event, setEvent] =
    useState<Event | null>(null);


  // エラーメッセージを保存するstate
  const [message, setMessage] =
    useState("");


  // ページ移動に使う
  const navigate = useNavigate();


  // ページ表示時に交流会情報を取得する
  useEffect(() => {

    const getEvent = async (): Promise<void> => {

      if (!eventId) {

        setMessage(
          "交流会IDが指定されていません"
        );

        return;
      }


      try {

        // FastAPIの交流会詳細APIへアクセス
        const response = await fetch(
          `http://127.0.0.1:8000/events/${eventId}`
        );


        // JSONを取得
        const data:
          | Event
          | { detail: string } =
          await response.json();


        // エラーの場合
        if (!response.ok) {

          if ("detail" in data) {

            setMessage(data.detail);

          } else {

            setMessage(
              "交流会情報の取得に失敗しました"
            );
          }

          return;
        }


        // 交流会情報を保存
        if ("id" in data) {

          setEvent(data);
        }

      } catch (error) {

        console.error(error);

        setMessage(
          "通信エラーが発生しました"
        );
      }
    };


    getEvent();

  }, [eventId]);


  // 日時を日本語表示に変換する
  const formatDate = (
    dateString: string
  ): string => {

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
  };


  return (
    <div className="page">

      <div className="page-container">

        {/* 戻るボタン */}
        <div className="page-actions">

          <button
            className="button button-secondary"
            onClick={() =>
              navigate("/events")
            }
          >
            ← 交流会一覧へ戻る
          </button>

        </div>


        {/* エラーメッセージ */}
        {message && (

          <div className="message">
            {message}
          </div>

        )}


        {/* 交流会情報 */}
        {event && (

          <div className="detail-card">

            {/* 交流会名 */}
            <h1 className="detail-title">
              {event.title}
            </h1>


            {/* 基本情報 */}
            <div className="detail-info">

              <div className="detail-info-row">

                <div className="detail-label">
                  📅 開催日時
                </div>

                <div className="detail-value">
                  {formatDate(event.event_date)}
                </div>

              </div>


              <div className="detail-info-row">

                <div className="detail-label">
                  📍 場所
                </div>

                <div className="detail-value">
                  {event.location}
                </div>

              </div>


              <div className="detail-info-row">

                <div className="detail-label">
                  👥 定員
                </div>

                <div className="detail-value">
                  {event.capacity}人
                </div>

              </div>

            </div>


            {/* 説明 */}
            <h2>
              交流会について
            </h2>

            <p>
              {event.description
                || "交流会の説明はありません。"}
            </p>


            {/* 後で参加機能につなげる */}
            <div className="page-actions">

              <button
                className="button button-primary"
                disabled
              >
                参加する（準備中）
              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}


// EventDetailPageを他のファイルから使用できるようにする
export default EventDetailPage;