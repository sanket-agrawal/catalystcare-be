-- Rename the legacy relations-personal category slug to the canonical website slug.
UPDATE "categories"
SET "slug" = 'couples-therapy-marriage-counselling-online'
WHERE "slug" = 'relations-personal'
   OR "name" = 'Relationships & Personal';
