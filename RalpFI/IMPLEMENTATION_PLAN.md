# Implementation Plan

> **Ralph Workflow**: Do tasks in order. One at a time. Update this file after each commit.

## Current Status

**Phase**: 0 - Discovery
**Progress**: 0 / 35 tasks
**Last Completed**: None

---

## Project: F1 Live Race Prediction

**Type**: Brownfield (adding to existing codebase)
**Target**: `D:\f1-race-replay`

### Features to Build
1. **PRED-01**: Win Probability Display - Real-time win probability for each driver
2. **PRED-02**: Pit Window Predictor - Optimal pit windows with "pit now" recommendations
3. **PRED-03**: Position Change Alerts - Imminent overtake predictions and danger zones
4. **PRED-04**: Prediction Overlay Panel - Toggleable UI panel for all predictions

---

## Phase 0: Discovery & Setup

### Codebase Analysis

- [ ] DISC-01: Document existing UI component patterns from ui_components.py
  - **File**: `D:\f1-race-replay\src\ui_components.py` (1547 lines)
  - **Output**: Create `D:\f1-race-replay\src\predictions\PATTERNS.md` documenting:
    - BaseComponent class: `on_resize(window)`, `draw(window)`, `on_mouse_press(window, x, y, button, modifiers) -> bool`
    - Visibility pattern: `_visible` property, `@property visible`, `toggle_visibility() -> bool`, `set_visible()`
    - COLORS dict pattern (see RaceProgressBarComponent.COLORS for reference)
    - Text rendering: `arcade.Text(text, x, y, color, size, bold=, anchor_x=, anchor_y=).draw()`
    - Rect drawing: `arcade.XYWH(cx, cy, w, h)`, `arcade.draw_rect_filled()`, `arcade.draw_rect_outline()`

- [ ] DISC-02: Document data structures in f1_data.py
  - **File**: `D:\f1-race-replay\src\f1_data.py` (878 lines)
  - **Output**: Add notes to `D:\f1-race-replay\src\predictions\PATTERNS.md` documenting:
    - Frame structure (verified from line 375-388):
      ```python
      frame = {
          "t": float,           # timestamp in seconds from race start
          "lap": int,           # leader's current lap
          "drivers": {
              "VER": {
                  "x": float, "y": float,           # world coordinates
                  "dist": float,                     # race distance (metres)
                  "lap": int,                        # driver's current lap
                  "rel_dist": float,                 # 0-1 within lap
                  "tyre": float,                     # compound (0=SOFT, 1=MED, 2=HARD, 3=INTER, 4=WET)
                  "position": int,                   # current race position
                  "speed": float, "gear": int,      # telemetry
                  "drs": int,                        # >=10 means DRS active
                  "throttle": float, "brake": float
              }, ...
          },
          "weather": {...}  # optional: track_temp, air_temp, humidity, wind_speed, wind_direction, rain_state
      }
      ```
    - FPS=25, DT=1/25 (line 24-25)
    - Track status codes: "1"=Green, "2"=Yellow, "4"=SC, "5"=Red, "6"/"7"=VSC

- [ ] DISC-03: Map integration points in race_replay.py
  - **File**: `D:\f1-race-replay\src\interfaces\race_replay.py` (510 lines)
  - **Output**: Add notes to `D:\f1-race-replay\src\predictions\PATTERNS.md` documenting:
    - Component init: After line 71 (race_controls_comp), add prediction components
    - Resize registration: Line 231 - add to component list for on_resize forwarding
    - Draw order: After line 444 (race_controls_comp.draw), before line 447 (draw_overlays)
    - Update hook: Line 449-456 in on_update() - add prediction calculation trigger
    - Key handler: Line 458-494 in on_key_press() - add 'P' key for prediction toggle
    - Mouse delegation: Lines 496-509 - forward to prediction panel

### Environment Setup

- [ ] SETUP-01: Add new dependencies to requirements.txt
  - **File**: `D:\f1-race-replay\requirements.txt`
  - **Current contents**: fastf1, pandas, matplotlib, numpy, arcade, pyglet, pyside6, questionary, rich
  - **Add**: `scikit-learn` and `scipy` on new lines

- [ ] SETUP-02: Create src/predictions/ directory structure
  - **Action**: Create directory `D:\f1-race-replay\src\predictions\`
  - **Files to create**:
    - `__init__.py` - Exports: PredictionEngine, PredictionPanelComponent, DriverPrediction, PaceModel
    - `models.py` - Data classes for predictions
    - `engine.py` - Core prediction algorithms
    - `ui.py` - UI components following BaseComponent pattern

---

## Phase 1: Core Data Models

- [ ] MODEL-01: Create PaceModel dataclass
  - **File**: `D:\f1-race-replay\src\predictions\models.py`
  - **Implementation**:
    ```python
    @dataclass
    class PaceModel:
        driver_code: str
        current_pace: float      # seconds per lap (latest lap)
        rolling_pace: float      # average over last N laps
        tyre_deg_rate: float     # seconds lost per lap due to tyre wear
        fuel_corrected_pace: float  # pace adjusted for fuel load
        gap_trend: float         # positive = gaining on car ahead
    ```

- [ ] MODEL-02: Create DriverPrediction dataclass
  - **File**: `D:\f1-race-replay\src\predictions\models.py`
  - **Implementation**:
    ```python
    @dataclass
    class DriverPrediction:
        driver_code: str
        win_probability: float      # 0.0 to 1.0
        podium_probability: float   # 0.0 to 1.0
        predicted_finish: int       # 1-20
        pit_window_start: Optional[int]  # lap number
        pit_window_end: Optional[int]
        should_pit_now: bool
        danger_level: float         # 0.0 (safe) to 1.0 (under attack)
        threat_driver: Optional[str]  # code of attacking driver
        confidence: float           # 0.0 to 1.0
    ```

- [ ] MODEL-03: Create TyreState dataclass
  - **File**: `D:\f1-race-replay\src\predictions\models.py`
  - **Implementation**:
    ```python
    @dataclass
    class TyreState:
        compound: int            # 0=SOFT, 1=MEDIUM, 2=HARD, 3=INTER, 4=WET
        laps_on_tyre: int
        deg_rate: float          # seconds per lap
        estimated_cliff_lap: int # when tyre falls off cliff
        remaining_optimal_laps: int
    ```
    - Use `src/lib/tyres.py` mapping: `get_tyre_compound_str(int)` / `get_tyre_compound_int(str)`

- [ ] MODEL-04: Create PredictionConfig dataclass
  - **File**: `D:\f1-race-replay\src\predictions\models.py`
  - **Implementation**:
    ```python
    @dataclass
    class PredictionConfig:
        pace_window_laps: int = 5        # laps for rolling average
        update_interval_frames: int = 25  # every 1 second at 25 FPS
        pit_window_buffer_laps: int = 3   # buffer around optimal
        danger_threshold_seconds: float = 1.5  # gap to flag danger
        overtake_probability_threshold: float = 0.3
    ```

---

## Phase 2: Pace Calculation Engine

- [ ] PACE-01: Implement lap time extraction from frame data
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Function**: `extract_lap_times(frames: List[dict], driver_code: str, up_to_frame: int) -> List[dict]`
  - **Logic**:
    - Iterate frames, detect when `frame['drivers'][code]['lap']` increments
    - Record lap time = timestamp difference between lap start/end
    - Track tyre compound at lap completion
  - **Returns**: `[{"lap": int, "time": float, "tyre": int, "tyre_age": int}, ...]`
  - **Edge cases**: Handle DNF (driver disappears), safety car laps (flag as invalid)

- [ ] PACE-02: Implement rolling pace calculation
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Function**: `calculate_rolling_pace(lap_times: List[dict], window: int = 5) -> float`
  - **Logic**:
    - Take last N valid lap times (exclude pit laps > 120% of median)
    - Return mean of valid laps
  - **Edge cases**: < N laps completed, all laps invalid

- [ ] PACE-03: Implement tyre degradation estimation
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Function**: `estimate_tyre_degradation(lap_times: List[dict]) -> TyreState`
  - **Logic**:
    - Filter lap times on current tyre stint
    - Linear regression: `lap_time = base + deg_rate * tyre_age`
    - Estimate cliff lap based on compound: SOFT ~18, MEDIUM ~30, HARD ~40
  - **Uses**: `scipy.stats.linregress` or simple numpy polyfit

- [ ] PACE-04: Implement fuel-corrected pace
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Function**: `fuel_correct_pace(lap_time: float, lap_number: int, total_laps: int) -> float`
  - **Logic**: `corrected = lap_time - (0.03 * (total_laps - lap_number))`
  - **Note**: ~0.03s/lap is standard F1 fuel correction factor

---

## Phase 3: Win Probability Calculator

- [ ] WIN-01: Implement position-based probability baseline
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Implementation**:
    - Create `calculate_base_probability(position, total_drivers)` function
    - Use historical win probability by position (P1 ~40%, P2 ~25%, P3 ~15%, etc.)
    - Decay probability exponentially for positions > 3

- [ ] WIN-02: Implement gap-based probability adjustment
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Implementation**:
    - Create `adjust_probability_for_gap(base_prob, gap_to_leader, laps_remaining)` function
    - Calculate catchability: gap / (pace_delta * laps_remaining)
    - Reduce probability based on uncatchable gap threshold

- [ ] WIN-03: Implement tyre advantage adjustment
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Implementation**:
    - Create `adjust_probability_for_tyres(prob, my_tyre_age, leader_tyre_age, my_compound, leader_compound)` function
    - Fresh tyres vs worn tyres = positive adjustment
    - Calculate expected pace delta based on tyre state

- [ ] WIN-04: Implement combined win probability calculator
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Implementation**:
    - Create `calculate_win_probability(frame_data, driver_code, laps_remaining, pace_models)` function
    - Combine base, gap, and tyre adjustments
    - Normalize probabilities across all drivers (sum = 1.0)

---

## Phase 4: Pit Window Predictor

- [ ] PIT-01: Implement optimal pit window calculation
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Implementation**:
    - Create `calculate_pit_window(tyre_deg_model, laps_remaining, track_position)` function
    - Estimate optimal window: when tyre deg rate crosses threshold
    - Account for undercut/overcut opportunities based on gaps

- [ ] PIT-02: Implement pit recommendation logic
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Implementation**:
    - Create `get_pit_recommendation(driver_state, pit_window, gap_behind)` function
    - Return "PIT NOW" if: within window AND (losing time OR undercut threat)
    - Return "STAY OUT" with reason if outside window

- [ ] PIT-03: Implement strategic pit option comparison
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Implementation**:
    - Create `compare_pit_strategies(current_state, laps_remaining)` function
    - Model outcomes for: pit now, pit in N laps, no stop
    - Return ranked strategies with predicted finish positions

---

## Phase 5: Position Change Predictor

- [ ] POS-01: Implement pace delta calculation
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Implementation**:
    - Create `calculate_pace_delta(driver1_pace, driver2_pace)` function
    - Return seconds per lap difference
    - Flag as "catching" or "pulling away"

- [ ] POS-02: Implement overtake probability
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Implementation**:
    - Create `calculate_overtake_probability(gap, pace_delta, drs_available)` function
    - DRS zones give +30% overtake probability
    - Return probability of overtake in next N laps

- [ ] POS-03: Implement danger zone detection
  - **File**: `D:\f1-race-replay\src\predictions\engine.py`
  - **Implementation**:
    - Create `detect_danger_zones(frame_data, driver_code)` function
    - Flag "DANGER" if: car behind within 1.5s AND faster pace
    - Return danger_level (0=safe, 1=warning, 2=danger)

---

## Phase 6: Prediction UI Components

- [ ] UI-01: Create PredictionPanelComponent base
  - **File**: `D:\f1-race-replay\src\predictions\ui.py`
  - **Implementation**:
    - Create class extending BaseComponent pattern from ui_components.py
    - Add position properties (x, y, width, height)
    - Add visibility toggle matching existing pattern
    - Define COLORS dict matching existing UI style

- [ ] UI-02: Implement win probability bars
  - **File**: `D:\f1-race-replay\src\predictions\ui.py`
  - **Implementation**:
    - Create `draw_win_probability(predictions, top_n=5)` method
    - Draw horizontal bar chart for top N drivers
    - Color bars by team color from driver_colors
    - Show percentage labels

- [ ] UI-03: Implement pit window indicator
  - **File**: `D:\f1-race-replay\src\predictions\ui.py`
  - **Implementation**:
    - Create `draw_pit_window(pit_state, selected_driver)` method
    - Show visual pit window timeline
    - Highlight "PIT NOW" in flashing color when recommended
    - Show laps until pit window opens/closes

- [ ] UI-04: Implement danger zone warnings
  - **File**: `D:\f1-race-replay\src\predictions\ui.py`
  - **Implementation**:
    - Create `draw_danger_alert(danger_states)` method
    - Show warning icons next to drivers under threat
    - Flash animation for high danger level
    - Show attacker code and gap

- [ ] UI-05: Implement confidence indicator
  - **File**: `D:\f1-race-replay\src\predictions\ui.py`
  - **Implementation**:
    - Create `draw_confidence_indicator(confidence_level)` method
    - Show "Confidence: High/Medium/Low" based on data quality
    - Fade out predictions when confidence is low

---

## Phase 7: Integration with Race Replay

- [ ] INT-01: Import prediction components into race_replay.py
  - **File**: `D:\f1-race-replay\src\interfaces\race_replay.py`
  - **Changes**:
    - Add import: `from src.predictions.ui import PredictionPanelComponent`
    - Add import: `from src.predictions.engine import PredictionEngine`

- [ ] INT-02: Initialize prediction engine in F1RaceReplayWindow
  - **File**: `D:\f1-race-replay\src\interfaces\race_replay.py`
  - **Changes**:
    - Add `self.prediction_engine = PredictionEngine()` in __init__
    - Add `self.prediction_panel = PredictionPanelComponent(...)` after other components
    - Add 'P' keyboard toggle for prediction panel

- [ ] INT-03: Add prediction update to on_update method
  - **File**: `D:\f1-race-replay\src\interfaces\race_replay.py`
  - **Changes**:
    - Call `self.prediction_engine.update(frame, laps_remaining)` every N frames
    - Cache predictions to avoid recalculating every frame
    - Update interval: every 25 frames (1 second of race time)

- [ ] INT-04: Add prediction panel to draw order
  - **File**: `D:\f1-race-replay\src\interfaces\race_replay.py`
  - **Changes**:
    - Add `self.prediction_panel.draw(self)` after other UI components
    - Ensure prediction overlay draws on top of track but below tooltips

---

## Phase 8: Testing & Polish

- [ ] TEST-01: Create unit tests for pace calculations
  - **File**: `D:\f1-race-replay\tests\test_predictions.py`
  - **Tests**:
    - Test extract_lap_times with sample frame data
    - Test rolling pace with edge cases (outliers, pit laps)
    - Test tyre degradation estimation accuracy

- [ ] TEST-02: Create integration test for prediction engine
  - **File**: `D:\f1-race-replay\tests\test_predictions.py`
  - **Tests**:
    - Test full prediction cycle with mock race data
    - Verify probabilities sum to 1.0
    - Verify predictions update correctly over time

- [ ] TEST-03: Manual visual testing
  - **Action**: Run replay with prediction panel enabled
  - **Verify**:
    - Predictions display correctly
    - No lag introduced (< 100ms calculation time)
    - Panel toggle works (P key)
    - Predictions update as race progresses

---

## Blockers

*None currently*

---

## Completed Tasks Log

| Task | Commit | Date |
|------|--------|------|
| - | - | - |

---

## Architecture Notes

### Integration Points Summary

1. **Entry Point**: `main.py` calls `run_arcade_replay()` which creates `F1RaceReplayWindow`
2. **Frame Data**: Available via `self.frames[idx]` containing all driver telemetry
3. **UI Component Pattern**: Extend `BaseComponent` with `on_resize()`, `draw()`, `on_mouse_press()`
4. **Component Registration**: Add to window in `__init__`, call draw in `on_draw()`, forward mouse events

### Performance Constraints

- Predictions must calculate in < 100ms
- Use frame sampling (every 25 frames = 1s) to reduce calculation frequency
- Cache predictions between frames
- Use numpy for vectorized operations where possible

### Existing Patterns to Follow

1. **Color Constants**: Use dict pattern like `COLORS = {"key": (r, g, b, a)}`
2. **Visibility Toggle**: `@property visible`, `toggle_visibility()`, `set_visible()`
3. **Text Rendering**: Create `arcade.Text()` objects, call `.draw()`
4. **Hit Testing**: Return `True` from `on_mouse_press()` if event consumed

### Data Flow

```
main.py
  └── run_arcade_replay()
        └── F1RaceReplayWindow.__init__()
              ├── Load frames from get_race_telemetry()
              ├── Initialize UI components
              └── Initialize PredictionEngine (NEW)

on_update() [called 60 FPS]
  └── Every 25 frames:
        └── PredictionEngine.update(current_frame, total_laps)
              ├── Extract pace data
              ├── Calculate win probabilities
              ├── Detect danger zones
              └── Return PredictionState for each driver

on_draw() [called 60 FPS]
  └── PredictionPanelComponent.draw()
        ├── Draw win probability bars
        ├── Draw pit window (if driver selected)
        └── Draw danger alerts
```

### Key Files to Modify (Summary)

| File | Type of Change |
|------|---------------|
| `requirements.txt` | Add scikit-learn, scipy |
| `src/predictions/__init__.py` | New file (exports) |
| `src/predictions/models.py` | New file (dataclasses) |
| `src/predictions/engine.py` | New file (prediction logic) |
| `src/predictions/ui.py` | New file (UI components) |
| `src/interfaces/race_replay.py` | Modify (integration) |
