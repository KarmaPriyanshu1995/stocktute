"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
};

const QUESTIONS: Question[] = [
  {
    id: "nse",
    prompt: "NSE and BSE are…",
    options: [
      "Guaranteed return products",
      "India’s main stock exchanges",
      "The same thing as Nifty 50",
      "Your broker’s brand names",
    ],
    answer: 1,
    explain: "They are exchanges. Nifty 50 is an index, not an exchange.",
  },
  {
    id: "market-order",
    prompt: "A market order…",
    options: [
      "Guarantees your price",
      "Fills now at whatever the book offers",
      "Never slips",
      "Is the same as a GTT",
    ],
    answer: 1,
    explain: "Market orders chase liquidity. In a thin name you can slip badly.",
  },
  {
    id: "hammer",
    prompt: "A hammer candlestick is…",
    options: [
      "A guaranteed buy signal",
      "A small body and long lower wick after a decline — a reversal *attempt*",
      "Always short the next bar",
      "Only valid on 1-minute charts",
    ],
    answer: 1,
    explain: "Location and the next close matter. The pattern is not a signal by itself.",
  },
  {
    id: "size",
    prompt: "Capital ₹1,00,000, risk 1%, entry ₹500, stop ₹490. Size is…",
    options: ["1,000 shares", "50 shares", "100 shares", "Whatever feels right"],
    answer: 2,
    explain: "₹1,000 risk ÷ ₹10 per share = 100 shares. Feelings are not a sizing method.",
  },
  {
    id: "fo-lock",
    prompt: "Why are futures and options locked on this platform?",
    options: [
      "They are illegal to teach",
      "Until you pass risk-management training",
      "Because paper trading is pointless",
      "SEBI banned simulators",
    ],
    answer: 1,
    explain: "Leverage without a written risk rule is how accounts vanish. The lock is pedagogical.",
  },
  {
    id: "backtest",
    prompt: "A beautiful backtest without brokerage, taxes or slippage is…",
    options: [
      "Proof you will make money",
      "Past performance with fantasy fills",
      "Enough to sell a course",
      "Better than out-of-sample testing",
    ],
    answer: 1,
    explain: "Costs and bias names exist because un-costed tests lie. This course will never label a curve as ‘the one’.",
  },
];

export default function DrillsPage() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUESTIONS[index];
  const locked = picked !== null;

  function choose(optionIndex: number) {
    if (locked) return;
    setPicked(optionIndex);
    if (optionIndex === q.answer) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= QUESTIONS.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <h1 className="font-display text-3xl text-text-primary">Drill complete</h1>
        <p className="text-sm text-text-secondary">
          {score}/{QUESTIONS.length}. This score tracks learning, not trading skill. Wrong answers
          are the point — read the explanation and retry later.
        </p>
        <button
          type="button"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-inverse"
          onClick={() => {
            setIndex(0);
            setPicked(null);
            setScore(0);
            setDone(false);
          }}
        >
          Retry
        </button>
        <Link href="/lessons" className="text-sm text-accent">
          Back to lessons
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Drills</h1>
        <p className="text-sm text-text-secondary">
          Foundations, candlesticks, and risk. No prize for a high score.
        </p>
        <p className="mt-1 font-mono text-xs text-text-tertiary">
          {index + 1}/{QUESTIONS.length}
        </p>
      </div>
      <p className="text-sm text-text-primary">{q.prompt}</p>
      <div className="flex flex-col gap-2">
        {q.options.map((option, optionIndex) => {
          const isCorrect = optionIndex === q.answer;
          const isPick = optionIndex === picked;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(optionIndex)}
              className={cn(
                "rounded-md border px-4 py-3 text-left text-sm",
                !locked && "border-bg-border hover:bg-bg-surface-hover",
                locked && isCorrect && "border-price-up text-price-up",
                locked && isPick && !isCorrect && "border-price-down text-price-down",
                locked && !isPick && !isCorrect && "border-bg-border text-text-tertiary",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {locked && (
        <>
          <p className="text-sm leading-relaxed text-text-secondary">{q.explain}</p>
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-inverse"
          >
            {index + 1 === QUESTIONS.length ? "See score" : "Next"}
          </button>
        </>
      )}
    </div>
  );
}
