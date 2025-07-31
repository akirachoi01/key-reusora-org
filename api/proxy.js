export const config = {
  api: {
    bodyParser: false, // Needed for binary DRM requests
  },
};

export default async function handler(req, res) {
  const target = req.query.url;
  if (!target) {
    return res.status(400).send("Missing url parameter");
  }

  // For POST (DRM license) forward raw request body
  const method = req.method;
  const headers = { ...req.headers };
  delete headers.host; // Remove host to avoid CORS issues

  console.log(`[Proxy] ${method} ${target}`);

  try {
    const fetchOptions = {
      method,
      headers,
    };

    if (method === "POST") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      fetchOptions.body = Buffer.concat(chunks);
    }

    const upstream = await fetch(target, fetchOptions);

    // Pass through headers for content type
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      // Avoid exposing cross-origin cookies
      if (!["set-cookie", "transfer-encoding"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // Stream back data
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error("[Proxy error]", err);
    res.status(500).send("Proxy request failed");
  }
}
