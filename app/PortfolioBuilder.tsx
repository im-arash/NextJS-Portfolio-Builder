"use client";

import { useRef, useState, type TouchEvent } from "react";

import InlineLogin from "@/components/projects/InlineLogin";
import ProjectDetail from "@/components/projects/ProjectDetail";
import ProjectEditor from "@/components/projects/ProjectEditor";
import ProjectsSidebar from "@/components/projects/ProjectsSidebar";
import type { Project } from "@/components/projects/types";
import { createClient } from "@/utils/supabase/client";

export default function PortfolioBuilder({
  projects: initialProjects,
  isAdmin,
}: {
  projects: Project[];
  isAdmin: boolean;
}) {
  const supabase = createClient();

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    initialProjects?.[0] ?? null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isNewProject, setIsNewProject] = useState(false);
  const [draggedProjectId, setDraggedProjectId] = useState<
    string | number | null
  >(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const [title, setTitle] = useState(selectedProject?.title || "");
  const [description, setDescription] = useState(
    selectedProject?.description || "",
  );
  const [category, setCategory] = useState(selectedProject?.category || "");
  const [projectYear, setProjectYear] = useState(
    selectedProject?.project_year?.toString() ||
      new Date().getFullYear().toString(),
  );

  const selectedIndex = selectedProject
    ? projects.findIndex((p) => p.id === selectedProject.id)
    : -1;

  const previousProject =
    selectedIndex > 0 ? projects[selectedIndex - 1] : null;
  const nextProject =
    selectedIndex >= 0 && selectedIndex < projects.length - 1
      ? projects[selectedIndex + 1]
      : null;

  function syncEditorFromProject(project: Project | null) {
    if (!project) {
      setTitle("");
      setDescription("");
      setCategory("");
      setProjectYear(new Date().getFullYear().toString());
      return;
    }

    setTitle(project.title);
    setDescription(project.description || "");
    setCategory(project.category || "");
    setProjectYear(project.project_year?.toString() || "");
  }

  function selectProject(project: Project) {
    setSelectedProject(project);
    setIsEditing(false);
    setShowLogin(false);
    setIsNewProject(false);
    syncEditorFromProject(project);
    setIsSidebarOpen(false);
  }

  function goToPreviousProject() {
    if (previousProject) selectProject(previousProject);
  }

  function goToNextProject() {
    if (nextProject) selectProject(nextProject);
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.changedTouches[0].clientX;
    touchEndX.current = null;
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    touchEndX.current = e.changedTouches[0].clientX;

    if (
      touchStartX.current === null ||
      touchEndX.current === null ||
      isEditing ||
      showLogin ||
      isSidebarOpen
    ) {
      return;
    }

    const distance = touchStartX.current - touchEndX.current;
    const swipeThreshold = 60;

    if (distance > swipeThreshold) {
      goToNextProject();
    } else if (distance < -swipeThreshold) {
      goToPreviousProject();
    }
  }

  async function persistProjectOrder(reorderedProjects: Project[]) {
    const updates = reorderedProjects.map((project, index) => ({
      ...project,
      sort_order: index + 1,
    }));

    setProjects(updates);

    if (selectedProject) {
      const updatedSelected =
        updates.find((p) => p.id === selectedProject.id) ?? selectedProject;
      setSelectedProject(updatedSelected);
    }

    for (const project of updates) {
      const { error } = await supabase
        .from("projects")
        .update({ sort_order: project.sort_order })
        .eq("id", project.id);

      if (error) {
        console.error(error);
        alert("Failed to update project order");
        return;
      }
    }
  }

  async function handleDrop(targetProject: Project) {
    if (!draggedProjectId || draggedProjectId === targetProject.id) return;

    const reorderedProjects = [...projects];
    const draggedIndex = reorderedProjects.findIndex(
      (p) => p.id === draggedProjectId,
    );
    const targetIndex = reorderedProjects.findIndex(
      (p) => p.id === targetProject.id,
    );

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedProject] = reorderedProjects.splice(draggedIndex, 1);
    reorderedProjects.splice(targetIndex, 0, draggedProject);

    await persistProjectOrder(reorderedProjects);
    setDraggedProjectId(null);
  }

  async function addNewProject() {
    const currentYear = new Date().getFullYear();

    const nextSortOrder =
      projects.length > 0
        ? Math.max(...projects.map((p) => p.sort_order || 0)) + 1
        : 1;

    const newProject = {
      title: "Untitled Project",
      description: "",
      category: "",
      project_year: currentYear,
      sort_order: nextSortOrder,
    };

    const { data, error } = await supabase
      .from("projects")
      .insert(newProject)
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Failed to create project");
      return;
    }

    setProjects((prev) => [...prev, data]);
    setSelectedProject(data);
    syncEditorFromProject(data);

    setShowLogin(false);
    setIsEditing(true);
    setIsNewProject(true);
    setIsSidebarOpen(false);
  }

  async function saveProject() {
    if (!selectedProject) return;

    const parsedYear = Number(projectYear);

    const { error } = await supabase
      .from("projects")
      .update({
        title,
        description,
        category,
        project_year: parsedYear,
      })
      .eq("id", selectedProject.id);

    if (error) {
      console.error(error);
      alert("Failed to save project");
      return;
    }

    const updated = {
      ...selectedProject,
      title,
      description,
      category,
      project_year: parsedYear,
    };

    setSelectedProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setIsEditing(false);
    setIsNewProject(false);
  }

  async function cancelEditing() {
    if (!selectedProject) {
      setIsEditing(false);
      return;
    }

    if (isNewProject) {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", selectedProject.id);

      if (error) {
        console.error(error);
        alert("Failed to remove new project");
        return;
      }

      const updatedProjects = projects.filter(
        (p) => p.id !== selectedProject.id,
      );
      setProjects(updatedProjects);

      const nextSelected = updatedProjects[updatedProjects.length - 1] ?? null;
      setSelectedProject(nextSelected);
      syncEditorFromProject(nextSelected);

      setIsEditing(false);
      setIsNewProject(false);
      return;
    }

    syncEditorFromProject(selectedProject);
    setIsEditing(false);
  }

  async function deleteProject() {
    if (!selectedProject) return;

    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", selectedProject.id);

    if (error) {
      console.error(error);
      alert("Failed to delete project");
      return;
    }

    const updatedProjects = projects.filter((p) => p.id !== selectedProject.id);

    const reindexedProjects = updatedProjects.map((project, index) => ({
      ...project,
      sort_order: index + 1,
    }));

    setProjects(reindexedProjects);

    for (const project of reindexedProjects) {
      const { error: reorderError } = await supabase
        .from("projects")
        .update({ sort_order: project.sort_order })
        .eq("id", project.id);

      if (reorderError) {
        console.error(reorderError);
        alert("Failed to reindex project order");
        return;
      }
    }

    const nextSelected =
      reindexedProjects[reindexedProjects.length - 1] ?? null;
    setSelectedProject(nextSelected);
    syncEditorFromProject(nextSelected);

    setIsEditing(false);
    setIsNewProject(false);
  }

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);

    if (selectedProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id ? { ...p, title: newTitle } : p,
        ),
      );

      setSelectedProject((prev) =>
        prev ? { ...prev, title: newTitle } : prev,
      );
    }
  }

  function handleCategoryChange(newCategory: string) {
    setCategory(newCategory);

    if (selectedProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id ? { ...p, category: newCategory } : p,
        ),
      );

      setSelectedProject((prev) =>
        prev ? { ...prev, category: newCategory } : prev,
      );
    }
  }

  function handleProjectYearChange(newYear: string) {
    setProjectYear(newYear);

    if (selectedProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id
            ? { ...p, project_year: Number(newYear) }
            : p,
        ),
      );

      setSelectedProject((prev) =>
        prev ? { ...prev, project_year: Number(newYear) } : prev,
      );
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <div className="relative flex w-full h-screen bg-background text-foreground overflow-hidden">
      <ProjectsSidebar
        projects={projects}
        selectedProject={selectedProject}
        isAdmin={isAdmin}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        setShowLogin={setShowLogin}
        onLogout={logout}
        onSelectProject={selectProject}
        onAddNewProject={addNewProject}
        onDragStart={setDraggedProjectId}
        onDrop={handleDrop}
        onDragEnd={() => setDraggedProjectId(null)}
      />

      <div
        className="w-full h-screen bg-card text-card-foreground pt-20 md:pt-10 p-4 md:p-10 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {showLogin && !isAdmin && (
          <div className="flex items-center justify-center h-full">
            <InlineLogin onSuccess={() => window.location.reload()} />
          </div>
        )}

        {!showLogin && selectedProject && !isEditing && (
          <ProjectDetail
            project={selectedProject}
            isAdmin={isAdmin}
            previousProject={previousProject}
            nextProject={nextProject}
            onEdit={() => setIsEditing(true)}
            onPrevious={goToPreviousProject}
            onNext={goToNextProject}
          />
        )}

        {!showLogin && selectedProject && isEditing && (
          <ProjectEditor
            selectedProject={selectedProject}
            title={title}
            description={description}
            category={category}
            projectYear={projectYear}
            onTitleChange={handleTitleChange}
            onDescriptionChange={setDescription}
            onCategoryChange={handleCategoryChange}
            onProjectYearChange={handleProjectYearChange}
            onSave={saveProject}
            onDelete={deleteProject}
            onCancel={cancelEditing}
          />
        )}
      </div>
    </div>
  );
}
