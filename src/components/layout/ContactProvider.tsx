"use client";

import { createContext, useContext } from "react";
import { buildContact, defaultContact, type Contact } from "@/data/contact";

type Site = { contact: Contact; /** Slugs of menu entries that are switched on, or null to show everything. */ menus: string[] | null };

const Ctx = createContext<Site>({ contact: buildContact(defaultContact), menus: null });

/** Hands the site settings loaded on the server to every client component. */
export function ContactProvider({ contact, menus, children }: Site & { children: React.ReactNode }) {
  return <Ctx value={{ contact, menus }}>{children}</Ctx>;
}

export const useContact = () => useContext(Ctx).contact;
export const useMenus = () => useContext(Ctx).menus;
