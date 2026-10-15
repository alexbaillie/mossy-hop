import Game from "./Game";

// The game renders entirely client-side, so the page itself can be prerendered
// (required for the static GitHub Pages export).
export const dynamic = "force-static";

export default function Page() {
  return <Game />;
}
