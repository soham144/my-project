import { ExternalLink } from 'lucide-react';
import './SourceCard.css';

function SourceCard({ source, index }) {
  const domain = (() => {
    try {
      return new URL(source.url).hostname.replace('www.', '');
    } catch {
      return source.url;
    }
  })();

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-card"
      title={source.title}
    >
      <div className="source-card__header">
        <span className="source-card__index">{index}</span>
        <img
          className="source-card__favicon"
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          width={14}
          height={14}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <span className="source-card__domain">{domain}</span>
        <ExternalLink size={10} className="source-card__link-icon" />
      </div>
      <p className="source-card__title">{source.title}</p>
      {source.snippet && (
        <p className="source-card__snippet">{source.snippet.slice(0, 100)}</p>
      )}
    </a>
  );
}

export default SourceCard;
