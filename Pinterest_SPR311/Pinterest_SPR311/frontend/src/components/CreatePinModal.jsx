import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { pinsService } from "../api/pins";
import "./CreatePinModal.css";

const CreatePinModal = ({ isOpen, onClose, onSuccess }) => {
  const { isAuthenticated } = useAuth();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Будь ласка, виберіть файл зображення");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Розмір файлу не може перевищувати 10MB");
      return;
    }

    setError("");
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      setError("Будь ласка, виберіть зображення");
      return;
    }

    if (!title.trim()) {
      setError("Будь ласка, введіть назву");
      return;
    }

    if (!isAuthenticated) {
      setError("Будь ласка, увійдіть в систему");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("Image", imageFile);
      formData.append("Title", title.trim());
      if (description.trim()) {
        formData.append("Description", description.trim());
      }
      if (link.trim()) {
        formData.append("Link", link.trim());
      }
      formData.append("Visibility", "Public");

      await pinsService.createPin(formData);

      setImageFile(null);
      setImagePreview(null);
      setTitle("");
      setDescription("");
      setLink("");
      setError("");

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "Не вдалося створити пін. Спробуйте ще раз."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setImageFile(null);
      setImagePreview(null);
      setTitle("");
      setDescription("");
      setLink("");
      setError("");
      setIsDragging(false);
      onClose();
    }
  };

  return (
    <div className="create-pin-modal-overlay" onClick={handleClose}>
      <div
        className="create-pin-modal"
        onClick={(e) => e.stopPropagation()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button className="create-pin-modal-close" onClick={handleClose}>
          ×
        </button>

        <div className="create-pin-modal-header">
          <h2>Створити пін</h2>
        </div>

        <form onSubmit={handleSubmit} className="create-pin-modal-form">
          {error && <div className="create-pin-error">{error}</div>}

          <div className="create-pin-content">
            <div className="create-pin-image-section">
              {imagePreview ? (
                <div className="create-pin-image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="create-pin-remove-image"
                    onClick={handleRemoveImage}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div
                  className={`create-pin-upload-area ${isDragging ? "dragging" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <p className="create-pin-upload-text">
                    Перетягніть зображення сюди або натисніть для вибору
                  </p>
                  <p className="create-pin-upload-hint">
                    Рекомендовано: використовуйте файли .JPG, .PNG або .WEBP
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    style={{ display: "none" }}
                  />
                </div>
              )}
            </div>

            <div className="create-pin-form-section">
              <div className="create-pin-form-group">
                <label htmlFor="title">Назва *</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Додайте назву"
                  maxLength={200}
                  required
                />
              </div>

              <div className="create-pin-form-group">
                <label htmlFor="description">Опис</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Додайте опис"
                  rows="4"
                  maxLength={1000}
                />
              </div>

              <div className="create-pin-form-group">
                <label htmlFor="link">Посилання</label>
                <input
                  type="url"
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://www.example.com"
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          <div className="create-pin-modal-footer">
            <button
              type="button"
              className="create-pin-cancel-btn"
              onClick={handleClose}
              disabled={uploading}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="create-pin-publish-btn"
              disabled={uploading || !imageFile || !title.trim()}
            >
              {uploading ? "Публікація..." : "Опублікувати"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePinModal;

