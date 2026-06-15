-- Migration 0013: Graph traversal at scale via recursive CTEs + centrality.
-- Corrected version — all UUID/TEXT casting fixed, column names match actual schema.
--
-- Adds:
--   1. org_id to entity_relationships + entity_paths (missing from 0001/0007)
--   2. traverse_graph(start_id, max_depth) — recursive BFS, all paths as TEXT[]
--   3. shortest_path(source_id, target_id) — unweighted BFS shortest path
--   4. betweenness_centrality() — normalized betweenness score per node
--   5. dependency_hubs(min_out_degree) — high-degree hub detection
--   6. refresh_entity_paths() — materializes BFS results into entity_paths cache
-- ---------------------------------------------------------------------------

-- 0. Add org_id to entity_relationships (was missing from 0001/0007 sweeps).
ALTER TABLE entity_relationships ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Backfill existing edges to the first (demo) org.
UPDATE entity_relationships
  SET org_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
  WHERE org_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_rel_org ON entity_relationships(org_id);

-- Add org_id to entity_paths too (0001 schema omitted it).
ALTER TABLE entity_paths ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);


-- ---------------------------------------------------------------------------
-- 1. BFS traversal from a start node.
--    Path stored as TEXT[] so UUIDs never need to be cast back from raw bytea.
--    All UUID→TEXT casts happen exactly once at the array boundary.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION traverse_graph(
  p_start_id  UUID,
  p_org_id    UUID DEFAULT NULL,
  p_max_depth INT  DEFAULT 6
)
RETURNS TABLE (
  node_id           TEXT,
  node_type         TEXT,
  relationship_type TEXT,
  depth             INT,
  path              TEXT[]
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH RECURSIVE bfs AS (
    -- Seed: direct neighbours of the start node.
    SELECT
      er.target_id::text       AS node_id,
      er.target_type           AS node_type,
      er.relationship_type     AS relationship_type,
      1                        AS depth,
      -- BOTH elements cast to text so the array is homogeneous TEXT[].
      ARRAY[p_start_id::text, er.target_id::text] AS path
    FROM entity_relationships er
    WHERE er.source_id = p_start_id
      AND er.valid_until IS NULL
      AND (p_org_id IS NULL OR er.org_id = p_org_id)

    UNION ALL

    -- Expand one hop.
    SELECT
      er.target_id::text,
      er.target_type,
      er.relationship_type,
      bfs.depth + 1,
      bfs.path || er.target_id::text
    FROM entity_relationships er
    -- Compare UUID source to TEXT node_id via cast — explicit, no ambiguity.
    JOIN bfs ON er.source_id::text = bfs.node_id
    WHERE bfs.depth < p_max_depth
      AND er.valid_until IS NULL
      -- Cycle guard: target (cast to text) must not already be in the path.
      AND NOT (er.target_id::text = ANY(bfs.path))
      AND (p_org_id IS NULL OR er.org_id = p_org_id)
  )
  SELECT DISTINCT ON (node_id)
    node_id, node_type, relationship_type, depth, path
  FROM bfs
  ORDER BY node_id, depth ASC;
$$;

COMMENT ON FUNCTION traverse_graph IS
  'Recursive BFS from p_start_id. Returns all reachable nodes within p_max_depth hops. '
  'Cycle-safe via path membership check. Scope to tenant with p_org_id.';

GRANT EXECUTE ON FUNCTION traverse_graph TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. Shortest path between two nodes (unweighted BFS).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION shortest_path(
  p_source_id UUID,
  p_target_id UUID,
  p_org_id    UUID DEFAULT NULL,
  p_max_depth INT  DEFAULT 10
)
RETURNS TEXT[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH RECURSIVE bfs AS (
    SELECT
      er.target_id::text                            AS node_id,
      ARRAY[p_source_id::text, er.target_id::text]  AS path,
      1                                             AS depth
    FROM entity_relationships er
    WHERE er.source_id = p_source_id
      AND er.valid_until IS NULL
      AND (p_org_id IS NULL OR er.org_id = p_org_id)

    UNION ALL

    SELECT
      er.target_id::text,
      bfs.path || er.target_id::text,
      bfs.depth + 1
    FROM entity_relationships er
    JOIN bfs ON er.source_id::text = bfs.node_id
    WHERE bfs.depth < p_max_depth
      AND er.valid_until IS NULL
      AND NOT (er.target_id::text = ANY(bfs.path))
      AND (p_org_id IS NULL OR er.org_id = p_org_id)
  )
  SELECT path
  FROM bfs
  WHERE node_id = p_target_id::text
  ORDER BY depth ASC
  LIMIT 1;
$$;

COMMENT ON FUNCTION shortest_path IS
  'Returns shortest path array [source::text, ..., target::text] or NULL if unreachable.';

GRANT EXECUTE ON FUNCTION shortest_path TO authenticated;


-- ---------------------------------------------------------------------------
-- 3. Betweenness centrality — which nodes lie on the most shortest paths.
--    Uses traverse_graph to build shortest-path trees from every source node,
--    counts how often each intermediate node appears, normalises by n*(n-1)/2.
--    Suitable for graphs up to ~500 nodes. Cache the result; do not call per-request.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION betweenness_centrality(p_org_id UUID DEFAULT NULL)
RETURNS TABLE (
  node_id    TEXT,
  node_type  TEXT,
  raw_count  BIGINT,
  normalized NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH
  -- All distinct nodes (sources and targets) visible in this org.
  nodes AS (
    SELECT DISTINCT source_id AS id, source_type AS node_type
    FROM entity_relationships
    WHERE valid_until IS NULL
      AND (p_org_id IS NULL OR org_id = p_org_id)
    UNION
    SELECT DISTINCT target_id, target_type
    FROM entity_relationships
    WHERE valid_until IS NULL
      AND (p_org_id IS NULL OR org_id = p_org_id)
  ),

  -- Shortest-path trees from every source node via traverse_graph.
  -- LEFT JOIN LATERAL so source nodes with no edges still appear in final count.
  all_paths AS (
    SELECT tg.node_id AS leaf_id, tg.path
    FROM nodes src
    LEFT JOIN LATERAL traverse_graph(src.id, p_org_id, 8) AS tg ON TRUE
    WHERE tg.node_id IS NOT NULL
      AND src.id::text <> tg.node_id     -- exclude self-paths
  ),

  -- Count how many paths each intermediate node appears in.
  -- path[2 .. len-1] extracts elements excluding first (source) and last (leaf).
  intermediary_counts AS (
    SELECT
      mid_node      AS node_id,
      COUNT(*)      AS raw_count
    FROM all_paths,
    LATERAL unnest(path[2 : array_length(path, 1) - 1]) AS mid_node
    GROUP BY mid_node
  ),

  total AS (SELECT COUNT(*) AS n FROM nodes)

  SELECT
    n.id::text AS node_id,
    n.node_type,
    COALESCE(ic.raw_count, 0) AS raw_count,
    CASE WHEN (SELECT n FROM total) > 1
      THEN ROUND(
        COALESCE(ic.raw_count, 0)::NUMERIC
        / NULLIF(
            ((SELECT n FROM total) - 1) * ((SELECT n FROM total) - 2) / 2,
            0
          ),
        4
      )
      ELSE 0::NUMERIC
    END AS normalized
  FROM nodes n
  LEFT JOIN intermediary_counts ic ON ic.node_id = n.id::text
  ORDER BY normalized DESC;
$$;

COMMENT ON FUNCTION betweenness_centrality IS
  'Normalized betweenness centrality for all graph nodes. '
  'High score = structural bridge. Do not call per-request; cache hourly.';

GRANT EXECUTE ON FUNCTION betweenness_centrality TO authenticated;


-- ---------------------------------------------------------------------------
-- 4. Dependency hub detection (high out-degree = fan-out risk).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION dependency_hubs(
  p_min_out_degree INT  DEFAULT 3,
  p_org_id         UUID DEFAULT NULL
)
RETURNS TABLE (
  source_id   TEXT,
  source_type TEXT,
  out_degree  BIGINT,
  in_degree   BIGINT,
  hub_score   NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH out_deg AS (
    SELECT source_id::text AS source_id, source_type, COUNT(*) AS out_degree
    FROM entity_relationships
    WHERE valid_until IS NULL
      AND (p_org_id IS NULL OR org_id = p_org_id)
    GROUP BY source_id, source_type
    HAVING COUNT(*) >= p_min_out_degree
  ),
  in_deg AS (
    SELECT target_id::text AS target_id, COUNT(*) AS in_degree
    FROM entity_relationships
    WHERE valid_until IS NULL
      AND (p_org_id IS NULL OR org_id = p_org_id)
    GROUP BY target_id
  )
  SELECT
    o.source_id,
    o.source_type,
    o.out_degree,
    COALESCE(i.in_degree, 0) AS in_degree,
    ROUND(
      SQRT(o.out_degree::NUMERIC * GREATEST(1, COALESCE(i.in_degree, 0))::NUMERIC),
      3
    ) AS hub_score
  FROM out_deg o
  LEFT JOIN in_deg i ON i.target_id = o.source_id
  ORDER BY hub_score DESC;
$$;

COMMENT ON FUNCTION dependency_hubs IS
  'Returns nodes with >= p_min_out_degree outgoing edges. '
  'hub_score = sqrt(out_degree * in_degree) — balances fan-out and fan-in.';

GRANT EXECUTE ON FUNCTION dependency_hubs TO authenticated;


-- ---------------------------------------------------------------------------
-- 5. Materialized path refresh — writes traverse_graph output into entity_paths.
--    entity_paths schema (from 0001):
--      root_id UUID, root_type TEXT, leaf_id UUID, leaf_type TEXT,
--      path_hops INT (check 1..4), path_array UUID[], path_types TEXT[],
--      computed_at TIMESTAMPTZ, org_id UUID (added above).
--    Only writes paths up to depth 4 to satisfy the check constraint.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_entity_paths(p_org_id UUID DEFAULT NULL)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count  INT := 0;
  v_source RECORD;
BEGIN
  -- Clear stale cached paths for this tenant.
  IF p_org_id IS NOT NULL THEN
    DELETE FROM entity_paths WHERE org_id = p_org_id;
  ELSE
    DELETE FROM entity_paths;
  END IF;

  FOR v_source IN
    SELECT DISTINCT source_id, source_type
    FROM entity_relationships
    WHERE valid_until IS NULL
      AND (p_org_id IS NULL OR org_id = p_org_id)
  LOOP
    INSERT INTO entity_paths (
      root_id, root_type,
      leaf_id, leaf_type,
      path_hops,
      path_array,
      path_types,
      org_id,
      computed_at
    )
    SELECT
      v_source.source_id,
      v_source.source_type,
      tg.node_id::uuid,
      tg.node_type,
      tg.depth,
      -- Convert TEXT[] path back to UUID[] for path_array column.
      ARRAY(SELECT p::uuid FROM unnest(tg.path) AS p),
      -- path_types: replicate leaf type for each hop position.
      ARRAY_FILL(tg.node_type, ARRAY[tg.depth + 1]),
      p_org_id,
      NOW()
    FROM traverse_graph(v_source.source_id, p_org_id, 4) AS tg
    -- Honour the entity_paths check constraint: path_hops between 1 and 4.
    WHERE tg.depth BETWEEN 1 AND 4;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION refresh_entity_paths IS
  'Materializes BFS traversal (depth 1-4) into entity_paths cache. '
  'Call hourly or after bulk imports. Returns count of source nodes processed.';

GRANT EXECUTE ON FUNCTION refresh_entity_paths TO service_role;
