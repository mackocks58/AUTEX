/**
 * Deploys database.rules.json to Firebase Realtime Database
 * using the service account to get an access token, then
 * calls the Firebase REST API directly — no firebase-tools needed.
 */
import { readFileSync, existsSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import https from "https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ── 1. Load rules ─────────────────────────────────────────────────────────────
const rulesPath = join(root, "database.rules.json");
const rules = JSON.parse(readFileSync(rulesPath, "utf8"));
console.log("✅ Loaded rules from", rulesPath);

// ── 2. Load service account ───────────────────────────────────────────────────
const saPath = join(root, "serviceAccount.json");
if (!existsSync(saPath)) {
  console.error("❌ serviceAccount.json not found at", saPath);
  process.exit(1);
}
const serviceAccount = JSON.parse(readFileSync(saPath, "utf8"));
const projectId = serviceAccount.project_id;
console.log("✅ Using project:", projectId);

// ── 3. Get OAuth2 access token via JWT ────────────────────────────────────────
// Use firebase-admin which is already installed
const require = createRequire(import.meta.url);
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
  });
}

const token = await admin.app().options.credential.getAccessToken();
const accessToken = token.access_token;
console.log("✅ Got access token");

// ── 4. Deploy rules via REST API ──────────────────────────────────────────────
const body = JSON.stringify({ rules });
const hostname = "firebaserules.googleapis.com";
const path = `/v1/projects/${projectId}/rulesets`;

// First: create a new ruleset
const rulesetBody = JSON.stringify({
  source: {
    files: [
      {
        name: "database.rules.json",
        content: JSON.stringify(rules, null, 2),
      },
    ],
  },
});

function httpsRequest(hostname, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method, headers }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

// The simplest approach: PUT directly to the .settings/rules endpoint
// This is the classic Firebase REST API for security rules
const dbHost = `${projectId}-default-rtdb.firebaseio.com`;
const rulesPayload = JSON.stringify({ rules });

console.log("📤 Deploying rules to Firebase RTDB...");

const response = await httpsRequest(
  dbHost,
  `/.settings/rules.json?access_token=${accessToken}`,
  "PUT",
  {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(rulesPayload),
  },
  rulesPayload
);

if (response.status === 200) {
  console.log("🎉 Database rules deployed successfully!");
  console.log("Response:", JSON.stringify(response.body, null, 2).slice(0, 300));
} else {
  console.error("❌ Deployment failed with status:", response.status);
  console.error("Error:", JSON.stringify(response.body, null, 2));
  process.exit(1);
}
