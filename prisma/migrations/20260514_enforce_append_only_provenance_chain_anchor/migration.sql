-- Database-enforced append-only behaviour for the internal provenance anchor ledger.
-- This is not WORM storage or external immutability. It prevents ordinary
-- UPDATE and DELETE operations against historical anchor rows inside Postgres.
-- INSERT remains allowed so new scoped Merkle anchors can continue to append.

CREATE OR REPLACE FUNCTION prevent_provenance_chain_anchor_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ProvenanceChainAnchor is append-only: UPDATE and DELETE are not permitted';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_provenance_chain_anchor_mutation()
IS 'Blocks UPDATE and DELETE on ProvenanceChainAnchor to enforce append-only provenance anchor ledger behaviour inside the application database boundary.';

CREATE TRIGGER prevent_provenance_chain_anchor_mutation
BEFORE UPDATE OR DELETE ON "ProvenanceChainAnchor"
FOR EACH ROW
EXECUTE FUNCTION prevent_provenance_chain_anchor_mutation();

COMMENT ON TRIGGER prevent_provenance_chain_anchor_mutation ON "ProvenanceChainAnchor"
IS 'Prevents UPDATE and DELETE while allowing INSERT for append-only provenance chain anchors.';
