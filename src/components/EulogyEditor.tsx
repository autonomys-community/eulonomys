"use client";

import { useState, useCallback, useRef } from "react";
import { WritingHelper } from "./WritingHelper";
import { config } from "@/config/app";

interface EulogyEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  image: File | null;
  onImageChange: (file: File | null) => void;
  imagePreview: string | null;
  onImagePreviewChange: (url: string | null) => void;
}

async function compressImage(file: File): Promise<File> {
  const { default: imageCompression } = await import(
    "browser-image-compression"
  );
  return imageCompression(file, {
    maxSizeMB: config.upload.maxImageSizeBytes / (1024 * 1024),
    useWebWorker: true,
    preserveExif: false,
  }) as Promise<File>;
}

function ToolbarButton({
  label,
  syntax,
  onInsert,
}: {
  label: string;
  syntax: { before: string; after: string };
  onInsert: (before: string, after: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onInsert(syntax.before, syntax.after)}
      className="rounded px-2 py-1 text-sm text-muted hover:bg-stone-200 hover:text-foreground transition-colors"
      title={label}
    >
      {label}
    </button>
  );
}

export function EulogyEditor({
  content,
  onContentChange,
  image,
  onImageChange,
  imagePreview,
  onImagePreviewChange,
}: EulogyEditorProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsert = useCallback(
    (before: string, after: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = content.substring(start, end);
      const newContent =
        content.substring(0, start) +
        before +
        selected +
        after +
        content.substring(end);
      onContentChange(newContent);

      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.focus();
        const cursorPos = start + before.length + selected.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    },
    [content, onContentChange]
  );

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!(config.upload.allowedImageTypes as readonly string[]).includes(file.type)) {
      alert("Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    setIsCompressing(true);
    try {
      let processedFile = file;
      if (file.size > config.upload.maxImageSizeBytes) {
        processedFile = await compressImage(file);
      }
      onImageChange(processedFile);
      onImagePreviewChange(URL.createObjectURL(processedFile));
    } catch {
      alert("Could not process the image. Please try a different file.");
    } finally {
      setIsCompressing(false);
    }
  }

  function removeImage() {
    onImageChange(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    onImagePreviewChange(null);
  }

  return (
    <div className="space-y-4">
      {/* Markdown toolbar */}
      <div className="flex gap-1 rounded-md border border-border bg-stone-50 p-1">
        <ToolbarButton
          label="B"
          syntax={{ before: "**", after: "**" }}
          onInsert={handleInsert}
        />
        <ToolbarButton
          label="I"
          syntax={{ before: "_", after: "_" }}
          onInsert={handleInsert}
        />
        <ToolbarButton
          label="H2"
          syntax={{ before: "## ", after: "" }}
          onInsert={handleInsert}
        />
        <ToolbarButton
          label="H3"
          syntax={{ before: "### ", after: "" }}
          onInsert={handleInsert}
        />
        <ToolbarButton
          label="Quote"
          syntax={{ before: "> ", after: "" }}
          onInsert={handleInsert}
        />
      </div>

      {/* Text editor */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        rows={16}
        placeholder="Write your eulogy here. You can use Markdown for formatting."
        className="w-full rounded-md border border-border px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-y"
      />

      {/* Image upload */}
      <div>
        {imagePreview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Uploaded photo"
              className="max-h-48 rounded-md border border-border"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -right-2 -top-2 rounded-full bg-stone-800 px-2 py-0.5 text-xs text-stone-50 hover:bg-stone-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted hover:bg-stone-100 transition-colors">
            {isCompressing ? "Processing..." : "Add a photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
              disabled={isCompressing}
            />
          </label>
        )}
      </div>

      {/* Writing helper */}
      <WritingHelper />
    </div>
  );
}
