"use client";

import RichTextEditor from "@/components/editor/RichTextEditor";
import type { Project } from "./types";

export default function ProjectEditor({
  selectedProject,
  title,
  description,
  category,
  projectYear,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onProjectYearChange,
  onSave,
  onDelete,
  onCancel,
}: {
  selectedProject: Project;
  title: string;
  description: string;
  category: string;
  projectYear: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onProjectYearChange: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl">Editing</h1>

        <button onClick={onCancel} className="text-sm underline">
          Cancel
        </button>
      </div>

      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="w-full border p-2 rounded bg-background"
        placeholder="Project title"
      />

      <input
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-full border p-2 rounded bg-background"
        placeholder="Category"
      />

      <select
        value={projectYear}
        onChange={(e) => onProjectYearChange(e.target.value)}
        className="w-full border p-2 rounded bg-background"
      >
        {Array.from({ length: 30 }, (_, i) => {
          const year = (new Date().getFullYear() - i).toString();
          return (
            <option key={year} value={year}>
              {year}
            </option>
          );
        })}
      </select>

      <RichTextEditor value={description} onChange={onDescriptionChange} />

      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Save
        </button>

        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
