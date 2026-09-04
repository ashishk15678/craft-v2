"use client";
import { useState } from "react";

const path = [
  [0, 0],
  [1, 0],
  [1, 1],
  [2, 1],
  [2, 2],
  [1, 2],
  [0, 2],
  [0, 3],
  [1, 3],
  [1, 4],
  [2, 4],
  [2, 5],
  [3, 5],
  [4, 5],
  [4, 4],
  [5, 4],
  [5, 3],
  [5, 2],
  [4, 2],
  [4, 1],
  [5, 1],
  [5, 0],
];
const keys = new Set(["2,2", "2,5", "4,2"]);
const exit = "5,0";
const adjacent = (a: number[], b: number[]) =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;

export function KeyMaze({ onComplete }: { onComplete: () => void }) {
  const [position, setPosition] = useState([0, 0]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("Find the hidden route.");
  function move(dx: number, dy: number) {
    const next = [position[0] + dx, position[1] + dy];
    if (
      next[0] < 0 ||
      next[0] > 5 ||
      next[1] < 0 ||
      next[1] > 5 ||
      !path.some((cell) => cell[0] === next[0] && cell[1] === next[1]) ||
      !adjacent(position, next)
    ) {
      setPosition([0, 0]);
      setFound(new Set());
      setMessage("Wall hit. Back to start — memorise the route.");
      return;
    }
    const id = next.join(",");
    const updated = new Set(found);
    if (keys.has(id)) updated.add(id);
    setFound(updated);
    setPosition(next);
    if (id === exit && updated.size === 3) {
      setMessage("Exit reached. Puzzle solved.");
      onComplete();
    } else if (id === exit) setMessage("The exit is locked. Find every key.");
    else
      setMessage(
        keys.has(id) ? `Key ${updated.size}/3 collected.` : "Safe move.",
      );
  }
  return (
    <div className="mt-5 rounded-xl border border-indigo-500/30 bg-[#111024] p-5">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase text-indigo-300">
        <span>Key maze · hidden walls</span>
        <span>{found.size}/3 keys</span>
      </div>
      <div className="mx-auto mt-5 grid w-fit grid-cols-6 gap-1 rounded-lg bg-black/30 p-2">
        {Array.from({ length: 36 }, (_, i) => {
          const x = i % 6,
            y = Math.floor(i / 6),
            id = `${x},${y}`,
            here = position[0] === x && position[1] === y;
          return (
            <div
              key={id}
              className={`grid h-9 w-9 place-items-center rounded-sm border border-white/5 text-sm ${here ? "bg-indigo-500" : "bg-white/5"}`}
            >
              {here
                ? "●"
                : keys.has(id) && !found.has(id)
                  ? "◆"
                  : id === exit
                    ? "⇥"
                    : ""}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-sm text-zinc-400">{message}</p>
      <div className="mx-auto mt-4 grid w-32 grid-cols-3 gap-1">
        <span />
        <button onClick={() => move(0, -1)} className="rounded bg-accent p-2">
          ↑
        </button>
        <span />
        <button onClick={() => move(-1, 0)} className="rounded bg-accent p-2">
          ←
        </button>
        <button onClick={() => move(0, 1)} className="rounded bg-accent p-2">
          ↓
        </button>
        <button onClick={() => move(1, 0)} className="rounded bg-accent p-2">
          →
        </button>
      </div>
    </div>
  );
}
