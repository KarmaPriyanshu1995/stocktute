"""Generate docs/Stocktute-Project-Guide.pdf — run from repo root."""
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parent / "Stocktute-Project-Guide.pdf"

NAVY = colors.HexColor("#0B0E11")
INK = colors.HexColor("#14171B")
MUTED = colors.HexColor("#565B62")
LINE = colors.HexColor("#DEDCD2")
ACCENT = colors.HexColor("#6B8F00")
SURFACE = colors.HexColor("#F5F4EF")
WHITE = colors.white


def styles():
    base = getSampleStyleSheet()
    s = {
        "coverKicker": ParagraphStyle(
            "coverKicker",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=ACCENT,
            tracking=1.2,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "coverTitle": ParagraphStyle(
            "coverTitle",
            parent=base["Title"],
            fontName="Times-Bold",
            fontSize=28,
            leading=34,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "coverSub": ParagraphStyle(
            "coverSub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Times-Bold",
            fontSize=16,
            leading=20,
            textColor=NAVY,
            spaceBefore=16,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=NAVY,
            spaceBefore=12,
            spaceAfter=6,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=14,
            textColor=INK,
            spaceBefore=8,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13.5,
            textColor=INK,
            alignment=TA_JUSTIFY,
            spaceAfter=7,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=INK,
            leftIndent=12,
            spaceAfter=2,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=MUTED,
        ),
        "caption": ParagraphStyle(
            "caption",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8,
            leading=11,
            textColor=MUTED,
            spaceAfter=8,
        ),
        "code": ParagraphStyle(
            "code",
            parent=base["Code"],
            fontName="Courier",
            fontSize=7.2,
            leading=9.6,
            textColor=NAVY,
            backColor=SURFACE,
            leftIndent=4,
            rightIndent=4,
            spaceBefore=4,
            spaceAfter=8,
        ),
        "toc": ParagraphStyle(
            "toc",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=16,
            textColor=INK,
        ),
        "th": ParagraphStyle(
            "th",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=WHITE,
        ),
        "td": ParagraphStyle(
            "td",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=INK,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
        ),
    }
    return s


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, A4[1] - 12 * mm, A4[0], 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, A4[1] - 12.8 * mm, A4[0], 1.2 * mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(18 * mm, A4[1] - 8 * mm, "STOCKTUTE  ·  PROJECT GUIDE")
    canvas.drawRightString(A4[0] - 18 * mm, A4[1] - 8 * mm, "Confidential  ·  internal")
    canvas.setFillColor(LINE)
    canvas.rect(0, 0, A4[0], 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(18 * mm, 5 * mm, "Educational simulation. Not investment advice.")
    canvas.drawRightString(A4[0] - 18 * mm, 5 * mm, f"Page {doc.page}")
    canvas.restoreState()


def cover_header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, A4[1] - 48 * mm, A4[0], 48 * mm, fill=1, stroke=0)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, A4[1] - 50 * mm, A4[0], 2 * mm, fill=1, stroke=0)
    canvas.setFillColor(LINE)
    canvas.rect(0, 0, A4[0], 18 * mm, fill=1, stroke=0)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(A4[0] / 2, 8 * mm, "Virtual-money classroom  ·  NSE / BSE education  ·  No live tips")
    canvas.restoreState()


def table(headers, rows, col_widths=None):
    s = styles()
    data = [[Paragraph(h, s["th"]) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), s["td"]) for c in row])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("BACKGROUND", (0, 1), (-1, -1), WHITE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, SURFACE]),
                ("GRID", (0, 0), (-1, -1), 0.3, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def bullets(items):
    s = styles()
    return ListFlowable(
        [ListItem(Paragraph(i, s["bullet"]), leftIndent=8, bulletColor=ACCENT) for i in items],
        bulletType="bullet",
        start="circle",
        leftIndent=14,
        bulletFontName="Helvetica",
        bulletFontSize=7,
        spaceAfter=8,
    )


def code_block(text):
    s = styles()
    return Preformatted(text.strip("\n"), s["code"])


def build():
    s = styles()
    story = []

    # Cover
    story.append(Spacer(1, 52 * mm))
    story.append(Paragraph("INDIAN STOCK MARKET EDUCATION PLATFORM", s["coverKicker"]))
    story.append(Paragraph("Stocktute", s["coverTitle"]))
    story.append(
        Paragraph(
            "Full project guide — what has been built, how it is wired,<br/>and what remains.",
            s["coverSub"],
        )
    )
    story.append(Spacer(1, 8 * mm))
    story.append(
        Paragraph(
            "Version 0.1.0  ·  Next.js 15  ·  TypeScript  ·  MongoDB<br/>Generated 22 September 2026  ·  Steps 1–4 complete",
            s["coverSub"],
        )
    )
    story.append(Spacer(1, 18 * mm))
    story.append(
        Paragraph(
            "Educational content only. Not investment advice.<br/>Past patterns do not guarantee future results. Virtual money only.",
            s["coverSub"],
        )
    )
    story.append(PageBreak())

    # TOC
    story.append(Paragraph("Contents", s["h1"]))
    toc = [
        "1. Product in one page",
        "2. Non-negotiable rules",
        "3. Tech stack",
        "4. Core architecture",
        "5. Build status (steps 1–6)",
        "6. Full repository tree",
        "7. Pages and routes",
        "8. API surface",
        "9. Detection engine (step 1)",
        "10. AI Classroom (step 2)",
        "11. Predictions and mistake journal (step 3)",
        "12. Everyday Market backend (step 4)",
        "13. Curriculum (12 levels)",
        "14. MongoDB models",
        "15. Auth, wallet, price feed",
        "16. How to run locally",
        "17. Tests",
        "18. Open assumptions and next steps",
    ]
    for line in toc:
        story.append(Paragraph(line, s["toc"]))
    story.append(PageBreak())

    # 1
    story.append(Paragraph("1. Product in one page", s["h1"]))
    story.append(
        Paragraph(
            "Stocktute is an Indian-market education platform for NSE/BSE. Students learn charts, "
            "candlesticks, risk, and process with <b>virtual money only</b>. The product never gives "
            "real buy/sell advice, stock tips, targets, or profit promises. A 12-level curriculum "
            "controls vocabulary and which tools unlock. Futures and options stay locked until the "
            "student passes Level 6 risk training.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "Two connected teaching features sit on top of a deterministic detection engine:",
            s["body"],
        )
    )
    story.append(
        bullets(
            [
                "<b>AI Classroom</b> — one historical chart taught in six layers (What, Why, Context, Predict, Reveal, Failure).",
                "<b>Everyday Market Chapter</b> — a draft chapter generated after the cash-market close from that session’s engine facts, then reviewed by an admin before it can go live.",
            ]
        )
    )
    story.append(
        Paragraph(
            "The most important product rule is technical: <b>the language model must never detect patterns or read prices</b>. "
            "Code computes ChartFacts JSON. The tutor only explains those facts. If a number is missing, the copy says "
            "“I don't have that data.”",
            s["body"],
        )
    )

    # 2
    story.append(Paragraph("2. Non-negotiable rules", s["h1"]))
    story.append(
        bullets(
            [
                "Never promise or imply guaranteed profits.",
                "A candlestick pattern is a label, not a buy or sell signal.",
                "Every strategy study must include invalidation and a position-sizing rule.",
                "F&amp;O stays locked until Level 6 risk training is passed.",
                "Paper trading comes before any live broker integration.",
                "Every generated chapter carries the disclaimer: Educational content only. Not investment advice. Past patterns do not guarantee future results.",
                "Psychology words such as “buyers” and “sellers” are allowed. Standalone “buy”, “sell”, “target”, “sure-shot”, “guaranteed”, and “will go up” are rewritten by the compliance filter.",
            ]
        )
    )

    # 3
    story.append(Paragraph("3. Tech stack", s["h1"]))
    story.append(
        table(
            ["Layer", "Choice", "Notes"],
            [
                ["App", "Next.js 15.5 App Router + React 19 + TypeScript", "src/app"],
                ["Auth", "NextAuth v5 (JWT) — email OTP + Google", "src/lib/auth, src/auth.ts"],
                ["Database", "MongoDB via Mongoose 9", "src/lib/db/mongoose.ts"],
                ["OTP / cache", "Upstash Redis", "10-minute OTP TTL"],
                ["Charts", "TradingView Lightweight Charts v5", "src/components/charts"],
                ["Detection", "In-house TypeScript engine", "src/lib/detection"],
                ["Jobs", "tsx workers", "price feed + daily chapter"],
                ["Tests", "Vitest", "44 tests passing as of 22 Sep 2026"],
                ["Styling", "Tailwind CSS 4 + design tokens", "src/styles/tokens.ts"],
                ["Payments (schema only)", "Razorpay keys in env", "Billing page is a placeholder"],
                ["LLM (not wired yet)", "Anthropic SDK in package.json", "Classroom uses a fact-grounded template narrator"],
            ],
            [38 * mm, 72 * mm, 62 * mm],
        )
    )
    story.append(Paragraph("Table 1. Stack as implemented in the repository.", s["caption"]))

    # 4
    story.append(Paragraph("4. Core architecture", s["h1"]))
    story.append(
        Paragraph(
            "All teaching numbers flow one way. The UI and the tutor are not allowed to invent OHLC, pattern names, EMA, RSI, support, or outcomes.",
            s["body"],
        )
    )
    story.append(
        code_block(
            """
OHLCV bars
    → detection engine  analyzeChart()
    → ChartFacts JSON   (setups, context, forward returns, base rates, missingFacts)
    → narrator / daily copy   (templates; LLM later may only explain this JSON)
    → compliance filter
    → MongoDB
    → UI (classroom, journal, admin review, later student daily chapter)
"""
        )
    )
    story.append(Paragraph("Figure 1. Teaching pipeline. Code detects. Copy explains.", s["caption"]))
    story.append(
        Paragraph(
            "If a value cannot be computed it is <b>null</b> and listed in missingFacts. Confirmation is the next <b>closed</b> bar’s close beyond the pattern high/low. If that bar does not exist, confirmation is unavailable. Base rates are never invented: sampleSize 0 and hitRate null when no universe is supplied.",
            s["body"],
        )
    )

    # 5
    story.append(Paragraph("5. Build status (steps 1–6)", s["h1"]))
    story.append(
        table(
            ["Step", "Deliverable", "Status"],
            [
                ["1", "Detection engine with unit tests (12 patterns, EMA, RSI, volume, S/R, outcomes, base rates)", "Done"],
                ["2", "AI Classroom 6-layer flow on one historical RELIANCE daily hammer", "Done"],
                ["3", "Persist predictions + mistake journal with Play/Pause/Step replay", "Done"],
                ["4", "Daily generation job, compliance filter, admin review (draft / approve / reject / publish)", "Done"],
                ["5", "Student Everyday Market view: level gating, streaks, archive", "Not built"],
                ["6", "Explain-back grading, misconception detector, spaced repetition, calibration chart", "Not built"],
            ],
            [18 * mm, 128 * mm, 26 * mm],
        )
    )
    story.append(Paragraph("Table 2. Ordered delivery plan from the original product spec.", s["caption"]))
    story.append(
        Paragraph(
            "Older platform shells still exist as placeholders: Simulator, Replay, Leaderboard, Billing. "
            "Curriculum, skill tree, lessons, drills, and the risk calculator are live.",
            s["body"],
        )
    )

    # 6
    story.append(Paragraph("6. Full repository tree", s["h1"]))
    story.append(
        Paragraph(
            "Only source that matters for the current product is shown. node_modules and .next are omitted.",
            s["body"],
        )
    )
    story.append(
        code_block(
            """
stocktute/
  package.json                 next, vitest, workers
  .env.example
  docs/
    phase1-architecture.md     early shell notes (partly superseded)
    Stocktute-Project-Guide.pdf  this document
  src/
    auth.ts
    app/
      layout.tsx, globals.css
      (marketing)/page.tsx
      (auth)/login  verify
      (app)/                   requires session
        dashboard  skill-tree  lessons/[slug]
        classroom              6-layer tutor
        classroom/live         sandbox tape
        journal                mistake journal
        drills  risk  formulas
        admin                  chapter list + generate
        admin/chapters/[date]  review / edit / approve
        simulator replay leaderboard billing   placeholders
      api/
        auth/[...nextauth]  auth/otp/request
        candles/[symbol]  stream  health
        predictions
        admin/chapters/generate
        admin/chapters/[date]
        admin/settings
    components/
      admin/     AdminGenerate  ChapterReview
      charts/    LightweightChart
      learn/     ClassroomTutor PatternReplay JournalClient
                 SkillTreeView PatternWorkbookView PositionSizeCalculator
      layout/    Sidebar TickerRail ComplianceBanner
    lib/
      detection/  engine patterns indicators trend levels
                  outcomes baseRates classroomLesson narrate
      journal/    score  teachingCharts
      daily/      calendar tapes select copy compliance
                  generate persist universe positionSize
      curriculum/ catalog content
      priceFeed/  MockNseProvider candleBuilder generateHistory
      auth/       otp options requireAdmin
      db/mongoose.ts
    models/       User Prediction MistakeJournalEntry
                  DailyChapter ComplianceEvent AppSettings
                  Candle Lesson Question Order Position Trade
    workers/      priceFeedWorker.ts  dailyChapterWorker.ts
  tests/
    detection/  engine.test.ts  classroomLesson.test.ts
    journal/    score.test.ts
    daily/      generate.test.ts
    curriculum/ catalog.test.ts
    detector/   candlestickPatterns.test.ts   (older live-tape labels)
"""
        )
    )

    # 7
    story.append(Paragraph("7. Pages and routes", s["h1"]))
    story.append(
        table(
            ["Path", "Audience", "What it does"],
            [
                ["/", "Public", "Marketing landing"],
                ["/login, /verify", "Public", "Email OTP sign-in"],
                ["/dashboard", "Student", "Welcome, 12-level path, paper wallet figure"],
                ["/skill-tree", "Student", "Levels 1–12 with lock reasons"],
                ["/lessons, /lessons/[slug]", "Student", "150+ lesson pages; candlestick academy workbooks"],
                ["/classroom", "Student", "AI Classroom — 6-layer historical hammer lesson"],
                ["/classroom/live", "Student", "Sandbox live tape with pattern markers"],
                ["/journal", "Student", "Wrong 5-bar guesses + chart replay + habit notes"],
                ["/drills", "Student", "Short quizzes"],
                ["/risk", "Student", "Position-size calculator (capital × risk% ÷ distance)"],
                ["/formulas", "Student", "Formula-builder preview"],
                ["/admin", "Admin only", "Generate daily drafts, auto-publish toggle, chapter list"],
                ["/admin/chapters/[date]", "Admin only", "Edit copy, charts, quiz, approve / reject / publish"],
                ["/simulator /replay /leaderboard /billing", "Student", "Phase placeholders — not implemented"],
            ],
            [48 * mm, 28 * mm, 96 * mm],
        )
    )
    story.append(Paragraph("Table 3. App Router pages. (app) layout redirects unsigned users to /login.", s["caption"]))
    story.append(
        Paragraph(
            "Admin pages call requireAdmin(). Students with role “student” are sent to /dashboard. "
            "The sidebar shows an Admin link only when session.user.role is admin.",
            s["body"],
        )
    )

    # 8
    story.append(Paragraph("8. API surface", s["h1"]))
    story.append(
        table(
            ["Method", "Path", "Auth", "Purpose"],
            [
                ["POST", "/api/auth/otp/request", "Public", "Email a 6-digit code (Redis TTL 10 minutes, IST timestamps)"],
                ["*", "/api/auth/[...nextauth]", "Public", "NextAuth Google + email-OTP credentials"],
                ["GET", "/api/candles/[symbol]", "Session via app", "History; falls back to generated OHLC if Mongo is thin"],
                ["GET", "/api/stream", "Session", "SSE live quotes"],
                ["GET", "/api/health", "Public", "Health check"],
                ["POST", "/api/predictions", "Signed-in", "Lock classroom prediction; score from engine; journal misses"],
                ["POST", "/api/admin/chapters/generate", "Admin or CRON_SECRET", "Build and upsert DailyChapter draft"],
                ["PATCH", "/api/admin/chapters/[date]", "Admin", "Save edits (re-filter), approve, reject, publish"],
                ["POST", "/api/admin/settings", "Admin", "autoPublishDaily toggle"],
            ],
            [22 * mm, 62 * mm, 38 * mm, 50 * mm],
        )
    )
    story.append(Paragraph("Table 4. HTTP APIs.", s["caption"]))
    story.append(
        Paragraph(
            "Classroom predictions do not trust client prices. The client sends only chartKey, direction, "
            "confidence (50–100), and a reason. The server resolves the teaching chart, runs scorePrediction "
            "against ChartFacts, and upserts one Prediction per user per chart. A miss writes MistakeJournalEntry; "
            "a later hit on the same chart deletes that journal row.",
            s["body"],
        )
    )

    # 9
    story.append(Paragraph("9. Detection engine (step 1)", s["h1"]))
    story.append(
        Paragraph(
            "Entry point: analyzeChart({ candles, symbol, timeframe, baseRates? }) in src/lib/detection/engine.ts. "
            "It returns ChartFacts: last close, EMA 20/50, RSI(14), volume average, support/resistance arrays, "
            "setups[], and missingFacts[].",
            s["body"],
        )
    )
    story.append(Paragraph("Each DetectedSetup includes", s["h2"]))
    story.append(
        bullets(
            [
                "Pattern name, bias (bullish / bearish / neutral), expectedMove (up / down / sideways).",
                "Inclusive startIndex and endIndex on the candle array.",
                "Key levels: open, high, low, close, invalidation.",
                "Confirmation: confirmed, unconfirmed, or unavailable (no next closed bar).",
                "Context: prior 20-bar trend, volume vs 20-bar average, EMA 20/50, RSI(14), nearest S/R and distances.",
                "Forward close returns at 1, 3, 5, 10 bars (null if those bars are not closed).",
                "Base rate: universe, sampleSize, hitRate (null when sampleSize is 0).",
            ]
        )
    )
    story.append(Paragraph("Twelve textbook patterns", s["h2"]))
    story.append(
        Paragraph(
            "Doji, Hammer, Hanging Man, Inverted Hammer, Shooting Star, Bullish Engulfing, Bearish Engulfing, "
            "Piercing Line, Dark Cloud Cover, Morning Star, Evening Star, Three White Soldiers, Three Black Crows. "
            "Geometry lives in geometry.ts; scanners in patterns.ts. One label per end bar, ranked so multi-bar "
            "patterns outrank single-bar wicks when both fire.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "Tests: tests/detection/engine.test.ts (23) plus classroomLesson.test.ts. First-run issues that were fixed: "
            "oxc parse on defaulted destructuring, Three White Soldiers outranking hammers (now require body/range &gt; 0.45), "
            "and hanging-man vs hammer depending on the prior bar’s direction.",
            s["body"],
        )
    )

    # 10
    story.append(Paragraph("10. AI Classroom (step 2)", s["h1"]))
    story.append(
        Paragraph(
            "Route /classroom is a server page that builds buildHammerClassroomLesson(studentLevel). "
            "Level is read from User.level (default 2) and only changes stop-loss wording. "
            "The live tape was moved to /classroom/live so the graded lesson is always historical.",
            s["body"],
        )
    )
    story.append(
        table(
            ["Layer", "Student action", "Engine constraint"],
            [
                ["1 What", "See highlighted hammer candles and OHLC in rupees", "Name and prices from DetectedSetup"],
                ["2 Why", "Read rejection story on that bar only", "Low / close / high / volume vs average from facts"],
                ["3 Context", "Compare strong vs weak twin side by side", "Same pattern name, different neighbourhood"],
                ["4 Predict", "Must pick up / down / sideways, 50–100% confidence, ≥8 character reason", "Future bars hidden; cannot skip"],
                ["5 Reveal", "Play / Pause / Step the next bars", "5-bar close % and base rate; one chart is an anecdote"],
                ["6 Failure", "See a hammer that did not follow through", "Invalidation print; stop-loss glossed if level &lt; 6"],
            ],
            [28 * mm, 72 * mm, 72 * mm],
        )
    )
    story.append(Paragraph("Table 5. Six-layer tutor. Narration is src/lib/detection/narrate.ts (templates, not Anthropic).", s["caption"]))
    story.append(
        Paragraph(
            "Highlighting is a lime border on pattern bars (highlightRange on LightweightChart). "
            "The teaching chart key is classroom:hammer:RELIANCE:1D:primary. If a fixture is not actually a Hammer, "
            "the builder throws — it will not invent a detection.",
            s["body"],
        )
    )

    # 11
    story.append(Paragraph("11. Predictions and mistake journal (step 3)", s["h1"]))
    story.append(
        Paragraph(
            "Locking a prediction POSTs to /api/predictions. Scoring is src/lib/journal/score.ts. "
            "“Wrong” means the student’s direction does not match the engine’s 5-bar close bucket "
            "(up if return &gt; 0.5%, down if &lt; −0.5%, else sideways). A missing 5-bar close is not a miss.",
            s["body"],
        )
    )
    story.append(Paragraph("Mistake tags (only on misses)", s["h2"]))
    story.append(
        bullets(
            [
                "wrong-direction — bucket mismatch.",
                "followed-textbook-bias — guessed the pattern’s expectedMove.",
                "ignored-volume — textbook side while volume vs average &lt; 1.",
                "ignored-context — reason did not mention trend, volume, support, EMA, RSI, wick, or invalidation.",
                "certainty-language — always / definitely / sure-shot / guaranteed / will go.",
            ]
        )
    )
    story.append(
        Paragraph(
            "/journal lists misses with the stored candle snapshot. PatternReplay is the same Play / Pause / Step "
            "control as Reveal. Habit notes appear only when the same tag shows at least twice. Correct guesses stay off this list on purpose.",
            s["body"],
        )
    )

    # 12
    story.append(Paragraph("12. Everyday Market backend (step 4)", s["h1"]))
    story.append(
        Paragraph(
            "After a cash-market session the job generateDailyChapter(date) runs. Weekends and a stub NSE holiday list are skipped. "
            "There is no licensed EOD vendor yet: indices use generateHistory; a few constituents get fixture overlays so the picker "
            "always has a clean pattern and a trap without inventing detections.",
            s["body"],
        )
    )
    story.append(
        table(
            ["Section", "Min level", "Source of numbers"],
            [
                ["Market Story", "1", "NIFTY and BANKNIFTY last bar OHLC, change vs prior close, volume vs 20-bar average. No news invented."],
                ["Pattern of the Day", "2", "Highest-quality recent setup from the engine."],
                ["Yesterday's Predict-and-Reveal", "2", "Pattern ending before the last closed bar; hideAfterPattern true."],
                ["Spot It Yourself", "3", "Three mixed-bias snapshots; labels stored for later student UI."],
                ["Trap of the Day", "4", "Same drawing, weak context (light volume or far from S/R)."],
                ["Risk Drill", "6", "Virtual ₹1,00,000 × 1% ÷ |close − invalidation|."],
                ["Rule Check", "7", "Last close above EMA(20) and volume &gt; 1.5× average. Educational list only."],
                ["Daily Quiz", "1", "Five items from the pattern-of-day facts (MCQ, chart-mark, explain)."],
            ],
            [48 * mm, 22 * mm, 102 * mm],
        )
    )
    story.append(Paragraph("Table 6. Daily chapter sections. Student gating is step 5 — today only admins see the draft.", s["caption"]))
    story.append(Paragraph("Compliance filter", s["h2"]))
    story.append(
        Paragraph(
            "src/lib/daily/compliance.ts rewrites phrases before save and again when an admin edits. Hits are stored on the chapter and in ComplianceEvent. "
            "Auto-publish (AppSettings.autoPublishDaily) only publishes when blockedCount is 0; otherwise the chapter stays draft.",
            s["body"],
        )
    )
    story.append(
        table(
            ["Phrase", "Becomes"],
            [
                ["buy / sell (word boundary; not buyers/sellers)", "study"],
                ["target(s)", "reference level"],
                ["sure-shot", "study case"],
                ["guaranteed", "not promised"],
                ["will go up / will go down", "moved in the textbook direction in past samples"],
                ["multibagger, book profit, accumulate", "study example / review the invalidation / watch"],
            ],
            [90 * mm, 82 * mm],
        )
    )
    story.append(Paragraph("Table 7. Compliance rewrites.", s["caption"]))
    story.append(Paragraph("How to generate", s["h2"]))
    story.append(
        bullets(
            [
                "Admin UI: /admin → Generate draft (optional session date).",
                "CLI: npm run daily-chapter   (optional YYYY-MM-DD argument).",
                "Cron: POST /api/admin/chapters/generate with Authorization: Bearer $CRON_SECRET. Intended ~18:00 IST.",
            ]
        )
    )
    story.append(
        Paragraph(
            "Universe stand-in: NIFTY, BANKNIFTY, RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, HINDUNILVR, SBIN, BHARTIARTL, ITC, KOTAKBANK.",
            s["body"],
        )
    )

    # 13
    story.append(Paragraph("13. Curriculum (12 levels)", s["h1"]))
    story.append(
        table(
            ["Level", "Name", "Notes"],
            [
                ["1", "Market basics", "NSE/BSE, orders, accounts — open"],
                ["2", "Charts and candlesticks", "Classroom default; candlestick academy workbooks"],
                ["3", "Patterns and indicators", "Open lessons"],
                ["4", "Price action", "Catalog present"],
                ["5", "Fundamentals", "Catalog present"],
                ["6", "Risk and position sizing", "Unlocks F&amp;O later; calculator live"],
                ["7", "Rule-based strategies", "Daily rule-check is tagged L7"],
                ["8", "Backtesting", "Outline"],
                ["9", "Paper trading", "Simulator page still placeholder"],
                ["10", "F&amp;O", "Locked until Level 6 risk test"],
                ["11", "Algo trading", "Locked / later"],
                ["12", "Capstone + certificate", "Later"],
            ],
            [22 * mm, 52 * mm, 98 * mm],
        )
    )
    story.append(Paragraph("Table 8. Catalog in src/lib/curriculum. 150+ unique slugs; F&amp;O lessons stay locked.", s["caption"]))

    # 14
    story.append(Paragraph("14. MongoDB models", s["h1"]))
    story.append(
        table(
            ["Collection", "Role"],
            [
                ["User", "Email, Google/email provider, tier free/lab, wallet ₹5,00,000 virtual, level 1–12 (default 2), xp, language en/hi/hinglish, streak, role student/admin"],
                ["Prediction", "One locked predict per user per chartKey: direction, confidence, reason, actual 5-bar bucket, tags, engine snapshot"],
                ["MistakeJournalEntry", "Misses only, unique per user+chartKey, replay snapshot"],
                ["DailyChapter", "YYYY-MM-DD IST, status draft/approved/rejected/published, sections[], compliance log, reviewer"],
                ["ComplianceEvent", "Rewrite audit trail (phrase, original, rewritten)"],
                ["AppSettings", "Singleton key=site, autoPublishDaily"],
                ["Candle", "OHLCV by symbol+timeframe+time (1m/5m/15m/1D)"],
                ["Lesson / Question", "Older CMS-style schemas; current syllabus is mostly the TypeScript catalog"],
                ["Order / Position / Trade", "Paper-trading schema ready; simulator UI not built"],
            ],
            [48 * mm, 124 * mm],
        )
    )
    story.append(Paragraph("Table 9. Mongoose models in src/models.", s["caption"]))

    # 15
    story.append(Paragraph("15. Auth, wallet, price feed", s["h1"]))
    story.append(Paragraph("Auth", s["h2"]))
    story.append(
        Paragraph(
            "OTP is stored in Redis and consumed only after a successful Mongo upsert, so a brief Atlas blip does not burn a valid code. "
            "Credentials errors map to invalid_otp and database_unavailable. Email timestamps are formatted in Asia/Kolkata. "
            "Google sign-in upserts User with provider google.",
            s["body"],
        )
    )
    story.append(Paragraph("Wallet", s["h2"]))
    story.append(
        Paragraph(
            "Every user starts with a ₹5,00,000 virtual wallet. Nothing in the classroom or daily chapter places a live order. "
            "The risk drill uses a hypothetical ₹1,00,000 × 1% example independent of the wallet.",
            s["body"],
        )
    )
    story.append(Paragraph("Price feed", s["h2"]))
    story.append(
        Paragraph(
            "npm run worker polls MockNseProvider, builds 1m/5m/15m/1D candles, writes closed bars to Mongo, and publishes quotes to Redis for /api/stream. "
            "If stored history is too thin or all bars are single-tick (OHLC equal), /api/candles falls back to generateHistory so charts have real bodies and wicks. "
            "That fallback is what used to look like a dotted line on 1-minute classroom charts.",
            s["body"],
        )
    )

    # 16
    story.append(Paragraph("16. How to run locally", s["h1"]))
    story.append(
        code_block(
            """
npm install
# copy .env.example → .env and fill Mongo, NextAuth, Redis, SMTP
npm run dev                 # http://localhost:3000
npm test                    # vitest (44 tests)
npm run worker              # optional mock tape
npm run daily-chapter       # optional: generate today's IST draft (needs Mongo + admin settings)
"""
        )
    )
    story.append(
        bullets(
            [
                "Whitelist this machine’s IP on Atlas if OTP sign-in fails with database_unavailable.",
                "Set a User.role to “admin” in Mongo to open /admin.",
                "Set CRON_SECRET to call the generate API from a scheduler at ~18:00 IST.",
                "ANTHROPIC_API_KEY is unused for teaching copy today; step 2–4 use templates grounded in ChartFacts.",
            ]
        )
    )

    # 17
    story.append(Paragraph("17. Tests", s["h1"]))
    story.append(
        table(
            ["File", "What it locks"],
            [
                ["tests/detection/engine.test.ts", "12 patterns, EMA/RSI, trend, S/R, forward returns, base rates"],
                ["tests/detection/classroomLesson.test.ts", "Hammer on strong/weak/failed tapes; narrator uses engine rupees; no live-trade wording"],
                ["tests/journal/score.test.ts", "Match vs miss, textbook-bias tags, habits after two similar misses, teaching-chart registry"],
                ["tests/daily/generate.test.ts", "Weekend/holiday skip, eight sections on 2026-09-22, no buy/sell, risk shares, compliance rewrites"],
                ["tests/curriculum/catalog.test.ts", "12 levels, unique slugs, F&amp;O locked"],
                ["tests/detector/candlestickPatterns.test.ts", "Older sandbox pattern labels on the live tape"],
            ],
            [62 * mm, 110 * mm],
        )
    )
    story.append(Paragraph("Table 10. Vitest suites. Last full run: 6 files, 44 passed.", s["caption"]))

    # 18
    story.append(Paragraph("18. Open assumptions and next steps", s["h1"]))
    story.append(Paragraph("Assumptions still open", s["h2"]))
    story.append(
        bullets(
            [
                "No licensed NSE EOD vendor. Daily chapters use synthetic 80-day tapes plus fixture overlays.",
                "Ten names stand in for NIFTY 50 constituents. Base rates are tallied on that synthetic universe, not a 5-year official history.",
                "NSE holiday calendar is a stub list in src/lib/daily/calendar.ts — replace with the official circular.",
                "Confirmation = next closed close beyond pattern high/low.",
                "User.level is stored but Everyday Market gating is not in the student UI yet.",
                "English-only classroom copy; language field exists (en / hi / hinglish) but is unused in the tutor.",
            ]
        )
    )
    story.append(Paragraph("Step 5 (not built) — Student Everyday Market", s["h2"]))
    story.append(
        bullets(
            [
                "Student route (for example /market) showing only sections at or below User.level; higher sections preview as “Unlock at Level X”.",
                "Streaks and XP for completing the daily chapter.",
                "Archive searchable by pattern name and date.",
                "Predict-and-reveal on yesterday’s chart using already-closed data only.",
            ]
        )
    )
    story.append(Paragraph("Step 6 (not built) — Mastery loop", s["h2"]))
    story.append(
        bullets(
            [
                "Explain-back: student restates the idea; rubric (correct idea, condition, mentions risk).",
                "Misconception detector (for example “hammer always means up”).",
                "Spaced repetition at 1, 3, 7, 21 days with fresh engine snapshots.",
                "Confidence calibration chart: are 80% guesses right about 80% of the time?",
                "Optional LLM explanations still bound to ChartFacts, then the same compliance filter.",
            ]
        )
    )
    story.append(Spacer(1, 8 * mm))
    story.append(
        Paragraph(
            "End of guide. Stocktute remains a virtual classroom. Nothing in this document is a recommendation to trade a live stock.",
            s["body"],
        )
    )

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=18 * mm,
        title="Stocktute Project Guide",
        author="Stocktute",
        subject="Full project structure and implementation status as of 22 September 2026",
    )
    doc.build(story, onFirstPage=cover_header_footer, onLaterPages=header_footer)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
