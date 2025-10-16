/*
  # Create alarms table for Monster Alarm Clock

  ## Overview
  This migration creates the core alarms table to store user-configured alarm settings
  including time, recurrence patterns, wake modes, voice broadcast configurations,
  and task challenges.

  ## Tables Created
  
  ### `alarms`
  Stores all alarm configurations for users.
  
  #### Columns:
  - `id` (uuid, primary key) - Unique identifier for each alarm
  - `user_id` (uuid, nullable) - Reference to auth.users, null for guest users
  - `time` (text) - Alarm time in HH:mm format (e.g., "07:00")
  - `period` (text) - Recurrence pattern: "everyday", "workday", "weekend", "custom", "tomorrow"
  - `custom_days` (integer[]) - Array of weekday numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
  - `wake_mode` (text) - Wake method: "ringtone" or "voice"
  - `ringtone` (text, nullable) - Name of selected ringtone if wake_mode is "ringtone"
  - `voice_modules` (jsonb) - Configuration of voice broadcast modules
  - `voice_package` (text) - Selected voice package (e.g., "energetic-girl", "calm-man")
  - `task` (text) - Wake-up challenge task type (e.g., "none", "quiz", "shake", "game-wordle")
  - `enabled` (boolean) - Whether alarm is currently active
  - `broadcast_text` (text, nullable) - Generated broadcast text content
  - `label` (text, nullable) - Optional user-defined label for the alarm
  - `created_at` (timestamptz) - Timestamp when alarm was created
  - `updated_at` (timestamptz) - Timestamp when alarm was last modified

  ## Security
  - Enable Row Level Security (RLS) on alarms table
  - Allow users to view, create, update, and delete only their own alarms
  - Guest users (null user_id) can manage alarms in local storage only

  ## Indexes
  - Index on user_id for efficient user-specific queries
  - Partial index on enabled alarms for active alarm lookups
*/

-- Create alarms table
CREATE TABLE IF NOT EXISTS alarms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  time text NOT NULL,
  period text NOT NULL CHECK (period IN ('everyday', 'workday', 'weekend', 'custom', 'tomorrow')),
  custom_days integer[] DEFAULT '{}',
  wake_mode text NOT NULL CHECK (wake_mode IN ('ringtone', 'voice')),
  ringtone text,
  voice_modules jsonb DEFAULT '[]'::jsonb,
  voice_package text DEFAULT 'energetic-girl',
  task text DEFAULT 'none',
  enabled boolean DEFAULT true,
  broadcast_text text,
  label text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Users can view own alarms"
  ON alarms FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alarms"
  ON alarms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alarms"
  ON alarms FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alarms"
  ON alarms FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alarms_user_id ON alarms(user_id);
CREATE INDEX IF NOT EXISTS idx_alarms_enabled ON alarms(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_alarms_time ON alarms(time);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_alarms_updated_at
  BEFORE UPDATE ON alarms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
