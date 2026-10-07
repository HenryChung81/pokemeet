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

  // URLからeventIdを取得する
  //
  // 例えば、
  // /events/1
  //
  // なら、
  // eventId = "1"
  //
  // となる。
  const { eventId } = useParams();


  // 交流会情報を保存するstate
  //
  // APIから取得する前はnull。
  // 取得後はEvent型のデータが入る。
  const [event, setEvent] =
    useState<Event | null>(null);


  // エラーメッセージなどを保存するstate
  const [message, setMessage] = useState("");


  // ページ移動に使う
  const navigate = useNavigate();


  // ページが表示されたときに
  // 交流会情報を取得する
  useEffect(() => {

    const getEvent = async (): Promise<void> => {

      // URLからeventIdが取得できない場合
      if (!eventId) {

        setMessage(
          "交流会IDが指定されていません"
        );

        return;
      }


      try {

        // FastAPIの交流会詳細APIへアクセスする
        //
        // 例えばeventIdが1なら、
        // GET /events/1
        // になる。
        const response = await fetch(
          `http://127.0.0.1:8000/events/${eventId}`
        );


        // FastAPIから返されたJSONを取得する
        const data: Event | { detail: string } =
          await response.json();


        // HTTPステータスが200番台ではない場合
        if (!response.ok) {

          // FastAPIのHTTPExceptionの場合、
          // detailにエラーメッセージが入っている
          if ("detail" in data) {

            setMessage(data.detail);

          } else {

            setMessage(
              "交流会情報の取得に失敗しました"
            );
          }

          return;
        }


        // 取得した交流会情報をstateに保存する
        if ("id" in data) {

          setEvent(data);
        }

      } catch (error) {

        // 通信エラーなどが発生した場合
        console.error(error);

        setMessage(
          "通信エラーが発生しました"
        );
      }
    };


    // 交流会情報を取得する
    getEvent();

  }, [eventId]);


  // 画面に表示する内容
  return (
    <div>

      {/* アプリのタイトル */}
      <h1>PokeMeet</h1>


      {/* ページタイトル */}
      <h2>交流会詳細</h2>


      {/* エラーメッセージ */}
      {message && (
        <p>{message}</p>
      )}


      {/* 交流会情報が取得できた場合 */}
      {event && (

        <div>

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
            {event.description || "説明なし"}
          </p>


          {/* 作成者 */}
          <p>
            作成者ID：
            {event.created_by}
          </p>


          {/* 交流会ID */}
          <p>
            交流会ID：
            {event.id}
          </p>

        </div>
      )}


      <br />


      {/* 交流会一覧へ戻る */}
      <button
        onClick={() =>
          navigate("/events")
        }
      >
        交流会一覧へ戻る
      </button>


      <br />
      <br />


      {/* ユーザー一覧へ戻る */}
      <button
        onClick={() =>
          navigate("/users")
        }
      >
        ユーザー一覧へ戻る
      </button>

    </div>
  );
}


// EventDetailPageを他のファイルから使用できるようにする
export default EventDetailPage;