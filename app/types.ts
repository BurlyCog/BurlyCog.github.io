export type Section = {
  id: string;
  name: string;
  slug: string;
  order_index: number;
};

export type Link = {
  label: string;
  url: string;
};

export type Card = {
  id: string;
  section_id: string;
  type: "project" | "painting" | string | null;

  order_index: number;

  title: string;
  subtitle?: string | null;

  description?: string | null;

  points?: string[] | null;
  tags?: string[] | null;

  links?: Link[] | Link | null;

  image_url?: string | null;

  audio_url?: string | null;
  audio_length?: string | null;
  created_at?: string;
};
