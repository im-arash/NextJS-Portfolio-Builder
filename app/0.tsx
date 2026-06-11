// "use client";

// import { useState, useRef, type FormEvent, type TouchEvent } from "react";

// // import RichTextEditor from "@/components/RichTextEditor";
// import RichTextEditor from "@/components/editor/rich-text-editor";
// import { createClient } from "@/utils/supabase/client";

// type Project = {
//   id: string | number;
//   title: string;
//   description: string;
//   category: string;
//   project_year: number | null;
//   sort_order: number;
// };

// export default function ProjectsList({
//   projects: initialProjects,
//   isAdmin,
// }: {
//   projects: Project[];
//   isAdmin: boolean;
// }) {
//   const supabase = createClient();

//   const [projects, setProjects] = useState<Project[]>(initialProjects);
//   const [selectedProject, setSelectedProject] = useState<Project | null>(
//     initialProjects?.[0] ?? null,
//   );

//   const [isEditing, setIsEditing] = useState(false);
//   const [showLogin, setShowLogin] = useState(false);
//   const [isNewProject, setIsNewProject] = useState(false);
//   const [draggedProjectId, setDraggedProjectId] = useState<
//     string | number | null
//   >(null);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   const touchStartX = useRef<number | null>(null);
//   const touchEndX = useRef<number | null>(null);

//   const [title, setTitle] = useState(selectedProject?.title || "");
//   const [description, setDescription] = useState(
//     selectedProject?.description || "",
//   );
//   const [category, setCategory] = useState(selectedProject?.category || "");
//   const [projectYear, setProjectYear] = useState(
//     selectedProject?.project_year?.toString() ||
//       new Date().getFullYear().toString(),
//   );

//   const selectedIndex = selectedProject
//     ? projects.findIndex((p) => p.id === selectedProject.id)
//     : -1;

//   const previousProject =
//     selectedIndex > 0 ? projects[selectedIndex - 1] : null;
//   const nextProject =
//     selectedIndex >= 0 && selectedIndex < projects.length - 1
//       ? projects[selectedIndex + 1]
//       : null;

//   function selectProject(project: Project) {
//     setSelectedProject(project);
//     setIsEditing(false);
//     setShowLogin(false);
//     setIsNewProject(false);
//     setTitle(project.title);
//     setDescription(project.description);
//     setCategory(project.category);
//     setProjectYear(project.project_year?.toString() || "");
//     setIsSidebarOpen(false);
//   }

//   function goToPreviousProject() {
//     if (previousProject) selectProject(previousProject);
//   }

//   function goToNextProject() {
//     if (nextProject) selectProject(nextProject);
//   }

//   function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
//     touchStartX.current = e.changedTouches[0].clientX;
//     touchEndX.current = null;
//   }

//   function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
//     touchEndX.current = e.changedTouches[0].clientX;

//     if (
//       touchStartX.current === null ||
//       touchEndX.current === null ||
//       isEditing ||
//       showLogin ||
//       isSidebarOpen
//     ) {
//       return;
//     }

//     const distance = touchStartX.current - touchEndX.current;
//     const swipeThreshold = 60;

//     if (distance > swipeThreshold) {
//       goToNextProject();
//     } else if (distance < -swipeThreshold) {
//       goToPreviousProject();
//     }
//   }

//   async function persistProjectOrder(reorderedProjects: Project[]) {
//     const updates = reorderedProjects.map((project, index) => ({
//       ...project,
//       sort_order: index + 1,
//     }));

//     setProjects(updates);

//     if (selectedProject) {
//       const updatedSelected =
//         updates.find((p) => p.id === selectedProject.id) ?? selectedProject;
//       setSelectedProject(updatedSelected);
//     }

//     for (const project of updates) {
//       const { error } = await supabase
//         .from("projects")
//         .update({ sort_order: project.sort_order })
//         .eq("id", project.id);

//       if (error) {
//         console.error(error);
//         alert("Failed to update project order");
//         return;
//       }
//     }
//   }

//   async function handleDrop(targetProject: Project) {
//     if (!draggedProjectId || draggedProjectId === targetProject.id) return;

//     const reorderedProjects = [...projects];
//     const draggedIndex = reorderedProjects.findIndex(
//       (p) => p.id === draggedProjectId,
//     );
//     const targetIndex = reorderedProjects.findIndex(
//       (p) => p.id === targetProject.id,
//     );

//     if (draggedIndex === -1 || targetIndex === -1) return;

//     const [draggedProject] = reorderedProjects.splice(draggedIndex, 1);
//     reorderedProjects.splice(targetIndex, 0, draggedProject);

//     await persistProjectOrder(reorderedProjects);
//     setDraggedProjectId(null);
//   }

//   async function addNewProject() {
//     const currentYear = new Date().getFullYear();

//     const nextSortOrder =
//       projects.length > 0
//         ? Math.max(...projects.map((p) => p.sort_order || 0)) + 1
//         : 1;

//     const newProject = {
//       title: "Untitled Project",
//       description: "",
//       category: "",
//       project_year: currentYear,
//       sort_order: nextSortOrder,
//     };

//     const { data, error } = await supabase
//       .from("projects")
//       .insert(newProject)
//       .select()
//       .single();

//     if (error) {
//       console.error(error);
//       alert("Failed to create project");
//       return;
//     }

//     setProjects((prev) => [...prev, data]);

//     setSelectedProject(data);
//     setTitle(data.title);
//     setDescription(data.description || "");
//     setCategory(data.category || "");
//     setProjectYear(data.project_year?.toString() || currentYear.toString());

//     setShowLogin(false);
//     setIsEditing(true);
//     setIsNewProject(true);
//   }

//   async function saveProject() {
//     if (!selectedProject) return;

//     const parsedYear = Number(projectYear);

//     const { error } = await supabase
//       .from("projects")
//       .update({
//         title,
//         description,
//         category,
//         project_year: parsedYear,
//       })
//       .eq("id", selectedProject.id);

//     if (error) {
//       console.error(error);
//       alert("Failed to save project");
//       return;
//     }

//     const updated = {
//       ...selectedProject,
//       title,
//       description,
//       category,
//       project_year: parsedYear,
//     };

//     setSelectedProject(updated);
//     setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

//     setIsEditing(false);
//     setIsNewProject(false);
//   }

//   async function cancelEditing() {
//     if (!selectedProject) {
//       setIsEditing(false);
//       return;
//     }

//     if (isNewProject) {
//       const { error } = await supabase
//         .from("projects")
//         .delete()
//         .eq("id", selectedProject.id);

//       if (error) {
//         console.error(error);
//         alert("Failed to remove new project");
//         return;
//       }

//       const updatedProjects = projects.filter(
//         (p) => p.id !== selectedProject.id,
//       );
//       setProjects(updatedProjects);

//       const nextProject = updatedProjects[updatedProjects.length - 1] ?? null;
//       setSelectedProject(nextProject);

//       if (nextProject) {
//         setTitle(nextProject.title);
//         setDescription(nextProject.description);
//         setCategory(nextProject.category);
//         setProjectYear(nextProject.project_year?.toString() || "");
//       } else {
//         setTitle("");
//         setDescription("");
//         setCategory("");
//         setProjectYear(new Date().getFullYear().toString());
//       }

//       setIsEditing(false);
//       setIsNewProject(false);
//       return;
//     }

//     setTitle(selectedProject.title);
//     setDescription(selectedProject.description);
//     setCategory(selectedProject.category);
//     setProjectYear(selectedProject.project_year?.toString() || "");
//     setIsEditing(false);
//   }

//   async function deleteProject() {
//     if (!selectedProject) return;

//     const confirmed = window.confirm("Delete this project?");
//     if (!confirmed) return;

//     const { error } = await supabase
//       .from("projects")
//       .delete()
//       .eq("id", selectedProject.id);

//     if (error) {
//       console.error(error);
//       alert("Failed to delete project");
//       return;
//     }

//     const updatedProjects = projects.filter((p) => p.id !== selectedProject.id);

//     const reindexedProjects = updatedProjects.map((project, index) => ({
//       ...project,
//       sort_order: index + 1,
//     }));

//     setProjects(reindexedProjects);

//     for (const project of reindexedProjects) {
//       const { error: reorderError } = await supabase
//         .from("projects")
//         .update({ sort_order: project.sort_order })
//         .eq("id", project.id);

//       if (reorderError) {
//         console.error(reorderError);
//         alert("Failed to reindex project order");
//         return;
//       }
//     }

//     const nextProject = reindexedProjects[reindexedProjects.length - 1] ?? null;
//     setSelectedProject(nextProject);

//     if (nextProject) {
//       setTitle(nextProject.title);
//       setDescription(nextProject.description);
//       setCategory(nextProject.category);
//       setProjectYear(nextProject.project_year?.toString() || "");
//     } else {
//       setTitle("");
//       setDescription("");
//       setCategory("");
//       setProjectYear(new Date().getFullYear().toString());
//     }

//     setIsEditing(false);
//     setIsNewProject(false);
//   }

//   async function logout() {
//     await supabase.auth.signOut();
//     window.location.reload();
//   }

//   return (
//     <div className="relative flex w-full h-screen bg-background text-foreground overflow-hidden">
//       <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[#e4dcd6] text-black border-b border-black/20">
//         <p>Arash Estronzo</p>
//         <button
//           onClick={() => setIsSidebarOpen((prev) => !prev)}
//           className="text-sm underline"
//         >
//           {isSidebarOpen ? "Close" : "Menu"}
//         </button>
//       </div>

//       {isSidebarOpen && (
//         <div
//           className="md:hidden fixed inset-0 z-30 bg-black/40"
//           onClick={() => setIsSidebarOpen(false)}
//         />
//       )}

//       <aside
//         className={`
//           fixed top-0 left-0 z-40 h-screen w-[85vw] max-w-sm
//           border-r border-border bg-[#e4dcd6] text-black
//           pr-6 pl-4 transition-transform duration-300
//           md:static md:z-auto md:h-screen md:w-1/3 md:translate-x-0 md:pr-10
//           ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
//         `}
//       >
//         <div className="pt-20 md:pt-8 pb-10 md:pb-32 flex justify-between items-center">
//           <p>Arash Estronzo</p>

//           {!isAdmin ? (
//             <button
//               onClick={() => setShowLogin(true)}
//               className="text-sm underline cursor-pointer"
//             >
//               Login
//             </button>
//           ) : (
//             <button
//               onClick={logout}
//               className="text-sm underline cursor-pointer"
//             >
//               Logout
//             </button>
//           )}
//         </div>

//         <h2 className="pb-8 text-2xl">Innovative Digital Solutions</h2>

//         <hr className="border-t border-black/20" />

//         <ul className="pt-8">
//           {projects?.map((project) => (
//             <li
//               key={project.id}
//               draggable={isAdmin}
//               onDragStart={() => {
//                 if (isAdmin) setDraggedProjectId(project.id);
//               }}
//               onDragOver={(e) => {
//                 if (isAdmin) e.preventDefault();
//               }}
//               onDrop={() => {
//                 if (isAdmin) handleDrop(project);
//               }}
//               onDragEnd={() => setDraggedProjectId(null)}
//               onClick={() => selectProject(project)}
//               className={`flex items-center cursor-pointer py-2 ${
//                 selectedProject?.id === project.id ? "font-semibold" : ""
//               }`}
//             >
//               <p className="underline underline-offset-8 decoration-taupe-400/50">
//                 {project.title}
//               </p>

//               <div className="ml-auto flex gap-4 md:gap-8">
//                 <p className="bg-taupe-400/50 rounded-full px-2 py-1 text-sm text-black/70">
//                   {project.category}
//                 </p>

//                 <p className="bg-taupe-400/50 rounded-full px-2 py-1 text-sm text-black/70">
//                   {project.project_year ?? ""}
//                 </p>
//               </div>
//             </li>
//           ))}

//           {isAdmin && (
//             <li
//               onClick={addNewProject}
//               className="flex items-center cursor-pointer py-2 text-sm underline"
//             >
//               + Add new
//             </li>
//           )}
//         </ul>
//       </aside>

//       <div
//         className="w-full h-screen bg-card text-card-foreground pt-20 md:pt-10 p-4 md:p-10 overflow-y-auto"
//         onTouchStart={handleTouchStart}
//         onTouchEnd={handleTouchEnd}
//       >
//         {showLogin && !isAdmin && (
//           <div className="flex items-center justify-center h-full">
//             <InlineLogin onSuccess={() => window.location.reload()} />
//           </div>
//         )}

//         {!showLogin && selectedProject && !isEditing && (
//           <>
//             <div className="flex items-center justify-between mb-4">
//               <h1 className="text-3xl">{selectedProject.title}</h1>

//               {isAdmin && (
//                 <button
//                   onClick={() => setIsEditing(true)}
//                   className="text-sm underline"
//                 >
//                   Edit
//                 </button>
//               )}
//             </div>

//             <div className="mb-6 flex gap-3">
//               <p className="bg-taupe-400/50 rounded-full px-3 py-1 text-sm text-black/70">
//                 {selectedProject.category}
//               </p>
//               <p className="bg-taupe-400/50 rounded-full px-3 py-1 text-sm text-black/70">
//                 {selectedProject.project_year ?? ""}
//               </p>
//             </div>

//             <div
//               className="rich-content prose prose-sm sm:prose-base max-w-none"
//               dangerouslySetInnerHTML={{
//                 __html: selectedProject.description || "",
//               }}
//             />

//             <div className="mt-10 flex items-center justify-between md:hidden">
//               <button
//                 onClick={goToPreviousProject}
//                 disabled={!previousProject}
//                 aria-label="Previous project"
//                 className="text-lg opacity-40 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
//               >
//                 &lt;
//               </button>

//               <button
//                 onClick={goToNextProject}
//                 disabled={!nextProject}
//                 aria-label="Next project"
//                 className="text-lg opacity-40 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
//               >
//                 &gt;
//               </button>
//             </div>
//           </>
//         )}

//         {!showLogin && selectedProject && isEditing && (
//           <div className="space-y-6 w-full">
//             <div className="flex justify-between items-center">
//               <h1 className="text-3xl">Editing</h1>

//               <button onClick={cancelEditing} className="text-sm underline">
//                 Cancel
//               </button>
//             </div>

//             <input
//               value={title}
//               onChange={(e) => {
//                 const newTitle = e.target.value;
//                 setTitle(newTitle);

//                 if (selectedProject) {
//                   setProjects((prev) =>
//                     prev.map((p) =>
//                       p.id === selectedProject.id
//                         ? { ...p, title: newTitle }
//                         : p,
//                     ),
//                   );

//                   setSelectedProject((prev) =>
//                     prev ? { ...prev, title: newTitle } : prev,
//                   );
//                 }
//               }}
//               className="w-full border p-2 rounded bg-background"
//               placeholder="Project title"
//             />

//             <input
//               value={category}
//               onChange={(e) => {
//                 const newCategory = e.target.value;
//                 setCategory(newCategory);

//                 if (selectedProject) {
//                   setProjects((prev) =>
//                     prev.map((p) =>
//                       p.id === selectedProject.id
//                         ? { ...p, category: newCategory }
//                         : p,
//                     ),
//                   );

//                   setSelectedProject((prev) =>
//                     prev ? { ...prev, category: newCategory } : prev,
//                   );
//                 }
//               }}
//               className="w-full border p-2 rounded bg-background"
//               placeholder="Category"
//             />

//             <select
//               value={projectYear}
//               onChange={(e) => {
//                 const newYear = e.target.value;
//                 setProjectYear(newYear);

//                 if (selectedProject) {
//                   setProjects((prev) =>
//                     prev.map((p) =>
//                       p.id === selectedProject.id
//                         ? { ...p, project_year: Number(newYear) }
//                         : p,
//                     ),
//                   );

//                   setSelectedProject((prev) =>
//                     prev ? { ...prev, project_year: Number(newYear) } : prev,
//                   );
//                 }
//               }}
//               className="w-full border p-2 rounded bg-background"
//             >
//               {Array.from({ length: 30 }, (_, i) => {
//                 const year = (new Date().getFullYear() - i).toString();
//                 return (
//                   <option key={year} value={year}>
//                     {year}
//                   </option>
//                 );
//               })}
//             </select>

//             <RichTextEditor
//               value={description}
//               onChange={setDescription}
//               bucketName="portfolio-images"
//             />

//             <div className="flex gap-3">
//               <button
//                 onClick={saveProject}
//                 className="px-4 py-2 bg-black text-white rounded"
//               >
//                 Save
//               </button>

//               <button
//                 onClick={deleteProject}
//                 className="px-4 py-2 bg-red-600 text-white rounded"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// /* --------------------------
//    INLINE LOGIN COMPONENT
// -------------------------- */

// function InlineLogin({ onSuccess }: { onSuccess: () => void }) {
//   const supabase = createClient();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   async function handleLogin(e: FormEvent) {
//     e.preventDefault();

//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) {
//       alert(error.message);
//       return;
//     }

//     onSuccess();
//   }

//   return (
//     <form onSubmit={handleLogin} className="max-w-md space-y-4">
//       <h1 className="text-3xl">Admin Login</h1>

//       <input
//         type="email"
//         placeholder="Email"
//         required
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         className="w-full border p-2 rounded"
//       />

//       <input
//         type="password"
//         placeholder="Password"
//         required
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//         className="w-full border p-2 rounded"
//       />

//       <button className="px-4 py-2 bg-black text-white rounded">Login</button>
//     </form>
//   );
// }
