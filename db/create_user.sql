-- 1. Create the user (Check if exists first)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'task_user') THEN
        CREATE USER task_user WITH PASSWORD 'your_secure_password';
    END IF;
END
$$;

-- 2. Grant Database-level access
-- Note: Ensure you are connected to 'tasksmanager' when running this!
GRANT CONNECT ON DATABASE tasksmanager TO task_user;

-- 3. Grant Schema-level access
-- This allows the user to see the schema and create new objects (tables) inside it
GRANT USAGE, CREATE ON SCHEMA public TO task_user;

-- 4. Grant permissions for EXISTING tables
-- (In case you already have tables in the database)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO task_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO task_user;

-- 5. Set DEFAULT privileges for FUTURE tables
-- This ensures that any tables created by OTHER users (like an admin) 
-- will automatically be accessible to task_user.
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO task_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO task_user;