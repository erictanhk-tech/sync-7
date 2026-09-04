'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Clock3,
  Headphones,
  Home as HomeIcon,
  Library,
  LockKeyhole,
  Music2,
  RotateCcw,
  Scale,
  Share2,
  TriangleAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type View = 'today' | 'week' | 'kit';
type Choice = {
  label: string;
  score: number;
  feedback: string;
  reply: string;
};
type Question = {
  gate: string;
  prompt: string;
  choices: Choice[];
};
type Day = {
  number: number;
  title: string;
  shortTitle: string;
  field: string;
  minutes: number;
  concept: string;
  brief: string;
  facts: string[];
  questions: Question[];
  takeaway: string[];
};
type ProgressState = {
  answers: Record<string, number[]>;
  cursors: Record<string, number>;
  completed: number[];
  currentDay: number;
};

const STORAGE_KEY = 'sync-7-progress-v1';

const days: Day[] = [
  {
    number: 1,
    title: 'Find the right song',
    shortTitle: 'Brief & discover',
    field: 'Film',
    minutes: 7,
    concept: 'Creative fit is only half the job. A usable song also fits the chain, budget and deadline.',
    brief: 'The director wants “Glass City” for a 72-second opening cue. Worldwide, 10 years. $60,000 all-in. Picture locks in 12 days.',
    facts: ['Director is attached', 'Split publishing', 'Sample status unknown'],
    questions: [
      {
        gate: 'First move',
        prompt: 'What do you do before contacting rights holders?',
        choices: [
          {
            label: 'Email the label and say the director must have it.',
            score: 0,
            feedback: 'You exposed maximum attachment before checking ownership, price or alternatives.',
            reply: 'Label: “If it is irreplaceable, send your best budget.”',
          },
          {
            label: 'Write the cue brief and shortlist two clearable alternatives.',
            score: 10,
            feedback: 'Strong. Define the story function, edit, lyrics, scope, deadline and ceiling—then protect leverage with alternates.',
            reply: 'Producer: “Show us the hero track and two alternates tomorrow.”',
          },
          {
            label: 'Ask editorial only for the timecode and wait for legal.',
            score: 5,
            feedback: 'Timecode matters, but supervision also connects story, lyrics, audience, budget and schedule.',
            reply: 'Editor: “The timing may change. What else do you need?”',
          },
        ],
      },
      {
        gate: 'Shortlist test',
        prompt: 'Which candidate should lead your presentation?',
        choices: [
          {
            label: 'The perfect creative fit with unknown ownership and no responsive contact.',
            score: 3,
            feedback: 'Pitch it only with a clear risk label. On this deadline, an unreachable chain cannot be your only plan.',
            reply: 'Production: “Can you guarantee an answer before picture lock?”',
          },
          {
            label: 'A strong fit with a verified one-stop owner, clean version and firm quote window.',
            score: 10,
            feedback: 'Correct. Creative strength plus clearability, asset readiness and response speed makes it decision-ready.',
            reply: 'Rights owner: “We can hold the quote for five business days.”',
          },
          {
            label: 'The cheapest track, even though its lyric contradicts the scene.',
            score: 4,
            feedback: 'Budget cannot rescue a poor narrative choice. Keep searching for a track that solves both story and deal.',
            reply: 'Director: “It clears, but it breaks the scene.”',
          },
        ],
      },
    ],
    takeaway: ['Translate taste into a written cue brief', 'Check clearability before promising', 'Always carry a credible alternate'],
  },
  {
    number: 2,
    title: 'Split the rights',
    shortTitle: 'Master & publishing',
    field: 'TV',
    minutes: 8,
    concept: 'A recorded song contains two assets: the recording (master) and the underlying song (composition).',
    brief: 'A TV episode uses 45 seconds of “Paper Moons.” The label confirms its master, but publisher data totals only 75%. Delivery is Friday.',
    facts: ['Master confirmed', 'Publishing mapped to 75%', 'One writer self-administers 25%'],
    questions: [
      {
        gate: 'Permission stack',
        prompt: 'What must you clear for the existing recording in picture?',
        choices: [
          {
            label: 'Master-use permission plus synchronization permission covering 100% of the composition.',
            score: 10,
            feedback: 'Exactly. The label clears the recording; publishers or writers clear the song. Samples and approvals may add layers.',
            reply: 'Counsel: “Make every offer contingent on full chain of title.”',
          },
          {
            label: 'A sync license from the label—the label clears the whole song.',
            score: 0,
            feedback: 'A label normally speaks for the master, not automatically for the composition.',
            reply: 'Label: “We do not represent the publishers.”',
          },
          {
            label: 'A public-performance license from the broadcaster.',
            score: 2,
            feedback: 'Performance licensing does not replace production-side master and synchronization permissions.',
            reply: 'Network delivery: “The episode still contains uncleared music.”',
          },
        ],
      },
      {
        gate: 'Missing share',
        prompt: 'The two publishers approve their 75%. What is the safest next call?',
        choices: [
          {
            label: 'Proceed; a majority of the composition is enough.',
            score: 0,
            feedback: 'A missing share can block the use. Do not assume partial approvals authorize the whole composition.',
            reply: 'Business affairs: “We cannot accept a 75%-cleared cue.”',
          },
          {
            label: 'Find and confirm the self-administered writer’s 25%, while holding a replacement cue.',
            score: 10,
            feedback: 'Right. Verify the share, approval authority and written evidence; keep the fallback alive until all required interests clear.',
            reply: 'Writer: “I control 25% and approve, subject to the stated terms.”',
          },
          {
            label: 'Ask the label to indemnify the production for the missing publishing.',
            score: 2,
            feedback: 'The label cannot grant a right it does not control. A warranty is not a substitute for permission.',
            reply: 'Label counsel: “Publishing is outside our control.”',
          },
        ],
      },
    ],
    takeaway: ['Map the exact recording and the song separately', 'Publishing must total 100%', 'Check samples, approvals and representation authority'],
  },
  {
    number: 3,
    title: 'Scope the license',
    shortTitle: 'Term, media & territory',
    field: 'Advertising',
    minutes: 8,
    concept: 'Price follows scope. Define the actual campaign before asking what the song costs.',
    brief: 'A brand wants a 30-second hero spot plus 6- and 15-second cutdowns. The brief says “digital buyout,” but media bought is North America for 13 weeks.',
    facts: ['Paid social + online + CTV', 'Consumer-electronics category', 'Global option possible'],
    questions: [
      {
        gate: 'Quote request',
        prompt: 'Which scope is ready for rights holders to price?',
        choices: [
          {
            label: 'All media, worldwide, forever, every use.',
            score: 3,
            feedback: 'That may be available, but it is broader than the funded campaign and invites a premium or refusal.',
            reply: 'Artist manager: “Perpetual global rights require a much higher quote.”',
          },
          {
            label: 'North America, 13 weeks from first use, named paid media, defined cutdowns and category exclusivity, with priced expansion options.',
            score: 10,
            feedback: 'Strong. The initial package matches the buy while options make expansion predictable.',
            reply: 'Publisher: “We can quote the flight plus a renewal and global step-up.”',
          },
          {
            label: '“Digital” for 13 weeks; the agency can decide platforms later.',
            score: 5,
            feedback: 'The term is clear, but “digital” can hide paid amplification, CTV, creators, organic archive and new versions.',
            reply: 'Agency: “Are boosted posts and connected TV covered?”',
          },
        ],
      },
      {
        gate: 'Scope control',
        prompt: 'The brand adds worldwide use but only $40,000. Rights holders want $120,000 more. Your recommendation?',
        choices: [
          {
            label: 'Launch North America and negotiate a time-limited option or narrower territory step-up.',
            score: 10,
            feedback: 'Good. Turn an impossible yes/no into funded scope choices and protect the launch.',
            reply: 'Brand: “Hold a 30-day UK/EU option for $20,000 per side.”',
          },
          {
            label: 'Say online use cannot be territorial, so worldwide must be free.',
            score: 0,
            feedback: 'Distribution technology does not erase the licensed territory.',
            reply: 'Rights holders: “The North American quote remains unchanged.”',
          },
          {
            label: 'Traffic worldwide and ask finance to approve the overage later.',
            score: 0,
            feedback: 'Using beyond scope creates infringement and emergency negotiating leverage for the licensors.',
            reply: 'Brand counsel: “Do not traffic outside North America.”',
          },
        ],
      },
    ],
    takeaway: ['Name context, version, duration and edits', 'Define media, territory, term and exclusivity', 'Price renewals and step-ups before launch'],
  },
  {
    number: 4,
    title: 'License or buyout?',
    shortTitle: 'Ownership & control',
    field: 'Artist project',
    minutes: 7,
    concept: '“Buyout” is shorthand, not a deal structure. Clarify whether the client wants a license, assignment or commissioned ownership.',
    brief: 'An agency requests a “full buyout” of an existing song. Separately, a producer created a new cover master, but ownership and session releases are not signed.',
    facts: ['Existing composition', 'New cover master', 'Producer fee + points discussed'],
    questions: [
      {
        gate: 'Decode buyout',
        prompt: 'What is your first clarification on the existing song?',
        choices: [
          {
            label: 'Ask whether they mean copyright ownership or a broad/perpetual license with defined uses.',
            score: 10,
            feedback: 'Correct. An assignment, work-made-for-hire commission and perpetual license carry different ownership, value and risk.',
            reply: 'Client counsel: “We need a broad license, not ownership.”',
          },
          {
            label: 'Promise a buyout because a flat fee eliminates every future right.',
            score: 0,
            feedback: 'A flat fee alone does not transfer copyright or erase every royalty and third-party obligation.',
            reply: 'Publisher: “We license this composition; we do not sell it.”',
          },
          {
            label: 'Use the word “buyout” in the short form and define it after production.',
            score: 2,
            feedback: 'Ambiguity now produces mismatched quotes and late-stage conflict.',
            reply: 'Artist manager: “Our quote assumed 13 weeks, not ownership.”',
          },
        ],
      },
      {
        gate: 'New master',
        prompt: 'The label paid for the cover session. Does it automatically own the new master?',
        choices: [
          {
            label: 'Yes. Paying the studio automatically secures copyright and every performance.',
            score: 0,
            feedback: 'Payment alone may not establish ownership, assignment, performer consent, union terms or producer royalties.',
            reply: 'Producer: “I never assigned the master, and we agreed to points.”',
          },
          {
            label: 'No. Document master ownership or license, producer terms, performer releases, splits, samples and delivery.',
            score: 10,
            feedback: 'Exactly. Build the new-master chain while separately clearing the underlying composition.',
            reply: 'Business affairs: “One session release and the producer agreement remain open.”',
          },
          {
            label: 'Owning the new recording also gives the label the underlying song.',
            score: 0,
            feedback: 'The new master and the composition remain separate assets.',
            reply: 'Publisher: “You still need permission for our song.”',
          },
        ],
      },
    ],
    takeaway: ['Replace “buyout” with precise rights language', 'A license grants use; an assignment transfers ownership', 'Paper the new master and underlying song separately'],
  },
  {
    number: 5,
    title: 'Make the money work',
    shortTitle: 'Quote, MFN & budget',
    field: 'Feature film',
    minutes: 9,
    concept: 'Keep master and publishing economics visible. State whether publishing numbers are aggregate, pro rata and quoted on a 100% basis.',
    brief: 'Your ceiling is $60,000 all-in. The label quotes $45,000 for the master. The publishers collectively quote $45,000 on a 100% composition basis.',
    facts: ['$90k quote', '$60k authority', 'Three publishing shares'],
    questions: [
      {
        gate: 'Opening position',
        prompt: 'Which offer is clear and budget-safe?',
        choices: [
          {
            label: '$30,000 master + $30,000 aggregate publishing, pro rata on a 100% basis, with carefully defined MFN.',
            score: 10,
            feedback: 'Strong. The publishing pot is aggregate—not $30,000 to every publisher—and the all-in cap stays intact.',
            reply: 'Rights holders: “We each quote $45,000 at the side basis.”',
          },
          {
            label: 'Tell every party the total budget and invite each to take what they can.',
            score: 2,
            feedback: 'Uncoordinated claims can exceed the cap and trigger mismatched MFN demands.',
            reply: 'Label: “We want $50,000.” Publisher: “We match the highest side.”',
          },
          {
            label: 'Spend all $60,000 on the master and ask publishing to waive.',
            score: 0,
            feedback: 'You consumed the full budget before clearing half the rights stack.',
            reply: 'Publishers: “No sync license without a publishing fee.”',
          },
        ],
      },
      {
        gate: 'Counter',
        prompt: 'The $90,000 quote holds. What is your move?',
        choices: [
          {
            label: 'Accept and move $30,000 from post without authorization.',
            score: 0,
            feedback: 'Creative enthusiasm is not spending authority. Escalate the choice; do not create an unauthorized overage.',
            reply: 'Producer: “You were not authorized to exceed the music budget.”',
          },
          {
            label: 'Counter at the $60,000 cap; trade term or promo scope if needed; set a deadline and keep the alternate live.',
            score: 10,
            feedback: 'Correct. Negotiate with scope and credible alternatives, not only a higher number.',
            reply: 'Rights holders: “$30,000 per side basis works for seven years plus a priced extension.”',
          },
          {
            label: 'Tell publishing the label accepted $20,000, even though it did not.',
            score: 0,
            feedback: 'False leverage destroys trust and can poison future deals.',
            reply: 'Publisher: “We checked. The quote is withdrawn pending counsel.”',
          },
        ],
      },
    ],
    takeaway: ['Separate master and aggregate publishing pots', 'State the 100% quote basis and pro-rata shares', 'Define MFN precisely and never exceed authority'],
  },
  {
    number: 6,
    title: 'Negotiate the edge cases',
    shortTitle: 'Games & digital',
    field: 'Video game',
    minutes: 9,
    concept: 'Game, trailer, soundtrack, creator capture and sequels are different value buckets. Bundle only what you can name.',
    brief: 'A full track plays on in-game radio. Marketing wants a trailer and creator campaign; the team may release an OST. The label flags automated streaming claims.',
    facts: ['Console + PC + cloud', 'Worldwide, 7 years', '$80k core-use budget'],
    questions: [
      {
        gate: 'Package the rights',
        prompt: 'How should the request be structured?',
        choices: [
          {
            label: 'Clear core in-game master + composition, then separately state trailer, creator, OST, sequel, DLC and extension options.',
            score: 10,
            feedback: 'Exactly. Define platforms, recurrence, capture and asset needs; keep ancillary value visible.',
            reply: 'Publisher: “Core game and trailer are available; OST is a separate option.”',
          },
          {
            label: 'Call it one “interactive sync” and assume marketing, OST and sequels are included.',
            score: 1,
            feedback: 'Undefined bundling creates scope disputes and hidden premiums.',
            reply: 'Label: “Our approval covered the base game only.”',
          },
          {
            label: 'Clear only the master because platforms handle publishing.',
            score: 0,
            feedback: 'Platform arrangements do not replace composition sync permission for embedding music in the game.',
            reply: 'Platform counsel: “Publishing clearance is the game publisher’s responsibility.”',
          },
        ],
      },
      {
        gate: 'Streamer conflict',
        prompt: 'How do you handle content claims while preserving creator marketing?',
        choices: [
          {
            label: 'Promise the publisher can prevent every claim on every platform.',
            score: 1,
            feedback: 'Do not promise what no party fully controls. Negotiate a process with defined limits.',
            reply: 'Label counsel: “We cannot warrant every automated system.”',
          },
          {
            label: 'Separate ordinary capture from named campaign channels; agree a claims/whitelist protocol and retain streamer mode.',
            score: 10,
            feedback: 'Strong. Operational rights need an operational workflow: channel list, asset IDs, response time and fallback.',
            reply: 'Label: “We will whitelist 50 channels; streamer mode disables the track for others.”',
          },
          {
            label: 'Remove the song immediately without testing a scoped workaround.',
            score: 5,
            feedback: 'Replacement may be right, but first test whether whitelisting and streamer mode solve the conflict within schedule.',
            reply: 'Audio director: “Can normal players keep it while streamer mode mutes it?”',
          },
        ],
      },
    ],
    takeaway: ['Unbundle game, marketing, OST and franchise rights', 'Price options instead of assuming free expansion', 'Turn digital restrictions into testable operating procedures'],
  },
  {
    number: 7,
    title: 'Close the deal',
    shortTitle: 'Paper, deliver & report',
    field: 'Trailer capstone',
    minutes: 10,
    concept: '“Approved” is not the finish line. Closeout connects written permission, payment, final assets, metadata and future dates.',
    brief: 'A launch trailer swapped songs 30 hours before mix. The alternate is affordable, but the final edit, one publisher approval and cue data are still moving.',
    facts: ['90-second trailer', 'Worldwide, one year', 'Theatrical + broadcast + digital'],
    questions: [
      {
        gate: 'Go / no-go',
        prompt: 'The label and one 50% publisher approve. Can the studio traffic?',
        choices: [
          {
            label: 'Yes. The other publisher can sign after launch.',
            score: 0,
            feedback: 'Half the publishing side is still uncleared. A rushed deadline does not lower the permission threshold.',
            reply: 'Studio counsel: “Hold trafficking.”',
          },
          {
            label: 'No. Obtain counsel-accepted written evidence for master and 100% publishing, plus required edit/context approvals.',
            score: 10,
            feedback: 'Correct. Match the evidence standard to the production and the exact final use.',
            reply: 'Publisher B: “Approved for the stated campaign, subject to long form.”',
          },
          {
            label: 'Yes, if the cue is under 30 seconds.',
            score: 0,
            feedback: 'There is no general duration shortcut that erases the need for permission.',
            reply: 'Counsel: “Duration may affect price, not whether rights exist.”',
          },
        ],
      },
      {
        gate: 'Delivery file',
        prompt: 'Which package lets business affairs approve final delivery?',
        choices: [
          {
            label: 'Signed licenses only; editorial already knows the rest.',
            score: 5,
            feedback: 'Contracts are central, but the file still needs final-use facts, payment, assets, credits and reporting data.',
            reply: 'Post: “We still need the approved version, timing and cue metadata.”',
          },
          {
            label: 'Written evidence, approvals, invoices/tax, correct audio, final timing/context, credits, cue metadata, restrictions, option dates and audit trail.',
            score: 10,
            feedback: 'That is a delivery-ready clearance file. It can survive distribution, royalties, renewals and audit.',
            reply: 'Business affairs: “Cleared for final delivery.”',
          },
          {
            label: 'The prior hero song’s cue sheet with the title replaced.',
            score: 0,
            feedback: 'Wrong ownership and identifier data breaks reporting, royalties and auditability.',
            reply: 'Music operations: “The recording and reported work do not match.”',
          },
        ],
      },
    ],
    takeaway: ['Match written evidence to the exact final use', 'Finish payments, assets, credits and cue metadata', 'Calendar restrictions, expiries and options'],
  },
];

const emptyProgress: ProgressState = {
  answers: {},
  cursors: {},
  completed: [],
  currentDay: 1,
};

const requestTemplate = `Subject: [PROJECT] — music clearance request — [SONG]

Project / producer:
Song + exact recording:
Scene and context:
Duration and versions:
Media:
Territory:
Term:
Promo / trailer / paid media:
Exclusivity:
Fee basis:
Requested options:
Conditions: full clearance, approvals, final context and long form
Response / hold deadline:`;

function scoreForDay(day: Day, progress: ProgressState) {
  const answers = progress.answers[String(day.number)] ?? [];
  if (!answers.length) return null;
  const earned = answers.reduce((sum, choiceIndex, questionIndex) => {
    return sum + (day.questions[questionIndex]?.choices[choiceIndex]?.score ?? 0);
  }, 0);
  return Math.round((earned / (day.questions.length * 10)) * 100);
}

function scoreLabel(score: number | null) {
  if (score === null) return 'Not started';
  if (score >= 90) return 'Supervisor call';
  if (score >= 70) return 'Sound judgment';
  return 'Replay recommended';
}

export default function Home() {
  const [view, setView] = useState<View>('today');
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setProgress({ ...emptyProgress, ...JSON.parse(saved) });
      } catch {
        setProgress(emptyProgress);
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [hydrated, progress]);

  const day = days[progress.currentDay - 1] ?? days[0];
  const cursor = Math.min(progress.cursors[String(day.number)] ?? 0, day.questions.length - 1);
  const answerIndexes = progress.answers[String(day.number)] ?? [];
  const selectedIndex = answerIndexes[cursor];
  const answered = selectedIndex !== undefined;
  const complete = progress.completed.includes(day.number);
  const question = day.questions[cursor];
  const selectedChoice = answered ? question.choices[selectedIndex] : null;
  const coursePercent = Math.round((progress.completed.length / days.length) * 100);

  const overallScore = useMemo(() => {
    const scores = days.map((item) => scoreForDay(item, progress)).filter((value): value is number => value !== null);
    if (!scores.length) return null;
    return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  }, [progress]);

  function choose(choiceIndex: number) {
    if (answered || complete) return;
    setProgress((current) => {
      const key = String(day.number);
      const nextAnswers = [...(current.answers[key] ?? [])];
      nextAnswers[cursor] = choiceIndex;
      return { ...current, answers: { ...current.answers, [key]: nextAnswers } };
    });
  }

  function advance() {
    if (!answered) return;
    if (cursor < day.questions.length - 1) {
      setProgress((current) => ({
        ...current,
        cursors: { ...current.cursors, [String(day.number)]: cursor + 1 },
      }));
      return;
    }
    setProgress((current) => ({
      ...current,
      completed: current.completed.includes(day.number) ? current.completed : [...current.completed, day.number],
    }));
  }

  function openDay(dayNumber: number) {
    setProgress((current) => ({ ...current, currentDay: dayNumber }));
    setView('today');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextDay() {
    if (day.number < days.length) openDay(day.number + 1);
    else setView('week');
  }

  async function copyRequest() {
    await navigator.clipboard.writeText(requestTemplate);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareApp() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'SYNC / 7',
          text: 'A seven-day music supervision deal sprint.',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      setShared(false);
    }
  }

  function resetProgress() {
    setProgress(emptyProgress);
    setView('today');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main className="min-h-dvh bg-background pb-28 text-foreground sm:px-6 sm:pb-12">
      <div className="mx-auto w-full max-w-xl">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/88 px-4 py-4 backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-5">
          <button type="button" className="flex items-center gap-2.5 text-left" onClick={() => setView('today')} aria-label="Go to today's lesson">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Headphones aria-hidden="true" className="size-4" />
            </span>
            <span>
              <span className="block font-heading text-sm font-semibold tracking-tight">SYNC / 7</span>
              <span className="block text-xs text-muted-foreground">Music deal training</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            {overallScore !== null && <Badge variant="secondary">{overallScore}% avg</Badge>}
            <Button type="button" variant="ghost" size="icon" aria-label="Share this app" onClick={shareApp}>
              {shared ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
            </Button>
          </div>
        </header>

        {view === 'today' && (
          <section aria-labelledby="today-title" className="space-y-4 px-4 pt-5 sm:px-0">
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Day {day.number} of 7 • {day.field}</p>
                  <h1 id="today-title" className="mt-1 font-heading text-3xl font-semibold tracking-[-0.035em]">
                    {day.title}
                  </h1>
                </div>
                <Badge variant="secondary" className="gap-1.5">
                  <Clock3 aria-hidden="true" className="size-3" /> {day.minutes} min
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={coursePercent} aria-label="Seven-day course progress" className="flex-1" />
                <span className="text-xs font-semibold tabular-nums">{coursePercent}%</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5" aria-label="Seven-day course map">
                {days.map((item) => {
                  const isCurrent = item.number === day.number;
                  const isDone = progress.completed.includes(item.number);
                  return (
                    <button
                      type="button"
                      key={item.number}
                      onClick={() => openDay(item.number)}
                      aria-label={'Open day ' + item.number + ': ' + item.title}
                      aria-current={isCurrent ? 'step' : undefined}
                      className={cn(
                        'grid h-9 place-items-center rounded-lg text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        isCurrent && 'bg-primary text-primary-foreground',
                        !isCurrent && isDone && 'bg-accent text-accent-foreground',
                        !isCurrent && !isDone && 'bg-muted text-muted-foreground hover:bg-secondary',
                      )}
                    >
                      {isDone ? <Check aria-hidden="true" className="size-3.5" /> : item.number}
                    </button>
                  );
                })}
              </div>
            </div>

            {!complete ? (
              <>
                <Card className="border-0 shadow-[0_18px_50px_-28px_oklch(0.29_0.07_42/0.45)] ring-border">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{day.field}</Badge>
                      <Badge variant="secondary">Challenge {cursor + 1} / {day.questions.length}</Badge>
                    </div>
                    <CardTitle className="text-xl">{question.gate}</CardTitle>
                    <CardDescription>{day.brief}</CardDescription>
                    <CardAction>
                      <span className="grid size-9 place-items-center rounded-full bg-accent text-accent-foreground">
                        <LockKeyhole aria-hidden="true" className="size-4" />
                      </span>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl bg-muted/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Know this first</p>
                      <p className="mt-1 text-sm leading-relaxed">{day.concept}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {day.facts.map((fact) => <Badge key={fact} variant="outline">{fact}</Badge>)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your call</p>
                      <p className="mt-1 font-medium leading-snug">{question.prompt}</p>
                    </div>
                    <fieldset className="space-y-2">
                      <legend className="sr-only">Choose your response</legend>
                      {question.choices.map((choice, index) => (
                        <Button
                          key={choice.label}
                          type="button"
                          variant={answered && selectedIndex === index ? 'secondary' : 'outline'}
                          className={cn(
                            'h-auto min-h-12 w-full justify-start whitespace-normal px-3 py-3 text-left leading-snug',
                            answered && selectedIndex !== index && 'opacity-55',
                          )}
                          onClick={() => choose(index)}
                          disabled={answered}
                          aria-pressed={selectedIndex === index}
                        >
                          <span className="mr-1 grid size-6 shrink-0 place-items-center rounded-full border border-current/20 text-xs">
                            {String.fromCharCode(65 + index)}
                          </span>
                          {choice.label}
                        </Button>
                      ))}
                    </fieldset>
                    {selectedChoice && (
                      <output className={cn(
                        'rounded-xl border p-3',
                        selectedChoice.score >= 8 ? 'border-accent bg-accent/45' : 'border-primary/25 bg-primary/5',
                      )} aria-live="polite">
                        <div className="flex items-start gap-2.5">
                          {selectedChoice.score >= 8
                            ? <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
                            : <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />}
                          <div>
                            <p className="text-sm font-semibold">{selectedChoice.score}/10 • {scoreLabel(selectedChoice.score * 10)}</p>
                            <p className="mt-1 text-sm leading-relaxed">{selectedChoice.feedback}</p>
                            <p className="mt-2 text-xs italic text-muted-foreground">{selectedChoice.reply}</p>
                          </div>
                        </div>
                      </output>
                    )}
                    <Button type="button" size="lg" className="h-12 w-full" disabled={!answered} onClick={advance}>
                      {cursor === day.questions.length - 1 ? 'Finish day' : 'Next challenge'}
                      <ArrowRight data-icon="inline-end" aria-hidden="true" />
                    </Button>
                  </CardContent>
                </Card>
                {day.number > 1 && (
                  <Button type="button" variant="ghost" className="w-full" onClick={() => openDay(day.number - 1)}>
                    <ArrowLeft data-icon="inline-start" aria-hidden="true" /> Previous day
                  </Button>
                )}
              </>
            ) : (
              <Card className="overflow-visible border-0 bg-foreground text-background shadow-[0_22px_60px_-30px_oklch(0.18_0.03_48/0.65)] ring-0">
                <CardHeader>
                  <Badge className="bg-accent text-accent-foreground">Day cleared</Badge>
                  <CardTitle className="font-heading text-2xl text-background">
                    {scoreForDay(day, progress)}% • {scoreLabel(scoreForDay(day, progress))}
                  </CardTitle>
                  <CardDescription className="text-background/68">Put these three moves in your pocket.</CardDescription>
                  <CardAction>
                    <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check aria-hidden="true" className="size-5" />
                    </span>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {day.takeaway.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="border-background/10 bg-background/5">
                  <Button type="button" size="lg" className="h-12 w-full" onClick={nextDay}>
                    {day.number === 7 ? 'See my week' : 'Start day ' + (day.number + 1)}
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            <p className="px-2 text-center text-xs leading-relaxed text-muted-foreground">
              Training simulation—not legal advice. Confirm live deals with qualified counsel.
            </p>
          </section>
        )}

        {view === 'week' && (
          <section aria-labelledby="week-title" className="space-y-5 px-4 pt-5 sm:px-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your sprint</p>
              <h1 id="week-title" className="mt-1 font-heading text-3xl font-semibold tracking-[-0.035em]">Seven days. One deal brain.</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Take the days in order or jump to the problem on your desk. Each session is under ten minutes.
              </p>
            </div>
            <Card size="sm">
              <CardContent className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
                  {progress.completed.length}/7
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">Course progress</p>
                    <span className="text-xs font-semibold tabular-nums">{coursePercent}%</span>
                  </div>
                  <Progress value={coursePercent} aria-label="Course progress" className="mt-2" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {overallScore === null ? 'Start Day 1 to set your baseline.' : overallScore + '% average across attempted days.'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {days.map((item) => {
                const isDone = progress.completed.includes(item.number);
                const score = scoreForDay(item, progress);
                const attempted = score !== null;
                return (
                  <button
                    key={item.number}
                    type="button"
                    onClick={() => openDay(item.number)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-xl text-sm font-semibold',
                      isDone ? 'bg-accent text-accent-foreground' : attempted ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground',
                    )}>
                      {isDone ? <Check aria-hidden="true" className="size-4" /> : item.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{item.field} • {item.minutes} min</span>
                      <span className="mt-0.5 block font-heading font-semibold">{item.shortTitle}</span>
                    </span>
                    <span className="text-right">
                      {score !== null && <span className="block text-xs font-semibold tabular-nums">{score}%</span>}
                      <ChevronRight aria-hidden="true" className="ml-auto mt-1 size-4 text-muted-foreground" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {view === 'kit' && (
          <section aria-labelledby="kit-title" className="space-y-5 px-4 pt-5 sm:px-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Pocket reference</p>
              <h1 id="kit-title" className="mt-1 font-heading text-3xl font-semibold tracking-[-0.035em]">Your field kit</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">The minimum viable deal desk—designed for a phone screen.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card size="sm">
                <CardHeader>
                  <span className="mb-1 grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Music2 aria-hidden="true" className="size-4" /></span>
                  <CardTitle>Master</CardTitle>
                  <CardDescription>The exact recorded performance. Usually cleared with the recording owner.</CardDescription>
                </CardHeader>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <span className="mb-1 grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground"><BookOpenText aria-hidden="true" className="size-4" /></span>
                  <CardTitle>Composition</CardTitle>
                  <CardDescription>The music and lyrics. Clear every required publisher/writer share.</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <Badge variant="outline">Copy + customize</Badge>
                <CardTitle>Clearance request skeleton</CardTitle>
                <CardDescription>Send the same complete scope to master and publishing contacts.</CardDescription>
                <CardAction>
                  <Button type="button" variant="ghost" size="icon" aria-label="Copy request template" onClick={copyRequest}>
                    {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-muted p-3 font-mono text-xs leading-relaxed text-muted-foreground">{requestTemplate}</pre>
              </CardContent>
              <CardFooter>
                <Button type="button" variant="outline" className="w-full" onClick={copyRequest}>
                  {copied ? 'Copied' : 'Copy request'} {copied ? <Check data-icon="inline-end" aria-hidden="true" /> : <Clipboard data-icon="inline-end" aria-hidden="true" />}
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-2">
              <h2 className="font-heading text-lg font-semibold">Deal order of operations</h2>
              {[
                ['1', 'Brief', 'Story, audience, timing, lyrics, deadline and ceiling'],
                ['2', 'Map', 'Master owner, 100% publishing, samples and approvals'],
                ['3', 'Scope', 'Context, media, territory, term, versions, promo and options'],
                ['4', 'Money', 'Master + aggregate publishing basis, MFN, cap and contingency'],
                ['5', 'Close', 'Written evidence, payment, assets, cue data and future dates'],
              ].map(([number, title, text]) => (
                <div key={number} className="flex gap-3 rounded-xl border border-border/70 bg-card/70 p-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-semibold">{number}</span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Scale aria-hidden="true" className="size-4 text-primary" /> Legal reality check</CardTitle>
                <CardDescription>
                  Mechanical, performance, neighboring-rights, union, moral-rights and tax rules vary by product and territory. Treat this as training and use qualified counsel for live exploitation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a className="text-sm font-semibold text-primary underline underline-offset-4" href="https://www.copyright.gov/music-modernization/educational-materials/musicians-income.pdf" target="_blank" rel="noreferrer">
                  U.S. Copyright Office music-rights guide
                </a>
              </CardContent>
            </Card>

            <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={resetProgress}>
              <RotateCcw data-icon="inline-start" aria-hidden="true" /> Reset all progress
            </Button>
          </section>
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/94 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl sm:static sm:mx-auto sm:mt-8 sm:max-w-xl sm:rounded-2xl sm:border sm:p-2 sm:shadow-sm" aria-label="Main navigation">
        <div className="mx-auto grid max-w-xl grid-cols-3 gap-1">
          <NavButton active={view === 'today'} onClick={() => setView('today')} icon={HomeIcon} label="Today" />
          <NavButton active={view === 'week'} onClick={() => setView('week')} icon={Library} label="Week" />
          <NavButton active={view === 'kit'} onClick={() => setView('kit')} icon={BriefcaseBusiness} label="Field kit" />
        </div>
      </nav>
    </main>
  );
}

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:min-h-10 sm:flex-row sm:gap-2',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}
