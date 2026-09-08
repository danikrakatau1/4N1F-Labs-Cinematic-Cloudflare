# 4N1F Hub V7 — Visual Refinement

Scope: homepage Preview Hub only.

Goals:
- reduce nested-card and badge density
- turn FETCH / Preview Key into a restrained segmented workspace switcher
- make the Preview Key rail the primary interaction
- flatten result and status into utility rows
- reduce ambient saturation/glow and remove decorative border-beam animation
- reserve mono typography for technical identifiers/status
- keep the existing 4N1F visual identity without changing routing or semantics

Hard locks:
- `4N1F_...` remains preview-only
- `p_...` remains editable Live Editor session
- Generate remains validation/status only; Open Preview is the navigation action
- Fetch remains isolated and untouched
- no Worker/API/KV/editor logic changes
