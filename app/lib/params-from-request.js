/** Map query-string (GET) or JSON body (POST) to bind parameters. */
async function paramsFromRequest(req) {
  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        const { parameters, ...rest } = body;
        if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
          return { ...parameters, ...rest };
        }
        return rest;
      }
    } catch {
      /* fall through */
    }
  }

  const out = {};
  const q = req.query || {};
  for (const [key, value] of Object.entries(q)) {
    const v = Array.isArray(value) ? value[value.length - 1] : value;
    if (key === 'offset' || key === 'limit' || key === 'now_ts') {
      const n = Number(v);
      if (!Number.isNaN(n)) out[key] = n;
    } else if (key === 'free') {
      out[key] = v;
    } else {
      out[key] = v;
    }
  }
  return out;
}

module.exports = { paramsFromRequest };
