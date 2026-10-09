import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

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

const EVENT_LOCATION_OPTIONS = [
  "池袋",
  "新宿",
  "渋谷",
  "上野",
  "秋葉原",
  "中野",
  "吉祥寺",
  "横浜",
  "名古屋",
  "大阪",
  "台北",
];

function getCityImageInfo(
  location: string
): { src: string; label: string } {
  if (location.includes("池袋")) {
    return { src: ikebukuroImage, label: "池袋の画像" };
  }

  if (location.includes("新宿")) {
    return { src: shinjukuImage, label: "新宿の画像" };
  }

  if (location.includes("渋谷")) {
    return { src: shibuyaImage, label: "渋谷の画像" };
  }

  if (location.includes("上野")) {
    return { src: uenoImage, label: "上野の画像" };
  }

  if (location.includes("名古屋")) {
    return { src: nagoyaImage, label: "名古屋の画像" };
  }

  if (location.includes("大阪")) {
    return { src: osakaImage, label: "大阪の画像" };
  }

  if (location.includes("秋葉原")) {
    return { src: akihabaraImage, label: "秋葉原の画像" };
  }

  if (location.includes("中野")) {
    return { src: nakanoImage, label: "中野の画像" };
  }

  if (location.includes("台北")) {
    return { src: taipeiImage, label: "台北の画像" };
  }

  if (location.includes("横浜")) {
    return { src: yokohamaImage, label: "横浜の画像" };
  }

  if (location.includes("吉祥寺")) {
    return { src: kichijojiImage, label: "吉祥寺の画像" };
  }

  return {
    src: defaultImage,
    label: "デフォルト画像",
  };
}

function EventCreatePage() {
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [participationFee, setParticipationFee] = useState("0");

  const [locationOpen, setLocationOpen] = useState(false);

  // 追加：場所の候補を全件表示するかどうか
  const [showAllLocations, setShowAllLocations] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // ログインユーザー情報取得
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "access_token"
            )}`,
          },
        });

        if (!response.ok) {
          navigate("/events");
          return;
        }

        const data = await response.json();

        if (data.role !== "admin") {
          navigate("/events");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error(error);
        navigate("/events");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  // 画像プレビューの後片付け
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // 場所の候補を表示する
  // メニューを開いた直後は全候補、入力中は入力内容に合う候補を表示
  const filteredLocations = showAllLocations
    ? EVENT_LOCATION_OPTIONS
    : EVENT_LOCATION_OPTIONS.filter((city) =>
        city.toLowerCase().includes(location.trim().toLowerCase())
      );

  // 開催場所に対応する画像
  const hasLocation = location.trim().length > 0;
  const autoImage = getCityImageInfo(location);

  // 場所が未入力の場合は都市画像を表示しない
  const displayedImage =
    imagePreview || (hasLocation ? autoImage.src : "");

  const displayedImageLabel = imagePreview
    ? "アップロード画像"
    : hasLocation
      ? `${autoImage.label}（自動）`
      : "";

  // 画像選択
  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const file = event.target.files?.[0] ?? null;

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
      event.target.value = "";

      setError("JPG、PNG、WebP画像のみ選択できます");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSelectedImage(null);
      setImagePreview("");
      event.target.value = "";

      setError("画像サイズは5MB以下にしてください");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // プレビュー用日時表示
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

  // 交流会作成
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");

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
    const participationFeeNumber = Number(participationFee);

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
      setCreating(true);

      // 交流会を作成
      const response = await fetch(`${API_BASE}/events`, {
        method: "POST",
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
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail || "交流会の作成に失敗しました"
        );
        return;
      }

      // 作成した交流会のIDを取得
      const eventId = data.event_id;

      if (!eventId) {
        setError(
          "交流会は作成されましたが、交流会IDを取得できませんでした"
        );
        return;
      }

      // 選択画像があればアップロード
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

        let imageData: { detail?: string } = {};

        try {
          imageData = await imageResponse.json();
        } catch {
          imageData = {};
        }

        if (!imageResponse.ok) {
          setError(
            imageData.detail ||
              "交流会は作成されましたが、画像のアップロードに失敗しました"
          );
          return;
        }
      }

      // 作成した交流会の詳細画面へ移動
      navigate(`/events/${eventId}`);
    } catch (error) {
      console.error(error);
      setError("交流会の作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  // 読み込み中
  if (loading) {
    return (
      <main className="page">
        <div className="page-container">
          <div className="empty-message">
            読み込んでいます...
          </div>
        </div>
      </main>
    );
  }

  // 管理者以外は表示しない
  if (!isAdmin) {
    return null;
  }

  return (
    <main className="page event-create-page">
      <div className="page-container">
        {/* ページヘッダー */}
        <section className="event-create-hero">
          <div className="event-create-hero-content">
            <div className="event-create-eyebrow">
              <span className="event-create-eyebrow-dot" />
              ADMIN / EVENT CREATE
            </div>

            <h1 className="event-create-title">
              交流会を作成
            </h1>

            <p className="event-create-description">
              ポケモン好きが集まる新しい交流会を作成しましょう。
            </p>
          </div>

          <div className="event-create-admin-badge">
            <span>●</span>
            管理者専用
          </div>
        </section>

        {/* エラーメッセージ */}
        {error && (
          <div
            className="event-create-error"
            role="alert"
          >
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
                  <p>交流会の名前や内容を設定します</p>
                </div>
              </div>

              <div className="event-create-field">
                <label htmlFor="title">
                  交流会名
                  <span className="required-mark">
                    必須
                  </span>
                </label>

                <input
                  id="title"
                  className="event-create-input"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="例：東京ポケモン交流会"
                  maxLength={100}
                  required
                />
              </div>

              <div className="event-create-field">
                <label htmlFor="description">
                  説明
                </label>

                <textarea
                  id="description"
                  className="event-create-input event-create-textarea"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="交流会の内容や、参加する方へのメッセージを入力してください"
                  rows={4}
                />

                <p className="event-create-help">
                  初めて参加する人にも雰囲気が伝わる説明がおすすめです。
                </p>
              </div>
            </section>

            {/* 開催情報 */}
            <section className="event-create-card">
              <div className="event-create-section-header">
                <div className="event-create-section-icon">
                  ▦
                </div>

                <div>
                  <h2>開催情報</h2>
                  <p>いつ・どこで開催するか設定します</p>
                </div>
              </div>

              <div className="event-create-grid">
                <div className="event-create-field">
                  <label htmlFor="eventDate">
                    開催日時
                    <span className="required-mark">
                      必須
                    </span>
                  </label>

                  <input
                    id="eventDate"
                    className="event-create-input"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(event) =>
                      setEventDate(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="event-create-field">
                  <label htmlFor="location">
                    開催場所
                    <span className="required-mark">
                      必須
                    </span>
                  </label>

                  <div className="event-create-location-control">
                    <div className="event-create-location-input-wrap">
                      <input
                        id="location"
                        className="event-create-input"
                        type="text"
                        value={location}
                        onChange={(event) => {
                          setLocation(event.target.value);
                          setShowAllLocations(false);
                          setLocationOpen(true);
                        }}
                        onFocus={(event) => {
                          // 選択済みの文字を選択状態にする
                          event.currentTarget.select();

                          // フォーカス時は全候補を表示
                          setShowAllLocations(true);
                          setLocationOpen(true);
                        }}
                        onBlur={() => {
                          window.setTimeout(
                            () => setLocationOpen(false),
                            120
                          );
                        }}
                        placeholder="都市を選択、または自由入力"
                        autoComplete="off"
                        aria-autocomplete="list"
                        aria-expanded={locationOpen}
                        aria-controls="event-location-options"
                        required
                      />

                      <button
                        type="button"
                        className="event-create-location-toggle"
                        aria-label="開催場所の候補を表示"
                        onMouseDown={(event) =>
                          event.preventDefault()
                        }
                        onClick={() => {
                          const nextOpen = !locationOpen;

                          setLocationOpen(nextOpen);

                          if (nextOpen) {
                            setShowAllLocations(true);
                          }
                        }}
                      >
                        <span
                          className={
                            locationOpen ? "is-open" : ""
                          }
                        >
                          ⌄
                        </span>
                      </button>
                    </div>

                    {locationOpen && (
                      <div
                        id="event-location-options"
                        className="event-create-location-menu"
                        role="listbox"
                      >
                        {filteredLocations.length > 0 ? (
                          filteredLocations.map((city) => (
                            <button
                              key={city}
                              type="button"
                              className={`event-create-location-option ${
                                location === city
                                  ? "is-selected"
                                  : ""
                              }`}
                              role="option"
                              aria-selected={location === city}
                              onMouseDown={(event) =>
                                event.preventDefault()
                              }
                              onClick={() => {
                                setLocation(city);
                                setShowAllLocations(false);
                                setLocationOpen(false);
                              }}
                            >
                              <span>{city}</span>

                              <span className="event-create-location-option-hint">
                                選択
                              </span>
                            </button>
                          ))
                        ) : (
                          <p className="event-create-location-empty">
                            候補にない場所もそのまま入力できます。
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="event-create-help">
                    候補から選ぶか、会場名や住所を自由に入力できます。
                  </p>
                </div>
              </div>
            </section>

            {/* 募集設定 */}
            <section className="event-create-card">
              <div className="event-create-section-header">
                <div className="event-create-section-icon">
                  ♙
                </div>

                <div>
                  <h2>募集設定</h2>
                  <p>参加人数と料金を設定します</p>
                </div>
              </div>

              <div className="event-create-grid">
                <div className="event-create-field">
                  <label htmlFor="capacity">
                    定員
                    <span className="required-mark">
                      必須
                    </span>
                  </label>

                  <div className="event-create-input-with-unit">
                    <input
                      id="capacity"
                      className="event-create-input"
                      type="number"
                      min="1"
                      step="1"
                      value={capacity}
                      onChange={(event) =>
                        setCapacity(event.target.value)
                      }
                      required
                    />

                    <span>名</span>
                  </div>

                  <p className="event-create-help">
                    最大参加人数を設定してください。
                  </p>
                </div>

                <div className="event-create-field">
                  <label htmlFor="participationFee">
                    参加料金
                    <span className="required-mark">
                      必須
                    </span>
                  </label>

                  <div className="event-create-input-with-unit">
                    <input
                      id="participationFee"
                      className="event-create-input"
                      type="number"
                      min="0"
                      step="1"
                      value={participationFee}
                      onChange={(event) =>
                        setParticipationFee(
                          event.target.value
                        )
                      }
                      required
                    />

                    <span>円</span>
                  </div>

                  <p className="event-create-help">
                    無料の場合は「0」と入力してください。
                  </p>
                </div>
              </div>
            </section>

            {/* 交流会画像 */}
            <section className="event-create-card">
              <div className="event-create-section-header">
                <div className="event-create-section-icon">
                  ▧
                </div>

                <div>
                  <h2>交流会画像</h2>
                  <p>
                    場所に合った画像を自動表示できます。画像の変更も可能です。
                  </p>
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

                <div className="event-create-image-preview">
                  {displayedImage ? (
                    <img
                      src={displayedImage}
                      alt="交流会画像プレビュー"
                    />
                  ) : (
                    <div className="event-create-image-empty">
                      <span>⌖</span>

                      <strong>
                        開催場所を入力すると画像が表示されます
                      </strong>

                      <small>
                        または、お好きな画像をアップロードできます
                      </small>
                    </div>
                  )}

                  {displayedImageLabel && (
                    <span className="event-create-image-auto-badge">
                      {displayedImageLabel}
                    </span>
                  )}
                </div>

                <label
                  htmlFor="eventImage"
                  className="event-create-upload-action"
                >
                  <span>＋</span>

                  {imagePreview
                    ? "画像を変更する"
                    : "画像をアップロード（任意）"}
                </label>
              </div>

              <div className="event-create-image-note">
                <strong>画像について</strong>

                <p>
                  画像をアップロードしない場合、対応エリアの画像を自動表示します。
                  対応エリア以外ではデフォルト画像を使用します。
                </p>
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
                onClick={() => navigate("/events")}
                disabled={creating}
              >
                キャンセル
              </button>

              <button
                type="submit"
                className="event-create-button event-create-button-primary"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <span className="event-create-spinner" />
                    作成中...
                  </>
                ) : (
                  <>
                    <span>＋</span>
                    交流会を作成
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 右側のライブプレビュー */}
          <aside className="event-create-preview">
            <div className="event-create-preview-label">
              LIVE PREVIEW
            </div>

            <div className="event-create-preview-heading">
              <div>
                <h2>交流会プレビュー</h2>
                <p>入力した内容がここに反映されます。</p>
              </div>

              <span className="event-create-preview-dot" />
            </div>

            <div className="event-preview-card">
              {displayedImage ? (
                <div className="event-preview-image">
                  <img
                    src={displayedImage}
                    alt="交流会のプレビュー画像"
                  />
                </div>
              ) : (
                <div className="event-preview-image event-preview-image-empty">
                  <span>⌖</span>

                  <small>
                    場所を入力すると画像が表示されます
                  </small>
                </div>
              )}

              <div className="event-preview-content">
                <div className="event-preview-tag">
                  POKEMEET COMMUNITY
                </div>

                <h3>
                  {title.trim() ||
                    "交流会名を入力してください"}
                </h3>

                <div className="event-preview-info">
                  <div>
                    <span>日時</span>
                    <p>{getPreviewDate()}</p>
                  </div>

                  <div>
                    <span>場所</span>
                    <p>
                      {location.trim() ||
                        "開催場所を入力してください"}
                    </p>
                  </div>

                  <div>
                    <span>定員</span>
                    <p>{capacity || "0"}名</p>
                  </div>

                  <div>
                    <span>料金</span>
                    <p>{participationFee || "0"}円</p>
                  </div>
                </div>

                {description.trim() && (
                  <p className="event-preview-description-text">
                    {description.trim()}
                  </p>
                )}
              </div>
            </div>

            <div className="event-create-preview-tip">
              <span>i</span>

              <p>
                場所を選ぶと対応する画像が表示されます。
                画像をアップロードすると、そちらが優先されます。
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default EventCreatePage;