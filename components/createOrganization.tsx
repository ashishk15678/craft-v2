"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useRef, useState } from "react";

interface CreateOrganizationProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateOrganization({
  isOpen,
  onOpenChange,
}: CreateOrganizationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert name into a URL-safe slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, "") // Remove special characters
      .replace(/\s+/g, "-")        // Replace spaces with hyphens
      .replace(/-+/g, "-");        // Remove duplicate hyphens
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
      // Reset form state on modal close
      formRef.current?.reset();
      setSlug("");
      setError(null);
    }
  }, [isOpen]);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    onOpenChange(false);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Extract values directly from the native HTML form elements
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const slugValue = formData.get("slug") as string;

    try {
      const res = await authClient.organization.create({
        name,
        slug: slugValue,
      });

      if (res?.error) {
        setError(res.error.message || "Failed to create organization");
        return;
      }

      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="m-auto rounded-2xl p-0 shadow-2xl border border-border max-w-md w-full bg-background text-foreground backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create Organization</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          {/* Organization Name Input */}
          <input
            name="name"
            type="text"
            placeholder="Organization Name"
            required
            onChange={(e) => setSlug(generateSlug(e.target.value))}
            className="border rounded-2xl px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
          />

          {/* Organization Slug Input */}
          <div className="flex flex-row w-full">
            <span className="border border-r-0 border-border bg-accent rounded-l-2xl w-1/4 text-center py-1 text-sm text-muted-foreground flex items-center justify-center select-none">
              org/
            </span>
            <input
              name="slug"
              type="text"
              placeholder="organization-slug"
              required
              value={slug}
              onChange={(e) => setSlug(generateSlug(e.target.value))}
              className="border rounded-r-2xl w-3/4 px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 w-full">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="px-4 py-1 text-sm border rounded-2xl hover:bg-accent w-1/4 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1 text-sm text-white bg-indigo-500 rounded-2xl hover:opacity-90 w-3/4 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
