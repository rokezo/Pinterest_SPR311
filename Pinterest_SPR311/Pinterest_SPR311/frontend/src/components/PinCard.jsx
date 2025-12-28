import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SavePinModal from "./SavePinModal";
import "./PinCard.css";

const PinCard = ({ pin, hideSaveButton = false, hideDownloadButton = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const imageUrl =
    pin.imageUrl?.startsWith("http") || pin.imageUrl?.startsWith("//")
      ? pin.imageUrl
      : `http://localhost:5001${pin.imageUrl}`;

  const handleClick = () => {
    navigate(`/pin/${pin.id}`);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName =
        pin.title?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "image";
      link.download = `${fileName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading image:", err);
    }
  };

  return (
    <div className="pin-card">
      <div className="pin-image-wrapper" onClick={handleClick}>
        <img
          src={imageUrl}
          alt={pin.title}
          className={`pin-image ${imageLoaded ? "loaded" : ""}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        {!imageLoaded && <div className="pin-image-placeholder" />}
        <div className="pin-overlay">
          {isAuthenticated && !hideSaveButton && (
            <button
              className="pin-save-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSaveModalOpen(true);
              }}
            >
              Зберегти
            </button>
          )}
          {!hideDownloadButton && (
            <button
              className="pin-download-btn"
              onClick={handleDownload}
              title="Завантажити зображення"
            >
              <span className="pin-download-icon">⬇</span>
            </button>
          )}
        </div>
      </div>
      <div className="pin-info">
        <h3 className="pin-title">{pin.title}</h3>
        {pin.description && (
          <p className="pin-description">{pin.description}</p>
        )}
        <div className="pin-meta">
          <span className="pin-author">{pin.ownerUsername}</span>
          {pin.likesCount > 0 && (
            <span className="pin-likes">❤️ {pin.likesCount}</span>
          )}
        </div>
      </div>

      <SavePinModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        pinId={pin.id}
        onSuccess={() => {
          console.log("Pin saved successfully");
        }}
      />
    </div>
  );
};

export default PinCard;
