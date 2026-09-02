-- ============================================================================
-- SHREE SHYAM MART: SUPABASE KEEP-ALIVE TRIGGER & SCHEDULED CRON JOB
-- Prevents Supabase Free Tier inactivity pausing (7-day threshold)
-- ============================================================================

-- 1. Enable pg_cron extension (native in Supabase PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create Heartbeat Ledger Table
CREATE TABLE IF NOT EXISTS keep_alive_heartbeat (
    id INT PRIMARY KEY DEFAULT 1,
    last_ping TIMESTAMPTZ DEFAULT NOW(),
    ping_count BIGINT DEFAULT 1,
    note TEXT DEFAULT 'Supabase automated keep-alive trigger'
);

-- Enable Row Level Security (RLS) on the heartbeat table
ALTER TABLE keep_alive_heartbeat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for keep_alive_heartbeat" ON keep_alive_heartbeat;
CREATE POLICY "Public read access for keep_alive_heartbeat" ON keep_alive_heartbeat FOR SELECT USING (true);

-- Ensure a singleton row exists
INSERT INTO keep_alive_heartbeat (id, last_ping, ping_count, note)
VALUES (1, NOW(), 1, 'Supabase automated keep-alive trigger')
ON CONFLICT (id) DO UPDATE 
SET last_ping = NOW(),
    ping_count = keep_alive_heartbeat.ping_count + 1;

-- 3. Stored Procedure to Trigger & Record Database Activity
CREATE OR REPLACE FUNCTION record_keep_alive_heartbeat()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE keep_alive_heartbeat
    SET last_ping = NOW(),
        ping_count = ping_count + 1
    WHERE id = 1;
END;
$$;

-- 4. Idempotently Register Scheduled Job with pg_cron
-- Runs every 3 days at 00:00 UTC (Supabase pauses after 7 days of inactivity)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        -- Remove existing job if already registered to prevent duplicate cron entries
        PERFORM cron.unschedule('supabase_keep_alive_ping')
        WHERE EXISTS (
            SELECT 1 FROM cron.job WHERE jobname = 'supabase_keep_alive_ping'
        );

        -- Schedule cron job to run every 3 days at midnight
        PERFORM cron.schedule(
            'supabase_keep_alive_ping',
            '0 0 */3 * *',
            'SELECT record_keep_alive_heartbeat();'
        );
    END IF;
END $$;
