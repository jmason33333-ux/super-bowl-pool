// ============================================================
// APPS SCRIPT ADDITIONS FOR GAME UPDATES + REPLIES
// ============================================================
//
// SETUP:
// 1. Create two new sheet tabs in your Google Sheet:
//    - "Updates" with headers: id | message | timestamp
//    - "Replies" with headers: updateId | name | text | timestamp
//
// 2. Add the functions below to your existing Apps Script
//
// 3. In your doGet function, add to the response object:
//      updates: getUpdates()
//    So it returns: { entries: ..., results: ..., locked: ..., updates: getUpdates() }
//
// 4. In your doPost function, add these two cases:
//      if (data.action === 'post_update') return respond(handlePostUpdate(data));
//      if (data.action === 'post_reply') return respond(handlePostReply(data));
//
// 5. Redeploy the Apps Script (Manage Deployments > edit > update version)
// ============================================================

function getUpdates() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var updSheet = ss.getSheetByName('Updates');
  var repSheet = ss.getSheetByName('Replies');
  if (!updSheet) return [];

  var updData = updSheet.getDataRange().getValues();
  var repData = repSheet ? repSheet.getDataRange().getValues() : [];
  var updates = [];

  for (var i = 1; i < updData.length; i++) {
    var row = updData[i];
    if (!row[0]) continue;
    var upd = {
      id: String(row[0]),
      message: String(row[1]),
      timestamp: String(row[2])
    };
    upd.replies = [];
    for (var j = 1; j < repData.length; j++) {
      if (String(repData[j][0]) === upd.id) {
        upd.replies.push({
          name: String(repData[j][1]),
          text: String(repData[j][2]),
          timestamp: String(repData[j][3])
        });
      }
    }
    updates.push(upd);
  }

  updates.reverse(); // newest first
  return updates;
}

function handlePostUpdate(data) {
  if (data.adminCode !== 'sblx2026') return { error: 'unauthorized' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var updSheet = ss.getSheetByName('Updates');
  if (!updSheet) {
    updSheet = ss.insertSheet('Updates');
    updSheet.appendRow(['id', 'message', 'timestamp']);
  }

  var id = 'u' + Date.now();
  updSheet.appendRow([id, data.message, new Date().toISOString()]);

  // Return full state so frontend stays in sync
  return getAllData();
}

function handlePostReply(data) {
  if (!data.updateId || !data.name || !data.text) return { error: 'missing_fields' };
  if (data.name.length > 30) return { error: 'name_too_long' };
  if (data.text.length > 280) return { error: 'text_too_long' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var repSheet = ss.getSheetByName('Replies');
  if (!repSheet) {
    repSheet = ss.insertSheet('Replies');
    repSheet.appendRow(['updateId', 'name', 'text', 'timestamp']);
  }

  repSheet.appendRow([data.updateId, data.name, data.text, new Date().toISOString()]);

  return getAllData();
}

// ============================================================
// NOTE: You likely already have a function that builds the
// response object with entries/results/locked. Just add
// "updates: getUpdates()" to it. If you don't have a shared
// helper, create one like this:
// ============================================================

function getAllData() {
  // Adapt this to match your existing code that reads entries/results/locked
  // The key addition is the "updates" field
  return {
    entries: getEntries(),     // your existing function
    results: getResults(),     // your existing function
    locked: getLocked(),       // your existing function
    updates: getUpdates()      // NEW
  };
}
