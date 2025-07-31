export const config = {
  api: {
    bodyParser: false, // Important: forward raw DRM binary
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    // Forward request to your actual Widevine server
    const licenseResponse = await fetch(
      "http://143.44.136.74:9443/widevine/?deviceId=02:00:00:00:00:00",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: req, // stream request body directly
      }
    );

    if (!licenseResponse.ok) {
      return res
        .status(licenseResponse.status)
        .send(`License request failed: ${licenseResponse.status}`);
    }

    // Return binary license
    const arrayBuffer = await licenseResponse.arrayBuffer();
    res.setHeader("Content-Type", "application/octet-stream");
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("Widevine proxy error", err);
    res.status(500).send("License server error");
  }
}
