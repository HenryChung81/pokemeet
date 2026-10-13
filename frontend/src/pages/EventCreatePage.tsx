import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import EventForm from "./EventForm";
import type { EventFormValues } from "./EventForm";

const API_BASE = "http://127.0.0.1:8000";

const INITIAL_VALUES: EventFormValues = {
  title: "",
  description: "",
  eventDate: "",
  location: "",
  capacity: "20",
  participationFee: "0",
};

function EventCreatePage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
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

  const handleCreate = async (
    values: EventFormValues,
    selectedImage: File | null
  ) => {
    setCreating(true);
    try {
      const response = await fetch(`${API_BASE}/events`, {
        method: "POST",
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
        throw new Error(data.detail || "交流会の作成に失敗しました");
      }

      const eventId = data.event_id;
      if (!eventId) {
        throw new Error(
          "交流会は作成されましたが、交流会IDを取得できませんでした"
        );
      }

      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);

        const imageResponse = await fetch(
          `${API_BASE}/events/${eventId}/image`,
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
              "交流会は作成されましたが、画像のアップロードに失敗しました"
          );
        }
      }

      navigate(`/events/${eventId}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="page-container">
          <div className="empty-message">読み込んでいます...</div>
        </div>
      </main>
    );
  }

  if (!isAdmin) return null;

  return (
    <EventForm
      mode="create"
      initialValues={INITIAL_VALUES}
      submitting={creating}
      onSubmit={handleCreate}
      onCancel={() => navigate("/events")}
    />
  );
}

export default EventCreatePage;