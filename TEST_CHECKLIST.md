# New World Idle - Test Checklist

## Character Creation

### Create Characters
- [ ] Create 1st character with name "TestChar1"
- [ ] Create 2nd character with name "TestChar2"
- [ ] Create 3rd character with name "TestChar3"
- [ ] Create 4th character with name "TestChar4"
- [ ] Verify all 4 characters appear on dashboard
- [ ] Verify character slots show "4/4"

### Character Limit
- [ ] Attempt to create 5th character
- [ ] Verify error message: "Maximum 4 characters per account"
- [ ] Verify 5th character NOT created
- [ ] Verify existing 4 characters still intact

### Delete Character
- [ ] Click DELETE on 1st character (not last)
- [ ] Verify confirmation dialog appears
- [ ] Verify character name shown in dialog
- [ ] Verify bulleted list of deleted data shown
- [ ] Verify NOTE about shared storage preserved shown
- [ ] Click CANCEL - verify character NOT deleted
- [ ] Click DELETE again, then YES, DELETE
- [ ] Verify character removed from list
- [ ] Verify other 3 characters still intact
- [ ] Verify shared storage still intact

### Delete Last Character
- [ ] Delete 2nd character (now last)
- [ ] Verify WARNING about account data erasure shown
- [ ] Confirm deletion
- [ ] Verify character deleted
- [ ] Verify all account data cleared (storage, discoveries, achievements)
- [ ] Verify tutorial progress cleared

### Recreate Character
- [ ] Create new character "RecreatedChar"
- [ ] Verify character appears in list
- [ ] Verify slot count shows "2/4"
- [ ] Verify fresh character has no items/progress

---

## Offline Progress

### 1 Minute Offline
- [ ] Start an activity (profession or exploration)
- [ ] Note start time and finish time
- [ ] Wait 1 minute (or manipulate last_active_at)
- [ ] Return to game
- [ ] Verify offline progress calculated
- [ ] Verify activity completed or partially progressed

### 1 Hour Offline
- [ ] Start profession (30 min duration)
- [ ] Start exploration
- [ ] Go offline for 1 hour
- [ ] Return and login
- [ ] Verify offline progress popup appears
- [ ] Verify gold/XP earned for offline time
- [ ] Verify END attribute bonus applied
- [ ] Verify activities completed

### 24 Hours Offline
- [ ] Start multiple activities
- [ ] Go offline for 24 hours
- [ ] Return to game
- [ ] Verify offline progress popup
- [ ] Verify gold earned (capped appropriately)
- [ ] Verify multiple activities completed
- [ ] Verify no negative effects

### Bob Pass 48 Hours
- [ ] With Bob Pass active (or simulate)
- [ ] Start activity
- [ ] Go offline for 48 hours
- [ ] Return to game
- [ ] Verify extended offline cap (if implemented)
- [ ] Verify Bob Pass bonus applied
- [ ] Compare vs non-Bob Pass offline cap

---

## Professions

### Start Profession
- [ ] Navigate to Professions tab
- [ ] Select gathering profession (e.g., Woodcutting)
- [ ] Click START
- [ ] Verify activity starts
- [ ] Verify countdown timer shows
- [ ] Verify can queue 2nd profession in different category

### Queue Profession
- [ ] Start active profession
- [ ] Start queued profession (same category should fail)
- [ ] Start queued profession (different category)
- [ ] Verify queued indicator shown
- [ ] Verify "will auto-start" text shown

### Cancel Active Profession
- [ ] Start profession
- [ ] Click STOP on active profession
- [ ] Confirm cancellation
- [ ] Verify profession stopped
- [ ] Verify queued profession auto-starts
- [ ] Verify new countdown starts

### Cancel Queued Profession
- [ ] Queue a profession
- [ ] Click CANCEL on queued
- [ ] Confirm cancellation
- [ ] Verify queued removed
- [ ] Verify active still running

### Claim Profession
- [ ] Complete profession (wait for timer)
- [ ] Click CLAIM
- [ ] Verify rewards granted
- [ ] Verify XP gained
- [ ] Verify level up if applicable
- [ ] Verify queued profession auto-starts

### Profession Levels
- [ ] Complete same profession multiple times
- [ ] Verify level increases
- [ ] Verify yield improves (STR bonus)
- [ ] Verify faster completion (DEX bonus)

---

## Exploration

### Start Exploration
- [ ] Navigate to Explore tab
- [ ] Select a region (Starter Town first)
- [ ] Verify required level met
- [ ] Click EXPLORE
- [ ] Verify exploration starts
- [ ] Verify countdown shown

### Queue Exploration
- [ ] Start active exploration
- [ ] Attempt to start 2nd exploration
- [ ] Verify it queues (not starts)
- [ ] Verify queued indicator
- [ ] Verify "1 queued" shown

### Cancel Active Exploration
- [ ] Start exploration
- [ ] Click STOP on active
- [ ] Confirm cancellation
- [ ] Verify exploration stopped
- [ ] Verify queued exploration auto-starts
- [ ] Verify new countdown starts

### Complete Exploration
- [ ] Wait for exploration to complete
- [ ] Click CLAIM
- [ ] Verify gold reward
- [ ] Verify discoveries (if any)
- [ ] Verify exploration removed from list

---

## Contracts

### Generate Contracts
- [ ] Navigate to Contracts tab
- [ ] Click GENERATE (costs 25g)
- [ ] Verify 3 contracts generated
- [ ] Verify contracts have requirements
- [ ] Verify gold/KP rewards shown

### Complete Contract
- [ ] Have required items in storage
- [ ] Click COMPLETE on contract
- [ ] Verify items deducted
- [ ] Verify gold granted
- [ ] Verify KP granted (INT bonus)
- [ ] Verify daily count increases

### Contract Daily Limit
- [ ] Complete 12 contracts
- [ ] Verify 13th contract shows error
- [ ] Verify timer shows reset countdown
- [ ] Wait for reset (or verify timer logic)
- [ ] Verify can complete contracts again

### Reroll Contract
- [ ] Click REROLL on contract
- [ ] Verify gold deducted (scales with level)
- [ ] Verify new contract generated
- [ ] Verify old contract removed

---

## Achievements

### View Achievements
- [ ] Navigate to Achievements tab
- [ ] Verify achievement list shown
- [ ] Verify categories (Gathering, Exploration, etc.)
- [ ] Verify progress bars

### Claim Achievement
- [ ] Complete achievement requirements
- [ ] Verify "CLAIM" button appears
- [ ] Click CLAIM
- [ ] Verify Bob Coins granted
- [ ] Verify achievement marked claimed
- [ ] Verify title granted (if applicable)

### Achievement Counters
- [ ] Reach level 5 - verify counter
- [ ] Create 2nd character - verify counter
- [ ] Spend attribute points - verify counter

---

## Specialization

### View Specializations
- [ ] Navigate to Specialization tab
- [ ] Verify 6 paths shown
- [ ] Verify tier requirements
- [ ] Verify current specialization highlighted

### Choose Specialization
- [ ] Select a specialization path
- [ ] Verify confirmation
- [ ] Verify specialization set
- [ ] Verify tier 1 unlocked

### Tier Progression
- [ ] Meet requirements for tier 2
- [ ] Verify tier upgrade available
- [ ] Complete tier upgrade
- [ ] Verify new bonuses applied

---

## Attributes

### Assign Points
- [ ] Note current attribute values
- [ ] Click +1 on STR
- [ ] Verify STR increases by 1
- [ ] Verify attribute_points decreases by 1
- [ ] Repeat for all attributes

### Attribute Effects
- [ ] Assign STR - verify yield bonus
- [ ] Assign DEX - verify speed bonus
- [ ] Assign INT - verify KP bonus
- [ ] Assign END - verify offline bonus
- [ ] Assign LCK - verify discovery bonus
- [ ] Assign CHA - verify contract bonus

---

## Storage

### Deposit Item
- [ ] Gather resources
- [ ] Find item in storage
- [ ] Verify item quantity increases

### Withdraw Item
- [ ] Have item in storage
- [ ] Withdraw item (if withdrawal supported)
- [ ] Verify quantity decreases

### Switch Character
- [ ] Character A deposits item
- [ ] Switch to Character B
- [ ] Verify Character B can access same item
- [ ] Verify item quantity shared

### Storage Limits
- [ ] Fill storage to capacity (if any)
- [ ] Attempt to deposit more
- [ ] Verify appropriate error

---

## Discovery System

### Discover Items
- [ ] Complete exploration
- [ ] Verify discoveries found
- [ ] View in Collection tab
- [ ] Verify rarity shown
- [ ] Verify lore text available

### Region Discovery
- [ ] Explore different regions
- [ ] Verify region-specific discoveries
- [ ] Verify discovery count increases

---

## UI/UX

### Loading States
- [ ] Refresh page - verify spinner
- [ ] Switch tabs - verify spinner
- [ ] Load character - verify spinner
- [ ] No blank screens

### Tab Navigation
- [ ] Home tab shows current activities
- [ ] Professions tab functional
- [ ] Exploration tab functional
- [ ] Contracts tab functional
- [ ] Collection tab functional
- [ ] Achievements tab functional
- [ ] Specialization tab functional

### Notifications
- [ ] Complete activity - verify notification
- [ ] Error occurs - verify error shown
- [ ] Level up - verify notification

### Countdown Timers
- [ ] Home tab shows active timers
- [ ] Profession tab shows timers
- [ ] Exploration tab shows timers
- [ ] Timers update every second
- [ ] Timers reach 0 at correct time

### Cancel Confirmation
- [ ] Click cancel on activity
- [ ] Verify confirmation dialog
- [ ] Verify activity name shown
- [ ] Confirm cancels correctly
- [ ] Cancel dismisses correctly

---

## Sound

### Click Sounds
- [ ] Button clicks play sound
- [ ] Navigation plays sound

### Reward Sounds
- [ ] Complete profession - reward sound
- [ ] Complete exploration - reward sound
- [ ] Complete contract - reward sound
- [ ] Rare discovery - rare sound
- [ ] Level up - level up sound

---

## Bob Coins

### View Balance
- [ ] Check Bob Coins in header/account
- [ ] Verify correct balance shown

### Earn Bob Coins
- [ ] Claim achievement
- [ ] Verify Bob Coins increase
- [ ] Verify total updated

### Spend Bob Coins
- [ ] Generate contracts (if costs Bob Coins)
- [ ] Verify balance decreases
- [ ] Verify feature unlocked

---

## Mobile/Touch

### Touch Targets
- [ ] All buttons 44px+ touch target
- [ ] No accidental clicks

### Responsive
- [ ] 360px width - usable
- [ ] 390px width - usable
- [ ] 430px width - usable
- [ ] No horizontal scroll

### Bottom Navigation
- [ ] Bottom nav visible
- [ ] Tabs switch correctly
- [ ] Active tab highlighted

---

## Edge Cases

### Network Issues
- [ ] Slow connection - spinners shown
- [ ] Reconnect - data refreshes
- [ ] Offline indicator (if any)

### Data Consistency
- [ ] Refresh after action - data correct
- [ ] Multiple rapid clicks - no double-processing
- [ ] Cancel during completion - handled

### Browser Refresh
- [ ] Refresh page - stay logged in
- [ ] Refresh during activity - data persists
- [ ] Refresh on world page - character maintained

### Tutorial
- [ ] New character sees tutorial
- [ ] Tutorial steps complete
- [ ] Tutorial doesn't re-show on refresh
- [ ] Per-character tutorial tracking works
