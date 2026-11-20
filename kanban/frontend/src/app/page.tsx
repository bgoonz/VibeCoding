"use client";

import dynamic from "next/dynamic";

const Board = dynamic(() => import("@/components/Board").then((mod) => mod.Board), {
  ssr: false,
});

export default function Home() {
  return <Board />;
}
