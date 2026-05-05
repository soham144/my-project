import { Sparkles } from 'lucide-react';
import './ThinkingAnimation.css';

function ThinkingAnimation() {
  return (
    <div className="thinking fade-in">
      <div className="thinking__avatar">
        <Sparkles size={16} />
      </div>
      <div className="thinking__content">
        <div className="thinking__dots">
          <span className="thinking__dot" />
          <span className="thinking__dot" />
          <span className="thinking__dot" />
        </div>
      </div>
    </div>
  );
}

export default ThinkingAnimation;
