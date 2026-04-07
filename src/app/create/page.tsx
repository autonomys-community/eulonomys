"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EulogyEditor } from "@/components/EulogyEditor";
import { PaymentFlow } from "@/components/PaymentFlow";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Step = "edit" | "preview" | "pay" | "uploading" | "complete";

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("edit");

  // Form state
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dateOfPassing, setDateOfPassing] = useState("");
  const [relationship, setRelationship] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contentSizeBytes = new Blob([content]).size + (image?.size || 0);

  function canProceed() {
    return name.trim() && content.trim();
  }

  async function handleUpload() {
    setStep("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("content", content);
      formData.append("visibility", visibility);
      if (dateOfBirth) formData.append("dateOfBirth", dateOfBirth);
      if (dateOfPassing) formData.append("dateOfPassing", dateOfPassing);
      if (relationship) formData.append("relationship", relationship);
      if (image) formData.append("image", image);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setCid(data.cid);
      setStep("complete");
    } catch {
      setError("Upload failed. Please try again.");
      setStep("pay");
    }
  }

  if (step === "complete" && cid) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Eulogy Stored Permanently
        </h1>
        <p className="mt-4 text-muted">
          The eulogy for {name} has been stored on the Autonomys Network. It
          will exist as long as the network does.
        </p>
        <div className="mt-6 rounded-md bg-stone-100 p-4">
          <p className="text-sm text-muted">Permalink</p>
          <p className="mt-1 font-mono text-sm text-foreground break-all">
            /eulogy/{cid}
          </p>
        </div>
        <button
          onClick={() => router.push(`/eulogy/${cid}`)}
          className="mt-6 rounded-md bg-stone-800 px-6 py-3 text-sm text-stone-50 hover:bg-stone-700 transition-colors"
        >
          View Eulogy
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground">Write a Eulogy</h1>
      <p className="mt-2 text-sm text-muted">
        Take your time. There is no rush here.
      </p>

      {step === "edit" && (
        <div className="mt-8 space-y-6">
          {/* Metadata fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground">
                Name of the deceased <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Date of birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Date of passing
              </label>
              <input
                type="date"
                value={dateOfPassing}
                onChange={(e) => setDateOfPassing(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground">
                Your relationship
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Daughter, Friend, Colleague"
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Visibility
            </label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  className="accent-stone-700"
                />
                <span>Public — browsable by anyone</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                  className="accent-stone-700"
                />
                <span>Private — link only</span>
              </label>
            </div>
            {visibility === "private" && (
              <p className="mt-2 text-xs text-muted">
                Note: The content is stored on a public network. Anyone who
                knows the CID can access it directly. &ldquo;Private&rdquo;
                means it won&apos;t appear in the browse page or search.
              </p>
            )}
          </div>

          {/* Editor */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Eulogy <span className="text-red-600">*</span>
            </label>
            <div className="mt-2">
              <EulogyEditor
                content={content}
                onContentChange={setContent}
                image={image}
                onImageChange={setImage}
                imagePreview={imagePreview}
                onImagePreviewChange={setImagePreview}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep("preview")}
              disabled={!canProceed()}
              className="rounded-md bg-stone-800 px-6 py-2 text-sm text-stone-50 hover:bg-stone-700 disabled:opacity-50 transition-colors"
            >
              Preview
            </button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="mt-8">
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground">{name}</h2>
            {(dateOfBirth || dateOfPassing) && (
              <p className="mt-1 text-sm text-muted">
                {[dateOfBirth, dateOfPassing].filter(Boolean).join(" — ")}
              </p>
            )}
            {relationship && (
              <p className="mt-1 text-sm italic text-muted">{relationship}</p>
            )}
            {imagePreview && (
              <div className="mt-6 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Uploaded photo"
                  className="max-h-64 rounded-lg border border-border"
                />
              </div>
            )}
            <div className="prose mt-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep("edit")}
              className="rounded-md border border-border px-6 py-2 text-sm text-foreground hover:bg-stone-100 transition-colors"
            >
              Back to Edit
            </button>
            <button
              onClick={() => setStep("pay")}
              className="rounded-md bg-stone-800 px-6 py-2 text-sm text-stone-50 hover:bg-stone-700 transition-colors"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      )}

      {step === "pay" && (
        <div className="mt-8">
          <PaymentFlow
            contentSizeBytes={contentSizeBytes}
            onPaymentConfirmed={handleUpload}
            onRequestEscrow={() => {
              // TODO: Integrate escrow request flow
              alert("Community funding request coming soon.");
            }}
          />
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          <button
            onClick={() => setStep("preview")}
            className="mt-4 rounded-md border border-border px-6 py-2 text-sm text-foreground hover:bg-stone-100 transition-colors"
          >
            Back to Preview
          </button>
        </div>
      )}

      {step === "uploading" && (
        <div className="mt-8 text-center">
          <p className="text-muted">
            Uploading to the Autonomys Network...
          </p>
        </div>
      )}
    </div>
  );
}
