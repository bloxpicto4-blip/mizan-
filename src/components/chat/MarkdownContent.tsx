import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { marked } from 'marked';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  // Extract and render code blocks with copy button
  const renderFormatted = () => {
    // Regex to split code blocks vs text
    const parts: React.ReactNode[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const matchIndex = match.index;
      // Text before code block
      if (matchIndex > lastIndex) {
        const textSegment = content.slice(lastIndex, matchIndex);
        parts.push(
          <div
            key={`text-${lastIndex}`}
            className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed break-words"
            dangerouslySetInnerHTML={{
              __html: marked.parse(textSegment, { async: false }) as string,
            }}
          />
        );
      }

      // Code block component
      const lang = match[1] || 'code';
      const code = match[2];
      parts.push(
        <CodeBlock key={`code-${matchIndex}`} language={lang} code={code} />
      );

      lastIndex = matchIndex + match[0].length;
    }

    // Remaining text
    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex);
      parts.push(
        <div
          key={`text-${lastIndex}`}
          className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed break-words"
          dangerouslySetInnerHTML={{
            __html: marked.parse(remaining, { async: false }) as string,
          }}
        />
      );
    }

    return parts;
  };

  return <div className="space-y-3 font-sans" dir="auto">{renderFormatted()}</div>;
};

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950/80 shadow-md dir-ltr" dir="ltr">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
        <span className="font-mono uppercase font-semibold text-amber-400/90">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 py-0.5 px-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs"
          title="نسخ الكود"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">تم النسخ!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>نسخ</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs md:text-sm font-mono text-slate-200 leading-relaxed selection:bg-amber-500/30">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};
