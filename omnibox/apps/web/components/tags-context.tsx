"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { v4 as uuid } from "uuid";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagsCtx {
  tags: Tag[];
  addTag: (name: string, color: string) => void;
  updateTag: (id: string, data: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
}

const TagsContext = createContext<TagsCtx | undefined>(undefined);

export function TagsProvider({ children }: { children: ReactNode }) {
  const [tags, setTags] = useState<Tag[]>([
    { id: "vip", name: "VIP", color: "#f87171" },
    { id: "new", name: "New Client", color: "#60a5fa" },
  ]);

  const addTag = (name: string, color: string) =>
    setTags((t) => [...t, { id: uuid(), name, color }]);
  const updateTag = (id: string, data: Partial<Tag>) =>
    setTags((t) => t.map((tag) => (tag.id === id ? { ...tag, ...data } : tag)));
  const deleteTag = (id: string) =>
    setTags((t) => t.filter((tag) => tag.id !== id));

  return (
    <TagsContext.Provider value={{ tags, addTag, updateTag, deleteTag }}>
      {children}
    </TagsContext.Provider>
  );
}

export function useTags() {
  const ctx = useContext(TagsContext);
  if (!ctx) throw new Error("useTags must be inside TagsProvider");
  return ctx;
}
