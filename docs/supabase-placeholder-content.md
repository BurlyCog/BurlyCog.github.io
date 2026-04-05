# Supabase Placeholder Content

The UI is fully data-driven.

- No `sections` rows means the sidebar is empty.
- No `cards` rows for a section means that section shows an empty checkerboard state.
- Card order comes from `cards.order_index`.
- Section order comes from `sections.order_index`.

## 1. Add Placeholder Sections

Run this in the Supabase SQL editor:

```sql
insert into sections (name, slug, order_index)
values
  ('About', 'about', 1),
  ('Projects', 'projects', 2),
  ('Experience', 'experience', 3),
  ('Achievements', 'achievements', 4);
```

## 2. Add Placeholder Cards

This version lets you control card placement manually through `order_index`.

The examples below add a few starter cards across the default sections.

```sql
insert into cards (
  section_id,
  type,
  order_index,
  title,
  subtitle,
  description,
  points,
  tags,
  links,
  image_url,
  audio_url,
  audio_length
)
select
  s.id,
  seed.type,
  seed.order_index,
  seed.title,
  seed.subtitle,
  seed.description,
  seed.points,
  seed.tags,
  seed.links,
  seed.image_url,
  seed.audio_url,
  seed.audio_length
from sections s
join (
  values
    (
      'about',
      'project',
      1,
      'Overview',
      'Intro',
      'Short introduction card for the about section.',
      array['Add a short summary here', 'Keep this one compact', 'Use order_index to move it'],
      array['about', 'intro'],
      jsonb_build_array(
        jsonb_build_object('label', 'Portfolio', 'url', 'https://example.com/about')
      ),
      null,
      null,
      null
    ),
    (
      'about',
      'project',
      2,
      'Background',
      'Story',
      'Placeholder card for biography, context, or creative approach.',
      array['Education or path', 'Design philosophy', 'What you focus on'],
      array['about', 'story'],
      '[]'::jsonb,
      null,
      null,
      null
    ),
    (
      'projects',
      'project',
      1,
      'Project One',
      'Case Study',
      'Primary project placeholder pulled from Supabase.',
      array['Problem', 'Process', 'Outcome'],
      array['project', 'featured'],
      jsonb_build_array(
        jsonb_build_object('label', 'Live', 'url', 'https://example.com/project-one'),
        jsonb_build_object('label', 'GitHub', 'url', 'https://github.com/example/project-one')
      ),
      null,
      null,
      '00:49'
    ),
    (
      'projects',
      'project',
      2,
      'Project Two',
      'System Design',
      'Second project placeholder card.',
      array['Research notes', 'Build decisions', 'Launch details'],
      array['project', 'system'],
      jsonb_build_array(
        jsonb_build_object('label', 'Docs', 'url', 'https://example.com/project-two')
      ),
      null,
      null,
      '01:12'
    ),
    (
      'projects',
      'project',
      3,
      'Project Three',
      'Experiment',
      'Third project placeholder card.',
      array['Prototype', 'Iteration', 'Final direction'],
      array['project', 'experimental'],
      '[]'::jsonb,
      null,
      null,
      null
    ),
    (
      'experience',
      'project',
      1,
      'Role One',
      'Experience',
      'Experience card placeholder.',
      array['Team context', 'Responsibilities', 'Key outcomes'],
      array['experience', 'role'],
      '[]'::jsonb,
      null,
      null,
      null
    ),
    (
      'experience',
      'project',
      2,
      'Role Two',
      'Studio / Company',
      'Another experience placeholder card.',
      array['Ownership area', 'Collaboration', 'Impact'],
      array['experience', 'work'],
      '[]'::jsonb,
      null,
      null,
      null
    ),
    (
      'achievements',
      'project',
      1,
      'Recognition One',
      'Award',
      'Achievement placeholder card.',
      array['Award name', 'Year', 'Context'],
      array['achievement', 'award'],
      '[]'::jsonb,
      null,
      null,
      null
    ),
    (
      'achievements',
      'project',
      2,
      'Recognition Two',
      'Milestone',
      'Second achievement placeholder card.',
      array['Publication', 'Exhibition', 'Talk or feature'],
      array['achievement', 'milestone'],
      '[]'::jsonb,
      null,
      null,
      null
    )
) as seed(
  section_slug,
  type,
  order_index,
  title,
  subtitle,
  description,
  points,
  tags,
  links,
  image_url,
  audio_url,
  audio_length
)
on s.slug = seed.section_slug;
```

Add more cards by repeating the insert with different `order_index` values.

## 3. Add An Art Card

If you want to add an art card, use `type = 'painting'`.

Replace the slug below with whatever section should contain the art card.

```sql
insert into cards (
  section_id,
  type,
  order_index,
  title,
  subtitle,
  description,
  points,
  tags,
  links,
  image_url,
  audio_url,
  audio_length
)
select
  s.id,
  'painting',
  4,
  'Untitled 01',
  'Acrylic on canvas',
  'Example art card with image-first content.',
  array['2026', '48 x 36 in', 'Private collection'],
  array['art', 'painting', 'acrylic'],
  jsonb_build_array(
    jsonb_build_object('label', 'Catalog', 'url', 'https://example.com/art/untitled-01')
  ),
  'https://your-project.supabase.co/storage/v1/object/public/portfolio-images/untitled-01.jpg',
  null,
  null
from sections s
where s.slug = 'projects';
```

Notes:

- `type = 'painting'` is already supported by the current card type model.
- `image_url` should be the public URL of the uploaded artwork image.
- `audio_url` can stay `null` for art cards.
- Use `order_index` to place the art card among the other cards in that section.

## 4. Change Sidebar Order

Update the section ordering directly:

```sql
update sections
set order_index = 1
where slug = 'projects';
```

## 5. Change Card Order Inside A Section

Move a card earlier or later by changing `order_index`:

```sql
update cards
set order_index = 3
where title = 'Project Two';
```

The frontend does not sort manually beyond reading `order_index`, so Supabase remains the source of truth.
