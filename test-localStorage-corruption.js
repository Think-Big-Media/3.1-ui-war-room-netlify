// Test script to validate localStorage corruption handling
console.log("🧪 Testing localStorage corruption recovery...");

// Inject malformed JSON for campaign data
localStorage.setItem('warRoomCampaignSetup', '{"campaignName": "Test", "invalid": json}');
console.log("❌ Injected invalid JSON into warRoomCampaignSetup");

// Inject malformed JSON for debug settings  
localStorage.setItem('debug-panel-settings', '{selectedEndpoint": "invalid}');
console.log("❌ Injected invalid JSON into debug-panel-settings");

// Inject malformed JSON for meta tokens
localStorage.setItem('meta_access_token', '{"token": invalid_token_format}');
console.log("❌ Injected invalid JSON into meta_access_token");

console.log("🔄 Now refresh the page to test recovery...");
console.log("✅ Expected behavior: All corrupt data should be cleared automatically");
