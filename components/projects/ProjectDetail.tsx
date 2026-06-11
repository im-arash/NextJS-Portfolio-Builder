"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "./types";

interface LightboxImage {
  src: string;
  alt?: string;
}

interface LightboxState {
  isOpen: boolean;
  images: LightboxImage[];
  index: number;
  projectId: Project["id"] | null;
}

export default function ProjectDetail({
  project,
  isAdmin,
  previousProject,
  nextProject,
  onEdit,
  onPrevious,
  onNext,
}: {
  project: Project;
  isAdmin: boolean;
  previousProject: Project | null;
  nextProject: Project | null;
  onEdit: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  const [lightbox, setLightbox] = useState<LightboxState>({
    isOpen: false,
    images: [],
    index: 0,
    projectId: null,
  });

  const isLightboxOpen = lightbox.isOpen && lightbox.projectId === project.id;

  const currentImage = useMemo(
    () => lightbox.images[lightbox.index],
    [lightbox.images, lightbox.index],
  );

  const closeLightbox = () => {
    setLightbox({
      isOpen: false,
      images: [],
      index: 0,
      projectId: null,
    });
  };

  const openLightbox = (images: LightboxImage[], startIndex = 0) => {
    if (images.length === 0) return;

    setLightbox({
      isOpen: true,
      images,
      index: startIndex,
      projectId: project.id,
    });
  };

  const showPreviousImage = () => {
    setLightbox((prev) => ({
      ...prev,
      index:
        prev.images.length === 0
          ? 0
          : (prev.index - 1 + prev.images.length) % prev.images.length,
    }));
  };

  const showNextImage = () => {
    setLightbox((prev) => ({
      ...prev,
      index:
        prev.images.length === 0 ? 0 : (prev.index + 1) % prev.images.length,
    }));
  };

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleContentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickedImg = target.closest("img");
      if (!clickedImg) return;

      const imgElement = clickedImg as HTMLImageElement;
      const galleryContainer = imgElement.closest(
        '[data-type="image-gallery"]',
      ) as HTMLElement | null;

      if (galleryContainer) {
        const galleryImageElements = Array.from(
          galleryContainer.querySelectorAll("img"),
        );

        const galleryImages = galleryImageElements
          .map((img) => ({
            src: img.getAttribute("src") || "",
            alt: img.getAttribute("alt") || "Gallery image",
          }))
          .filter((image) => image.src);

        const clickedIndex = galleryImageElements.indexOf(imgElement);

        openLightbox(galleryImages, clickedIndex >= 0 ? clickedIndex : 0);
        return;
      }

      const src = imgElement.getAttribute("src");
      if (!src) return;

      openLightbox([
        {
          src,
          alt: imgElement.getAttribute("alt") || "Image",
        },
      ]);
    };

    container.addEventListener("click", handleContentClick);

    return () => {
      container.removeEventListener("click", handleContentClick);
    };
  }, [project.id, project.description]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        showPreviousImage();
      } else if (event.key === "ArrowRight") {
        showNextImage();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl">{project.title}</h1>

        {isAdmin && (
          <button onClick={onEdit} className="text-sm underline">
            Edit
          </button>
        )}
      </div>

      <div className="mb-6 flex gap-3">
        <p className="bg-taupe-400/50 rounded-full px-3 py-1 text-sm text-black/70">
          {project.category}
        </p>
        <p className="bg-taupe-400/50 rounded-full px-3 py-1 text-sm text-black/70">
          {project.project_year ?? ""}
        </p>
      </div>

      <div
        ref={contentRef}
        className="rich-content prose prose-sm sm:prose-base max-w-none"
        dangerouslySetInnerHTML={{
          __html: project.description || "",
        }}
      />

      <div className="mt-10 flex items-center justify-between md:hidden">
        <button
          onClick={onPrevious}
          disabled={!previousProject}
          aria-label="Previous project"
          className="text-lg opacity-40 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
        >
          &lt;
        </button>

        <button
          onClick={onNext}
          disabled={!nextProject}
          aria-label="Next project"
          className="text-lg opacity-40 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
        >
          &gt;
        </button>
      </div>

      {isLightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative w-full max-w-6xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute top-0 right-0 -mt-12 px-3 py-2 rounded bg-white/10 text-white hover:bg-white/20"
            >
              Close
            </button>

            {lightbox.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 px-4 py-3 rounded bg-white/10 text-white hover:bg-white/20"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 px-4 py-3 rounded bg-white/10 text-white hover:bg-white/20"
                >
                  ›
                </button>
              </>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage.src}
              alt={currentImage.alt || "Preview image"}
              className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
            />

            <div className="mt-4 text-center text-white">
              {currentImage.alt && (
                <p className="text-sm opacity-90">{currentImage.alt}</p>
              )}

              {lightbox.images.length > 1 && (
                <p className="text-xs opacity-70 mt-1">
                  {lightbox.index + 1} / {lightbox.images.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
