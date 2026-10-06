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


  // 画面に表示する内容
  return (
    <div>

      {/* アプリのタイトル */}
      <h1>PokeMeet</h1>


      {/* ページタイトル */}
      <h2>交流会一覧</h2>


      {/* エラーメッセージを表示 */}
      {message && (
        <p>{message}</p>
      )}


      {/* 交流会が存在する場合だけ一覧を表示 */}
      {events.length > 0 ? (

        <div>

          {events.map((event) => (

            <div key={event.id}>

              {/* 交流会名 */}
              <h3>
                {event.title}
              </h3>


              {/* 開催日時 */}
              <p>
                開催日時：
                {event.event_date}
              </p>


              {/* 開催場所 */}
              <p>
                場所：
                {event.location}
              </p>


              {/* 定員 */}
              <p>
                定員：
                {event.capacity}人
              </p>


              {/* 交流会の説明 */}
              <p>
                説明：
                {event.description}
              </p>


              {/* 交流会詳細ページは後で作成する */}
              <button
                onClick={() =>
                  navigate(`/events/${event.id}`)
                }
              >
                詳細を見る
              </button>


              <hr />

            </div>

          ))}

        </div>

      ) : (

        // 交流会が存在しない場合
        <p>
          現在、交流会はありません。
        </p>

      )}


      {/* ユーザー一覧へ戻る */}
      <button
        onClick={() => navigate("/users")}
      >
        ユーザー一覧へ戻る
      </button>

    </div>
  );
}


// EventsPageを他のファイルから使用できるようにする
export default EventsPage;