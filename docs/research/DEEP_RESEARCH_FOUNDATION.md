# Analysis Idle v2 — Deep Research Foundation

**Status:** Phase 0 research package, revision 0.1  
**Repository audited:** `thiepn/Analysis-Idle` (`main`)  
**Purpose:** Establish the design, balance, progression, upgrade, prestige, replayability, and technical foundations before Codex implementation.  
**Code changes:** None.

---

# 1. Executive conclusion

Analysis Idle should not be repaired by changing costs and multipliers. Its current structure is a data-driven but fundamentally linear generator game:

1. acquire one spendable currency;
2. buy passive production;
3. purchase the next prerequisite upgrade;
4. cross a numerical chapter threshold;
5. receive another multiplier;
6. repeat the same interaction under new mathematical names.

The strongest redesign is a **hybrid strategic incremental game** built around four connected ideas:

1. **Allocate finite Attention.**  
   The player cannot maximize every activity simultaneously. Definitions, examples, exercises, and proof projects compete for limited Attention.

2. **Construct mathematical dependencies.**  
   Concepts are not merely purchased. Resources and completed ideas feed a visible dependency network in which definitions enable examples, examples expose patterns, exercises produce techniques, and techniques support proofs.

3. **Automate solved work.**  
   Repetition is initially visible, then queued, prioritized, automated, and eventually compressed. New progression should replace old decisions rather than add permanent chores.

4. **Make each chapter transform the system.**  
   Natural Numbers introduces induction chains; Integers introduces factor networks; Rational Numbers introduces equivalence and density; Real Numbers introduces bounds and completeness; Sequences introduces dynamic trajectories; Limits introduces error control.

The recommended game is not a pure clicker, a full mathematics quiz, or a passive management dashboard. It is an idle strategy game in which:

- routine execution proceeds automatically;
- the player allocates scarce capacity;
- research offers genuine branches;
- active interactions are bounded strategic opportunities;
- chapter completion permanently changes earlier systems;
- prestige changes rules and build identity rather than only multiplying production.

The first implementation must be a complete **Natural Numbers vertical slice**, not an attempt to implement the full Analysis curriculum.

---

# 2. Research methodology

## 2.1 Evidence layers

This package uses four evidence layers.

### Layer A — Genre-level evidence

Sources include academic work, genre histories, developer interviews, design talks, and aggregate achievement research.

### Layer B — Representative mechanical survey

Forty incremental games were classified by loop, progression structure, automation, prestige, replayability, and major failure risks.

### Layer C — Intensive case studies

The strongest current evidence comes from:

- Cookie Clicker;
- Universal Paperclips;
- A Dark Room;
- Antimatter Dimensions;
- Clicker Heroes;
- AdVenture Capitalist;
- Kittens Game;
- Realm Grinder;
- Trimps;
- Exponential Idle;
- Magic Research 2;
- Orb of Creation.

### Layer D — Failure analysis

The research explicitly studies:

- waiting without decisions;
- mandatory clicking;
- fake research branches;
- prestige fatigue;
- multiplier explosions;
- UI accretion;
- achievement tax;
- offline invalidation;
- monetization-driven friction.

## 2.2 Evidence labels

Throughout the report:

- **Sourced fact** means directly supported by a source or repository code.
- **Observed design pattern** means present in multiple surveyed games.
- **Inference** means a conclusion derived from those facts.
- **Recommendation** means a proposed Analysis Idle design choice.
- **Provisional parameter** means a number requiring simulation and playtesting.

## 2.3 Limitations

This is a substantial research foundation, not a claim that thousands of games were individually reverse-engineered. A broad market scan can identify patterns, but deep mechanical reconstruction should focus on representative games. Popularity does not prove quality; several commercially successful games are useful mainly as examples of friction, monetization pressure, or shallow repetition.

---

# 3. Current Analysis Idle audit

## 3.1 Existing architecture

The current project has several strengths:

- plain HTML/CSS/JavaScript modules;
- separate data files for buildings, upgrades, chapters, and achievements;
- separate systems for economy, chapters, saving, unlocks, and UI;
- versioned save migrations;
- direct GitHub Pages compatibility.

These are worth preserving conceptually.

## 3.2 Current core loop

The implemented player actions are predominantly:

- purchase a Study Work generator;
- purchase a Concept upgrade;
- change bulk quantity;
- reveal details;
- save.

The game automatically adds Understanding each animation frame and runs unlock, milestone, chapter, achievement, and UI checks continuously.

**Repository references**

- `main.js:82–100` — simulation and full UI refresh on each animation frame.
- `index.html:112–163` — the two principal shops.
- `systems/economy.js:41–74` — one primary currency and production calculation.
- `systems/upgrades.js:7–25` — research is a currency purchase.
- `systems/chapters.js:33–52` — chapter completion is automatic once conditions are met.

## 3.3 Single-resource dominance

Understanding simultaneously functions as:

- spendable currency;
- progression score;
- unlock threshold;
- chapter requirement;
- achievement threshold;
- offline reward;
- production output.

This makes most systems reducible to one question:

> What purchase increases Understanding fastest?

A single-resource game can work, but only if purchases create qualitatively different strategies. Here, most purchases produce or multiply the same output.

## 3.4 Linear research

Most chapter research follows one prerequisite chain. For example, early Natural Numbers research proceeds through Peano Axioms, Successor Function, Mathematical Induction, Addition, Multiplication, and Well-Ordering.

Consequences:

- no build identity;
- no opportunity cost;
- no meaningful respec;
- no reason to replay with a different route;
- the optimal action is usually to buy the only unlocked concept.

## 3.5 Cosmetic chapters

Chapters rename the same global Study Work groups. Definitions, Examples, Exercises, Proof Attempts, Lemmas, and Theorems remain the underlying engines.

Chapter rewards are mostly global multipliers. The chapter changes the interface language more than the decision structure.

## 3.6 Achievement tax

Most achievements are earned automatically by reaching expected thresholds or buying required content. Their default rewards add small global or building multipliers.

This causes two problems:

1. achievements are not interesting objectives;
2. many tiny multiplicative rewards make the economy harder to audit.

## 3.7 Confirmed balance instability

Representative base payback times vary drastically before synergies:

| Building | Base cost | Base production | Approximate base payback |
|---|---:|---:|---:|
| Formal Definitions | 10 | 4/s | 2.5 s |
| Key Theorems | 9,000,000 | 500,000/s | 18 s |
| Routine Exercises | 5,500 | 220/s | 25 s |
| Convergence Lemmas | 45,000,000,000 | 32,000/s | 16.3 days |
| Generalization Theorems | 12,000,000,000,000 | 100,000/s | 3.8 years |
| Epsilon Proof Drafts | 850,000,000,000 | 3,000/s | about 9 years |

Synergies may reduce effective payback, but this does not solve the problem. It transfers balance from visible base values into an opaque network of compounding multipliers.

## 3.8 Likely unowned-effect bug

`getBuildingProductionMultiplier` iterates through effects declared by every building definition. The effect application does not require the declaring building to be owned.

Parent-tier synergies can therefore activate from a source group even when the specific building that declares the effect is locked or unowned.

This must not be patched into the v2 architecture. Effects should have explicit ownership, purchase, state, and scope conditions.

## 3.9 Chapter threshold discontinuity

Primary chapter thresholds grow approximately:

- 10 thousand;
- 500 thousand;
- 15 million;
- 500 million;
- 250 billion;
- 25 trillion.

The jump into Sequences is roughly 500 times, followed by another 100-times jump into Limits, without equivalent changes in the player’s mechanical role.

## 3.10 Unlimited offline gain

Offline gain equals current production multiplied by all elapsed seconds.

Risks:

- long absence skips content;
- clock manipulation;
- no distinction between active and idle builds;
- uncontrolled progression variance;
- returning players receive resources without pending decisions.

## 3.11 UI and performance

`ui/ui.js` is approximately 1,167 lines and combines:

- event handling;
- UI state;
- DOM creation;
- rendering;
- formatting;
- progression selection;
- achievement grouping;
- effect descriptions.

The full UI refresh is invoked on every animation frame. Static sections such as achievements are rebuilt far more frequently than necessary.

## 3.12 Current audit verdict

### Preserve

- Analysis theme;
- chapter sequence;
- data-driven definitions;
- save migration discipline;
- static hosting;
- restrained academic tone.

### Replace

- single-currency generator economy;
- linear research list;
- current synergies;
- global-multiplier chapter rewards;
- achievement multiplier stack;
- unlimited offline formula;
- frame-coupled simulation;
- monolithic UI controller;
- implicit chapter selection.

---

# 4. What successful incremental games actually do

The genre is often summarized as “numbers go up,” but strong incrementals coordinate several different pleasures.

## 4.1 Rhythmic acceleration

Universal Paperclips designer Frank Lantz and designer Naomi Clark describe strong incrementals as layered mathematical rhythms: multiple bursts, plateaus, and accelerations interact like plot lines or musical phrases. The important variable is not merely growth, but **how growth changes texture**.

### Analysis Idle implication

Use a deliberately authored rhythm:

1. preparation;
2. bottleneck;
3. strategic decision;
4. breakthrough;
5. acceleration;
6. automation;
7. transformation.

Do not produce a smooth, uniform exponential curve for the entire game.

## 4.2 Role transformation

Good incrementals change what the player is responsible for.

Typical progression:

1. perform an action manually;
2. hire or unlock automation;
3. set priorities;
4. manage several automated systems;
5. design automation rules;
6. compress the solved layer.

Antimatter Dimensions uses milestone rewards to remove repetitive reset work, unlock autobuyers, preserve previous upgrades, and eventually generate prestige resources offline. This is a direct example of progression as **increased control**, not only increased output.

### Analysis Idle implication

The player should progress from:

- manually assigning Attention;
- to queuing Study Work;
- to priority allocation;
- to conditional automation;
- to chapter-level compression.

## 4.3 Phase transitions

Universal Paperclips moves from a small market simulation to planetary infrastructure and then cosmic replication. A Dark Room begins with a single fire and gradually reveals village management and world exploration.

The interface and meaning change as the player advances.

### Analysis Idle implication

Do not display the full Analysis curriculum immediately. Begin with one mathematical object and let the world unfold.

## 4.4 Intermediate persistence

Large-scale achievement analysis suggests players favor tasks requiring intermediate, justifiable persistence rather than trivial or extreme persistence.

### Analysis Idle implication

Major goals should be:

- clearly achievable;
- visibly progressing;
- demanding enough to feel earned;
- supported by intermediate decisions.

A long timer is not difficulty.

## 4.5 Autonomy and competence

Game motivation research commonly emphasizes autonomy and competence, but recent scholarship warns against using Self-Determination Theory as a shallow checklist.

### Analysis Idle implication

Do not claim that three cosmetic branch buttons create autonomy. Branches must produce different decisions and viable outcomes. Competence requires:

- understandable systems;
- feedback;
- strategy improvement;
- visible mastery;
- recoverable mistakes.

## 4.6 Optimization complexity

Formal research on Cookie Clicker shows that even a simple generator-and-upgrade structure can produce nontrivial optimization problems.

### Analysis Idle implication

Strategic depth can arise from cost, production, unlock value, and future milestones. However, complexity must remain legible. The game should calculate and display basic marginal effects while leaving higher-order planning to the player.

---

# 5. Forty-game mechanical survey

The table records the principal lesson, not a complete review.

| Game | Dominant structure | Strongest lesson | Main risk |
|---|---|---|---|
| Cookie Clicker | generator economy plus layered side systems | long-term layering and surprising transformations | achievement and system clutter |
| AdVenture Capitalist | simple businesses, managers, angels, events | clarity and rapid reward cadence | shallow decisions and monetized waiting |
| Clicker Heroes | zone progression, heroes, ascension | prestige converts walls into recovery loops | brick walls and repetitive ascensions |
| Realm Grinder | faction builds and layered resets | build identity and changing optimal strategies | extreme opacity and guide dependence |
| Antimatter Dimensions | recursive production, challenges, multiple resets | automation as progression; branch paths | high complexity and late-game UI burden |
| Kittens Game | constrained resource management | real bottlenecks and interacting production chains | slow onboarding and hidden dependencies |
| Universal Paperclips | finite narrative phases | phase transitions and thematic integration | limited replay depth after discovery |
| A Dark Room | unfolding interface and exploration | mystery, progressive disclosure, transformation | replay relies heavily on surprise |
| Candy Box 2 | incremental puzzle adventure | surprises and finite progression | limited long-term idle structure |
| Trimps | combat zones, maps, perks, portals | repeated runs with changing optimization | long-run complexity and grind |
| NGU Idle | many interacting long-term systems | sustained content and automation | feature accretion |
| Melvor Idle | RuneScape-like skills and mastery | parallel goals and offline planning | broad systems can feel disconnected |
| Idle Slayer | active platforming plus idle growth | bounded active play connected to idle systems | active requirement may dominate |
| Leaf Blower Revolution | collection, equipment, prestige | rapid novelty and collection loops | clutter and layered currencies |
| Cell to Singularity | educational evolution tree | theme-driven progression and visuals | linear museum-like progression |
| Exponential Idle | mathematical formulas and theories | theme-mechanic alignment and formal growth | equations can become passive labels |
| Synergism | many prestige layers and challenge systems | long-form systemic interaction | prestige-layer inflation |
| The Prestige Tree | branching prestige nodes | explicit dependency structure | content can become pure reset hierarchy |
| Incremental Mass Rewritten | escalating systems and layers | large-number spectacle | onboarding and comprehensibility |
| Evolve Idle | civilization management and resets | phase progression and alternative routes | long complexity ramp |
| Orb of Creation | active spell/resource crafting | expressive combinations and build construction | high cognitive load |
| Magic Research | research, combat, retirement | narrative progression and run planning | repetition before automation |
| Magic Research 2 | storylines, schools, retirement | replayable routes and discovered content | balance across many schools |
| Progress Knight | career progression and rebirth | clear long-term ladder | limited agency |
| Grimoire Incremental | spell and build choices | concise build-defining choices | small content surface |
| Farmer Against Potatoes Idle | RPG layers and challenges | many overlapping goals | feature overload |
| Unnamed Space Idle | ship systems and long automation | system specialization | dense technical interface |
| CIFI | ship and prestige layers | persistent meta-progression | long mobile-oriented grind |
| Idle Champions | formation optimization | positional build decisions | monetization and roster complexity |
| Mr. Mine | mining progression and discoveries | collection and exploration | repetitive resource extraction |
| Rusty’s Retirement | desktop companion farming | low-pressure coexistence with work | limited strategic escalation |
| The Gnorp Apologue | finite machine-like incremental | strong audiovisual feedback and compact scope | less traditional offline play |
| Reactor Idle | spatial energy economy | placement and network optimization | solved layouts |
| Idle Research | research layers and crafting | layered production chains | grind and currency proliferation |
| Anti-Idle | massive active/idle hybrid | variety and long-term experimentation | overwhelming scope |
| Shark Game | unfolding resource ecosystem | surprising expansion from simplicity | balance instability |
| Crank | hidden-system unfolding | mystery and mechanical revelation | low replay after discovery |
| Sandcastle Builder | dense, strange long-term systems | community theorycrafting | severe opacity |
| Progress Quest | fully automated satire | demonstrates that observation alone can be compelling briefly | almost no agency |
| The Longing | real-time waiting and exploration | waiting can be thematic when state visibly changes | pacing is difficult to test |
| Reactor Incremental variants | spatial generators and adjacency | local synergy creates visible strategy | dominant arrangements |
| Idle Dice | probability and upgrades | stochastic builds and reroll decisions | luck variance |
| Swarm Simulator | layered unit production | clean recursive production hierarchy | abstract repetition |

## Survey synthesis

The strongest recurring patterns are:

1. **Unfolding content** is more effective than showing all locked content.
2. **Automation rewards** are among the most satisfying upgrades.
3. **Build identity** creates replayability only when paths alter decisions.
4. **Prestige works when recovery changes**, not merely when it becomes faster.
5. **Finite or chapter-based escalation** can be stronger than endless numerical inflation.
6. **Resource bottlenecks create strategy**, but hidden dependencies create frustration.
7. **Active mechanics must be bounded** or players feel compelled to remain online.
8. **UI compression is a progression feature.**

---

# 6. Failure-pattern catalogue

| Failure | Symptom | Cause | Detection | Prevention |
|---|---|---|---|---|
| Button waiting | player has no relevant action | one resource and one next purchase | long time to next decision | parallel goals and allocation choices |
| Fake choice | several options but one dominates | comparable costs with unequal total value | simulation dominance >15–20% across all phases | situational strengths and changing bottlenecks |
| Multiplier soup | output changes unpredictably | many independent multiplicative sources | multiplier decomposition contains dozens of small factors | multiplier budget and typed stacking |
| Prestige fatigue | repeated identical opening | reset retains power but not control | actions after fifth reset match first reset | preserve automation and compress solved layers |
| Achievement tax | completionists gain mandatory power | every achievement multiplies output | global power strongly correlated with trivial achievements | cosmetic/feature rewards; limited mechanical set |
| Active invalidation | idle strategy is strictly inferior | repeatable active action has uncapped value | active player gains several times idle output | capped opportunities and stored charges |
| Offline invalidation | absence skips mechanics | unlimited offline rewards and automatic unlock cascades | return skips entire chapter | caps, pending decisions, project boundaries |
| Feature accretion | interface becomes permanent archive | old systems never compress | navigation and visible element count continually grow | chapter summaries and system abstraction |
| Guide dependency | player cannot compare options | hidden formulas and nonlinear effects | community calculator required for basic choice | visible marginal gain and payback |
| Resource orphaning | old currencies lose purpose | new chapter replaces rather than transforms them | resource has no meaningful sink | conversion, compression, or retirement |
| Arbitrary wall | progress stops without strategy | threshold selected independently of economy | no viable action changes completion time | tune using policy simulation |
| Clicking exploit | autoclicker is optimal | uncapped manual resource action | click frequency predicts progression | remove repetitive clicking |
| Branch trap | early choice permanently damages save | no respec and unequal scaling | poor branch cannot recover | chapter respec and clear trade-offs |
| Notification flood | progress feels administrative | each automatic threshold opens a modal | many alerts after offline return | summarized return report |
| Numerical failure | Infinity/NaN/save corruption | uncontrolled exponents | simulation reaches non-finite state | magnitude budget and numeric assertions |

---

# 7. Three candidate redesigns

## 7.1 Candidate A — Strategic Attention Allocation

### Loop

- Player has limited Attention.
- Attention is assigned to Definitions, Examples, Exercises, and current Projects.
- Activities produce distinct resources.
- Research and proofs consume combinations.
- Automation gradually manages assignments.

### Strengths

- inherently creates opportunity cost;
- strong idle compatibility;
- easy to simulate;
- supports active, hybrid, and idle builds;
- mathematically thematic.

### Weaknesses

- can become a spreadsheet;
- frequent allocation changes may become micromanagement;
- chapter mechanics need more than renamed lanes.

## 7.2 Candidate B — Proof Dependency Network

### Loop

- Player constructs a visible network of definitions, examples, lemmas, and theorems.
- Nodes produce or amplify connected nodes.
- Different graph topologies create builds.
- Chapter capstones require a valid dependency structure.

### Strengths

- strongest mathematical integration;
- spatial and visual strategy;
- high build expression;
- old concepts can support later chapters.

### Weaknesses

- difficult mobile UX;
- balancing network topology is complex;
- can resemble a puzzle more than an idle game;
- risk of solved optimal layouts.

## 7.3 Candidate C — Research Management Campaign

### Loop

- Select concurrent research projects.
- Allocate staff/Attention and resources.
- Projects complete over time.
- Discover story events and chapter mechanics.
- Publish findings for permanent progress.

### Strengths

- strong return loop;
- clear project anticipation;
- easy narrative integration;
- bounded active play.

### Weaknesses

- may become queue management;
- less distinctive unless projects interact deeply;
- waiting can dominate.

## 7.4 Weighted evaluation

Weights:

- core-loop depth: 20%;
- idle suitability: 15%;
- mathematical fit: 15%;
- replayability: 15%;
- balance feasibility: 15%;
- mobile usability: 10%;
- solo implementation feasibility: 10%.

| Candidate | Weighted score / 10 |
|---|---:|
| Attention Allocation | 8.2 |
| Dependency Network | 7.7 |
| Research Management | 7.6 |

## 7.5 Selected hybrid

Use Attention Allocation as the stable economy, Research Projects as the session loop, and a simplified Dependency Map as chapter structure.

This avoids turning the entire game into either a generator list or a graph puzzle.

---

# 8. Recommended Analysis Idle v2 design

## 8.1 Design pillars

### Pillar 1 — Solve decisions, automate repetition

A task begins manually only while the player is learning it. Repeated execution becomes queued, prioritized, automated, and compressed.

**Test:** If the player must repeat an unchanged action ten times, the design needs an automation path.

### Pillar 2 — Finite Attention creates meaningful choice

The player cannot maximize Definitions, Examples, Exercises, and Projects simultaneously.

**Test:** At every major phase, at least two plausible allocations must exist.

### Pillar 3 — Knowledge is a dependency structure

The game models how mathematical work supports later work.

**Test:** Removing the Analysis theme must damage the mechanics, not merely the names.

### Pillar 4 — Chapters change rules

Each chapter introduces a new optimization problem.

**Test:** A chapter is rejected if it only adds new costs, resources, or multipliers.

### Pillar 5 — Mastery increases control

Permanent progression grants automation, forecasting, and compression before raw multipliers.

**Test:** At least half of major permanent rewards must alter control or rules.

### Pillar 6 — Active play redirects, idle play executes

Active players make more timely or skillful decisions, but cannot farm unlimited advantage.

**Test:** Sustained active play should generally improve progress by roughly 15–35%, not several hundred percent.

---

# 9. Core resource architecture

## 9.1 Attention

**Type:** fixed capacity  
**Function:** allocated among activities and projects  
**Primary decision:** where work occurs  
**Persistence:** base capacity persists; temporary allocations reset on major prestige  
**Offline behavior:** saved allocation remains active

Attention is not a conventional spendable currency. It represents limited simultaneous effort.

## 9.2 Precision

Produced mainly by Definitions.

Used for:

- formal concepts;
- proof validity;
- reducing project uncertainty;
- Rigor-branch upgrades.

## 9.3 Intuition

Produced mainly by Examples and visual investigations.

Used for:

- discovering candidate projects;
- active Insight opportunities;
- reducing failed-project risk;
- Intuition-branch upgrades.

## 9.4 Technique

Produced mainly by Exercises.

Used for:

- proof methods;
- automation;
- repeatability;
- Practice/Automation branch upgrades.

## 9.5 Understanding

**Recommended role:** cumulative chapter progress and unlock measure, not the universal spendable currency.

Understanding rises when:

- concepts are mastered;
- proofs complete;
- capstones are published;
- chapter mechanics are solved.

This prevents all systems from collapsing into one ROI calculation.

## 9.6 Insight

A limited, spendable strategic resource produced by:

- bounded active interactions;
- offline return decisions;
- unusual discoveries;
- selected upgrades.

Uses:

- temporarily redirecting Attention;
- accelerating one project;
- changing a project condition;
- respec;
- unlocking optional side research.

Insight should have a storage cap so active opportunities cannot be farmed indefinitely.

## 9.7 Axioms

Major prestige currency.

Axioms should buy:

- starting automation;
- persistent project slots;
- framework choices;
- branch flexibility;
- challenge modifiers;
- chapter compression.

Raw global multipliers should be a minority of Axiom upgrades.

---

# 10. Activity and project model

## 10.1 Production

For activity \(i\):

\[
R_i = A_i \cdot B_i \cdot M_i \cdot D(A_i)
\]

where:

- \(A_i\) is allocated Attention;
- \(B_i\) is base production;
- \(M_i\) is the product of explicitly typed effects;
- \(D(A_i)\) is a visible diminishing-return function.

A provisional diminishing-return function:

\[
D(A_i) = A_i^{-0.10}
\]

therefore:

\[
R_i = B_i A_i^{0.90} M_i
\]

This rewards concentration without making all-in allocation always optimal.

## 10.2 Projects

A project has:

- prerequisite concepts;
- input resources;
- work requirement;
- assigned Attention;
- one or more optional modifiers;
- output;
- chapter significance.

Project progress:

\[
\Delta W = S \cdot A_p^{0.85}\Delta t
\]

where \(A_p\) is project Attention.

This creates a genuine decision:

- allocate more Attention to finish the current project;
- or continue producing resources for the next project.

## 10.3 No random proof failure in the base game

Random failure would punish offline play and create frustration.

Instead:

- insufficient Precision increases project work;
- insufficient Intuition hides optional shortcuts;
- insufficient Technique prevents automation;
- challenge modes may introduce controlled uncertainty.

---

# 11. Upgrade architecture

## 11.1 Upgrade families

### Routine upgrades

Small, transparent improvements to one activity.

Purpose:

- smooth short-term pacing;
- provide frequent purchases.

Power target:

- approximately 8–20% local improvement.

### Milestone upgrades

Unlocked at meaningful ownership, mastery, or project thresholds.

Purpose:

- create visible breakpoints;
- reward planning.

Power target:

- approximately 25–100%, or a small rule change.

### Automation upgrades

Examples:

- queue a project;
- maintain a target resource reserve;
- automatically shift Attention when a project completes;
- purchase routine upgrades under a priority rule;
- execute chapter-specific repetitive steps.

These should be among the most desirable upgrades.

### Conversion upgrades

Change relationships between resources.

Examples:

- completed Examples generate a small amount of Precision;
- unused Technique improves project speed;
- excess Precision is converted into proof stability.

Conversion rates need soft caps to prevent positive-feedback explosions.

### Branch upgrades

Three first-run branches are recommended.

#### Rigor

- stronger Precision;
- lower proof work requirement;
- better Axiom yield from difficult capstones;
- slower discovery of shortcuts.

#### Intuition

- stronger Intuition;
- larger bounded active rewards;
- faster discovery of optional projects;
- weaker fully offline efficiency.

#### Automation

- stronger Technique;
- earlier queue and conditional allocation;
- best unattended consistency;
- weaker active-event value.

No branch should dominate every phase.

### Keystone upgrades

A keystone must change a rule.

Examples:

- **Formal Closure:** completed Definitions permanently reduce related proof work.
- **Counterexample Engine:** excess Examples create Counterexamples that reveal cheaper proof routes.
- **Practice Compiler:** repeated Exercises become automated Techniques.
- **Lemma Reuse:** one completed lemma may support multiple queued proofs.
- **Stored Insight:** inactive active-opportunity charges accumulate up to a cap.
- **Chapter Compression:** published Natural Numbers work is represented by one automated Foundation node in later chapters.

### Information upgrades

Information can be progression.

Examples:

- show marginal production;
- show exact project completion time;
- show resource deficit forecast;
- show estimated prestige recovery;
- show branch comparison.

Do not hide basic facts merely to sell clarity. Information upgrades should reveal strategic forecasting, not essential usability.

## 11.2 Upgrade tiers

| Tier | Expected function |
|---|---|
| Routine | smoothing and local efficiency |
| Meaningful | alters current allocation or project choice |
| Major | changes chapter strategy |
| Capstone | enables chapter completion |
| Transformative | adds automation, conversion, or a new rule |
| Prestige | changes future runs |

## 11.3 Stacking rules

Use explicit categories:

1. base values;
2. additive flat changes;
3. additive percentage within a category;
4. one multiplicative product per named category;
5. exponent or formula changes;
6. soft caps.

Display the decomposition.

Avoid dozens of independent \(1.003\times\) multipliers.

## 11.4 Upgrade comparison UI

For each upgrade, show:

- affected system;
- current value;
- post-purchase value;
- absolute and percentage gain;
- estimated payback where meaningful;
- unlock consequences;
- reset behavior.

---

# 12. Natural Numbers vertical slice

## 12.1 Chapter mechanic — Induction Chain

The chapter centers on constructing proof chains:

1. establish a base case;
2. build a successor relationship;
3. create reusable induction steps;
4. prove increasingly general statements;
5. publish the Well-Ordering capstone.

The interaction is not an exam question. It is a system of dependencies and resource allocation.

## 12.2 Chapter progression

### Stage 1 — First principles

Visible:

- Attention;
- Definitions;
- Precision;
- first Definition project.

The player makes the first allocation within seconds.

### Stage 2 — Examples

Examples and Intuition unfold after the first Definition.

The player chooses whether to:

- continue formal production;
- investigate examples;
- split Attention.

### Stage 3 — Exercises

Technique appears after the first pattern is recognized.

The first three-resource project creates the first meaningful allocation problem.

### Stage 4 — Branch choice

Rigor, Intuition, or Automation.

The branch is respecable once before chapter publication, at an Insight cost.

### Stage 5 — Proof projects

Projects compete with resource generation for Attention.

### Stage 6 — Capstone

The Well-Ordering / Induction capstone combines:

- prerequisite concepts;
- resource stockpiles;
- project work;
- one optional chapter-specific optimization.

### Stage 7 — Publication

Publishing:

- completes the chapter;
- compresses routine Natural Numbers work;
- unlocks Integers;
- grants Mastery;
- reveals the major prestige system without necessarily forcing a reset.

## 12.3 Provisional first-chapter timings

Target, subject to full simulation:

| Milestone | Active optimizer | Hybrid | Mostly idle |
|---|---:|---:|---:|
| first allocation | 5–15 s | 5–15 s | 5–15 s |
| second activity | 45–90 s | 1–2 min | 2–4 min |
| first real branch | 4–7 min | 6–10 min | 12–20 min |
| first proof project | 8–14 min | 12–20 min | 25–45 min |
| chapter capstone | 25–40 min | 35–60 min | 1.5–3 h |
| publication | 30–50 min | 45–75 min | 2–4 h |

These targets intentionally prevent the first chapter from becoming a multi-day wait.

---

# 13. Preliminary deterministic model

A simplified prototype model was simulated with:

- six Attention;
- Precision, Intuition, and Technique production;
- seven sequential core/capstone projects;
- project Attention competing with production Attention;
- three branches;
- bounded active Insight events every two minutes.

This is not final balance. It tests whether the proposed architecture can produce reasonable pacing.

## 13.1 Provisional result

Approximate Natural Numbers capstone time:

| Policy | No active opportunities | Bounded active opportunities |
|---|---:|---:|
| Balanced | 35.3 min | 28.8 min |
| Rigor | 32.4 min | 26.6 min |
| Intuition | 33.7 min | 26.7 min |
| Automation | 31.4 min | 28.3 min |

## 13.2 Interpretation

- branch spread is limited enough that no branch is immediately invalid;
- active play improves completion by roughly 10–20%, not several times;
- Automation performs best unattended but does not dominate active play;
- Rigor and Intuition produce similar active completion through different mechanisms.

## 13.3 What remains to validate

The complete simulator must include:

- project queues;
- upgrade costs;
- milestone timing;
- resource reserves;
- player mistakes;
- offline caps;
- chapter publication;
- multiple runs;
- branch respec;
- major prestige;
- sensitivity analysis.

---

# 14. Active gameplay

## 14.1 Stored Insight opportunities

Instead of random events requiring constant screen attention:

- an Insight charge generates periodically;
- charges store up to a cap;
- the player may resolve them later;
- different branches change the resolution.

Possible Natural Numbers opportunity:

> Choose which link in an induction chain receives temporary focus.

Options could include:

- strengthen the base case;
- shorten the induction step;
- discover a reusable lemma.

The reward changes strategy rather than simply granting currency.

## 14.2 Active reward budget

Recommended active advantage:

- casual use: 5–15%;
- engaged strategic use: 15–30%;
- highly skilled use: normally below 40% over a long horizon.

No repeatable tapping reward.

---

# 15. Automation progression

## Stage 0 — Direct control

The player assigns Attention and starts projects.

## Stage 1 — Queue

One future project may be queued.

## Stage 2 — Completion rule

When a project completes, Attention returns to a selected activity.

## Stage 3 — Reserve rules

Examples:

- keep at least 100 Precision;
- prioritize Technique until the next project becomes affordable.

## Stage 4 — Priority profile

The player orders activities and projects.

## Stage 5 — Build templates

Save Rigor, Intuition, and Automation profiles.

## Stage 6 — Chapter compression

Published chapters become summarized Foundation modules.

Automation is retained through prestige unless a challenge explicitly removes it.

---

# 16. Prestige design

## 16.1 Separate local publication from major prestige

A chapter ending should not always erase the game.

### Publication

- local chapter completion;
- permanent chapter Mastery;
- compresses solved work;
- advances the campaign.

### Reaxiomatization

- major prestige after the player has experienced enough systems;
- likely after Real Numbers or the first complete Foundations arc;
- grants Axioms;
- allows alternative frameworks and challenge runs.

This avoids forcing repeated Natural Numbers runs before the player has seen meaningful content.

## 16.2 Prestige purpose

Reaxiomatization should:

- change the starting framework;
- unlock branch combinations;
- improve automation;
- alter chapter interactions;
- enable challenge modifiers;
- accelerate solved content through compression.

## 16.3 Prestige formula

Do not base Axioms solely on lifetime Understanding.

A candidate score:

\[
S =
w_c C +
w_m M +
w_p \log_{10}(1 + P) +
w_e E
\]

where:

- \(C\) = completed chapter capstones;
- \(M\) = optional mastery objectives;
- \(P\) = cumulative proof value;
- \(E\) = efficiency/challenge contribution.

Then:

\[
A = \left\lfloor \left(\frac{S}{K}\right)^{0.65} \right\rfloor
\]

This rewards breadth and mastery while preserving diminishing returns.

## 16.4 Prestige decision UI

Show:

- Axioms gained now;
- next Axiom threshold;
- retained automation;
- compressed chapters;
- estimated recovery;
- current unfinished mastery goals.

## 16.5 Anti-fatigue rule

By the fifth major reset:

- the first chapter should begin substantially automated;
- the player should select a framework/build rather than repeat tutorial actions;
- prior chapter work should appear as configurable summarized modules.

---

# 17. Achievements

## 17.1 Categories

### Progression

Recognize major discoveries. Mostly non-mechanical.

### Strategy

Examples:

- complete a project using no more than two Attention;
- publish with all three resources within 5% balance;
- complete a chapter through each branch.

### Optimization

Examples:

- beat a project time without using an active Insight;
- maintain a reserve while completing two projects.

### Restraint

Examples:

- publish without a routine production upgrade;
- solve using a low-Attention configuration.

### Discovery

Hidden only when the discovery itself is enjoyable.

### Mastery

Difficult optional objectives that unlock challenge modifiers or cosmetics.

## 17.2 Reward policy

Recommended distribution:

- 60–70% cosmetic, record, or profile rewards;
- 20–30% feature/challenge unlocks;
- at most 10–15% small mechanical rewards.

Do not make every achievement a permanent multiplier.

---

# 18. Challenges

Challenges should alter rules and teach systems.

## Natural Numbers examples

### Sparse Foundations

Attention cap is reduced.

**Lesson:** concentration and project timing.

### No Examples

Intuition must come from proof attempts and Counterexamples.

**Lesson:** alternative resource conversion.

### Constructive Route

Certain nonconstructive shortcuts are unavailable.

**Lesson:** branch adaptation.

### Fixed Allocation

Attention allocation may only change after project completion.

**Lesson:** planning.

Rewards should be:

- automation options;
- new framework nodes;
- cosmetics;
- limited permanent utility.

Main progression must not require every challenge.

---

# 19. Offline progression

## 19.1 Recommended model

- 100% analytical production for the first 8 hours;
- declining efficiency from 8 to 48 hours;
- no additional routine production beyond 48 hours initially;
- cap can expand through utility upgrades;
- projects may complete offline;
- the simulation stops at the first unresolved strategic decision if no automation rule exists.

This is critical:

> Offline time may execute the player’s plan, but should not make new strategic choices for them.

## 19.2 Return summary

One screen should show:

- elapsed time;
- resources gained;
- completed projects;
- Attention behavior;
- cap reached;
- decisions waiting;
- suggested but nonbinding next actions.

No modal cascade.

## 19.3 Clock protection

- reject negative elapsed time;
- record monotonic session duration where available;
- cap single-gap credit;
- record suspicious jumps without punishing normal players;
- never let invalid timestamps corrupt saves.

---

# 20. Chapter mechanics

| Chapter | Central mechanic | New decision | Permanent transformation |
|---|---|---|---|
| Foundations/Logic | dependency validity | which assumptions support a project | global condition engine introduced diegetically |
| Natural Numbers | induction chains | concentration versus preparation | recurring proof patterns automate |
| Integers | factor/divisibility network | general production versus specialized factors | reusable algorithms |
| Rational Numbers | equivalence and density | precision versus representation complexity | conversion systems |
| Real Numbers | upper/lower bounds | tighten bounds or explore candidates | soft caps become explicit mechanics |
| Sequences | dynamic trajectories | boundedness, monotonicity, subsequences | time-dependent systems |
| Limits | epsilon-delta error control | allocate error budget | precision forecasting |
| Continuity | connect local behaviors | coverage versus strength | network interactions |
| Differentiation | local rate optimization | short-term acceleration versus stability | derivative-based automation |
| Integration | partition and accumulation | resolution versus cost | accumulated offline planning |
| Infinite Series | convergence and remainder | test selection and truncation | postgame infinite optimization |

A chapter must be rejected if its implementation cannot identify:

- one new decision;
- one new automation;
- one transformed prior system;
- one visible mathematical mechanic.

---

# 21. UI architecture

## 21.1 First minute

Display only:

- current chapter object;
- Attention;
- one activity;
- one clear objective.

## 21.2 Progressive navigation

Recommended desktop navigation:

- Overview;
- Study;
- Projects;
- Concepts;
- Chapter Map;
- Records;
- Settings.

Recommended mobile navigation:

- Overview;
- Study;
- Projects;
- More.

Locked future chapters should be represented on a compact map, not as hundreds of rows.

## 21.3 Visual mathematics

Use visual state representations:

- induction dependency chain;
- factor graph;
- nested interval visualization;
- sequence plot;
- epsilon neighborhood;
- tangent approximation;
- Riemann partition;
- partial-sum plot.

Visuals must expose mechanics.

## 21.4 Math rendering

Use KaTeX or an equivalent tested renderer.

Requirements:

- correct inline/display math;
- mobile overflow handling;
- accessible text alternatives;
- no raw LaTeX visible to players;
- consistent notation.

---

# 22. Technical architecture

## 22.1 Recommended stack

- TypeScript;
- Vite;
- Preact or React;
- framework-independent simulation core;
- Zod or equivalent schema validation;
- Vitest;
- Playwright;
- KaTeX;
- a large-number library only if simulations prove native numbers insufficient.

Preact is attractive for bundle size; React may be easier for Codex and tooling. Either is acceptable if the simulation remains independent.

## 22.2 Architecture

```text
content definitions
        ↓
validated configuration
        ↓
commands → deterministic state reducer
        ↓
derived selectors
        ↓
UI components
```

## 22.3 Canonical state

Store:

- resources;
- Attention allocations;
- projects;
- concepts;
- chapter state;
- automation rules;
- achievements;
- prestige;
- records;
- save metadata;
- deterministic RNG state.

Do not store values that can be derived.

## 22.4 Central condition engine

One engine must support:

- unlocks;
- objectives;
- milestones;
- achievements;
- project prerequisites;
- challenges;
- prestige.

It must provide:

- boolean evaluation;
- progress;
- description;
- dependency validation.

## 22.5 Typed effect engine

Example effect categories:

- `production.add`;
- `production.multiply`;
- `production.power`;
- `cost.multiply`;
- `project.speed`;
- `capacity.add`;
- `conversion.add`;
- `automation.unlock`;
- `offline.cap`;
- `rule.replace`.

Every effect declares:

- source;
- activation condition;
- target;
- stacking group;
- reset layer.

This prevents the current unowned-effect problem.

## 22.6 Simulation timing

- deterministic fixed simulation step for non-analytical systems;
- analytical integration for simple production;
- UI refresh around 4–10 times per second;
- event-driven static panels;
- maximum catch-up step;
- bounded offline calculation.

## 22.7 Save design

- key: `analysis-idle:v2:save`;
- save schema version;
- import/export;
- local rotating backups;
- checksum;
- corruption recovery;
- v1 archive detection;
- no automatic destructive conversion.

Recommended legacy treatment:

- preserve v1 save separately;
- grant a non-power “First Principles” founder record;
- start the v2 economy clean.

## 22.8 Testing

Mandatory:

- effect activation;
- stacking;
- bulk cost;
- project completion;
- offline cap;
- clock anomalies;
- save migration;
- chapter reachability;
- challenge solvability;
- branch viability;
- numerical finiteness;
- keyboard and mobile flows.

---

# 23. Balance tooling

Codex should build tools before large content expansion.

Required:

1. headless simulation CLI;
2. policy definitions;
3. purchase/project timeline;
4. time-to-milestone report;
5. branch comparison;
6. multiplier decomposition;
7. dead-content detector;
8. dependency-cycle detector;
9. offline-return simulator;
10. sensitivity runner;
11. save-state generator;
12. in-game debug panel;
13. time acceleration;
14. deterministic replay.

## 23.1 Policy set

Simulate:

- cheapest available;
- shortest immediate payback;
- next-milestone saver;
- Rigor specialist;
- Intuition specialist;
- Automation specialist;
- balanced;
- active optimizer;
- mostly idle;
- poor but plausible allocation;
- long-offline returner.

---

# 24. Development roadmap

## Phase 0 — Authoritative specifications

Deliver:

- final GDD;
- final balance specification;
- Natural Numbers content catalogue;
- technical specification;
- QA checklist;
- simulator design.

## Phase 1 — Engine and simulator

No polished game content yet.

Acceptance:

- deterministic state transitions;
- effect/condition validation;
- headless simulations;
- save schema;
- CI.

## Phase 2 — Natural Numbers vertical slice

Acceptance:

- complete first chapter;
- three viable branches;
- bounded active play;
- automation stages 0–3;
- chapter publication;
- mobile and desktop;
- full tests;
- no dead interval beyond targets.

## Phase 3 — Prestige proof

Implement Reaxiomatization prototype or a smaller replay framework.

Acceptance:

- repeated run differs;
- automation survives;
- fifth-run opening is compressed;
- no universal branch dominance.

## Phase 4 — Integers

Must add a factor-network mechanic, not more generator rows.

## Phase 5 — Rational and Real Numbers

Validate resource conversions, explicit bounds, and first major framework prestige.

## Phase 6 — Sequences and Limits

Add dynamic mathematical visualizations.

## Phase 7 — Calculus and postgame

Only after complexity and UI remain controlled.

---

# 25. Risk register

| Risk | Severity | Mitigation |
|---|---:|---|
| Attention allocation becomes micromanagement | high | queues, reserve rules, minimum project duration, automation |
| three resources feel arbitrary | high | each resource must have distinct mechanical function |
| mathematical systems become school exercises | high | use abstractions and optional learning layers |
| branch dominance | high | policy simulation and phase-specific strengths |
| prestige repeats tutorial | critical | retain automation and compress publications |
| scope explosion | critical | one-chapter vertical slice gate |
| UI becomes another dashboard | high | progressive disclosure and chapter compression |
| active play becomes mandatory | high | stored charges and reward budget |
| offline skips content | high | stop at unresolved decisions |
| effect stack becomes opaque | high | typed stacking groups and decomposition |
| content inaccuracies | medium/high | mathematical content review checklist |
| Codex rewrites architecture unpredictably | high | frozen specs, phase prompts, acceptance tests |
| large-number dependency added prematurely | medium | magnitude simulation first |

---

# 26. Red-team fun review

## Skeptical idle veteran

Potential quit reason:

- allocation system is shallow and one ratio is optimal.

Required countermeasure:

- changing bottlenecks, branch interactions, project timing, challenges.

## Casual player

Potential quit reason:

- three resources and projects appear at once.

Countermeasure:

- unfold one activity at a time.

## Mobile player

Potential quit reason:

- excessive tables and graph navigation.

Countermeasure:

- compact overview, touch allocation controls, responsive dependency map.

## Mathematics student

Potential quit reason:

- concepts are inaccurate or superficial.

Countermeasure:

- optional formal layer and expert audit.

## Player uninterested in mathematics

Potential quit reason:

- game reads like a textbook.

Countermeasure:

- mechanics remain understandable through visual systems and plain language.

## Min-maxer

Potential quit reason:

- hidden formulas or solved universal path.

Countermeasure:

- visible marginal effects, several phase-dependent builds, simulator validation.

## Returning player

Potential quit reason:

- dozens of completed actions with no clear next decision.

Countermeasure:

- consolidated offline report and pending-decision focus.

---

# 27. Preliminary approval score

| Category | Score |
|---|---:|
| Core-loop depth | 8.2 |
| Idle suitability | 8.5 |
| Meaningful choice | 8.3 |
| Progression pacing | 8.0 provisional |
| Upgrade quality | 8.4 |
| Build diversity | 8.0 provisional |
| Prestige quality | 8.2 conceptually |
| Achievement quality | 8.1 |
| Replayability | 8.1 |
| Chapter identity | 8.8 |
| Mathematical integration | 9.0 |
| Onboarding | 8.0 |
| Mobile usability | 7.8 |
| Accessibility | 8.0 |
| Technical feasibility | 8.3 |
| Balance stability | 7.6 pending full simulator |
| Content expandability | 8.7 |
| Originality | 8.6 |
| Ethical engagement | 9.0 |
| Resistance to boring wait-and-click failure | 8.3 |

The design is **not yet approved for full implementation** because balance stability remains below 8 until the complete simulator covers upgrades, publication, offline progress, and repeated runs.

It is approved for:

1. finalizing the Natural Numbers specification;
2. implementing the headless engine and simulator;
3. producing the Phase 1 Codex prompt after those specifications are frozen.

---

# 28. Immediate design decisions

## Adopt

- finite Attention;
- three functional chapter resources;
- projects competing with production;
- three branch identities;
- automation as core progression;
- bounded stored active opportunities;
- chapter publication;
- delayed major prestige;
- typed effect and condition engines;
- Natural Numbers vertical slice.

## Reject

- universal spendable Understanding;
- continuous manual clicking;
- one long research chain;
- every achievement granting production;
- unlimited offline gain;
- one global prestige multiplier;
- permanent display of all old content;
- all chapters implemented at once;
- balance by intuition alone.

## Keep provisional

- exact first chapter costs;
- exact offline cap;
- first major prestige location;
- Axiom formula;
- number of Attention points;
- final choice between Preact and React;
- need for a large-number library.

---

# 29. Source registry

## Genre and research

1. **Complexity of Popularity and Dynamics of Within-Game Achievements in Computer Games**  
   https://arxiv.org/abs/2404.15295

2. **Cookie Clicker — algorithmic strategy analysis**  
   https://arxiv.org/abs/1808.07540

3. **Designing Game Feel: A Survey**  
   https://arxiv.org/abs/2011.09201

4. **Self-Determination Theory and HCI Games Research: Unfulfilled Promises and Unquestioned Paradigms**  
   https://arxiv.org/abs/2405.12639

5. **Exploring Player Motivation in Educational Interactive Narratives**  
   https://arxiv.org/abs/2505.08891

6. **Incremental game — genre history and mechanics summary**  
   https://en.wikipedia.org/wiki/Incremental_game

## Case studies

7. **Cookie Clicker overview and mechanics**  
   https://en.wikipedia.org/wiki/Cookie_Clicker

8. **Universal Paperclips overview**  
   https://en.wikipedia.org/wiki/Universal_Paperclips

9. **The Unexpected Philosophical Depths of the Clicker Game Universal Paperclips**  
   https://www.newyorker.com/culture/culture-desk/the-unexpected-philosophical-depths-of-the-clicker-game-universal-paperclips

10. **The Way the World Ends: Not with a Bang But a Paperclip**  
    https://www.wired.com/story/the-way-the-world-ends-not-with-a-bang-but-a-paperclip

11. **A Dark Room overview and development**  
    https://en.wikipedia.org/wiki/A_Dark_Room

12. **Clicker Heroes overview and mechanics**  
    https://en.wikipedia.org/wiki/Clicker_Heroes

13. **AdVenture Capitalist overview**  
    https://en.wikipedia.org/wiki/AdVenture_Capitalist

14. **Antimatter Dimensions official source — Eternity milestones**  
    https://github.com/IvarK/AntimatterDimensionsSourceCode/blob/master/src/core/secret-formula/eternity/eternity-milestones.js

15. **Antimatter Dimensions official source — Time Studies**  
    https://github.com/IvarK/AntimatterDimensionsSourceCode/blob/master/src/core/secret-formula/eternity/time-studies/normal-time-studies.js

## Current repository

16. **Analysis Idle repository**  
    https://github.com/thiepn/Analysis-Idle

Key audited files:

- `main.js`
- `data/buildings.js`
- `data/upgrades.js`
- `data/chapters.js`
- `data/achievements.js`
- `systems/economy.js`
- `systems/buildings.js`
- `systems/upgrades.js`
- `systems/chapters.js`
- `systems/unlocks.js`
- `systems/save.js`
- `systems/achievements.js`
- `systems/milestones.js`
- `systems/research.js`
- `ui/ui.js`
- `ui/notifications.js`
- `style.css`
- `utils/format.js`

---

# 30. Final answer to the governing question

> If all visual polish and mathematical flavor were removed, would the selected design still be strategically satisfying?

**Potentially yes, but only if the full simulation confirms that:**

- allocation choices remain situational;
- branch differences persist across phases;
- project timing creates opportunity cost;
- automation changes the player’s role;
- publication and prestige compress repetition;
- offline execution stops at strategic boundaries;
- active play remains bounded.

The current Analysis Idle fails that test. The proposed hybrid has the necessary structural ingredients to pass it, but full implementation should not begin until the Natural Numbers economy and repeated-run model pass the simulator and red-team gates.
