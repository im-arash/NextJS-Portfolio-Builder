"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Project } from "./types";

export default function ProjectsSidebar({
  projects,
  selectedProject,
  isAdmin,
  isSidebarOpen,
  setIsSidebarOpen,
  setShowLogin,
  onLogout,
  onSelectProject,
  onAddNewProject,
  onDragStart,
  onDrop,
  onDragEnd,
}: {
  projects: Project[];
  selectedProject: Project | null;
  isAdmin: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  setShowLogin: Dispatch<SetStateAction<boolean>>;
  onLogout: () => void;
  onSelectProject: (project: Project) => void;
  onAddNewProject: () => void;
  onDragStart: (id: string | number | null) => void;
  onDrop: (project: Project) => void;
  onDragEnd: () => void;
}) {
  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[#e4dcd6] text-black border-b border-black/20">
        <p>John Doe</p>
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="text-sm underline"
        >
          {isSidebarOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-[85vw]
          border-r border-border bg-[#e4dcd6] text-black
          pr-6 pl-4 transition-transform duration-300
          md:static md:z-auto md:h-screen md:w-1/3 md:translate-x-0 md:pr-10
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="pt-20 md:pt-8 pb-10 md:pb-32 flex justify-between items-center">
          <p>John Doe</p>

          {!isAdmin ? (
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm underline cursor-pointer"
            >
              Login
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="text-sm underline cursor-pointer"
            >
              Logout
            </button>
          )}
        </div>

        <h2 className="pb-8 text-2xl">Building innovative digital solutions.</h2>

        <hr className="border-t border-black/20" />

        <ul className="pt-8">
          {projects.map((project) => (
            <li
              key={project.id}
              draggable={isAdmin}
              onDragStart={() => {
                if (isAdmin) onDragStart(project.id);
              }}
              onDragOver={(e) => {
                if (isAdmin) e.preventDefault();
              }}
              onDrop={() => {
                if (isAdmin) onDrop(project);
              }}
              onDragEnd={onDragEnd}
              onClick={() => onSelectProject(project)}
              className={`flex items-center cursor-pointer py-2 ${
                selectedProject?.id === project.id ? "font-semibold" : ""
              }`}
            >
              <p className="underline underline-offset-8 decoration-taupe-400/50">
                {project.title}
              </p>

              <div className="ml-auto flex gap-4 md:gap-8">
                <p className="h-5 leading-none flex items-center justify-center text-center bg-taupe-400/30 rounded-full px-2 text-sm text-black/50">
                  {project.category}
                </p>

                <p className="h-5 min-w-[40px] leading-none flex items-center justify-center text-center bg-taupe-400/30 rounded-full px-2 text-sm text-black/50">
                  {project.project_year ?? ""}
                </p>
              </div>
            </li>
          ))}

          {isAdmin && (
            <li
              onClick={onAddNewProject}
              className="text-center cursor-pointer mt-8 bg-taupe-400/20 rounded-full px-2 py-1 text-sm text-black/70"
            >
              +
            </li>
          )}
        </ul>
      </aside>
    </>
  );
}
