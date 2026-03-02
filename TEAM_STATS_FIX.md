# Team Stats Fix - Admin Panel

## Problema
Ang Team Statistics sa admin panel ay hindi nag-show ng data ng members dahil may mismatch sa field names sa database query.

## Root Cause
1. **Field Name Mismatch**: Sa `moodLogs` collection, ang user ID field ay `userId` pero sa query ginagamit ang `uid`
2. **Activity Field Handling**: May dalawang possible fields - `activities` (array) at `activity` (string/array)

## Mga Ginawang Fixes

### 1. Fixed User ID Query (Line ~1330)
**Before:**
```javascript
const userLogsSnap = await db.collection('moodLogs')
  .where('uid', '==', uid)
  .get();
```

**After:**
```javascript
const userLogsSnap = await db.collection('moodLogs')
  .where('userId', '==', uid)
  .get();
```

### 2. Fixed Active Members Calculation (Line ~1350)
**Before:**
```javascript
const activeUids = new Set(logs.map(log => log.uid));
```

**After:**
```javascript
// Note: moodLogs uses 'userId' field, not 'uid'
const activeUids = new Set(logs.map(log => log.userId || log.uid));
```

### 3. Fixed Activity Distribution (Line ~1365)
**Before:**
```javascript
logs.forEach(log => {
  if (log.activity && Array.isArray(log.activity)) {
    log.activity.forEach(act => {
      activityCounts[act] = (activityCounts[act] || 0) + 1;
    });
  }
});
```

**After:**
```javascript
logs.forEach(log => {
  // Handle both 'activities' (array) and 'activity' (string or array) fields
  const acts = log.activities || log.activity || [];
  const actArray = Array.isArray(acts) ? acts : [acts];
  
  actArray.forEach(act => {
    if (act && act.trim()) {
      activityCounts[act] = (activityCounts[act] || 0) + 1;
    }
  });
});
```

## Data Structure sa Firestore

### moodLogs Collection
```javascript
{
  userId: "user123",           // ✅ Tama - hindi 'uid'
  userName: "username",
  userPhoto: "url",
  orgId: "org123",
  mood: "good",
  activity: "working",         // Legacy field
  activities: ["working"],     // New field (array)
  note: "Feeling productive",
  timestamp: 1234567890
}
```

## API Response Structure

### GET /api/org/team-stats
```javascript
{
  totalEntries: 150,
  avgEntriesPerDay: 5.0,
  activeMembers: 8,
  totalMembers: 10,
  moodDistribution: {
    rad: 45,
    good: 60,
    meh: 30,
    bad: 10,
    awful: 5
  },
  topActivities: [
    { activity: "working", count: 80 },
    { activity: "meeting", count: 45 },
    { activity: "coding", count: 30 },
    { activity: "break", count: 25 },
    { activity: "lunch", count: 20 }
  ],
  moodData: {
    "Feb 28": { rad: 5, good: 8, meh: 3, bad: 1, awful: 0 },
    "Feb 27": { rad: 6, good: 7, meh: 2, bad: 2, awful: 1 },
    // ... last 7 days
  }
}
```

## Testing
Para i-test ang fix:
1. Restart ang server: `node server.js`
2. Login as admin
3. Open Admin Panel
4. Click "Team Statistics"
5. Dapat makita na ang:
   - Total Entries count
   - Average entries per day
   - Active members count
   - Mood distribution chart
   - Top activities chart
   - 7-day mood trend chart

## Notes
- Ang endpoint ay nag-fetch ng last 30 days ng data para sa statistics
- Ang mood chart ay nag-show ng last 7 days lang
- Admin access lang ang pwede mag-access ng team stats
- Fallback mechanism para sa compound index issues
