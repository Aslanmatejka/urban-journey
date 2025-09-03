-- Update listing_type enum to remove trade option
ALTER TYPE listing_type RENAME TO listing_type_old;
CREATE TYPE listing_type AS ENUM ('donation');

-- Update existing columns to use new type
ALTER TABLE food_listings 
  ALTER COLUMN listing_type TYPE listing_type 
  USING (CASE WHEN listing_type::text = 'trade' THEN 'donation'::listing_type ELSE listing_type::text::listing_type END);

-- Drop old type
DROP TYPE listing_type_old;
