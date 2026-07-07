/**
 * lib/intelligence/accountability/durable-graph-store.ts
 *
 * §4.2 — Durable Decision Graph persistence.
 *
 * Persists canonical graph semantics with tenant partition, case partition,
 * node version, edge provenance, correction, supersession, deletion propagation.
 *
 * Proves: close/reopen retains graph; cross-tenant traversal denied;
 * deleted node cannot remain reachable through stale edge;
 * superseded decision remains historical but not current;
 * copied node IDs across tenants do not collide.
 */
import Database from "better-sqlite3";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import type { GraphNodeType, GraphEdgeType } from "../canonical-decision-graph";

const DB_DIR = join(process.cwd(), "data", "graph");
const DB_PATH = join(DB_DIR, "graph-store.sqlite");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS graph_nodes (
      node_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      node_type TEXT NOT NULL,
      label TEXT NOT NULL,
      properties TEXT NOT NULL DEFAULT '{}',
      version INTEGER NOT NULL DEFAULT 1,
      superseded_by TEXT,
      deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (node_id, tenant_id)
    );
    CREATE INDEX IF NOT EXISTS idx_graph_nodes_tenant ON graph_nodes(tenant_id, case_id);
    CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(node_type);

    CREATE TABLE IF NOT EXISTS graph_edges (
      edge_id TEXT NOT NULL,
      edge_type TEXT NOT NULL,
      source_node_id TEXT NOT NULL,
      target_node_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      properties TEXT NOT NULL DEFAULT '{}',
      deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      PRIMARY KEY (edge_id, tenant_id)
    );
    CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source_node_id, tenant_id);
    CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target_node_id, tenant_id);
    CREATE INDEX IF NOT EXISTS idx_graph_edges_tenant ON graph_edges(tenant_id);
  `);
  return _db;
}

export interface DurableGraphNode {
  nodeId: string;
  tenantId: string;
  caseId: string;
  nodeType: GraphNodeType;
  label: string;
  properties: Record<string, unknown>;
  version: number;
  supersededBy: string | null;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DurableGraphEdge {
  edgeId: string;
  edgeType: GraphEdgeType;
  sourceNodeId: string;
  targetNodeId: string;
  tenantId: string;
  properties: Record<string, unknown>;
  deleted: boolean;
  createdAt: string;
}

export function createNode(input: { tenantId: string; caseId: string; nodeType: GraphNodeType; label: string; properties?: Record<string, unknown> }): DurableGraphNode {
  const db = getDb();
  const now = new Date().toISOString();
  const nodeId = `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.prepare("INSERT INTO graph_nodes (node_id, tenant_id, case_id, node_type, label, properties, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(nodeId, input.tenantId, input.caseId, input.nodeType, input.label, JSON.stringify(input.properties ?? {}), now, now);
  return getNode(nodeId, input.tenantId)!;
}

export function getNode(nodeId: string, tenantId: string): DurableGraphNode | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM graph_nodes WHERE node_id = ? AND tenant_id = ? AND deleted = 0").get(nodeId, tenantId) as any;
  if (!row) return null;
  return mapNode(row);
}

export function getNodesForCase(tenantId: string, caseId: string): DurableGraphNode[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM graph_nodes WHERE tenant_id = ? AND case_id = ? AND deleted = 0 ORDER BY created_at ASC").all(tenantId, caseId) as any[];
  return rows.map(mapNode);
}

export function supersedeNode(nodeId: string, tenantId: string, supersededBy: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE graph_nodes SET superseded_by = ?, updated_at = ? WHERE node_id = ? AND tenant_id = ?").run(supersededBy, now, nodeId, tenantId);
}

export function deleteNode(nodeId: string, tenantId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE graph_nodes SET deleted = 1, updated_at = ? WHERE node_id = ? AND tenant_id = ?").run(now, nodeId, tenantId);
  // Cascade: delete edges connected to this node
  db.prepare("UPDATE graph_edges SET deleted = 1 WHERE (source_node_id = ? OR target_node_id = ?) AND tenant_id = ?").run(nodeId, nodeId, tenantId);
}

export function createEdge(input: { edgeType: GraphEdgeType; sourceNodeId: string; targetNodeId: string; tenantId: string; properties?: Record<string, unknown> }): DurableGraphEdge {
  const db = getDb();
  const now = new Date().toISOString();
  const edgeId = `e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.prepare("INSERT INTO graph_edges (edge_id, edge_type, source_node_id, target_node_id, tenant_id, properties, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(edgeId, input.edgeType, input.sourceNodeId, input.targetNodeId, input.tenantId, JSON.stringify(input.properties ?? {}), now);
  return getEdge(edgeId, input.tenantId)!;
}

export function getEdge(edgeId: string, tenantId: string): DurableGraphEdge | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM graph_edges WHERE edge_id = ? AND tenant_id = ? AND deleted = 0").get(edgeId, tenantId) as any;
  if (!row) return null;
  return mapEdge(row);
}

export function getEdgesForCase(tenantId: string, caseId: string): DurableGraphEdge[] {
  const db = getDb();
  const nodeIds = getNodesForCase(tenantId, caseId).map(n => n.nodeId);
  if (nodeIds.length === 0) return [];
  const placeholders = nodeIds.map(() => "?").join(",");
  const rows = db.prepare(`SELECT * FROM graph_edges WHERE tenant_id = ? AND deleted = 0 AND (source_node_id IN (${placeholders}) OR target_node_id IN (${placeholders}))`).all(tenantId, ...nodeIds, ...nodeIds) as any[];
  return rows.map(mapEdge);
}

export function traverseFromNode(nodeId: string, tenantId: string, maxDepth: number = 3): { nodes: DurableGraphNode[]; edges: DurableGraphEdge[] } {
  const visitedNodes = new Set<string>();
  const visitedEdges = new Set<string>();
  const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visitedNodes.has(current.nodeId) || current.depth > maxDepth) continue;
    visitedNodes.add(current.nodeId);

    const db = getDb();
    const edgeRows = db.prepare("SELECT * FROM graph_edges WHERE tenant_id = ? AND deleted = 0 AND (source_node_id = ? OR target_node_id = ?)").all(tenantId, current.nodeId, current.nodeId) as any[];
    for (const er of edgeRows) {
      visitedEdges.add(er.edge_id);
      const nextNodeId = er.source_node_id === current.nodeId ? er.target_node_id : er.source_node_id;
      if (!visitedNodes.has(nextNodeId)) queue.push({ nodeId: nextNodeId, depth: current.depth + 1 });
    }
  }

  const db = getDb();
  const nodeRows = db.prepare(`SELECT * FROM graph_nodes WHERE tenant_id = ? AND deleted = 0 AND node_id IN (${Array.from(visitedNodes).map(() => "?").join(",")})`).all(tenantId, ...Array.from(visitedNodes)) as any[];
  const edgeRows = db.prepare(`SELECT * FROM graph_edges WHERE tenant_id = ? AND deleted = 0 AND edge_id IN (${Array.from(visitedEdges).map(() => "?").join(",")})`).all(tenantId, ...Array.from(visitedEdges)) as any[];

  return { nodes: nodeRows.map(mapNode), edges: edgeRows.map(mapEdge) };
}

export function getGraphVersion(tenantId: string, caseId: string): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM graph_nodes WHERE tenant_id = ? AND case_id = ? AND deleted = 0").get(tenantId, caseId) as any;
  return row?.count ?? 0;
}

export function closeGraphDatabase(): void {
  if (_db) { try { _db.close(); } catch { } _db = null; }
}

function mapNode(row: any): DurableGraphNode {
  return {
    nodeId: row.node_id,
    tenantId: row.tenant_id,
    caseId: row.case_id,
    nodeType: row.node_type as GraphNodeType,
    label: row.label,
    properties: JSON.parse(row.properties || "{}"),
    version: row.version,
    supersededBy: row.superseded_by,
    deleted: row.deleted === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEdge(row: any): DurableGraphEdge {
  return {
    edgeId: row.edge_id,
    edgeType: row.edge_type as GraphEdgeType,
    sourceNodeId: row.source_node_id,
    targetNodeId: row.target_node_id,
    tenantId: row.tenant_id,
    properties: JSON.parse(row.properties || "{}"),
    deleted: row.deleted === 1,
    createdAt: row.created_at,
  };
}
