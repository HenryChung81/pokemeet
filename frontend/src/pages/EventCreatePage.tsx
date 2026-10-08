import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


function EventCreatePage() {

  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [participationFee, setParticipationFee] = useState("0");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

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
    event: React.ChangeEvent<HTMLInputElement>
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
    event: React.FormEvent<HTMLFormElement>
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


    if (capacityNumber <= 0) {

      setError("定員は1名以上にしてください");

      return;
    }


    if (participationFeeNumber < 0) {

      setError("参加料金は0円以上にしてください");

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

        setError(
          data.detail ||
          "交流会の作成に失敗しました"
        );

        return;
      }


      /* =========================
         作成した交流会のID取得
         ========================= */

      const eventId = data.event_id;


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

        const formData = new FormData();

        formData.append(
          "image",
          selectedImage
        );


        const imageResponse = await fetch(
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


        const imageData = await imageResponse.json();


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

      navigate(`/events/${eventId}`);

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

    <main className="page">

      <div className="page-container">

        {/* =========================
            ページタイトル
            ========================= */}

        <div className="page-header">

          <div className="page-title-area">

            <span className="page-title-ball"></span>

            <div>

              <h1 className="page-title">
                交流会を作成
              </h1>

              <p className="page-description">
                新しいポケモン交流会を作成しよう！
              </p>

            </div>

          </div>

        </div>


        {/* =========================
            エラー
            ========================= */}

        {error && (

          <div className="message">
            {error}
          </div>

        )}


        {/* =========================
            交流会作成フォーム
            ========================= */}

        <form
          onSubmit={handleSubmit}
          className="event-create-form"
        >

          {/* 交流会名 */}

          <div className="form-group">

            <label htmlFor="title">
              交流会名
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="例：東京ポケモン交流会"
              required
            />

          </div>


          {/* 説明 */}

          <div className="form-group">

            <label htmlFor="description">
              説明
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="交流会の内容を入力してください"
              rows={5}
            />

          </div>


          {/* 開催日時 */}

          <div className="form-group">

            <label htmlFor="eventDate">
              開催日時
            </label>

            <input
              id="eventDate"
              type="datetime-local"
              value={eventDate}
              onChange={(event) =>
                setEventDate(event.target.value)
              }
              required
            />

          </div>


          {/* 開催場所 */}

          <div className="form-group">

            <label htmlFor="location">
              開催場所
            </label>

            <input
              id="location"
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="例：東京・池袋"
              required
            />

          </div>


          {/* 定員 */}

          <div className="form-group">

            <label htmlFor="capacity">
              定員
            </label>

            <input
              id="capacity"
              type="number"
              min="1"
              value={capacity}
              onChange={(event) =>
                setCapacity(event.target.value)
              }
              required
            />

          </div>


          {/* 参加料金 */}

          <div className="form-group">

            <label htmlFor="participationFee">
              参加料金（円）
            </label>

            <input
              id="participationFee"
              type="number"
              min="0"
              value={participationFee}
              onChange={(event) =>
                setParticipationFee(event.target.value)
              }
              required
            />

          </div>


          {/* =========================
              交流会画像
              ========================= */}

          <div className="form-group">

            <label htmlFor="eventImage">
              交流会画像
            </label>

            <input
              id="eventImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
            />

            <p>
              JPG、PNG、WebP / 5MB以下
            </p>


            {imagePreview && (

              <div style={{ marginTop: "12px" }}>

                <img
                  src={imagePreview}
                  alt="交流会画像プレビュー"
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "400px",
                    height: "220px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    border: "1px solid #ddd",
                  }}
                />

              </div>

            )}

          </div>


          {/* ボタン */}

          <div className="event-button-area">

            <button
              type="button"
              className="button"
              onClick={() => navigate("/events")}
              disabled={creating}
            >
              キャンセル
            </button>


            <button
              type="submit"
              className="button button-primary"
              disabled={creating}
            >

              {creating
                ? "作成中..."
                : "交流会を作成"
              }

            </button>

          </div>

        </form>

      </div>

    </main>

  );

}


export default EventCreatePage;