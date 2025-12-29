import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { pinsService } from "../api/pins";
import "./CreateCollageModal.css";

const COLLAGE_LAYOUTS = [
  { id: "2x2", name: "2x2", rows: 2, cols: 2 },
  { id: "1+2", name: "1+2", rows: 2, cols: 2, custom: true },
  { id: "2+1", name: "2+1", rows: 2, cols: 2, custom: true },
  { id: "3x1", name: "3 в ряд", rows: 1, cols: 3 },
  { id: "1x3", name: "3 в стовпчик", rows: 3, cols: 1 },
];

const CreateCollageModal = ({ isOpen, onClose, onSuccess }) => {
  const { isAuthenticated } = useAuth();
  const [images, setImages] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(COLLAGE_LAYOUTS[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;

    const maxImages = 4;
    const imageFiles = Array.from(files).slice(0, maxImages);

    imageFiles.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Будь ласка, виберіть файли зображень");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("Розмір файлу не може перевищувати 10MB");
        return;
      }
    });

    setError("");

    const newImages = imageFiles.map((file) => {
      const reader = new FileReader();
      const imageObj = { file, preview: null };

      reader.onloadend = () => {
        imageObj.preview = reader.result;
        setImages((prev) => [...prev, imageObj]);
      };
      reader.readAsDataURL(file);

      return imageObj;
    });
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
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError("Будь ласка, увійдіть в систему");
      return;
    }

    if (images.length < 2) {
      setError("Виберіть мінімум 2 зображення для колажу");
      return;
    }

    if (!title.trim()) {
      setError("Будь ласка, введіть назву");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }
      if (link.trim()) {
        formData.append("link", link.trim());
      }
      formData.append("visibility", "Public");
      formData.append("layout", selectedLayout.id);

      images.forEach((imageObj, index) => {
        formData.append(`images`, imageObj.file);
      });

      await pinsService.createCollage(formData);

      setImages([]);
      setTitle("");
      setDescription("");
      setLink("");
      setSelectedLayout(COLLAGE_LAYOUTS[0]);
      setError("");

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Не вдалося створити колаж. Спробуйте ще раз."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setImages([]);
      setTitle("");
      setDescription("");
      setLink("");
      setSelectedLayout(COLLAGE_LAYOUTS[0]);
      setError("");
      onClose();
    }
  };

  const renderPreview = () => {
    if (images.length === 0) return null;

    const layoutClass = `collage-preview-${selectedLayout.id}`;
    const displayImages = images.slice(0, 4);

    return (
      <div className={`collage-preview ${layoutClass}`}>
        {displayImages.map((imageObj, index) => (
          <div key={index} className="collage-preview-item">
            {imageObj.preview && (
              <img src={imageObj.preview} alt={`Preview ${index + 1}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="create-collage-modal-overlay" onClick={handleClose}>
      <div
        className="create-collage-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="create-collage-modal-close" onClick={handleClose}>
          ×
        </button>

        <div className="create-collage-modal-header">
          <h2>Створити колаж</h2>
        </div>

        <form onSubmit={handleSubmit} className="create-collage-modal-form">
          <div className="create-collage-modal-content">
            {error && <div className="create-collage-error">{error}</div>}

            <div className="create-collage-layouts">
              <label>Виберіть макет:</label>
              <div className="create-collage-layout-options">
                {COLLAGE_LAYOUTS.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    className={`create-collage-layout-btn ${
                      selectedLayout.id === layout.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedLayout(layout)}
                  >
                    {layout.name}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`create-collage-upload-area ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                style={{ display: "none" }}
              />
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
              </svg>
              <p>Перетягніть зображення сюди або натисніть для вибору</p>
              <p className="create-collage-upload-hint">
                Мінімум 2 зображення, максимум 4
              </p>
            </div>

            {images.length > 0 && (
              <div className="create-collage-images-list">
                {images.map((imageObj, index) => (
                  <div key={index} className="create-collage-image-item">
                    <img
                      src={imageObj.preview}
                      alt={`Image ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="create-collage-remove-btn"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length > 0 && (
              <div className="create-collage-preview-section">
                <label>Попередній перегляд:</label>
                {renderPreview()}
              </div>
            )}

            <div className="create-collage-form-group">
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

            <div className="create-collage-form-group">
              <label htmlFor="description">Опис</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Розкажіть про свій колаж"
                rows="3"
                maxLength={500}
              />
            </div>

            <div className="create-collage-form-group">
              <label htmlFor="link">Посилання (необов'язково)</label>
              <input
                type="url"
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                maxLength={500}
              />
            </div>
          </div>

          <div className="create-collage-modal-footer">
            <button
              type="button"
              className="create-collage-cancel-btn"
              onClick={handleClose}
              disabled={uploading}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="create-collage-create-btn"
              disabled={uploading || images.length < 2 || !title.trim()}
            >
              {uploading ? "Створення..." : "Створити колаж"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCollageModal;
