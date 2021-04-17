coding log for this branch - S Wu

# 4/8/2021
I think I broke the visual yarn path view? Because I modified the fillArea functions (in Draft and the Weave Directive) to take a Pattern object rather than a 2D boolean array, this might have ripple effects. I already had to change the Pattern constructor to take an optional boolean array for when fillArea is called outside of filling with a Pattern (like clear, inverting, etc.) to create a dummy pattern (id = -1).

Fixed the invert selection function, probably more to do with the merge conflict.

ISSUES:
- what happened to warp/weft adding buttons?
- yarn view is weird

IDEAS:
- for Masks tab, view each region as their color code
- lock a warp/weft system to a specific material so you toggle them together
- Circuit and Masks tab should have the "Circuit" and "Mask" menus at the top, above Design

# 3/30/2021
Something happens with a Region object, undefined shape and effect after filling from a pattern (printing to console)

# 3/29/2021 - part 2
Back to actual code, not math geekery. Work on making this happen: user makes a Selection, then fills it with a Pattern. Make the Selection's shape + Pattern = automatic Region in the "Mask" tab.

# 3/29/2021 - part 1
I have the barebones of region.ts, effect.ts, and shape.ts in the current version of AdaCAD. Minimal example: create a rectangular region with one pattern (simple Effect and simple Shape).

The only exception to simple effect = 1 pattern is if the one pattern is double weave, which creates two separate layers, each one on a paired warp-weft system. 

A separate cloth layer is formed when there is a closed set of warp-weft system interactions. In the simplest case of double weave (besides the degenerate case of plainweave single cloth), there are two weft systems (A, B) and 2 warp systems (A, B), forming two cloth layers (1, 2 -- 1 is the top layer during weaving, 2 is the bottom). To notate a warp-weft system pairing, I'll write [warp]-[weft].
layer # 	1 		2
--------------------------
combo 		A-A 	B-B
			B-B 	A-A
			A-B 	B-A
			B-A 	A-B

The four DW plainweave drafts corresponding to each combo:
(plainweave for both layers is: 1 0
								0 1 )
overlay
A 0 			A 1 		1 B 		0 B
1 B 			0 B 		A 0 		A 1

drawdown
	A B A B 	A B A B 	A B A B 	A B A B
A 	1 0 0 0 	1 1 0 1		1 1 1 0 	0 1 0 0
B 	1 1 1 0 	0 1 0 0 	1 0 0 0 	1 1 0 1
A 	0 0 1 0 	0 1 1 1		1 0 1 1 	0 0 0 1
B 	1 0 1 1 	0 0 0 1 	0 0 1 0 	0 1 1 1

For an extended example: a draft has 3 weft systems (A, B, C) and 3 warp systems (A, B, C). We can assume the warp systems will always follow that order, otherwise the cloth layers' warp densities will be uneven. Not sure about weft systems. Practically speaking, it would be easier for the weaver to stick to the same weft sequence for shuttles. The maximum number of cloth layers from system interactions is 3. If there were only 2 weft systems or 2 warp systems, the maximum would be 2, the smaller count of systems. Listing out the possible configurations of 3 layers (layer 1 is the topmost during weaving):
layer # 	1		2		3
--------------------------------
combo		A-A 	B-B 	C-C
			A-A 	B-C	 	C-B
			A-B	 	B-A	 	C-C
			A-B	 	B-C	 	C-A
			A-C	 	B-B	 	C-A
			A-C	 	B-A		C-B
and each combo has 6 permutations in layer order, for a total of 36 possible 3-layer configurations.

Each cloth layer has exactly one warp system and one weft system. For 2-layer configurations with this set, warp and weft systems are each split into two groups (assume that system order within each layer does not matter):
layer # 	1 		2 						1 		2
----------------------------				-----------------
sys groups	A 		BC 		example combos	A-BC 	BC-A
			AB 		C 						AB-AB 	C-C
			AC 		B						AC-A 	B-BC
			B 		AC
			BC 		A
			C 		AB
If both warp and weft systems can be grouped exactly like this, there are 6 x 6 = 36 possible pairings of warp/weft groupings, and 4 permutations of each pairing -> 144 possible 2-layer configurations.

# 3/26/2021
pulled most recent changed, merged from ld -> main, then main -> sw (me)

need to comment out Firebase + secrets-related stuff to serve locally (ignore changes in git repo)

I really like editing a weave in "Visual" mode with these new changes, shows yarn paths pretty accurately (selvedges excepted)
