"""Generic diff between two JSON snapshot blobs (e.g. two SanSnapshot.fabric or two
StorageSnapshot.data rows for the same device), "Oxidized-style": what changed since the last
pull. Shared by SAN and Storage so both reuse the same port-keying conventions their own
adapters already use, instead of re-deriving them.
"""


def diff_snapshots(old, new, port_key_fn, port_fields, top_level_fields):
    """
    old, new: snapshot dicts (e.g. SanSnapshot.fabric / StorageSnapshot.data).
    port_key_fn: callable(port_dict) -> hashable key identifying "the same port" across pulls,
        or None if the port can't be keyed (such ports are skipped on both sides).
    port_fields: list of field names on each port dict to compare for a "changed" classification.
    top_level_fields: list of top-level field names (e.g. "firmware", "health") to compare.

    Returns {"added": [...], "removed": [...], "changed": [...], "top_level": [...]}.
    "added"/"removed" are full port dicts. "changed" entries are
    {"key": ..., "port": new_port_dict, "fields": [{"field", "from", "to"}, ...]}.
    "top_level" entries are {"field", "from", "to"}.
    """
    old = old or {}
    new = new or {}

    old_ports = {}
    for p in (old.get("ports") or []):
        key = port_key_fn(p)
        if key is not None:
            old_ports[key] = p
    new_ports = {}
    for p in (new.get("ports") or []):
        key = port_key_fn(p)
        if key is not None:
            new_ports[key] = p

    added = [new_ports[k] for k in new_ports if k not in old_ports]
    removed = [old_ports[k] for k in old_ports if k not in new_ports]

    changed = []
    for key in new_ports:
        if key not in old_ports:
            continue
        op, np = old_ports[key], new_ports[key]
        field_diffs = []
        for field in port_fields:
            ov, nv = op.get(field), np.get(field)
            if ov != nv:
                field_diffs.append({"field": field, "from": ov, "to": nv})
        if field_diffs:
            changed.append({"key": key, "port": np, "fields": field_diffs})

    top_level = []
    for field in top_level_fields:
        ov, nv = old.get(field), new.get(field)
        if ov != nv:
            top_level.append({"field": field, "from": ov, "to": nv})

    return {"added": added, "removed": removed, "changed": changed, "top_level": top_level}
