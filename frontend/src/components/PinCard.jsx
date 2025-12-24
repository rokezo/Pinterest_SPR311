import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PinCard.css";

const PinCard = ({ pin }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();
  const imageUrl =
    pin.imageUrl?.startsWith("http") || pin.imageUrl?.startsWith("//")
      ? pin.imageUrl
      : `http://localhost:5000${pin.imageUrl}`;

  const handleClick = () => {
    navigate(`/pin/${pin.id}`);
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
          <button
            className="pin-save-btn"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Save
          </button>
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
    </div>
  );
};

export default PinCard;
