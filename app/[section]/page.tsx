import { getSections } from "../lib/queries";

export const dynamicParams = false;

export async function generateStaticParams() {
  const { data: sections } = await getSections();

  return (sections ?? [])
    .filter((section) => typeof section.slug === "string" && section.slug.trim().length > 0)
    .map((section) => ({
      section: section.slug,
    }));
}

export default function Page() {
  return null;
}
