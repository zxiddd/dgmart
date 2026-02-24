-- Add fcm_token column to users table for push notifications
-- Also add firebase_uid for Firebase auth bridge
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS fcm_token TEXT,
    ADD COLUMN IF NOT EXISTS firebase_uid TEXT;

-- Create index for faster FCM token lookups
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token) WHERE fcm_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid) WHERE firebase_uid IS NOT NULL;
