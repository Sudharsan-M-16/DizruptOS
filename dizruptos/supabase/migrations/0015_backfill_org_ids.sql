-- 0015: Backfill org_ids after seed data was loaded.
-- Safe to run multiple times (all WHERE org_id IS NULL).

DO $$ BEGIN
  UPDATE recommendations
    SET org_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
    WHERE org_id IS NULL;

  UPDATE entity_embeddings
    SET org_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
    WHERE org_id IS NULL;

  -- Also backfill user title/location if still null after seed.
  UPDATE users SET
    title    = COALESCE(title,
      CASE role
        WHEN 'admin'           THEN 'Engineering Manager'
        WHEN 'executive'       THEN 'Chief Executive Officer'
        WHEN 'dept_head'       THEN 'Head of Engineering'
        WHEN 'project_manager' THEN 'Senior Project Manager'
        ELSE                        'Software Engineer'
      END),
    location = COALESCE(location, 'San Francisco, CA'),
    timezone = COALESCE(timezone, 'America/Los_Angeles')
  WHERE title IS NULL OR location IS NULL;
END $$;

-- Re-seed tenant_settings in case the org didn't exist when 0014 ran.
INSERT INTO tenant_settings (org_id, key, value, is_secret, updated_at)
SELECT orgs.id, d.s_key, d.s_value, d.s_secret, NOW()
FROM organizations AS orgs
CROSS JOIN (
  VALUES
    ('sso.enabled'::text,        'false'::text, FALSE::boolean),
    ('scim.enabled',             'false',       FALSE),
    ('idle_lock_minutes',        '10',          FALSE),
    ('branding.product_name',    'DizruptOS',   FALSE),
    ('feature.monte_carlo',      'true',        FALSE),
    ('feature.llm_copilot',      'true',        FALSE),
    ('feature.graph_traversal',  'true',        FALSE)
) AS d(s_key, s_value, s_secret)
ON CONFLICT (org_id, key) DO NOTHING;
