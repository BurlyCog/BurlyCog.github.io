# Portfolio

System-style portfolio built with Next.js App Router and Supabase.

## Local development

```bash
cd /Users/mac/Developer/portfolio/portfolio
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Get both values from:

- `Supabase -> Project Settings -> API`

## Supabase schema

Current app data depends on two tables:

```sql
create table sections (
  id uuid primary key default gen_random_uuid(),
  name text,
  slug text unique,
  order_index int
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references sections(id) on delete cascade,
  type text,
  order_index int,
  title text,
  subtitle text,
  description text,
  points text[],
  tags text[],
  links jsonb,
  image_url text,
  audio_url text,
  audio_length text,
  created_at timestamp default now()
);
```

## How content works

- Sidebar sections come from `sections`
- Card count per page comes from `cards` filtered by `section_id`
- Section order comes from `sections.order_index`
- Card order inside a section comes from `cards.order_index`
- If a section has no cards, the content area stays empty

## Add a section

```sql
insert into sections (name, slug, order_index)
values ('Projects', 'projects', 2);
```

Notes:

- `slug` becomes the route, so `projects` renders at `/projects`
- `order_index` decides where it appears in the sidebar

## Edit a section

Rename:

```sql
update sections
set name = 'Selected Works'
where slug = 'projects';
```

Move sidebar order:

```sql
update sections
set order_index = 1
where slug = 'projects';
```

Change route slug:

```sql
update sections
set slug = 'selected-works'
where slug = 'projects';
```

## Add a card

This is the safest pattern because it looks up the target section by slug:

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
  'project',
  1,
  'Project Name',
  'Case Study',
  'Short project description.',
  array['Problem', 'Process', 'Outcome'],
  array['project', 'featured'],
  jsonb_build_array(
    jsonb_build_object('label', 'Live', 'url', 'https://example.com'),
    jsonb_build_object('label', 'GitHub', 'url', 'https://github.com/example/repo')
  ),
  'https://your-project.supabase.co/storage/v1/object/public/portfolio-images/project-cover.jpg',
  null,
  '00:49'
from sections s
where s.slug = 'projects';
```

## Add an art card

Use `type = 'painting'` for artwork:

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
  2,
  'Untitled 01',
  'Acrylic on canvas',
  'Artwork description.',
  array['2026', '48 x 36 in', 'Private collection'],
  array['art', 'painting', 'acrylic'],
  jsonb_build_array(
    jsonb_build_object('label', 'Catalog', 'url', 'https://example.com/catalog')
  ),
  'https://your-project.supabase.co/storage/v1/object/public/portfolio-images/untitled-01.jpg',
  null,
  null
from sections s
where s.slug = 'projects';
```

## Edit a card

Change title and description:

```sql
update cards
set
  title = 'Updated Project Name',
  description = 'Updated description text.'
where title = 'Project Name';
```

Move card order inside a section:

```sql
update cards
set order_index = 3
where title = 'Updated Project Name';
```

Replace tags:

```sql
update cards
set tags = array['project', 'system', 'featured']
where title = 'Updated Project Name';
```

Replace bullet points:

```sql
update cards
set points = array['Research', 'Design', 'Build', 'Launch']
where title = 'Updated Project Name';
```

Replace links:

```sql
update cards
set links = jsonb_build_array(
  jsonb_build_object('label', 'Live', 'url', 'https://example.com/live'),
  jsonb_build_object('label', 'Docs', 'url', 'https://example.com/docs')
)
where title = 'Updated Project Name';
```

## Delete content

Delete one card:

```sql
delete from cards
where title = 'Updated Project Name';
```

Delete one section and all of its cards:

```sql
delete from sections
where slug = 'projects';
```

`cards.section_id` uses `on delete cascade`, so section deletion removes its cards automatically.

## Templates

Project template:

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
  'project',
  99,
  'Template Project',
  'Subtitle',
  'Describe the work here.',
  array['Point one', 'Point two', 'Point three'],
  array['project'],
  jsonb_build_array(
    jsonb_build_object('label', 'Live', 'url', 'https://example.com')
  ),
  null,
  null,
  null
from sections s
where s.slug = 'projects';
```

Art template:

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
  image_url
)
select
  s.id,
  'painting',
  99,
  'Template Painting',
  'Medium',
  'Artwork description.',
  array['Year', 'Dimensions', 'Collection'],
  array['art', 'painting'],
  jsonb_build_array(
    jsonb_build_object('label', 'Catalog', 'url', 'https://example.com')
  ),
  'https://your-project.supabase.co/storage/v1/object/public/portfolio-images/template.jpg'
from sections s
where s.slug = 'projects';
```

Section template:

```sql
insert into sections (name, slug, order_index)
values ('New Section', 'new-section', 99);
```

## Media

Recommended storage buckets:

- `portfolio-images`
- `portfolio-audio`

For MVP, upload files to Supabase Storage and store public URLs in:

- `cards.image_url`
- `cards.audio_url`

## Quick checklist

1. Add or update a row in `sections`
2. Add cards tied to that section using the section slug lookup pattern
3. Set `order_index` for sidebar and card order
4. Upload media to Supabase Storage
5. Paste public URLs into `image_url` / `audio_url`
6. Refresh the app

## Reference seed file

For larger starter SQL, see:

- [docs/supabase-placeholder-content.md](/Users/mac/Developer/portfolio/portfolio/docs/supabase-placeholder-content.md)
