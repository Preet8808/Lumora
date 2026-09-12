import { strict as assert } from "assert";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("🚀 Starting Lumora Automated End-to-End Test Suite...\n");

  // 1. Test Landing Page
  console.log("1️⃣ Testing Landing Page GET /...");
  const homeRes = await fetch(`${BASE_URL}/`);
  assert.equal(homeRes.status, 200, "Landing page should return 200");
  const homeHtml = await homeRes.text();
  assert.ok(homeHtml.includes("Lumora"), "Landing page must mention Lumora");
  console.log("   ✅ Landing page OK");

  // 2. Test Login & Session Cookie
  console.log("2️⃣ Testing Auth Login POST /api/auth/login...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@lumora.app", password: "password123" }),
  });
  assert.equal(loginRes.status, 200, "Login should succeed with 200");
  const cookie = loginRes.headers.get("set-cookie");
  assert.ok(cookie, "Login must issue session cookie");
  const alexCookie = cookie.split(";")[0];
  console.log("   ✅ Alex Chen authenticated, session cookie acquired");

  // 3. Test Dashboard API
  console.log("3️⃣ Testing Dashboard Data API GET /api/dashboard...");
  const dashRes = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: { Cookie: alexCookie },
  });
  assert.equal(dashRes.status, 200, "Dashboard API should return 200");
  const dashData = await dashRes.json();
  assert.ok(dashData.continueItems, "Dashboard must have continueItems");
  assert.ok(dashData.quickWins, "Dashboard must have quickWins");
  assert.ok(dashData.recommendations, "Dashboard must have recommendations");
  assert.ok(dashData.stats, "Dashboard must have stats");
  console.log(`   ✅ Dashboard loaded: ${dashData.recentItems.length} recent, ${dashData.continueItems.length} continue items`);

  // 4. Test SSRF Protection on Metadata API
  console.log("4️⃣ Testing SSRF Protection on /api/metadata...");
  const ssrfRes = await fetch(`${BASE_URL}/api/metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: alexCookie },
    body: JSON.stringify({ url: "http://127.0.0.1:8080/internal" }),
  });
  assert.equal(ssrfRes.status, 400, "Loopback URL must be blocked by SSRF filter");
  const ssrfData = await ssrfRes.json();
  assert.ok(ssrfData.blocked, "Response must flag blocked URL");
  console.log("   ✅ SSRF successfully blocked 127.0.0.1 request");

  // 5. Test Quick Save Metadata Extraction
  console.log("5️⃣ Testing Real Metadata Extraction for GitHub...");
  const metaRes = await fetch(`${BASE_URL}/api/metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: alexCookie },
    body: JSON.stringify({ url: "https://github.com/facebook/react" }),
  });
  assert.equal(metaRes.status, 200, "Metadata fetch must succeed");
  const metaData = await metaRes.json();
  assert.equal(metaData.metadata.type, "github");
  assert.ok(metaData.metadata.title.includes("facebook/react"));
  console.log(`   ✅ Metadata extracted: "${metaData.metadata.title}" (${metaData.metadata.type})`);

  // 6. Test Saving Item to Inbox
  console.log("6️⃣ Testing Save Item to Inbox POST /api/items...");
  const createRes = await fetch(`${BASE_URL}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: alexCookie },
    body: JSON.stringify({
      url: "https://github.com/facebook/react",
      title: "facebook/react — A declarative UI library",
      description: "The library for web and native user interfaces",
      domain: "github.com",
      type: "github",
      tagNames: ["react", "frontend"],
      status: "INBOX",
      note: "Test note for React UI library",
    }),
  });
  assert.equal(createRes.status, 201, "Item creation should return 201");
  const createdItem = (await createRes.json()).item;
  assert.equal(createdItem.status, "INBOX");
  console.log(`   ✅ Item saved to Inbox with ID: ${createdItem.id}`);

  // 7. Test Global ⌘K Search API
  console.log("7️⃣ Testing Global ⌘K Search GET /api/search?q=redis...");
  const searchRes = await fetch(`${BASE_URL}/api/search?q=redis`, {
    headers: { Cookie: alexCookie },
  });
  assert.equal(searchRes.status, 200, "Search API should return 200");
  const searchResults = (await searchRes.json()).results;
  assert.ok(searchResults.length > 0, "Search should return matching items");
  assert.ok(searchResults[0].matchScore > 0, "Top result must have relevance score");
  console.log(`   ✅ Search matched "${searchResults[0].title}" (Score: ${searchResults[0].matchScore})`);

  // 8. Test Item Progress & Status Update
  console.log("8️⃣ Testing Item Update PATCH /api/items/[id]...");
  const updateRes = await fetch(`${BASE_URL}/api/items/${createdItem.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: alexCookie },
    body: JSON.stringify({
      progress: 75,
      status: "IN_PROGRESS",
      isFavorite: true,
    }),
  });
  assert.equal(updateRes.status, 200, "Update item should return 200");
  const updatedItem = (await updateRes.json()).item;
  assert.equal(updatedItem.progress, 75);
  assert.equal(updatedItem.status, "IN_PROGRESS");
  assert.equal(updatedItem.isFavorite, true);
  console.log("   ✅ Progress updated to 75%, status to IN_PROGRESS, favorite toggled");

  // 9. Test Browser Extension Save API
  console.log("9️⃣ Testing Browser Extension API POST /api/v1/extension/save...");
  const extRes = await fetch(`${BASE_URL}/api/v1/extension/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: alexCookie },
    body: JSON.stringify({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      note: "Saved via browser extension 1-click test",
      tagNames: ["youtube-save"],
    }),
  });
  assert.equal(extRes.status, 201, "Extension save must return 201");
  const extData = await extRes.json();
  assert.ok(extData.item.id);
  console.log(`   ✅ Extension saved item: "${extData.item.title}"`);

  // 10. Test Multi-User Data Isolation
  console.log("🔟 Testing Strict Data Isolation between Alex and Alice...");
  const aliceLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "alice@lumora.app", password: "password123" }),
  });
  const aliceCookie = aliceLoginRes.headers.get("set-cookie").split(";")[0];

  const aliceItemsRes = await fetch(`${BASE_URL}/api/items`, {
    headers: { Cookie: aliceCookie },
  });
  const aliceItems = (await aliceItemsRes.json()).items;

  // Alice should NOT see Alex's items
  const hasAlexItems = aliceItems.some((i) => i.id === createdItem.id || i.title.includes("Redis Clone"));
  assert.equal(hasAlexItems, false, "CRITICAL: Alice must never see Alex's items!");

  // Attempting to access Alex's item directly with Alice's cookie must 404
  const breachAttemptRes = await fetch(`${BASE_URL}/api/items/${createdItem.id}`, {
    headers: { Cookie: aliceCookie },
  });
  assert.equal(breachAttemptRes.status, 404, "Alice accessing Alex's item directly must return 404 Not Found");
  console.log("   ✅ Complete Data Isolation verified: Cross-user access blocked!");

  console.log("\n🎉 ALL 10 END-TO-END TESTS PASSED WITH 100% SUCCESS!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
