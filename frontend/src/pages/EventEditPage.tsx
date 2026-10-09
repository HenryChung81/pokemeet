
import { useEffect, useState } from "react";
import type {
  ChangeEvent,
  FormEvent,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

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

import "./EventCreatePage.css";

const API_BASE = "http://127.0.0.1:8000";

// 開催場所に応じた都市画像を取得する
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


function toDateTimeLocal(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number: number) =>
    String(number).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  );
}


function EventEditPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const [event, setEvent] =
    useState<Event | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [participationFee, setParticipationFee] =
    useState("0");

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  /* =========================
     交流会情報取得
     ========================= */

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError("");

        if (!eventId) {
          throw new Error("交流会が見つかりません");
        }

        const response = await fetch(
          `${API_BASE}/events/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "access_token"
              )}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "交流会の取得に失敗しました"
          );
        }

        setEvent(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setEventDate(toDateTimeLocal(data.event_date));
        setLocation(data.location);
        setCapacity(String(data.capacity));
        setParticipationFee(
          String(data.participation_fee)
        );

      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "交流会の取得に失敗しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);


  /* =========================
     画像プレビューの後片付け
     ========================= */

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);


  /* =========================
     画像選択
     ========================= */

  const handleImageChange = (
    changeEvent: ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const file =
      changeEvent.target.files?.[0] ?? null;

    if (!file) {
      setSelectedImage(null);
      setImagePreview("");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setSelectedImage(null);
      setImagePreview("");
      changeEvent.target.value = "";
      setError("JPG、PNG、WebP画像のみ選択できます");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSelectedImage(null);
      setImagePreview("");
      changeEvent.target.value = "";
      setError("画像サイズは5MB以下にしてください");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };


  /* =========================
     交流会更新
     ========================= */

  const handleSubmit = async (
    formEvent: FormEvent<HTMLFormElement>
  ) => {
    formEvent.preventDefault();
    setError("");

    if (!eventId || !event) {
      setError("交流会が見つかりません");
      return;
    }

    if (!title.trim()) {
      setError("交流会名を入力してください");
      return;
    }

    if (!eventDate) {
      setError("開催日時を入力してください");
      return;
    }

    if (!location.trim()) {
      setError("開催場所を入力してください");
      return;
    }

    const capacityNumber = Number(capacity);
    const participationFeeNumber =
      Number(participationFee);

    if (
      !Number.isInteger(capacityNumber) ||
      capacityNumber <= 0
    ) {
      setError("定員は1名以上の整数にしてください");
      return;
    }

    if (
      !Number.isInteger(participationFeeNumber) ||
      participationFeeNumber < 0
    ) {
      setError("参加料金は0円以上の整数にしてください");
      return;
    }

    try {
      setSaving(true);

      /* =========================
         交流会情報を更新
         ========================= */

      const response = await fetch(
        `${API_BASE}/events/${eventId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "access_token"
            )}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            event_date: eventDate,
            location: location.trim(),
            capacity: capacityNumber,
            participation_fee: participationFeeNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "交流会の更新に失敗しました"
        );
      }

      /* =========================
         選択した画像をアップロード
         ========================= */

      if (selectedImage) {
        const formData = new FormData();

        formData.append("image", selectedImage);

        const imageResponse = await fetch(
          `${API_BASE}/events/${eventId}/image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "access_token"
              )}`,
            },
            body: formData,
          }
        );

        const imageData = await imageResponse.json();

        if (!imageResponse.ok) {
          throw new Error(
            imageData.detail ||
              "交流会情報は更新されましたが、画像の更新に失敗しました"
          );
        }
      }

      /* =========================
         更新完了
         ========================= */

      navigate(`/events/${eventId}`);

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "交流会の更新に失敗しました"
      );
    } finally {
      setSaving(false);
    }
  };


  /* =========================
     プレビュー日時
     ========================= */

  const getPreviewDate = () => {
    if (!eventDate) {
      return "開催日時を入力してください";
    }

    const date = new Date(eventDate);

    if (Number.isNaN(date.getTime())) {
      return eventDate;
    }

    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  /* =========================
     読み込み中
     ========================= */

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


  /* =========================
     取得エラー
     ========================= */

  if (!event) {
    return (
      <main className="page">
        <div className="page-container">
          <div className="message">
            {error || "交流会が見つかりません"}
          </div>

          <button
            className="button button-secondary"
            onClick={() => navigate("/events")}
          >
            交流会一覧に戻る
          </button>
        </div>
      </main>
    );
  }


const displayedImage =
  imagePreview ||
  (event.image_url
    ? `${API_BASE}${event.image_url}`
    : getCityImage(location));


  /* =========================
     画面
     ========================= */

  return (
    <main className="page event-create-page">
      <div className="page-container">

        <section className="event-create-hero">
          <div className="event-create-hero-content">

            <div className="event-create-eyebrow">
              <span className="event-create-eyebrow-dot" />
              EVENT / EDIT
            </div>

            <div className="event-create-title-row">
              <div>
                <h1 className="event-create-title">
                  交流会を編集
                </h1>

                <p className="event-create-description">
                  交流会の内容を変更できます。
                </p>
              </div>
            </div>

          </div>
        </section>


        {error && (
          <div className="event-create-error">
            <span className="event-create-error-icon">
              !
            </span>

            <div>
              <strong>入力内容を確認してください</strong>
              <p>{error}</p>
            </div>
          </div>
        )}


        <div className="event-create-layout">

          <form
            onSubmit={handleSubmit}
            className="event-create-form"
          >

            {/* 基本情報 */}

            <section className="event-create-card">
              <div className="event-create-section-header">
                <div className="event-create-section-icon">
                  ✦
                </div>

                <div>
                  <h2>基本情報</h2>
                  <p>交流会の名前や内容を編集します</p>
                </div>
              </div>

              <div className="event-create-field">
                <label htmlFor="title">
                  交流会名
                  <span className="required-mark">必須</span>
                </label>

                <input
                  id="title"
                  className="event-create-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="event-create-field">
                <label htmlFor="description">
                  交流会の説明
                </label>

                <textarea
                  id="description"
                  className="event-create-input event-create-textarea"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows={6}
                />
              </div>
            </section>


            {/* 開催情報 */}

            <section className="event-create-card">
              <div className="event-create-section-header">
                <div className="event-create-section-icon">
                  📅
                </div>

                <div>
                  <h2>開催情報</h2>
                  <p>開催日時と場所を編集します</p>
                </div>
              </div>

              <div className="event-create-grid">

                <div className="event-create-field">
                  <label htmlFor="eventDate">
                    開催日時
                    <span className="required-mark">必須</span>
                  </label>

                  <input
                    id="eventDate"
                    className="event-create-input"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) =>
                      setEventDate(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="event-create-field">
                  <label htmlFor="location">
                    開催場所
                    <span className="required-mark">必須</span>
                  </label>

                  <input
                    id="location"
                    className="event-create-input"
                    type="text"
                    value={location}
                    onChange={(e) =>
                      setLocation(e.target.value)
                    }
                    required
                  />
                </div>

              </div>
            </section>


            {/* 募集設定 */}

            <section className="event-create-card">
              <div className="event-create-section-header">
                <div className="event-create-section-icon">
                  👥
                </div>

                <div>
                  <h2>募集設定</h2>
                  <p>定員と参加料金を編集します</p>
                </div>
              </div>

              <div className="event-create-grid">

                <div className="event-create-field">
                  <label htmlFor="capacity">
                    定員
                    <span className="required-mark">必須</span>
                  </label>

                  <div className="event-create-input-with-unit">
                    <input
                      id="capacity"
                      className="event-create-input"
                      type="number"
                      min={event.participant_count}
                      value={capacity}
                      onChange={(e) =>
                        setCapacity(e.target.value)
                      }
                      required
                    />

                    <span>名</span>
                  </div>

                  <p className="event-create-help">
                    現在の参加者数：
                    {event.participant_count}名
                  </p>
                </div>

                <div className="event-create-field">
                  <label htmlFor="participationFee">
                    参加料金
                    <span className="required-mark">必須</span>
                  </label>

                  <div className="event-create-input-with-unit">
                    <input
                      id="participationFee"
                      className="event-create-input"
                      type="number"
                      min="0"
                      value={participationFee}
                      onChange={(e) =>
                        setParticipationFee(e.target.value)
                      }
                      required
                    />

                    <span>円</span>
                  </div>
                </div>

              </div>
            </section>


            {/* 交流会画像 */}

            <section className="event-create-card">
              <div className="event-create-section-header">
                <div className="event-create-section-icon">
                  🖼️
                </div>

                <div>
                  <h2>交流会画像</h2>
                  <p>画像を変更する場合は選択してください</p>
                </div>
              </div>

              <div className="event-create-upload">

                <input
                  id="eventImage"
                  className="event-create-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />

                {displayedImage ? (
                  <div className="event-create-image-preview">
                    <img
                      src={displayedImage}
                      alt="交流会画像プレビュー"
                    />

                    <div className="event-create-image-overlay">
                      <label
                        htmlFor="eventImage"
                        className="event-create-change-image"
                      >
                        📷 画像を変更
                      </label>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="eventImage"
                    className="event-create-upload-empty"
                  >
                    <span className="event-create-upload-icon">
                      📷
                    </span>

                    <strong>画像を選択</strong>
                    <span>JPG / PNG / WebP</span>
                    <small>最大 5MB</small>
                  </label>
                )}

              </div>

              {selectedImage && (
                <div className="event-create-file-info">
                  <span className="event-create-file-check">
                    ✓
                  </span>

                  <span className="event-create-file-name">
                    {selectedImage.name}
                  </span>
                </div>
              )}
            </section>


            {/* ボタン */}

            <div className="event-create-actions">
              <button
                type="button"
                className="event-create-button event-create-button-secondary"
                onClick={() =>
                  navigate(`/events/${eventId}`)
                }
                disabled={saving}
              >
                キャンセル
              </button>

              <button
                type="submit"
                className="event-create-button event-create-button-primary"
                disabled={saving}
              >
                {saving ? "保存中..." : "変更を保存"}
              </button>
            </div>

          </form>


          {/* プレビュー */}

          <aside className="event-create-preview">
            <div className="event-create-preview-label">
              LIVE PREVIEW
            </div>

            <div className="event-create-preview-heading">
              <div>
                <h2>交流会プレビュー</h2>
                <p>変更内容を確認できます。</p>
              </div>

              <span className="event-create-preview-dot" />
            </div>

            <div className="event-preview-card">

              {displayedImage ? (
                <div className="event-preview-image">
                  <img
                    src={displayedImage}
                    alt="交流会プレビュー"
                  />
                </div>
              ) : (
                <div className="event-preview-image event-preview-image-empty">
                  <span>📷</span>
                  <small>交流会画像</small>
                </div>
              )}

              <div className="event-preview-content">
                <div className="event-preview-tag">
                  PokeMeet
                </div>

                <h3>
                  {title.trim() || "交流会名"}
                </h3>

                <div className="event-preview-info">
                  <div>
                    <span>📅</span>
                    <p>{getPreviewDate()}</p>
                  </div>

                  <div>
                    <span>📍</span>
                    <p>{location.trim() || "開催場所"}</p>
                  </div>

                  <div>
                    <span>👥</span>
                    <p>定員 {capacity || "0"}名</p>
                  </div>

                  <div>
                    <span>💴</span>
                    <p>
                      {Number(
                        participationFee || 0
                      ).toLocaleString("ja-JP")}円
                    </p>
                  </div>
                </div>

                {description.trim() && (
                  <p className="event-preview-description-text">
                    {description}
                  </p>
                )}
              </div>

            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}

export default EventEditPage;
