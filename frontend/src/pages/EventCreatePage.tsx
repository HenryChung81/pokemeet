import {
  useEffect,
  useState,
} from "react";

import type {
  ChangeEvent,
  FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "./EventCreatePage.css";


function EventCreatePage() {
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [participationFee, setParticipationFee] = useState("0");

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");


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
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const file =
      event.target.files?.[0] ?? null;

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

      setError(
        "JPG、PNG、WebP画像のみ選択できます"
      );

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSelectedImage(null);
      setImagePreview("");

      event.target.value = "";

      setError(
        "画像サイズは5MB以下にしてください"
      );

      return;
    }

    setSelectedImage(file);

    setImagePreview(
      URL.createObjectURL(file)
    );
  };


  /* =========================
     交流会作成
     ========================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError(
        "交流会名を入力してください"
      );
      return;
    }

    if (!eventDate) {
      setError(
        "開催日時を入力してください"
      );
      return;
    }

    if (!location.trim()) {
      setError(
        "開催場所を入力してください"
      );
      return;
    }

    const capacityNumber =
      Number(capacity);

    const participationFeeNumber =
      Number(participationFee);

    if (capacityNumber <= 0) {
      setError(
        "定員は1名以上にしてください"
      );
      return;
    }

    if (participationFeeNumber < 0) {
      setError(
        "参加料金は0円以上にしてください"
      );
      return;
    }

    try {
      setCreating(true);


      /* =========================
         交流会を作成
         ========================= */

      const response = await fetch(
        "http://127.0.0.1:8000/events",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${localStorage.getItem(
              "access_token"
            )}`,
          },

          body: JSON.stringify({
            title: title.trim(),

            description:
              description.trim() || null,

            event_date: eventDate,

            location:
              location.trim(),

            capacity:
              capacityNumber,

            participation_fee:
              participationFeeNumber,
          }),
        }
      );


      const data =
        await response.json();


      if (!response.ok) {
        setError(
          data.detail ||
            "交流会の作成に失敗しました"
        );

        return;
      }


      /* =========================
         作成した交流会のID取得
         ========================= */

      const eventId =
        data.event_id;


      if (!eventId) {
        setError(
          "交流会は作成されましたが、交流会IDを取得できませんでした"
        );

        return;
      }


      /* =========================
         画像アップロード
         ========================= */

      if (selectedImage) {
        const formData =
          new FormData();

        formData.append(
          "image",
          selectedImage
        );


        const imageResponse =
          await fetch(
            `http://127.0.0.1:8000/events/${eventId}/image`,
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


        const imageData =
          await imageResponse.json();


        if (!imageResponse.ok) {
          setError(
            imageData.detail ||
              "交流会は作成されましたが、画像のアップロードに失敗しました"
          );

          return;
        }
      }


      /* =========================
         作成完了
         ========================= */

      navigate(
        `/events/${eventId}`
      );

    } catch (error) {
      console.error(error);

      setError(
        "交流会の作成に失敗しました"
      );

    } finally {
      setCreating(false);
    }
  };


  /* =========================
     プレビュー用日時表示
     ========================= */

  const getPreviewDate = () => {
    if (!eventDate) {
      return "開催日時を入力してください";
    }

    const date =
      new Date(eventDate);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return eventDate;
    }

    return date.toLocaleString(
      "ja-JP",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  /* =========================
     読み込み中
     ========================= */

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


  /* =========================
     管理者以外は表示しない
     ========================= */

  if (!isAdmin) {
    return null;
  }


  return (
    <main className="page event-create-page">

      <div className="page-container">


        {/* =========================
            ページヘッダー
            ========================= */}

        <section className="event-create-hero">

          <div className="event-create-hero-content">

            <div className="event-create-eyebrow">

              <span className="event-create-eyebrow-dot"></span>

              ADMIN / EVENT CREATE

            </div>


            <div className="event-create-title-row">

              <div>

                <h1 className="event-create-title">
                  交流会を作成
                </h1>

                <p className="event-create-description">
                  ポケモン好きが集まる新しい交流会を作成しましょう。
                </p>

              </div>

            </div>

          </div>


          <div className="event-create-admin-badge">

            <span>●</span>

            管理者専用

          </div>

        </section>


        {/* =========================
            エラー
            ========================= */}

        {error && (
          <div className="event-create-error">

            <span className="event-create-error-icon">
              !
            </span>

            <div>

              <strong>
                入力内容を確認してください
              </strong>

              <p>
                {error}
              </p>

            </div>

          </div>
        )}


        {/* =========================
            メインレイアウト
            ========================= */}

        <div className="event-create-layout">


          {/* =========================
              左：入力フォーム
              ========================= */}

          <form
            onSubmit={handleSubmit}
            className="event-create-form"
          >


            {/* =========================
                基本情報
                ========================= */}

            <section className="event-create-card">

              <div className="event-create-section-header">

                <div className="event-create-section-icon">
                  ✦
                </div>

                <div>

                  <h2>
                    基本情報
                  </h2>

                  <p>
                    交流会の名前や内容を設定します
                  </p>

                </div>

              </div>


              {/* 交流会名 */}

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
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="例：東京ポケモン交流会"
                  required
                />


                <p className="event-create-help">
                  参加する人が分かりやすい名前を付けましょう。
                </p>

              </div>


              {/* 説明 */}

              <div className="event-create-field">

                <label htmlFor="description">
                  交流会の説明
                </label>


                <textarea
                  id="description"
                  className="event-create-input event-create-textarea"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="交流会の内容、対象者、予定していることなどを入力してください"
                  rows={6}
                />


                <p className="event-create-help">
                  初めて参加する人にも内容が伝わるように書くと親切です。
                </p>

              </div>

            </section>


            {/* =========================
                開催情報
                ========================= */}

            <section className="event-create-card">

              <div className="event-create-section-header">

                <div className="event-create-section-icon">
                  📅
                </div>

                <div>

                  <h2>
                    開催情報
                  </h2>

                  <p>
                    いつ・どこで開催するか設定します
                  </p>

                </div>

              </div>


              <div className="event-create-grid">


                {/* 開催日時 */}

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
                      setEventDate(
                        event.target.value
                      )
                    }
                    required
                  />

                </div>


                {/* 開催場所 */}

                <div className="event-create-field">

                  <label htmlFor="location">

                    開催場所

                    <span className="required-mark">
                      必須
                    </span>

                  </label>


                  <input
                    id="location"
                    className="event-create-input"
                    type="text"
                    value={location}
                    onChange={(event) =>
                      setLocation(
                        event.target.value
                      )
                    }
                    placeholder="例：東京・池袋"
                    required
                  />

                </div>

              </div>

            </section>


            {/* =========================
                募集設定
                ========================= */}

            <section className="event-create-card">

              <div className="event-create-section-header">

                <div className="event-create-section-icon">
                  👥
                </div>

                <div>

                  <h2>
                    募集設定
                  </h2>

                  <p>
                    参加人数と料金を設定します
                  </p>

                </div>

              </div>


              <div className="event-create-grid">


                {/* 定員 */}

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
                      value={capacity}
                      onChange={(event) =>
                        setCapacity(
                          event.target.value
                        )
                      }
                      required
                    />

                    <span>
                      名
                    </span>

                  </div>


                  <p className="event-create-help">
                    最大参加人数を設定してください。
                  </p>

                </div>


                {/* 参加料金 */}

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
                      value={participationFee}
                      onChange={(event) =>
                        setParticipationFee(
                          event.target.value
                        )
                      }
                      required
                    />

                    <span>
                      円
                    </span>

                  </div>


                  <p className="event-create-help">
                    無料の場合は「0」と入力してください。
                  </p>

                </div>

              </div>

            </section>


            {/* =========================
                交流会画像
                ========================= */}

            <section className="event-create-card">

              <div className="event-create-section-header">

                <div className="event-create-section-icon">
                  🖼️
                </div>

                <div>

                  <h2>
                    交流会画像
                  </h2>

                  <p>
                    一覧画面や詳細画面に表示されます
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


                {imagePreview ? (

                  <div className="event-create-image-preview">

                    <img
                      src={imagePreview}
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

                    <strong>
                      画像を選択
                    </strong>

                    <span>
                      JPG / PNG / WebP
                    </span>

                    <small>
                      最大 5MB
                    </small>

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


            {/* =========================
                ボタン
                ========================= */}

            <div className="event-create-actions">

              <button
                type="button"
                className="event-create-button event-create-button-secondary"
                onClick={() =>
                  navigate("/events")
                }
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
                    <span className="event-create-spinner"></span>
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


          {/* =========================
              右：プレビュー
              ========================= */}

          <aside className="event-create-preview">

            <div className="event-create-preview-label">
              LIVE PREVIEW
            </div>


            <div className="event-create-preview-heading">

              <div>

                <h2>
                  交流会プレビュー
                </h2>

                <p>
                  入力した内容がここに反映されます。
                </p>

              </div>

              <span className="event-create-preview-dot"></span>

            </div>


            {/* 実際の交流会カードに近いプレビュー */}

            <div className="event-preview-card">


              {/* プレビュー画像 */}

              {imagePreview ? (

                <div className="event-preview-image">

                  <img
                    src={imagePreview}
                    alt="プレビュー"
                  />

                </div>

              ) : (

                <div className="event-preview-image event-preview-image-empty">

                  <span>
                    📷
                  </span>

                  <small>
                    交流会画像
                  </small>

                </div>

              )}


              {/* プレビュー本文 */}

              <div className="event-preview-content">

                <div className="event-preview-tag">
                  PokeMeet
                </div>


                <h3>
                  {title.trim() ||
                    "交流会名を入力してください"}
                </h3>


                <div className="event-preview-info">


                  <div>

                    <span>
                      📅
                    </span>

                    <p>
                      {getPreviewDate()}
                    </p>

                  </div>


                  <div>

                    <span>
                      📍
                    </span>

                    <p>
                      {location.trim() ||
                        "開催場所を入力してください"}
                    </p>

                  </div>


                  <div>

                    <span>
                      👥
                    </span>

                    <p>
                      定員 {capacity || "0"}名
                    </p>

                  </div>


                  <div>

                    <span>
                      💴
                    </span>

                    <p>
                      {Number(
                        participationFee || 0
                      ).toLocaleString()}円
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


            {/* 補足 */}

            <div className="event-create-preview-tip">

              <span>
                💡
              </span>

              <p>
                交流会の雰囲気が伝わる画像や、分かりやすい説明を設定すると参加者が内容を確認しやすくなります。
              </p>

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}


export default EventCreatePage;