import { Search, Database, BarChart3, FileText, Loader2, Check, X } from 'lucide-react';
import './ToolIndicator.css';

const TOOL_CONFIG = {
  web_search: { label: 'Searching the web', icon: Search, color: 'purple' },
  query_database: { label: 'Querying database', icon: Database, color: 'blue' },
  analyze_database: { label: 'Analyzing data', icon: BarChart3, color: 'cyan' },
  summarize_text: { label: 'Summarizing', icon: FileText, color: 'teal' },
};

function ToolIndicator({ tool }) {
  const config = TOOL_CONFIG[tool.name] || {
    label: tool.name,
    icon: Loader2,
    color: 'purple',
  };
  const Icon = config.icon;
  const isRunning = tool.status === 'running';
  const isDone = tool.status === 'done';
  const isError = tool.status === 'error';

  return (
    <div className={`tool-indicator tool-indicator--${config.color} ${isRunning ? 'tool-indicator--running' : ''}`}>
      <div className="tool-indicator__icon">
        {isRunning ? (
          <Loader2 size={14} className="tool-indicator__spinner" />
        ) : isDone ? (
          <Check size={14} />
        ) : isError ? (
          <X size={14} />
        ) : (
          <Icon size={14} />
        )}
      </div>
      <span className="tool-indicator__label">{config.label}</span>
      {isRunning && <span className="tool-indicator__dots"><span>.</span><span>.</span><span>.</span></span>}
    </div>
  );
}

export default ToolIndicator;
