-- Add image column to Rating table
ALTER TABLE Rating ADD COLUMN image TEXT;

-- Add index for image-based queries
CREATE INDEX idx_rating_image ON Rating (image); 