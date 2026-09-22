# Phase 1 — Architecture

## Folder structure

```
stocktute/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   └── page.tsx                 # Landing page (placeholder until Phase 8)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── verify/page.tsx          # OTP verification
│   │   ├── (app)/                       # Authenticated app shell
│   │   │   ├── layout.tsx               # Sidebar + ticker rail
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── classroom/page.tsx       # AI Classroom (live chart, Phase 5 fills in)
│   │   │   ├── simulator/page.tsx       # Phase 3
│   │   │   ├── replay/page.tsx          # Phase 3
│   │   │   ├── drills/page.tsx          # Phase 4
│   │   │   ├── skill-tree/page.tsx      # Phase 4
│   │   │   ├── lessons/page.tsx         # Phase 7
│   │   │   ├── journal/page.tsx         # Phase 3/6
│   │   │   ├── leaderboard/page.tsx     # Phase 3
│   │   │   ├── billing/page.tsx         # Phase 7
│   │   │   └── admin/page.tsx           # Phase 7
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── candles/[symbol]/route.ts    # REST fallback for candle history
│   │   │   ├── stream/route.ts              # SSE endpoint pushing live candles
│   │   │   └── health/route.ts
│   │   ├── layout.tsx                   # Root layout, fonts, theme provider
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                          # shadcn/ui primitives (button, card, dialog...)
│   │   ├── charts/
│   │   │   └── LightweightChart.tsx     # TradingView Lightweight Charts wrapper
│   │   ├── layout/
│   │   │   ├── TickerRail.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ComplianceBanner.tsx
│   │   └── theme/
│   │       └── ThemeProvider.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   └── mongoose.ts              # cached connection helper
│   │   ├── auth/
│   │   │   └── options.ts               # NextAuth config
│   │   ├── redis/
│   │   │   └── client.ts                # Upstash Redis client
│   │   ├── priceFeed/
│   │   │   ├── PriceProvider.ts         # interface
│   │   │   ├── MockNseProvider.ts       # Phase 1 stand-in provider
│   │   │   └── candleBuilder.ts         # tick -> 1m/5m/15m/1D aggregation
│   │   └── utils.ts
│   ├── models/                          # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Candle.ts
│   │   ├── Order.ts
│   │   ├── Position.ts
│   │   ├── Trade.ts
│   │   ├── Question.ts
│   │   └── Lesson.ts
│   ├── styles/
│   │   └── tokens.ts                    # design tokens (colors, type, spacing, motion)
│   └── workers/
│       └── priceFeedWorker.ts           # standalone Node worker entry (Phase 1: polls MockNseProvider)
├── tests/
│   └── detector/                        # Phase 2 unit tests live here
├── docs/
│   └── phase1-architecture.md
├── .env.example
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

## Mongo schemas (Mongoose)

- `User` — auth identity, subscription tier, virtual wallet balance, streak/mastery summary
- `Candle` — OHLCV per symbol/timeframe/timestamp, unique compound index
- `Order` — paper order (market/limit/stop), lifecycle status
- `Position` — open holdings per user/symbol, avg price, realised/unrealised P&L
- `Trade` — closed trade record with the student's written plan + AI review slot
- `Question` — drill bank entry (topic, difficulty, chart snippet ref, options, SM-2 fields live on a join collection later)
- `Lesson` — CMS markdown lesson tied to a skill-tree node

See `src/models/*.ts` for full field definitions.

## Design tokens

See `src/styles/tokens.ts`. Palette: near-black `#0B0E11` background, graphite surfaces, electric lime `#C6FF3D` accent, green/red reserved strictly for price movement. Fonts: Instrument Serif (display), Geist (UI), JetBrains Mono (numbers).
