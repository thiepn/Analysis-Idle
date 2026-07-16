# Chapter design standard

Every chapter must define: mathematical convention/source; unique mechanic; player fantasy; primary stocks and exclusive sinks; dependency graph; project/upgrade/milestone catalogues; automation additions; active/offline behavior; capstone; Publication transform; reset map; accessible UI journey; pacing/balance gates; and tests.

A chapter is rejected if it changes only names/art/multipliers, repeats a previous capstone, adds a stock without an exclusive decision, depends on mandatory clicking, hides mathematical assumptions, creates unreachable content, or makes earlier automation irrelevant.

Content IDs are stable `<chapter>.<kind>.<slug>`. Nodes declare prerequisites, source note, requirements, approach effects, work, outputs, reset/Publication/prestige behavior, accessibility description, and tests. Mathematical edges represent actual prerequisites; gameplay-only edges are labeled as such.

Every capstone requires at least two dependency relationships and a chapter mechanic—not one currency threshold. Publication must retain, reset, compress, transform, and expose a later reuse. Each chapter introduces at most one major economy mechanic before existing controls are automated.

