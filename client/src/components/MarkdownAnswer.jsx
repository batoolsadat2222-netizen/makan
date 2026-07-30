import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownAnswer({ content, className = '' }) {
  if (!content) return null;

  return (
    <div className={`markdown-body ${className}`} dir="rtl" lang="fa">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
