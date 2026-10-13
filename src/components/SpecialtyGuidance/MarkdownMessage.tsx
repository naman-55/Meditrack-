import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
}

/**
 * Lightweight, safe React-based Markdown renderer tailored for clinical AI Assistant responses.
 * Sanitizes and renders bold text, headings, bullet lists, numbered lists, links, and source documents
 * without using dangerous HTML injection.
 */
export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  if (!content) return null;

  // Split content into lines and group into structured blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentList: { type: 'bullet' | 'number'; items: string[] } | null = null;
  let inSourcesSection = false;

  const flushList = (keyPrefix: string) => {
    if (!currentList) return;
    const isBullet = currentList.type === 'bullet';
    elements.push(
      <ul
        key={`${keyPrefix}-list-${elements.length}`}
        className="space-y-1.5 my-2 pl-1 text-xs text-slate-700 dark:text-[#B4C4D8]"
      >
        {currentList.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 leading-relaxed">
            <span
              className={`inline-block shrink-0 mt-1.5 ${
                isBullet
                  ? 'w-1.5 h-1.5 rounded-full bg-[#00A884] dark:bg-[#00D6B0]'
                  : 'text-[11px] font-bold text-[#00A884] dark:text-[#00D6B0] w-4'
              }`}
            >
              {!isBullet ? `${idx + 1}.` : ''}
            </span>
            <span className="flex-1 min-w-0">{renderInlineMarkdown(item)}</span>
          </li>
        ))}
      </ul>
    );
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList(`gap-${i}`);
      continue;
    }

    // 1. Check for Section Heading (e.g., "### Heading", "## Heading", "# Heading")
    const hashHeadingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
    if (hashHeadingMatch) {
      flushList(`h-${i}`);
      const headingText = hashHeadingMatch[1].replace(/[*_:]+$/g, '').trim();
      inSourcesSection = /sources?/i.test(headingText);
      elements.push(
        <h4
          key={`h-${i}`}
          className="font-bold text-[#071B49] dark:text-[#F1F5FB] text-xs sm:text-sm mt-3.5 mb-1.5 first:mt-0 tracking-tight"
        >
          {renderInlineMarkdown(headingText)}
        </h4>
      );
      continue;
    }

    // 2. Check for Standalone Bold Section Heading (e.g., "**Key Considerations**", "**Limitations:**", "**Sources:**")
    const boldHeadingMatch = trimmed.match(/^\*\*([^*]+)\*\*:?$/);
    if (boldHeadingMatch) {
      flushList(`bh-${i}`);
      const headingText = boldHeadingMatch[1].replace(/:$/, '').trim();
      inSourcesSection = /sources?/i.test(headingText);
      elements.push(
        <h4
          key={`bh-${i}`}
          className="font-bold text-[#071B49] dark:text-[#F1F5FB] text-xs sm:text-sm mt-3.5 mb-1.5 first:mt-0 tracking-tight"
        >
          {headingText}
        </h4>
      );
      continue;
    }

    // 3. Check for Source Document Item (inside Sources section or matching .pdf report pattern)
    const isPdfSourceLine =
      trimmed.includes('.pdf') ||
      trimmed.startsWith('• MediTrack_') ||
      trimmed.startsWith('- MediTrack_') ||
      (inSourcesSection && (trimmed.includes('Report') || trimmed.includes('Lab')));

    if (inSourcesSection && isPdfSourceLine) {
      flushList(`src-${i}`);
      // Clean bullet markers
      const cleaned = trimmed.replace(/^[-*•+]\s+/, '').replace(/^\[[^\]]+\]\s*/, '');
      const parts = cleaned.split(/\s*[-–—:]\s*|\n/).map(s => s.trim()).filter(Boolean);
      const title = parts[0] || cleaned;
      const subtitle = parts.slice(1).join(' · ');

      elements.push(
        <div
          key={`source-card-${i}`}
          className="flex items-start gap-2.5 p-2.5 my-1.5 rounded-xl bg-slate-100/80 dark:bg-[#0D1B2A] border border-slate-200 dark:border-[#20364A] text-xs shadow-2xs"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-100/70 dark:bg-[#0B2545]/80 text-[#2563EB] dark:text-[#2684FF] flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#071B49] dark:text-[#F1F5FB] leading-tight truncate">
              {title}
            </p>
            {subtitle && (
              <p className="text-[11px] text-[#64748B] dark:text-[#8297B2] leading-tight mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      );
      continue;
    }

    // 4. Check for Bullet List Item (lines starting with *, -, •, +)
    const bulletMatch = trimmed.match(/^[-*•+]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'bullet') {
        flushList(`switch-b-${i}`);
        currentList = { type: 'bullet', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // 5. Check for Numbered List Item (lines starting with "1. ", "2. ", etc.)
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      if (!currentList || currentList.type !== 'number') {
        flushList(`switch-n-${i}`);
        currentList = { type: 'number', items: [] };
      }
      currentList.items.push(numberMatch[2]);
      continue;
    }

    // 6. Regular Paragraph Line
    flushList(`p-${i}`);
    elements.push(
      <p
        key={`p-${i}`}
        className="text-xs text-slate-700 dark:text-[#B4C4D8] leading-relaxed my-1.5 first:mt-0 last:mb-0"
      >
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  }

  flushList('final');

  return <div className="space-y-1">{elements}</div>;
};

/**
 * Parses inline markdown: bold (**text**), inline code (`code`), and links ([text](url)).
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Tokenize regex for bold (**...**), code (`...`), and links ([...](...))
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    // 1. Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-[#071B49] dark:text-[#F1F5FB]">
          {boldText}
        </strong>
      );
    }

    // 2. Inline Code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#102033] border border-slate-200/70 dark:border-[#20364A] font-mono text-[11px] text-slate-800 dark:text-[#00D6B0]"
        >
          {codeText}
        </code>
      );
    }

    // 3. Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const rawUrl = linkMatch[2];
      const isSafe = /^https?:\/\//i.test(rawUrl) || rawUrl.startsWith('/') || rawUrl.startsWith('#');
      if (isSafe) {
        return (
          <a
            key={index}
            href={rawUrl}
            target={rawUrl.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[#2563EB] dark:text-[#00D6B0] hover:underline font-semibold"
          >
            <span>{label}</span>
            {rawUrl.startsWith('http') && <ExternalLink className="w-3 h-3 inline ml-0.5" />}
          </a>
        );
      }
      return <span key={index}>{label}</span>;
    }

    return part;
  });
}
