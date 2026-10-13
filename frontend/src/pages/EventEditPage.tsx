import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Event } from "../types/event";
import EventForm from "./EventForm";
import type { EventFormValues } from "./EventForm";

const API_BASE = "http://127.0.0.1:8000";

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function EventEditPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setLoadError("");

        if (!eventId) {
          throw new Error("交流会が見つかりません。");
        }

        const response = await fetch(`${API_BASE}/events/${eventId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.detail || "交流会の取得に失敗しました");
        }

        setEvent(data as Event);
      } catch (error) {
        console.error(error);
        setLoadError(
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

  const handleUpdate = async (
    values: EventFormValues,
    selectedImage: File | null
  ) => {
    if (!event) {
      throw new Error("交流会情報を取得できませんでした。");
    }

    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description || null,
          event_date: values.eventDate,
          location: values.location,
          capacity: Number(values.capacity),
          participation_fee: Number(values.participationFee),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "交流会の更新に失敗しました");
      }

      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);

        const imageResponse = await fetch(
          `${API_BASE}/events/${event.id}/image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: formData,
          }
        );

        const imageData = await imageResponse.json().catch(() => ({}));
        if (!imageResponse.ok) {
          throw new Error(
            imageData.detail ||
              "交流会は更新されましたが、画像のアップロードに失敗しました"
          );
        }
      }

      navigate(`/events/${event.id}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="page-container">
          <div className="empty-message">交流会を読み込んでいます...</div>
        </div>
      </main>
    );
  }

  if (loadError || !event) {
    return (
      <main className="page">
        <div className="page-container">
          <div className="event-create-error" role="alert">
            <span className="event-create-error-icon">!</span>
            <div>
              <strong>交流会を読み込めませんでした</strong>
              <p>{loadError || "交流会が見つかりません。"}</p>
            </div>
          </div>
          <button
            type="button"
            className="event-create-button event-create-button-secondary"
            onClick={() => navigate("/events")}
          >
            一覧に戻る
          </button>
        </div>
      </main>
    );
  }

  return (
    <EventForm
      key={event.id}
      mode="edit"
      initialValues={{
        title: event.title,
        description: event.description ?? "",
        eventDate: toDateTimeLocal(event.event_date),
        location: event.location,
        capacity: String(event.capacity),
        participationFee: String(event.participation_fee),
      }}
      initialImageUrl={event.image_url}
      participantCount={event.participant_count}
      submitting={updating}
      onSubmit={handleUpdate}
      onCancel={() => navigate(`/events/${event.id}`)}
    />
  );
}

export default EventEditPage;