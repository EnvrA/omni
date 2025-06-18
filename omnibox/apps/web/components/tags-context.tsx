"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { v4 as uuid } from "uuid";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

type TagType = "clients" | "deals";

interface TagsCtx {
  get: (type: TagType) => Tag[];
  addTag: (type: TagType, name: string, color: string) => void;
  updateTag: (type: TagType, id: string, data: Partial<Tag>) => void;
  deleteTag: (type: TagType, id: string) => void;
}

const TagsContext = createContext<TagsCtx | undefined>(undefined);

export function TagsProvider({ children }: { children: ReactNode }) {
  const [clientTags, setClientTags] = useState<Tag[]>([
    { id: "vip", name: "VIP", color: "#f87171" },
    { id: "new", name: "New Client", color: "#60a5fa" },
  ]);
  const [dealTags, setDealTags] = useState<Tag[]>([
    { id: "low", name: "low priority", color: "#6b7280" },
    { id: "medium", name: "medium priority", color: "#facc15" },
    { id: "high", name: "high priority", color: "#ef4444" },
  ]);

  const getState = (type: TagType) =>
    type === "clients" ? clientTags : dealTags;
  const setState = (type: TagType) =>
    type === "clients" ? setClientTags : setDealTags;

  const addTag = (type: TagType, name: string, color: string) =>
    setState(type)((t) => [...t, { id: uuid(), name, color }]);
  const updateTag = (type: TagType, id: string, data: Partial<Tag>) =>
    setState(type)((t) =>
      t.map((tag) => (tag.id === id ? { ...tag, ...data } : tag)),
    );
  const deleteTag = (type: TagType, id: string) =>
    setState(type)((t) => t.filter((tag) => tag.id !== id));

  const value: TagsCtx = {
    get: getState,
    addTag,
    updateTag,
    deleteTag,
  };

  return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>;
}

export function useTags(type: TagType) {
  const ctx = useContext(TagsContext);
  if (!ctx) throw new Error("useTags must be inside TagsProvider");
  const tags = ctx.get(type);
  return {
    tags,
    addTag: (name: string, color: string) => ctx.addTag(type, name, color),
    updateTag: (id: string, data: Partial<Tag>) =>
      ctx.updateTag(type, id, data),
    deleteTag: (id: string) => ctx.deleteTag(type, id),
  };
}
