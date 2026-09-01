-- Collections and bookmarks now share one ordered sequence per parent container,
-- so that browser/floccus child order round-trips exactly.
WITH items AS (
  SELECT
    'collection' AS kind,
    c."id",
    c."userId",
    c."parentId" AS container,
    c."position",
    0 AS rank,
    c."name" AS title
  FROM "Collection" c
  WHERE c."kind" = 'USER'
  UNION ALL
  SELECT
    'bookmark',
    b."id",
    b."userId",
    CASE WHEN p."kind" = 'UNSORTED' THEN NULL ELSE b."collectionId" END,
    b."position",
    1,
    b."title"
  FROM "Bookmark" b
  JOIN "Collection" p ON p."id" = b."collectionId"
),
ranked AS (
  SELECT
    kind,
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId", container
      ORDER BY "position", rank, title, "id"
    ) - 1 AS next
  FROM items
),
collections AS (
  UPDATE "Collection" c
  SET "position" = r.next
  FROM ranked r
  WHERE r.kind = 'collection' AND c."id" = r."id" AND c."position" <> r.next
  RETURNING 1
),
bookmarks AS (
  UPDATE "Bookmark" b
  SET "position" = r.next
  FROM ranked r
  WHERE r.kind = 'bookmark' AND b."id" = r."id" AND b."position" <> r.next
  RETURNING 1
)
SELECT
  (SELECT COUNT(*) FROM collections) AS collections,
  (SELECT COUNT(*) FROM bookmarks) AS bookmarks;
