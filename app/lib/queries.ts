// app/lib/queries.ts
import { supabase } from "./supabase";
import type { Card, Section } from "../types";

export async function getSections() {
  return await supabase
    .from("sections")
    .select("*")
    .order("order_index")
    .returns<Section[]>();
}

export async function getCards() {
  return await supabase
    .from("cards")
    .select("*")
    .order("section_id")
    .order("order_index")
    .returns<Card[]>();
}

export async function getSectionBySlug(slug: string) {
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("slug", slug)
    .single<Section>();

  return { data, error };
}

export async function getCardsBySectionSlug(slug: string) {
  const { data: section } = await supabase
    .from("sections")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!section) return [];

  const { data } = await supabase
    .from("cards")
    .select("*")
    .eq("section_id", section.id)
    .order("order_index")
    .returns<Card[]>();

  return data ?? [];
}
