import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

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

export type EventFormValues = {
  title: string;
  description: string;
  eventDate: string;
  location: string;
  capacity: string;
  participationFee: string;
};

type EventFormProps = {
  mode: "create" | "edit";
  initialValues: EventFormValues;
  initialImageUrl?: string | null;
  participantCount?: number;
  submitting: boolean;
  onSubmit: (values: EventFormValues, selectedImage: File | null) => Promise<void>;
  onCancel: () => void;
};

function getCityImageInfo(location: string): { src: string; label: string } {
  if (location.includes("池袋")) return { src: ikebukuroImage, label: "池袋の画像" };
  if (location.includes("新宿")) return { src: shinjukuImage, label: "新宿の画像" };
  if (location.includes("渋谷")) return { src: shibuyaImage, label: "渋谷の画像" };
  if (location.includes("上野")) return { src: uenoImage, label: "上野の画像" };
  if (location.includes("名古屋")) return { src: nagoyaImage, label: "名古屋の画像" };
  if (location.includes("大阪")) return { src: osakaImage, label: "大阪の画像" };
  if (location.includes("秋葉原")) return { src: akihabaraImage, label: "秋葉原の画像" };
  if (location.includes("中野")) return { src: nakanoImage, label: "中野の画像" };
  if (location.includes("台北")) return { src: taipeiImage, label: "台北の画像" };
  if (location.includes("横浜")) return { src: yokohamaImage, label: "横浜の画像" };
  if (location.includes("吉祥寺")) return { src: kichijojiImage, label: "吉祥寺の画像" };
  return { src: defaultImage, label: "デフォルト画像" };
}

function resolveImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/")) return `${API_BASE}${imageUrl}`;
  return `${API_BASE}/${imageUrl}`;
}

function formatPreviewDate(value: string): string {
  if (!value) return "開催日時を入力してください";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventForm({
  mode,
  initialValues,
  initialImageUrl,
  participantCount = 0,
  submitting,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [eventDate, setEventDate] = useState(initialValues.eventDate);
  const [location, setLocation] = useState(initialValues.location);
  const [capacity, setCapacity] = useState(initialValues.capacity);
  const [participationFee, setParticipationFee] = useState(initialValues.participationFee);

  const [locationOpen, setLocationOpen] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const filteredLocations = showAllLocations
    ? EVENT_LOCATION_OPTIONS
    : EVENT_LOCATION_OPTIONS.filter((city) =>
        city.toLowerCase().includes(location.trim().toLowerCase())
      );

  const hasLocation = location.trim().length > 0;
  const autoImage = getCityImageInfo(location);
  const savedImage = resolveImageUrl(initialImageUrl);
  const displayedImage = imagePreview || savedImage || (hasLocation ? autoImage.src : "");
  const displayedImageLabel = imagePreview
    ? "アップロード画像"
    : savedImage
      ? "登録済み画像"
      : hasLocation
        ? `${autoImage.label}（自動）`
        : "";

  const clearError = () => setError("");

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    clearError();
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedImage(null);
      setImagePreview("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
    const minimumCapacity = Math.max(1, participantCount);

    if (!Number.isInteger(capacityNumber) || capacityNumber < minimumCapacity) {
      setError(
        participantCount > 0
          ? `定員は現在の参加者数（${participantCount}名）以上にしてください`
          : "定員は1名以上の整数にしてください"
      );
      return;
    }

    if (!Number.isInteger(participationFeeNumber) || participationFeeNumber < 0) {
      setError("参加料金は0円以上の整数にしてください");
      return;
    }

    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim(),
          eventDate,
          location: location.trim(),
          capacity,
          participationFee,
        },
        selectedImage
      );
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : mode === "create"
            ? "交流会の作成に失敗しました"
            : "交流会の更新に失敗しました"
      );
    }
  };

  const minimumCapacity = Math.max(1, participantCount);

  return (
    <main className="page event-create-page">
      <div className="page-container">
        <section className="event-create-hero">
          <div className="event-create-hero-content">
            <div className="event-create-eyebrow">
              <span className="event-create-eyebrow-dot" />
              {mode === "create" ? "ADMIN / EVENT CREATE" : "EVENT / EDIT"}
            </div>
            <h1 className="event-create-title">
              {mode === "create" ? "交流会を作成" : "交流会を編集"}
            </h1>
            <p className="event-create-description">
              {mode === "create"
                ? "ポケモン好きが集まる新しい交流会を作成しましょう。"
                : "交流会の内容を変更できます。"}
            </p>
          </div>
          {mode === "create" && (
            <div className="event-create-admin-badge">
              <span>●</span>
              管理者専用
            </div>
          )}
        </section>

        {error && (
          <div className="event-create-error" role="alert">
            <span className="event-create-error-icon">!</span>
            <div>
              <strong>入力内容を確認してください</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="event-create-layout">
          <form onSubmit={handleSubmit} className="event-create-form">
            <section className="event-create-card">
              <div className="event-create-section-header">
                <div className="event-create-section-icon">✦</div>
                <div>
                  <h2>基本情報</h2>
                  <p>交流会の名前や内容を設定します</p>
                </div>
              </div>

              <div className="event-create-field">
                <label htmlFor="title">
                  交流会名 <span className="required-mark">必須</span>
                </label>
                <input
                  id="title"
                  className="event-create-input"
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    clearError();
                  }}
                  placeholder="例：東京ポケモン交流会"
                  maxLength={100}
                  required
                />
              </div>

              <div className="event-create-field">
                <label htmlFor="description">説明</label>
                <textarea
                  id="description"
                  className="event-create-input event-create-textarea"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    clearError();
                  }}
                  placeholder="交流会の内容や、参加する方へのメッセージを入力してください"
                  rows={4}
                />
                <p className="event-create-help">
                  初めて参加する人にも雰囲気が伝わる説明がおすすめです。
                </p>
              </div>
            </section>

            <section className="event-create-card">
              <div className="event-create-section-header">
                <div className="event-create-section-icon">▦</div>
                <div>
                  <h2>開催情報</h2>
                  <p>いつ・どこで開催するか設定します</p>
                </div>
              </div>

              <div className="event-create-grid">
                <div className="event-create-field">
                  <label htmlFor="eventDate">
                    開催日時 <span className="required-mark">必須</span>
                  </label>
                  <input
                    id="eventDate"
                    className="event-create-input"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(event) => {
                      setEventDate(event.target.value);
                      clearError();
                    }}
                    required
                  />
                </div>

                <div className="event-create-field">
                  <label htmlFor="location">
                    開催場所 <span className="required-mark">必須</span>
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
                          setLocationOpen(true);
                          setShowAllLocations(false);
                          clearError();
                        }}
                        onFocus={() => {
                          setLocationOpen(true);
                          setShowAllLocations(false);
                        }}
                        onBlur={() => {
                          window.setTimeout(() => {
                            setLocationOpen(false);
                            setShowAllLocations(false);
                          }, 120);
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
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          if (!locationOpen) setShowAllLocations(true);
                          else setShowAllLocations(false);
                          setLocationOpen((open) => !open);
                        }}
                      >
                        <span className={locationOpen ? "is-open" : ""}>⌄</span>
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
                              className={`event-create-location-option ${location === city ? "is-selected" : ""}`}
                              role="option"
                              aria-selected={location === city}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setLocation(city);
                                setLocationOpen(false);
                                setShowAllLocations(false);
                                clearError();
                              }}
                            >
                              <span>{city}</span>
                              <span className="event-create-location-option-hint">選択</span>
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

            <section className="event-create-card">
              <div className="event-create-section-header">
                <div className="event-create-section-icon">♙</div>
                <div>
                  <h2>募集設定</h2>
                  <p>参加人数と料金を設定します</p>
                </div>
              </div>

              <div className="event-create-grid">
                <div className="event-create-field">
                  <label htmlFor="capacity">
                    定員 <span className="required-mark">必須</span>
                  </label>
                  <div className="event-create-input-with-unit">
                    <input
                      id="capacity"
                      className="event-create-input"
                      type="number"
                      min={minimumCapacity}
                      step="1"
                      value={capacity}
                      onChange={(event) => {
                        setCapacity(event.target.value);
                        clearError();
                      }}
                      required
                    />
                    <span>名</span>
                  </div>
                  <p className="event-create-help">
                    {mode === "edit" && participantCount > 0
                      ? `現在の参加者は${participantCount}名です。これより少ない定員にはできません。`
                      : "最大参加人数を設定してください。"}
                  </p>
                </div>

                <div className="event-create-field">
                  <label htmlFor="participationFee">
                    参加料金 <span className="required-mark">必須</span>
                  </label>
                  <div className="event-create-input-with-unit">
                    <input
                      id="participationFee"
                      className="event-create-input"
                      type="number"
                      min="0"
                      step="1"
                      value={participationFee}
                      onChange={(event) => {
                        setParticipationFee(event.target.value);
                        clearError();
                      }}
                      required
                    />
                    <span>円</span>
                  </div>
                  <p className="event-create-help">無料の場合は「0」と入力してください。</p>
                </div>
              </div>
            </section>

            <section className="event-create-card">
              <div className="event-create-section-header">
                <div className="event-create-section-icon">▧</div>
                <div>
                  <h2>交流会画像</h2>
                  <p>開催場所に合う画像を自動表示するか、好きな画像を設定できます</p>
                </div>
              </div>

              <input
                id="eventImage"
                className="event-create-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />

              <div className="event-create-image-preview">
                {displayedImage ? (
                  <img src={displayedImage} alt="交流会画像プレビュー" />
                ) : (
                  <div className="event-create-image-empty">
                    <span>⌖</span>
                    <strong>開催場所を入力すると画像が表示されます</strong>
                    <small>または、お好きな画像をアップロードできます</small>
                  </div>
                )}
                {displayedImageLabel && (
                  <span className="event-create-image-auto-badge">{displayedImageLabel}</span>
                )}
              </div>

              <label htmlFor="eventImage" className="event-create-upload-action">
                <span>＋</span>
                {imagePreview ? "画像を変更する" : "画像をアップロード（任意）"}
              </label>

              <div className="event-create-image-note">
                <strong>画像について</strong>
                <p>
                  画像をアップロードしない場合、対応エリアの画像を自動表示します。
                  対応エリア以外ではデフォルト画像を使用します。画像は5MB以下のJPG、PNG、WebPに対応しています。
                </p>
              </div>

              {selectedImage && (
                <div className="event-create-file-info">
                  <span className="event-create-file-check">✓</span>
                  <span className="event-create-file-name">{selectedImage.name}</span>
                </div>
              )}
              {mode === "edit" && savedImage && !selectedImage && (
                <p className="event-create-help">画像を選択し直さない場合、現在の登録画像を維持します。</p>
              )}
            </section>

            <div className="event-create-actions">
              <button
                type="button"
                className="event-create-button event-create-button-secondary"
                onClick={onCancel}
                disabled={submitting}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="event-create-button event-create-button-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="event-create-spinner" />
                    {mode === "create" ? "作成中..." : "更新中..."}
                  </>
                ) : (
                  <>
                    <span>{mode === "create" ? "＋" : "✓"}</span>
                    {mode === "create" ? "交流会を作成" : "変更を保存"}
                  </>
                )}
              </button>
            </div>
          </form>

          <aside className="event-create-preview">
            <div className="event-create-preview-label">LIVE PREVIEW</div>
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
                  <img src={displayedImage} alt="交流会のプレビュー画像" />
                </div>
              ) : (
                <div className="event-preview-image event-preview-image-empty">
                  <span>⌖</span>
                  <small>場所を入力すると画像が表示されます</small>
                </div>
              )}
              <div className="event-preview-content">
                <div className="event-preview-tag">POKEMEET COMMUNITY</div>
                <h3>{title.trim() || "交流会名を入力してください"}</h3>
                <div className="event-preview-info">
                  <div>
                    <span>日時</span>
                    <p>{formatPreviewDate(eventDate)}</p>
                  </div>
                  <div>
                    <span>場所</span>
                    <p>{location.trim() || "開催場所を入力してください"}</p>
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
                  <p className="event-preview-description-text">{description.trim()}</p>
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

export default EventForm;