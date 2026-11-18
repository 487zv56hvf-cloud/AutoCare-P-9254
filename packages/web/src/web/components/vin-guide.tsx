import { useState, useRef, useEffect } from "react";
import { MapPin, Maximize2, X } from "lucide-react";
import { t, type Lang } from "../lib/carcare";
export function VinGuide({ lang }: { lang: Lang }) {
  const [zoom, setZoom] = useState<string | null>(null);
  return (
    <details className="vin-guide">
      <summary>
        <MapPin size={16} />
        {t(lang, "vinWhere")}
      </summary>
      <div className="guide-intro">
        <strong>{t(lang, "vinHowTitle")}</strong>
        <p>{t(lang, "vinHowIntro")}</p>
        <ul>
          {[1, 2, 3].map((n) => (
            <li key={n}>{t(lang, `vinTip${n}`)}</li>
          ))}
        </ul>
      </div>
      <div className="guide-grid">
        {["windshield", "door", "engine"].map((spot) => (
          <article key={spot}>
            <button
              type="button"
              className="guide-image"
              onClick={() => setZoom(spot)}
              aria-label={t(lang, "vinTapZoom")}
            >
              <img
                src={`/images/vin/${spot}.jpg`}
                alt={t(lang, `vinSpot_${spot}`)}
              />
              <Maximize2 size={18} />
            </button>
            <h3>{t(lang, `vinSpot_${spot}`)}</h3>
            <ol>
              {[1, 2, 3].map((n) => (
                <li key={n}>{t(lang, `vinStep_${spot}_${n}`)}</li>
              ))}
            </ol>
          </article>
        ))}
      </div>
      {zoom && <Zoom lang={lang} spot={zoom} onClose={() => setZoom(null)} />}
    </details>
  );
}
function Zoom({
  lang,
  spot,
  onClose,
}: {
  lang: Lang;
  spot: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="image-overlay"
      aria-label={t(lang, `vinSpot_${spot}`)}
      onCancel={onClose}
    >
      <button type="button" aria-label={t(lang, "close")} onClick={onClose}>
        <X />
      </button>
      <img src={`/images/vin/${spot}.jpg`} alt={t(lang, `vinSpot_${spot}`)} />
    </dialog>
  );
}
