// Runnable check for the color-picker undo coalescing (Wave 11D undo fix): a native
// <input type=color> fires onChange per drag tick, so previewColor must collapse one
// drag into a SINGLE undo step while keeping deliberate picks separate. Run `bun test`.
import { expect, test, beforeEach } from "bun:test";
import { useEditorStore } from "./editorStore";

const store = useEditorStore;
const s = () => store.getState();

beforeEach(() => s().reset());

test("one color-picker drag = one undo step; picks stay separate", () => {
  store.setState({ selectedBlock: "b1" });

  // Drag #1: many onChange ticks within a single burst → one snapshot.
  s().previewColor({ bgColor: "#111111" });
  s().previewColor({ bgColor: "#222222" });
  s().previewColor({ bgColor: "#333333" });
  expect(s().undoStack.length).toBe(1);
  expect(s().changes.get("b1")?.bgColor).toBe("#333333");

  // Picker closes, user opens it again (new deliberate pick) → second burst.
  s().endColorBurst();
  s().previewColor({ bgColor: "#444444" });
  s().previewColor({ bgColor: "#454545" });
  expect(s().undoStack.length).toBe(2);

  // Undo peels exactly one pick at a time, restoring the prior color.
  s().undo();
  expect(s().changes.get("b1")?.bgColor).toBe("#333333");
  s().undo();
  expect(s().changes.get("b1")?.bgColor).toBeUndefined(); // back past both picks
});
