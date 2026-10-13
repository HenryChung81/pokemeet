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

const API_BASE = "http://127.0.0.1:8000";

type EventParticipant = {
  user_id: number;
  nickname: string;
};

/* =========================================================
   都市画像
   ========================================================= */

function getCityImage(location: string): string {
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

/* =========================================================
   都市カラー
   ========================================================= */

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

/* =========================================================
   日時表示
   ========================================================= */

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

/* =========================================================
   料金表示
   ========================================================= */

function formatParticipationFee(fee: number): string {
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

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ログインユーザーID
  const [currentUserId, setCurrentUserId] =
    useState<number | null>(null);

  // 管理者かどうか
  const [isAdmin, setIsAdmin] = useState(false);

  // 参加者一覧
  const [participants, setParticipants] =
    useState<EventParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] =
    useState(false);
  const [participantsError, setParticipantsError] =
    useState("");

  // 参加登録・キャンセル時のメッセージ
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  /* =======================================================
     ログインユーザー取得
     ======================================================= */

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          return;
        }

        const response = await fetch(`${API_BASE}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        // ユーザーの権限を取得
        setIsAdmin(data.role === "admin");

        // ログインユーザーIDを取得
        const rawUserId =
          data.id ??
          data.user_id ??
          data.userId ??
          data.user?.id ??
          data.user?.user_id;

        const userId = Number(rawUserId);

        if (Number.isInteger(userId) && userId > 0) {
          setCurrentUserId(userId);
        }
      } catch (error) {
        console.error(
          "ログインユーザー情報の取得に失敗しました",
          error
        );
      }
    };

    fetchCurrentUser();
  }, []);

  /* =======================================================
     交流会詳細取得
     ======================================================= */

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError("");

        if (!eventId) {
          throw new Error("交流会が見つかりません。");
        }

        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error("ログインしてください。");
        }

        const response = await fetch(
          `${API_BASE}/events/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.detail || "交流会の取得に失敗しました。"
          );
        }

        setEvent(data as Event);
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
     参加者一覧取得（管理者のみ）
     ======================================================= */

  useEffect(() => {
    const fetchParticipants = async () => {
      // 管理者以外は参加者一覧を取得しない
      if (!isAdmin || !eventId) {
        setParticipants([]);
        setParticipantsError("");
        setParticipantsLoading(false);
        return;
      }

      const token = localStorage.getItem("access_token");

      if (!token) {
        setParticipantsError("ログインしてください。");
        return;
      }

      try {
        setParticipantsLoading(true);
        setParticipantsError("");

        const response = await fetch(
          `${API_BASE}/events/${eventId}/participants`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.detail || "参加者一覧の取得に失敗しました。"
          );
        }

        setParticipants(
          Array.isArray(data.participants)
            ? data.participants
            : []
        );
      } catch (error) {
        console.error(error);

        setParticipantsError(
          error instanceof Error
            ? error.message
            : "参加者一覧の取得に失敗しました。"
        );
      } finally {
        setParticipantsLoading(false);
      }
    };

    fetchParticipants();
  }, [eventId, isAdmin, event?.participant_count]);

  /* =======================================================
     交流会の最新情報を再取得
     ======================================================= */

  const refreshEvent = async (
    id: number,
    token: string
  ): Promise<void> => {
    const response = await fetch(
      `${API_BASE}/events/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.detail || "交流会情報の更新に失敗しました。"
      );
    }

    setEvent(data as Event);
  };

  /* =======================================================
     参加登録
     ======================================================= */

  const handleJoinEvent = async () => {
    if (!event || joining) {
      return;
    }

    if (event.is_joined) {
      return;
    }

    if (event.remaining_slots <= 0) {
      setActionError("この交流会は満員です。");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      setActionError("ログインしてください。");
      return;
    }

    try {
      setJoining(true);
      setActionError("");
      setActionNotice("");

      const response = await fetch(
        `${API_BASE}/events/${event.id}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "交流会への参加に失敗しました。"
        );
      }

      await refreshEvent(event.id, token);

      setActionNotice("交流会に参加しました。");
    } catch (error) {
      console.error(error);

      setActionError(
        error instanceof Error
          ? error.message
          : "交流会への参加に失敗しました。"
      );
    } finally {
      setJoining(false);
    }
  };

  /* =======================================================
     参加キャンセル
     ======================================================= */

  const handleLeaveEvent = async () => {
    if (!event || joining) {
      return;
    }

    const confirmed = window.confirm(
      `「${event.title}」への参加をキャンセルしますか？`
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      setActionError("ログインしてください。");
      return;
    }

    try {
      setJoining(true);
      setActionError("");
      setActionNotice("");

      const response = await fetch(
        `${API_BASE}/events/${event.id}/join`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "参加のキャンセルに失敗しました。"
        );
      }

      await refreshEvent(event.id, token);

      setActionNotice(
        "交流会への参加をキャンセルしました。"
      );
    } catch (error) {
      console.error(error);

      setActionError(
        error instanceof Error
          ? error.message
          : "参加のキャンセルに失敗しました。"
      );
    } finally {
      setJoining(false);
    }
  };

  /* =======================================================
     交流会削除
     ======================================================= */

  const handleDeleteEvent = async () => {
    if (!event || deleting) {
      return;
    }

    const confirmed = window.confirm(
      `「${event.title}」を削除しますか？\n削除すると元に戻せません。`
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.alert(
        "ログイン情報がありません。再ログインしてください。"
      );
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_BASE}/events/${event.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "交流会の削除に失敗しました。"
        );
      }

      window.alert("交流会を削除しました。");
      navigate("/events");
    } catch (error) {
      console.error(error);

      window.alert(
        error instanceof Error
          ? error.message
          : "交流会の削除に失敗しました。"
      );
    } finally {
      setDeleting(false);
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
            {error || "交流会が見つかりません。"}
          </div>

          <div className="page-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/events")}
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

  const cityImage = event.image_url
    ? event.image_url.startsWith("http")
      ? event.image_url
      : `${API_BASE}${
          event.image_url.startsWith("/")
            ? ""
            : "/"
        }${event.image_url}`
    : getCityImage(event.location);

  const cityClass = getCityClass(event.location);

  // 交流会の作成者本人に編集・削除ボタンを表示
  const canEditEvent =
    currentUserId !== null &&
    Number(event.created_by) === currentUserId;

  const participantPercentage =
    event.capacity > 0
      ? Math.min(
          100,
          Math.round(
            (event.participant_count / event.capacity) * 100
          )
        )
      : 0;

  const imageStyle = {
    "--detail-image": `url("${cityImage}")`,
  } as CSSProperties;

  /* =======================================================
     画面
     ======================================================= */

  return (
    <main className="page">
      <div className="page-container">
        {/* 戻るボタン */}
        <button
          type="button"
          className="back-link"
          onClick={() => navigate("/events")}
        >
          ← 交流会一覧に戻る
        </button>

        {/* 交流会詳細カード */}
        <article className={`event-detail-card ${cityClass}`}>
          {/* 街画像 */}
          <div
            className="event-detail-image"
            style={imageStyle}
          >
            <img
              src={cityImage}
              alt={`${event.location}の街並み`}
            />

            <div className="city-label">
              <span className="city-label-ball"></span>
              {event.location}
            </div>
          </div>

          <div className="event-detail-content">
            {/* タイトル */}
            <div className="event-detail-heading">
              <span className="event-detail-category">
                ポケモン交流会
              </span>

              <h1 className="event-detail-title">
                {event.title}
              </h1>
            </div>

            {/* 基本情報 */}
            <div className="event-detail-info">
              <div className="event-detail-info-item">
                <span className="event-detail-info-icon">
                  📅
                </span>

                <div>
                  <span className="event-detail-info-label">
                    開催日時
                  </span>

                  <strong>
                    {formatEventDate(event.event_date)}
                  </strong>
                </div>
              </div>

              <div className="event-detail-info-item">
                <span className="event-detail-info-icon">
                  📍
                </span>

                <div>
                  <span className="event-detail-info-label">
                    開催場所
                  </span>

                  <strong>{event.location}</strong>
                </div>
              </div>

              <div className="event-detail-info-item">
                <span className="event-detail-info-icon">
                  👥
                </span>

                <div>
                  <span className="event-detail-info-label">
                    定員
                  </span>

                  <strong>{event.capacity}名</strong>
                </div>
              </div>

              <div className="event-detail-info-item">
                <span className="event-detail-info-icon">
                  💰
                </span>

                <div>
                  <span className="event-detail-info-label">
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

            {/* 参加者状況：全ユーザーに表示 */}
            <section className="event-detail-section">
              <h2>👥 参加者状況</h2>

              <div className="participant-status">
                <div className="participant-count">
                  <strong>{event.participant_count}</strong>
                  <span>/ {event.capacity}名</span>
                </div>

                <div className="participant-bar">
                  <div
                    className="participant-bar-fill"
                    style={{
                      width: `${participantPercentage}%`,
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

            {/* 参加者一覧：管理者のみ */}
            {isAdmin && (
              <section className="event-detail-section">
                <h2>
                  参加者一覧（{participants.length}名）
                </h2>

                {participantsLoading ? (
                  <p>参加者を読み込んでいます...</p>
                ) : participantsError ? (
                  <p className="message" role="alert">
                    {participantsError}
                  </p>
                ) : participants.length === 0 ? (
                  <p>まだ参加者はいません。</p>
                ) : (
                  <ul className="event-participants-list">
                    {participants.map((participant) => (
                      <li
                        key={participant.user_id}
                        className="event-participant-item"
                      >
                        <span aria-hidden="true">👤</span>
                        {participant.nickname}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* 交流会について */}
            <section className="event-detail-section">
              <h2>この交流会について</h2>

              <p>
                {event.description ||
                  "この交流会の詳細情報はまだ登録されていません。"}
              </p>
            </section>

            {/* 操作結果メッセージ */}
            {actionError && (
              <p className="message" role="alert">
                {actionError}
              </p>
            )}

            {actionNotice && (
              <p className="message" role="status">
                {actionNotice}
              </p>
            )}

            {/* 操作ボタン */}
            <div className="event-detail-actions">
              {canEditEvent && (
                <>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() =>
                      navigate(`/events/${event.id}/edit`)
                    }
                  >
                    ✏️ 交流会を編集
                  </button>

                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={handleDeleteEvent}
                    disabled={deleting}
                  >
                    {deleting
                      ? "削除中..."
                      : "🗑️ 交流会を削除"}
                  </button>
                </>
              )}

              {event.is_joined ? (
                <button
                  type="button"
                  className="button button-secondary event-join-button"
                  onClick={handleLeaveEvent}
                  disabled={joining}
                >
                  {joining
                    ? "処理中..."
                    : "参加をキャンセルする"}
                </button>
              ) : (
                <button
                  type="button"
                  className="button button-primary event-join-button"
                  onClick={handleJoinEvent}
                  disabled={
                    joining || event.remaining_slots <= 0
                  }
                >
                  <span
                    className="button-ball"
                    aria-hidden="true"
                  ></span>

                  {joining
                    ? "参加処理中..."
                    : event.remaining_slots <= 0
                      ? "満員"
                      : "交流会に参加する"}

                  <span className="button-arrow">→</span>
                </button>
              )}

              <button
                type="button"
                className="button button-secondary"
                onClick={() => navigate("/events")}
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