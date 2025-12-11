# Mission Ideas for Low-Poly NPCs

These mission concepts are tailored for the existing city scene and mobile-friendly controls. They assume low-poly NPCs with simple but readable behaviors and can be slotted into the current mission panel without changing the base UI.

## 1) Courier Sprint
- **Hook:** A bike courier NPC asks you to relay urgent packages across the plaza.
- **Flow:** Pick up a package, dash across obstacles (fountain rim, benches) within a timer, drop it at a marked NPC.
- **NPC flavor:** Courier paces impatiently, checks watch when time runs low.
- **Rewards:** Coins + small speed boost consumable.
- **Why it fits:** Uses existing jump/platform tweaks around benches and fountain.

## 2) Night Watch
- **Hook:** A security guard NPC needs help checking street lamps and benches after dark.
- **Flow:** Tap lamps/benches to "inspect" hotspots; some contain sleepy NPCs to wake.
- **NPC flavor:** Guard uses flashlight sweep, nods when you complete each check.
- **Rewards:** Coins + visibility perk (longer flashlight radius) for a short duration.
- **Why it fits:** Encourages collision-aware navigation around props without combat.

## 3) Fountain Rescue
- **Hook:** A child NPC dropped their toy onto the fountain rim.
- **Flow:** Jump onto the fountain edge, grab the toy, and return it without falling in.
- **NPC flavor:** Child points toward the toy and cheers when you land safely.
- **Rewards:** Coins + reputation toward a "City Helper" badge.
- **Why it fits:** Highlights jump mechanics onto low platforms.

## 4) Bench Band
- **Hook:** Street musicians (3 low-poly buskers) want help setting up.
- **Flow:** Retrieve instrument cases from different benches; carry them back before a song starts.
- **NPC flavor:** Buskers play short riffs when you return items; idle sway animations.
- **Rewards:** Coins + temporary buff that draws nearby coins toward the player.
- **Why it fits:** Requires weaving between benches/trees with solid colliders.

## 5) Lost Tourist Trail
- **Hook:** A tourist NPC is lost and asks for a guided walk to landmarks.
- **Flow:** Lead them to 3 markers (fountain, shop row, park gate) without losing them.
- **NPC flavor:** Tourist follows at a short distance, snaps photos at each stop.
- **Rewards:** Coins + map reveal for nearby points of interest.
- **Why it fits:** Follows player around existing collision setup; no new UI needed.

## 6) Cleanup Crew
- **Hook:** City worker NPC wants trash collected from benches and tree bases.
- **Flow:** Tap to pick up litter, toss it into bins within a time limit.
- **NPC flavor:** Worker waves when a zone is cleared; idle sweeping animation.
- **Rewards:** Coins + minor stamina refill.
- **Why it fits:** Encourages pathing around props; integrates with current touch interactions.

## 7) Rooftop Signal
- **Hook:** A tech NPC needs antennas aligned on low building ledges.
- **Flow:** Jump onto low roofs/ledges, rotate signal dishes to match an on-screen arrow.
- **NPC flavor:** Tech NPC checks a handheld tablet, gives thumbs-up when aligned.
- **Rewards:** Coins + short-range radar ping for hidden pickups.
- **Why it fits:** Uses elevated but reachable platforms and jump timing.

## 8) Parkour Time Trial
- **Hook:** A rival runner challenges you to beat their route.
- **Flow:** Follow floating checkpoints over benches, fountain rim, and low walls under a timer.
- **NPC flavor:** Rival claps or taunts at start/finish; ghost replay could be added later.
- **Rewards:** Coins + a small movement buff or cosmetic trail.
- **Why it fits:** Stress-tests jump physics, platform landings, and collision boundaries.

## Implementation Notes
- Reuse the existing player store and mission panel by adding mission definitions as data objects (title, hook, steps, rewards) so UI stays stable.
- Keep mission NPCs pooled with simple idle/gesture animations and minimal pathing to avoid performance hits on mobile.
- Use existing collider setup: benches and fountain rim should already block and support landing; place mission markers near standable surfaces.
- Gate mission availability by time-of-day flags where relevant (e.g., Night Watch at night) without changing the global day/night toggle behavior.
