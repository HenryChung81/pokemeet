// Reactの状態管理と、
// ページ表示時に処理を実行するための機能
import {
  useEffect,
  useState,
} from "react";

// React Routerから、
// 別のページへ移動するための機能を読み込む
import { useNavigate } from "react-router-dom";

// 交流会情報の型を読み込む
import type { Event } from "../types/event";


// 交流会一覧画面
function EventsPage() {

  // 交流会一覧を保存するstate
  const [events, setEvents] = useState<Event[]>([]);


  // エラーメッセージなどを保存するstate
  const [message, setMessage] = useState("");


  // ページ移動に使う
  const navigate = useNavigate();


  // ページが表示されたときに
  // 交流会一覧を取得する
  useEffect(() => {

    const getEvents = async (): Promise<void> => {

      try {

        // FastAPIの交流会一覧APIへアクセスする
        const response = await fetch(
          "http://127.0.0.1:8000/events"
        );


        // FastAPIから返されたJSONを取得する
        const data: Event[] = await response.json();


        // HTTPステータスが200番台ではない場合
        if (!response.ok) {

          setMessage(
            "交流会一覧の取得に失敗しました"
          );

          return;
        }


        // 取得した交流会一覧をstateに保存する
        setEvents(data);

      } catch (error) {

        // 通信エラーなどが発生した場合
        console.error(error);

        setMessage(
          "通信エラーが発生しました"
        );
      }
    };


    // 交流会一覧を取得する
    getEvents();

  }, []);


  // 日時を日本語表示に変換する関数
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


  // 画面に表示する内容
  return (
    <div className="page">

      <div className="page-container">

        {/* =========================
            ページタイトル
            ========================= */}

        <div className="page-header">

          <h1 className="page-title">
            交流会一覧
          </h1>

          <p className="page-description">
            ポケモン好きな人と交流できるイベントを探そう！
          </p>

        </div>


        {/* =========================
            エラーメッセージ
            ========================= */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}


        {/* =========================
            交流会一覧
            ========================= */}

        {events.length > 0 ? (

          <div className="event-grid">

            {events.map((event) => (

              <div
                className="event-card"
                key={event.id}
              >

                {/* 交流会名 */}
                <h2 className="event-card-title">
                  {event.title}
                </h2>


                {/* 交流会情報 */}
                <div className="event-info">

                  {/* 開催日時 */}
                  <div className="event-info-row">

                    <span className="event-info-icon">
                      📅
                    </span>

                    <span>
                      {formatDate(event.event_date)}
                    </span>

                  </div>


                  {/* 開催場所 */}
                  <div className="event-info-row">

                    <span className="event-info-icon">
                      📍
                    </span>

                    <span>
                      {event.location}
                    </span>

                  </div>


                  {/* 定員 */}
                  <div className="event-info-row">

                    <span className="event-info-icon">
                      👥
                    </span>

                    <span>
                      定員 {event.capacity}人
                    </span>

                  </div>

                </div>


                {/* 交流会の説明 */}
                <p className="event-description">

                  {event.description
                    || "交流会の説明はありません。"}

                </p>


                {/* 詳細ボタン */}
                <div className="event-button-area">

                  <button
                    className="button button-primary"
                    onClick={() =>
                      navigate(`/events/${event.id}`)
                    }
                  >
                    詳細を見る
                  </button>

                </div>

              </div>

            ))}

          </div>

        ) : (

          /* =========================
             交流会が存在しない場合
             ========================= */

          <div className="empty-message">

            現在、交流会はありません。

          </div>

        )}


        {/* =========================
            戻るボタン
            ========================= */}

        <div className="page-actions">

          <button
            className="button button-secondary"
            onClick={() =>
              navigate("/users")
            }
          >
            ユーザー一覧へ戻る
          </button>

        </div>

      </div>

    </div>
  );
}


// EventsPageを他のファイルから使用できるようにする
export default EventsPage;