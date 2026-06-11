"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { Node as TiptapNode, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Youtube from "@tiptap/extension-youtube";
import ResizeImage from "tiptap-extension-resize-image";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { createClient } from "@/utils/supabase/client";

const BUCKET_NAME = "portfolio-images";

const ResizableAlignedImage = ResizeImage.extend({
  name: "image",

  inline() {
    return false;
  },

  group() {
    return "block";
  },

  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      ...this.parent?.(),

      align: {
        default: "center",
        parseHTML: (element) => {
          const dataAlign = element.getAttribute("data-align");
          if (dataAlign) return dataAlign;

          const style = element.getAttribute("style") || "";

          if (
            style.includes("margin-left: auto") &&
            style.includes("margin-right: auto")
          ) {
            return "center";
          }

          if (
            style.includes("margin-left: auto") &&
            style.includes("margin-right: 0")
          ) {
            return "right";
          }

          return "left";
        },
        renderHTML: (attributes) => {
          let style = "display: block;";

          if (attributes.align === "left") {
            style += " margin-left: 0; margin-right: auto;";
          } else if (attributes.align === "center") {
            style += " margin-left: auto; margin-right: auto;";
          } else if (attributes.align === "right") {
            style += " margin-left: auto; margin-right: 0;";
          }

          return {
            "data-align": attributes.align,
            style,
          };
        },
      },

      width: {
        default: "100%",
        parseHTML: (element) =>
          element.getAttribute("width") ||
          element.style.width ||
          element.getAttribute("data-width") ||
          "100%",
        renderHTML: (attributes) => ({
          width: attributes.width,
          "data-width": attributes.width,
        }),
      },
    };
  },
});

const ImageGallery = TiptapNode.create({
  name: "imageGallery",

  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element) => {
          const raw = element.getAttribute("data-images");
          if (!raw) return [];

          try {
            return JSON.parse(raw);
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => ({
          "data-images": JSON.stringify(attributes.images || []),
        }),
      },
      columns: {
        default: 3,
        parseHTML: (element) =>
          Number(element.getAttribute("data-columns")) || 3,
        renderHTML: (attributes) => ({
          "data-columns": attributes.columns || 3,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-gallery"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const images = node.attrs.images || [];
    const columns = node.attrs.columns || 3;

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "image-gallery",
        class: "my-4 grid gap-3",
        style: `grid-template-columns: repeat(${columns}, minmax(0, 1fr));`,
      }),
      ...images.map((image: { src: string; alt?: string }) => [
        "img",
        {
          src: image.src,
          alt: image.alt || "Gallery image",
          class: "w-full rounded-md object-cover",
        },
      ]),
    ];
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

interface BucketImage {
  name: string;
  path: string;
  url: string;
}

const TEXT_COLORS = [
  "#000000",
  "#374151",
  "#6B7280",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
];

export default function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [images, setImages] = useState<BucketImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<
    BucketImage[]
  >([]);

  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlValue, setHtmlValue] = useState(value || "");

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,

        codeBlock: {
          HTMLAttributes: {
            class: "rounded-md bg-muted p-4 font-mono text-sm",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 pl-4 italic text-muted-foreground",
          },
        },
        horizontalRule: {
          HTMLAttributes: {
            class: "my-4 border-t",
          },
        },
      }),

      TextAlign.configure({
        types: ["heading", "paragraph", "listItem"],
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "text-blue-600 underline",
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        modestBranding: true,
        HTMLAttributes: {
          class: "rounded-md overflow-hidden mx-auto my-4",
        },
      }),
      ResizableAlignedImage.configure({
        inline: false,
        allowBase64: true,
      }),
      ImageGallery,
    ],

    content: value,
    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },

    editorProps: {
      attributes: {
        class:
          "ProseMirror prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] p-4 border rounded-md",
      },

      handleClickOn(view, _pos, node, nodePos) {
        if (node.type.name === "image" || node.type.name === "imageGallery") {
          const transaction = view.state.tr.setSelection(
            NodeSelection.create(view.state.doc, nodePos),
          );
          view.dispatch(transaction);
          return true;
        }

        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor || isHtmlMode) return;

    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", {
        emitUpdate: false,
      });
    }
  }, [editor, value, isHtmlMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as globalThis.Node | null;

      if (
        emojiPickerRef.current &&
        target &&
        !emojiPickerRef.current.contains(target)
      ) {
        setIsEmojiPickerOpen(false);
      }

      if (
        colorPickerRef.current &&
        target &&
        !colorPickerRef.current.contains(target)
      ) {
        setIsColorPickerOpen(false);
      }
    };

    if (isEmojiPickerOpen || isColorPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEmojiPickerOpen, isColorPickerOpen]);

  const loadImages = useCallback(async () => {
    setLoadingImages(true);

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list("", {
          limit: 100,
          offset: 0,
          sortBy: {
            column: "created_at",
            order: "desc",
          },
        });

      if (error) throw error;

      const formattedImages: BucketImage[] = (data || [])
        .filter(
          (file) =>
            file.name && /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(file.name),
        )
        .map((file) => {
          const path = file.name;

          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path);

          return {
            name: file.name,
            path,
            url: publicUrlData.publicUrl,
          };
        });

      setImages(formattedImages);
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setLoadingImages(false);
    }
  }, [supabase]);

  const openImageManager = useCallback(async () => {
    setSelectedGalleryImages([]);
    setIsImageManagerOpen(true);
    await loadImages();
  }, [loadImages]);

  const selectImageBySrc = useCallback(
    (src: string) => {
      if (!editor) return;

      const { state, view } = editor;
      let imagePosition: number | null = null;

      state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === src) {
          imagePosition = pos;
        }
      });

      if (imagePosition === null) return;

      const transaction = state.tr.setSelection(
        NodeSelection.create(state.doc, imagePosition),
      );

      view.dispatch(transaction);
      view.focus();
    },
    [editor],
  );

  const insertImage = useCallback(
    (url: string, alt = "Image") => {
      if (!editor) return;

      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: {
            src: url,
            align: "center",
            width: "100%",
            alt,
          },
        })
        .run();

      setIsImageManagerOpen(false);

      requestAnimationFrame(() => {
        selectImageBySrc(url);
      });
    },
    [editor, selectImageBySrc],
  );

  const insertImageGallery = useCallback(
    (galleryImages: BucketImage[]) => {
      if (!editor || galleryImages.length === 0) return;

      editor
        .chain()
        .focus()
        .insertContent({
          type: "imageGallery",
          attrs: {
            columns: galleryImages.length >= 3 ? 3 : galleryImages.length,
            images: galleryImages.map((image) => ({
              src: image.url,
              alt: image.name,
            })),
          },
        })
        .run();

      setSelectedGalleryImages([]);
      setIsImageManagerOpen(false);
    },
    [editor],
  );

  const toggleGalleryImageSelection = useCallback((image: BucketImage) => {
    setSelectedGalleryImages((prev) => {
      const exists = prev.some((item) => item.path === image.path);

      if (exists) {
        return prev.filter((item) => item.path !== image.path);
      }

      return [...prev, image];
    });
  }, []);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadingImage(true);

      try {
        const safeFileName = file.name.replace(/\s+/g, "-").toLowerCase();
        const filename = `${Date.now()}-${safeFileName}`;

        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filename, file);

        if (error) throw error;

        const { data: publicData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(data.path);

        await loadImages();
        insertImage(publicData.publicUrl, file.name);
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setUploadingImage(false);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [supabase, loadImages, insertImage],
  );

  const handleToggleHtmlMode = useCallback(() => {
    if (!editor) return;

    if (!isHtmlMode) {
      setHtmlValue(editor.getHTML());
      setIsHtmlMode(true);
      return;
    }

    editor.commands.setContent(htmlValue || "", {
      emitUpdate: true,
    });
    setIsHtmlMode(false);
  }, [editor, isHtmlMode, htmlValue]);

  const handleHtmlChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setHtmlValue(newValue);
      onChange(newValue);
    },
    [onChange],
  );

  const insertEmoji = useCallback(
    (emoji: string) => {
      if (!editor) return;

      editor.chain().focus().insertContent(emoji).run();
      setIsEmojiPickerOpen(false);
    },
    [editor],
  );

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter URL", previousUrl);

    if (url === null) return;

    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }, [editor]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  }, [editor]);

  const insertYoutube = useCallback(() => {
    if (!editor) return;

    const url = window.prompt("Enter YouTube URL");
    if (!url || !url.trim()) return;

    editor
      .chain()
      .focus()
      .setYoutubeVideo({
        src: url.trim(),
        width: 640,
        height: 360,
      })
      .run();
  }, [editor]);

  const applyTextColor = useCallback(
    (color: string) => {
      if (!editor) return;
      setSelectedColor(color);
      editor.chain().focus().setColor(color).run();
      setIsColorPickerOpen(false);
    },
    [editor],
  );

  const clearTextColor = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetColor().run();
    setSelectedColor("#000000");
    setIsColorPickerOpen(false);
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setParagraph().run()}
          disabled={isHtmlMode}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive("paragraph")
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          P
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          disabled={isHtmlMode}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive("heading", { level: 1 })
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          H1
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={isHtmlMode}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive("heading", { level: 2 })
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          H2
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          disabled={isHtmlMode}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive("heading", { level: 3 })
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          H3
        </button>

        <div className="flex items-center gap-1 border-l pl-2 ml-2 border-border">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("bold")
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Bold
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("italic")
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Italic
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("underline")
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Underline
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("strike")
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Strike
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("highlight")
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Highlight
          </button>
        </div>

        <div
          className="relative flex items-center gap-1 border-l pl-2 ml-2 border-border"
          ref={colorPickerRef}
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsColorPickerOpen((prev) => !prev)}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded bg-muted hover:bg-secondary ${
              isHtmlMode ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Color
          </button>

          <div
            className="w-5 h-5 rounded border"
            style={{ backgroundColor: selectedColor }}
          />

          {isColorPickerOpen && !isHtmlMode && (
            <div className="absolute top-full left-0 mt-2 z-40 bg-background border rounded-md shadow-lg p-3 w-56">
              <div className="grid grid-cols-6 gap-2 mb-3">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => applyTextColor(color)}
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={clearTextColor}
                className="w-full px-3 py-2 text-sm rounded bg-muted hover:bg-secondary"
              >
                Clear Color
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 border-l pl-2 ml-2 border-border">
          <span className="text-xs text-muted-foreground mr-1">Lists:</span>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("bulletList")
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Bullet
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("orderedList")
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Numbered
          </button>
        </div>

        <div className="flex items-center gap-1 border-l pl-2 ml-2 border-border">
          <span className="text-xs text-muted-foreground mr-1">Blocks:</span>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("blockquote")
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Quote
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("codeBlock")
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Code
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded bg-muted ${
              isHtmlMode
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-secondary"
            }`}
          >
            HR
          </button>
        </div>

        <div className="flex items-center gap-1 border-l pl-2 ml-2 border-border">
          <span className="text-xs text-muted-foreground mr-1">Text:</span>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive({ textAlign: "left" })
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Left
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive({ textAlign: "center" })
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Center
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive({ textAlign: "right" })
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Right
          </button>
        </div>

        <div className="flex items-center gap-1 border-l pl-2 ml-2 border-border">
          <span className="text-xs text-muted-foreground mr-1">Links:</span>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={setLink}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("link")
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${isHtmlMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Add Link
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={removeLink}
            disabled={isHtmlMode || !editor.isActive("link")}
            className={`px-3 py-1 text-sm rounded bg-muted ${
              isHtmlMode || !editor.isActive("link")
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-secondary"
            }`}
          >
            Remove Link
          </button>
        </div>

        <div
          className="relative border-l pl-2 ml-2 border-border"
          ref={emojiPickerRef}
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded bg-muted hover:bg-secondary ${
              isHtmlMode ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Emoji
          </button>

          {isEmojiPickerOpen && !isHtmlMode && (
            <div className="absolute top-full left-0 mt-2 z-40 shadow-lg">
              <EmojiPicker
                onEmojiClick={(emojiData) => insertEmoji(emojiData.emoji)}
                theme={Theme.AUTO}
                lazyLoadEmojis
                width={320}
                height={400}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 border-l pl-2 ml-2 border-border">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertYoutube}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded bg-muted hover:bg-secondary ${
              isHtmlMode ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            YouTube
          </button>
        </div>

        <div className="relative border-l pl-2 ml-2 border-border">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={openImageManager}
            disabled={isHtmlMode}
            className={`px-3 py-1 text-sm rounded bg-muted hover:bg-secondary ${
              isHtmlMode ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Upload / Choose Image
          </button>
        </div>

        <div className="relative border-l pl-2 ml-2 border-border">
          <button
            type="button"
            onClick={handleToggleHtmlMode}
            className="px-3 py-1 text-sm rounded bg-muted hover:bg-secondary"
          >
            {isHtmlMode ? "Visual View" : "HTML View"}
          </button>
        </div>
      </div>

      {isHtmlMode ? (
        <textarea
          value={htmlValue}
          onChange={handleHtmlChange}
          className="min-h-[300px] w-full rounded-md border p-4 font-mono text-sm focus:outline-none"
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      {isImageManagerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-4xl rounded-lg border shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Image Library</h2>

              <button
                type="button"
                onClick={() => {
                  setSelectedGalleryImages([]);
                  setIsImageManagerOpen(false);
                }}
                className="px-3 py-1 rounded bg-muted hover:bg-secondary"
              >
                Close
              </button>
            </div>

            <div className="mb-4 flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />

              {uploadingImage && (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              )}
            </div>

            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => insertImageGallery(selectedGalleryImages)}
                disabled={selectedGalleryImages.length === 0}
                className={`px-3 py-2 rounded text-sm ${
                  selectedGalleryImages.length === 0
                    ? "bg-muted opacity-50 cursor-not-allowed"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                Insert Gallery ({selectedGalleryImages.length})
              </button>

              {selectedGalleryImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedGalleryImages([])}
                  className="px-3 py-2 rounded text-sm bg-muted hover:bg-secondary"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {loadingImages ? (
              <p className="text-sm text-muted-foreground">Loading images...</p>
            ) : images.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No images found in the bucket.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
                {images.map((image) => {
                  const isSelected = selectedGalleryImages.some(
                    (item) => item.path === image.path,
                  );

                  return (
                    <div
                      key={image.path}
                      className={`border rounded-md p-2 ${
                        isSelected ? "ring-2 ring-primary bg-muted" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      <p className="text-xs mt-2 mb-2 truncate">{image.name}</p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => insertImage(image.url, image.name)}
                          className="flex-1 px-2 py-1 text-xs rounded bg-muted hover:bg-secondary"
                        >
                          Insert Image
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleGalleryImageSelection(image)}
                          className={`flex-1 px-2 py-1 text-xs rounded ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-secondary"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
