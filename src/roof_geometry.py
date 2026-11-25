"""Shared bounds and ray blockers for the orthogonal roof exported by the viewer."""


def roof_bounds(source):
    outline = source['roofOutline']
    return (min(p[0] for p in outline), min(p[1] for p in outline),
            max(p[0] for p in outline), max(p[1] for p in outline))


def roof_blockers(source):
    outline = source['roofOutline']
    roof = next(mesh for mesh in source['meshes'] if mesh['roof'])
    # The exported roof is extruded in local Z and rotated 90 degrees about X.
    depth = roof['positions'][2::3]
    bottom, top = roof['position'][1] - max(depth), roof['position'][1] - min(depth)
    edges = list(zip(outline, outline[1:] + outline[:1]))
    levels = sorted(set(p[1] for p in outline))
    result = []
    for z0, z1 in zip(levels, levels[1:]):
        middle = (z0 + z1) / 2
        crossings = sorted(a[0] for a, b in edges
                           if a[0] == b[0] and min(a[1], b[1]) < middle < max(a[1], b[1]))
        for x0, x1 in zip(crossings[::2], crossings[1::2]):
            result.append(((x0, bottom, z0), (x1, top, z1)))
    return result
