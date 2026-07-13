const API_BASE = "https://api.cloudflare.com/client/v4";
const ZONE_NAME = "leapsignal.net";
const NOTE = "Leap Signal Labs OG preview scanner";
const SCANNER_RANGES = ["74.220.48.0/24", "74.220.56.0/24"];

const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  throw new Error("CLOUDFLARE_API_TOKEN is required");
}

async function cloudflare(path, init = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    const details = payload.errors?.map((error) => error.message).join("; ") || response.statusText;
    throw new Error(`Cloudflare API ${response.status}: ${details}`);
  }

  return payload;
}

const zones = await cloudflare(`/zones?name=${encodeURIComponent(ZONE_NAME)}&status=active`);
const zone = zones.result.find((candidate) => candidate.name === ZONE_NAME);
if (!zone) {
  throw new Error(`Active Cloudflare zone not found: ${ZONE_NAME}`);
}

const rulesResponse = await cloudflare(`/zones/${zone.id}/firewall/access_rules/rules?per_page=1000`);
const rules = rulesResponse.result;

for (const range of SCANNER_RANGES) {
  const existing = rules.find(
    (rule) => rule.configuration?.target === "ip_range" && rule.configuration?.value === range,
  );
  const body = JSON.stringify({
    mode: "whitelist",
    configuration: { target: "ip_range", value: range },
    notes: NOTE,
  });

  if (existing?.mode === "whitelist") {
    console.log(`Already allowed: ${range}`);
    continue;
  }

  if (existing) {
    await cloudflare(`/zones/${zone.id}/firewall/access_rules/rules/${existing.id}`, {
      method: "PATCH",
      body,
    });
    console.log(`Updated to allow: ${range}`);
    continue;
  }

  await cloudflare(`/zones/${zone.id}/firewall/access_rules/rules`, {
    method: "POST",
    body,
  });
  console.log(`Allowed: ${range}`);
}
