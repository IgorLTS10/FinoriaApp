-- Migration: Add crowdfunding platforms system
-- This migration creates the platforms table and migrates existing platform data

-- Step 1: Create the platforms table
CREATE TABLE IF NOT EXISTS crowdfunding_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

-- Step 2: Create user platform favorites table
CREATE TABLE IF NOT EXISTS user_platform_favorites (
  user_id UUID NOT NULL,
  platform_id UUID NOT NULL REFERENCES crowdfunding_platforms(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, platform_id)
);

-- Step 3: Insert existing platforms with their colors
-- Based on current hardcoded PLATFORM_COLORS
INSERT INTO crowdfunding_platforms (name, color) VALUES
  ('Bricks', '#f59e0b'),      -- Orange (user specified)
  ('Bienpreter', '#8b5cf6'),  -- Blue/Purple (user specified)
  ('Anaxago', '#10b981'),     -- Green
  ('Fundimmo', '#f59e0b'),    -- Amber
  ('Homunity', '#ef4444'),    -- Red
  ('Raizers', '#ec4899')      -- Pink
ON CONFLICT (name) DO NOTHING;

-- Step 4: Add new column to projects table (nullable for now)
ALTER TABLE crowdfunding_projects 
ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES crowdfunding_platforms(id);

-- Step 5: Migrate existing data - match platform names to IDs
UPDATE crowdfunding_projects cp
SET platform_id = cfp.id
FROM crowdfunding_platforms cfp
WHERE cp.platform = cfp.name;

-- Step 6: For any projects with platforms not in our list, create them with random colors
DO $$
DECLARE
  platform_name TEXT;
  new_platform_id UUID;
BEGIN
  FOR platform_name IN 
    SELECT DISTINCT platform 
    FROM crowdfunding_projects 
    WHERE platform_id IS NULL AND platform IS NOT NULL
  LOOP
    -- Generate a random pastel color
    INSERT INTO crowdfunding_platforms (name, color)
    VALUES (
      platform_name,
      '#' || LPAD(TO_HEX((RANDOM() * 127 + 128)::INT), 2, '0') ||
             LPAD(TO_HEX((RANDOM() * 127 + 128)::INT), 2, '0') ||
             LPAD(TO_HEX((RANDOM() * 127 + 128)::INT), 2, '0')
    )
    RETURNING id INTO new_platform_id;
    
    -- Update projects with this platform
    UPDATE crowdfunding_projects
    SET platform_id = new_platform_id
    WHERE platform = platform_name AND platform_id IS NULL;
  END LOOP;
END $$;

-- Step 7: Make platform_id NOT NULL (all projects should have it now)
ALTER TABLE crowdfunding_projects 
ALTER COLUMN platform_id SET NOT NULL;

-- Step 8: Drop the old platform text column (keep it for now as backup)
-- ALTER TABLE crowdfunding_projects DROP COLUMN platform;
-- We'll keep the old column for safety, can drop it later manually

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crowdfunding_projects_platform_id 
ON crowdfunding_projects(platform_id);

CREATE INDEX IF NOT EXISTS idx_user_platform_favorites_user_id 
ON user_platform_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_user_platform_favorites_platform_id 
ON user_platform_favorites(platform_id);
