'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  CloudCheck,
  CloudOff,
  Clock3,
  Headphones,
  Home as HomeIcon,
  Library,
  Link2,
  LockKeyhole,
  Music2,
  RefreshCw,
  RotateCcw,
  Scale,
  Share2,
  TriangleAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
  emptyProgress,
  mergeProgress,
  normalizeProgress,
  type ProgressState,
  type View,
} from '@/lib/progress';

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
type TutorialNote = {
  strengths: [string, string, string];
  stretch: string;
  principle: string;
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
const STORAGE_KEY = 'sync-7-progress-v1';
const SYNC_KEY_STORAGE = 'sync-7-resume-key-v1';
const SYNC_GENERATION_STORAGE = 'sync-7-resume-generation-v1';
const SYNC_REVISION_STORAGE = 'sync-7-resume-revision-v1';
const SYNC_DIRTY_STORAGE = 'sync-7-resume-pending-v1';
type SyncStatus = 'loading' | 'saving' | 'saved' | 'offline';

const days: Day[] = [
  {
    number: 1,
    title: 'Find the right song',
    shortTitle: 'Brief & discover',
    field: 'Film',
    minutes: 7,
    concept:
      'Creative fit is only half the job. A usable song also fits the chain, budget and deadline.',
    brief:
      'The director wants “Glass City” for a 72-second opening cue. Worldwide, 10 years. $60,000 all-in. Picture locks in 12 days.',
    facts: [
      'Director is attached',
      'Split publishing',
      'Sample status unknown',
    ],
    questions: [
      {
        gate: 'First move',
        prompt: 'What do you do before contacting rights holders?',
        choices: [
          {
            label: 'Email the label and say the director must have it.',
            score: 0,
            feedback:
              'You exposed maximum attachment before checking ownership, price or alternatives.',
            reply: 'Label: “If it is irreplaceable, send your best budget.”',
          },
          {
            label:
              'Write the cue brief and shortlist two clearable alternatives.',
            score: 10,
            feedback:
              'Strong. Define the story function, edit, lyrics, scope, deadline and ceiling—then protect leverage with alternates.',
            reply:
              'Producer: “Show us the hero track and two alternates tomorrow.”',
          },
          {
            label: 'Ask editorial only for the timecode and wait for legal.',
            score: 5,
            feedback:
              'Timecode matters, but supervision also connects story, lyrics, audience, budget and schedule.',
            reply: 'Editor: “The timing may change. What else do you need?”',
          },
        ],
      },
      {
        gate: 'Shortlist test',
        prompt: 'Which candidate should lead your presentation?',
        choices: [
          {
            label:
              'The perfect creative fit with unknown ownership and no responsive contact.',
            score: 3,
            feedback:
              'Pitch it only with a clear risk label. On this deadline, an unreachable chain cannot be your only plan.',
            reply:
              'Production: “Can you guarantee an answer before picture lock?”',
          },
          {
            label:
              'A strong fit with a verified one-stop owner, clean version and firm quote window.',
            score: 10,
            feedback:
              'Correct. Creative strength plus clearability, asset readiness and response speed makes it decision-ready.',
            reply:
              'Rights owner: “We can hold the quote for five business days.”',
          },
          {
            label:
              'The cheapest track, even though its lyric contradicts the scene.',
            score: 4,
            feedback:
              'Budget cannot rescue a poor narrative choice. Keep searching for a track that solves both story and deal.',
            reply: 'Director: “It clears, but it breaks the scene.”',
          },
        ],
      },
    ],
    takeaway: [
      'Translate taste into a written cue brief',
      'Check clearability before promising',
      'Always carry a credible alternate',
    ],
  },
  {
    number: 2,
    title: 'Split the rights',
    shortTitle: 'Master & publishing',
    field: 'TV',
    minutes: 8,
    concept:
      'A recorded song contains two assets: the recording (master) and the underlying song (composition).',
    brief:
      'A TV episode uses 45 seconds of “Paper Moons.” The label confirms its master, but publisher data totals only 75%. Delivery is Friday.',
    facts: [
      'Master confirmed',
      'Publishing mapped to 75%',
      'One writer self-administers 25%',
    ],
    questions: [
      {
        gate: 'Permission stack',
        prompt: 'What must you clear for the existing recording in picture?',
        choices: [
          {
            label:
              'Master-use permission plus synchronization permission covering 100% of the composition.',
            score: 10,
            feedback:
              'Exactly. The label clears the recording; publishers or writers clear the song. Samples and approvals may add layers.',
            reply:
              'Counsel: “Make every offer contingent on full chain of title.”',
          },
          {
            label:
              'A sync license from the label—the label clears the whole song.',
            score: 0,
            feedback:
              'A label normally speaks for the master, not automatically for the composition.',
            reply: 'Label: “We do not represent the publishers.”',
          },
          {
            label: 'A public-performance license from the broadcaster.',
            score: 2,
            feedback:
              'Performance licensing does not replace production-side master and synchronization permissions.',
            reply:
              'Network delivery: “The episode still contains uncleared music.”',
          },
        ],
      },
      {
        gate: 'Missing share',
        prompt:
          'The two publishers approve their 75%. What is the safest next call?',
        choices: [
          {
            label: 'Proceed; a majority of the composition is enough.',
            score: 0,
            feedback:
              'A missing share can block the use. Do not assume partial approvals authorize the whole composition.',
            reply: 'Business affairs: “We cannot accept a 75%-cleared cue.”',
          },
          {
            label:
              'Find and confirm the self-administered writer’s 25%, while holding a replacement cue.',
            score: 10,
            feedback:
              'Right. Verify the share, approval authority and written evidence; keep the fallback alive until all required interests clear.',
            reply:
              'Writer: “I control 25% and approve, subject to the stated terms.”',
          },
          {
            label:
              'Ask the label to indemnify the production for the missing publishing.',
            score: 2,
            feedback:
              'The label cannot grant a right it does not control. A warranty is not a substitute for permission.',
            reply: 'Label counsel: “Publishing is outside our control.”',
          },
        ],
      },
    ],
    takeaway: [
      'Map the exact recording and the song separately',
      'Publishing must total 100%',
      'Check samples, approvals and representation authority',
    ],
  },
  {
    number: 3,
    title: 'Scope the license',
    shortTitle: 'Term, media & territory',
    field: 'Advertising',
    minutes: 8,
    concept:
      'Price follows scope. Define the actual campaign before asking what the song costs.',
    brief:
      'A brand wants a 30-second hero spot plus 6- and 15-second cutdowns. The brief says “digital buyout,” but media bought is North America for 13 weeks.',
    facts: [
      'Paid social + online + CTV',
      'Consumer-electronics category',
      'Global option possible',
    ],
    questions: [
      {
        gate: 'Quote request',
        prompt: 'Which scope is ready for rights holders to price?',
        choices: [
          {
            label: 'All media, worldwide, forever, every use.',
            score: 3,
            feedback:
              'That may be available, but it is broader than the funded campaign and invites a premium or refusal.',
            reply:
              'Artist manager: “Perpetual global rights require a much higher quote.”',
          },
          {
            label:
              'North America, 13 weeks from first use, named paid media, defined cutdowns and category exclusivity, with priced expansion options.',
            score: 10,
            feedback:
              'Strong. The initial package matches the buy while options make expansion predictable.',
            reply:
              'Publisher: “We can quote the flight plus a renewal and global step-up.”',
          },
          {
            label:
              '“Digital” for 13 weeks; the agency can decide platforms later.',
            score: 5,
            feedback:
              'The term is clear, but “digital” can hide paid amplification, CTV, creators, organic archive and new versions.',
            reply: 'Agency: “Are boosted posts and connected TV covered?”',
          },
        ],
      },
      {
        gate: 'Scope control',
        prompt:
          'The brand adds worldwide use but only $40,000. Rights holders want $120,000 more. Your recommendation?',
        choices: [
          {
            label:
              'Launch North America and negotiate a time-limited option or narrower territory step-up.',
            score: 10,
            feedback:
              'Good. Turn an impossible yes/no into funded scope choices and protect the launch.',
            reply: 'Brand: “Hold a 30-day UK/EU option for $20,000 per side.”',
          },
          {
            label:
              'Say online use cannot be territorial, so worldwide must be free.',
            score: 0,
            feedback:
              'Distribution technology does not erase the licensed territory.',
            reply:
              'Rights holders: “The North American quote remains unchanged.”',
          },
          {
            label:
              'Traffic worldwide and ask finance to approve the overage later.',
            score: 0,
            feedback:
              'Using beyond scope creates infringement and emergency negotiating leverage for the licensors.',
            reply: 'Brand counsel: “Do not traffic outside North America.”',
          },
        ],
      },
    ],
    takeaway: [
      'Name context, version, duration and edits',
      'Define media, territory, term and exclusivity',
      'Price renewals and step-ups before launch',
    ],
  },
  {
    number: 4,
    title: 'License or buyout?',
    shortTitle: 'Ownership & control',
    field: 'Artist project',
    minutes: 7,
    concept:
      '“Buyout” is shorthand, not a deal structure. Clarify whether the client wants a license, assignment or commissioned ownership.',
    brief:
      'An agency requests a “full buyout” of an existing song. Separately, a producer created a new cover master, but ownership and session releases are not signed.',
    facts: [
      'Existing composition',
      'New cover master',
      'Producer fee + points discussed',
    ],
    questions: [
      {
        gate: 'Decode buyout',
        prompt: 'What is your first clarification on the existing song?',
        choices: [
          {
            label:
              'Ask whether they mean copyright ownership or a broad/perpetual license with defined uses.',
            score: 10,
            feedback:
              'Correct. An assignment, work-made-for-hire commission and perpetual license carry different ownership, value and risk.',
            reply: 'Client counsel: “We need a broad license, not ownership.”',
          },
          {
            label:
              'Promise a buyout because a flat fee eliminates every future right.',
            score: 0,
            feedback:
              'A flat fee alone does not transfer copyright or erase every royalty and third-party obligation.',
            reply:
              'Publisher: “We license this composition; we do not sell it.”',
          },
          {
            label:
              'Use the word “buyout” in the short form and define it after production.',
            score: 2,
            feedback:
              'Ambiguity now produces mismatched quotes and late-stage conflict.',
            reply:
              'Artist manager: “Our quote assumed 13 weeks, not ownership.”',
          },
        ],
      },
      {
        gate: 'New master',
        prompt:
          'The label paid for the cover session. Does it automatically own the new master?',
        choices: [
          {
            label:
              'Yes. Paying the studio automatically secures copyright and every performance.',
            score: 0,
            feedback:
              'Payment alone may not establish ownership, assignment, performer consent, union terms or producer royalties.',
            reply:
              'Producer: “I never assigned the master, and we agreed to points.”',
          },
          {
            label:
              'No. Document master ownership or license, producer terms, performer releases, splits, samples and delivery.',
            score: 10,
            feedback:
              'Exactly. Build the new-master chain while separately clearing the underlying composition.',
            reply:
              'Business affairs: “One session release and the producer agreement remain open.”',
          },
          {
            label:
              'Owning the new recording also gives the label the underlying song.',
            score: 0,
            feedback:
              'The new master and the composition remain separate assets.',
            reply: 'Publisher: “You still need permission for our song.”',
          },
        ],
      },
    ],
    takeaway: [
      'Replace “buyout” with precise rights language',
      'A license grants use; an assignment transfers ownership',
      'Paper the new master and underlying song separately',
    ],
  },
  {
    number: 5,
    title: 'Make the money work',
    shortTitle: 'Quote, MFN & budget',
    field: 'Feature film',
    minutes: 9,
    concept:
      'Keep master and publishing economics visible. State whether publishing numbers are aggregate, pro rata and quoted on a 100% basis.',
    brief:
      'Your ceiling is $60,000 all-in. The label quotes $45,000 for the master. The publishers collectively quote $45,000 on a 100% composition basis.',
    facts: ['$90k quote', '$60k authority', 'Three publishing shares'],
    questions: [
      {
        gate: 'Opening position',
        prompt: 'Which offer is clear and budget-safe?',
        choices: [
          {
            label:
              '$30,000 master + $30,000 aggregate publishing, pro rata on a 100% basis, with carefully defined MFN.',
            score: 10,
            feedback:
              'Strong. The publishing pot is aggregate—not $30,000 to every publisher—and the all-in cap stays intact.',
            reply: 'Rights holders: “We each quote $45,000 at the side basis.”',
          },
          {
            label:
              'Tell every party the total budget and invite each to take what they can.',
            score: 2,
            feedback:
              'Uncoordinated claims can exceed the cap and trigger mismatched MFN demands.',
            reply:
              'Label: “We want $50,000.” Publisher: “We match the highest side.”',
          },
          {
            label:
              'Spend all $60,000 on the master and ask publishing to waive.',
            score: 0,
            feedback:
              'You consumed the full budget before clearing half the rights stack.',
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
            feedback:
              'Creative enthusiasm is not spending authority. Escalate the choice; do not create an unauthorized overage.',
            reply:
              'Producer: “You were not authorized to exceed the music budget.”',
          },
          {
            label:
              'Counter at the $60,000 cap; trade term or promo scope if needed; set a deadline and keep the alternate live.',
            score: 10,
            feedback:
              'Correct. Negotiate with scope and credible alternatives, not only a higher number.',
            reply:
              'Rights holders: “$30,000 per side basis works for seven years plus a priced extension.”',
          },
          {
            label:
              'Tell publishing the label accepted $20,000, even though it did not.',
            score: 0,
            feedback:
              'False leverage destroys trust and can poison future deals.',
            reply:
              'Publisher: “We checked. The quote is withdrawn pending counsel.”',
          },
        ],
      },
    ],
    takeaway: [
      'Separate master and aggregate publishing pots',
      'State the 100% quote basis and pro-rata shares',
      'Define MFN precisely and never exceed authority',
    ],
  },
  {
    number: 6,
    title: 'Negotiate the edge cases',
    shortTitle: 'Games & digital',
    field: 'Video game',
    minutes: 9,
    concept:
      'Game, trailer, soundtrack, creator capture and sequels are different value buckets. Bundle only what you can name.',
    brief:
      'A full track plays on in-game radio. Marketing wants a trailer and creator campaign; the team may release an OST. The label flags automated streaming claims.',
    facts: [
      'Console + PC + cloud',
      'Worldwide, 7 years',
      '$80k core-use budget',
    ],
    questions: [
      {
        gate: 'Package the rights',
        prompt: 'How should the request be structured?',
        choices: [
          {
            label:
              'Clear core in-game master + composition, then separately state trailer, creator, OST, sequel, DLC and extension options.',
            score: 10,
            feedback:
              'Exactly. Define platforms, recurrence, capture and asset needs; keep ancillary value visible.',
            reply:
              'Publisher: “Core game and trailer are available; OST is a separate option.”',
          },
          {
            label:
              'Call it one “interactive sync” and assume marketing, OST and sequels are included.',
            score: 1,
            feedback:
              'Undefined bundling creates scope disputes and hidden premiums.',
            reply: 'Label: “Our approval covered the base game only.”',
          },
          {
            label: 'Clear only the master because platforms handle publishing.',
            score: 0,
            feedback:
              'Platform arrangements do not replace composition sync permission for embedding music in the game.',
            reply:
              'Platform counsel: “Publishing clearance is the game publisher’s responsibility.”',
          },
        ],
      },
      {
        gate: 'Streamer conflict',
        prompt:
          'How do you handle content claims while preserving creator marketing?',
        choices: [
          {
            label:
              'Promise the publisher can prevent every claim on every platform.',
            score: 1,
            feedback:
              'Do not promise what no party fully controls. Negotiate a process with defined limits.',
            reply: 'Label counsel: “We cannot warrant every automated system.”',
          },
          {
            label:
              'Separate ordinary capture from named campaign channels; agree a claims/whitelist protocol and retain streamer mode.',
            score: 10,
            feedback:
              'Strong. Operational rights need an operational workflow: channel list, asset IDs, response time and fallback.',
            reply:
              'Label: “We will whitelist 50 channels; streamer mode disables the track for others.”',
          },
          {
            label:
              'Remove the song immediately without testing a scoped workaround.',
            score: 5,
            feedback:
              'Replacement may be right, but first test whether whitelisting and streamer mode solve the conflict within schedule.',
            reply:
              'Audio director: “Can normal players keep it while streamer mode mutes it?”',
          },
        ],
      },
    ],
    takeaway: [
      'Unbundle game, marketing, OST and franchise rights',
      'Price options instead of assuming free expansion',
      'Turn digital restrictions into testable operating procedures',
    ],
  },
  {
    number: 7,
    title: 'Close the deal',
    shortTitle: 'Paper, deliver & report',
    field: 'Trailer capstone',
    minutes: 10,
    concept:
      '“Approved” is not the finish line. Closeout connects written permission, payment, final assets, metadata and future dates.',
    brief:
      'A launch trailer swapped songs 30 hours before mix. The alternate is affordable, but the final edit, one publisher approval and cue data are still moving.',
    facts: [
      '90-second trailer',
      'Worldwide, one year',
      'Theatrical + broadcast + digital',
    ],
    questions: [
      {
        gate: 'Go / no-go',
        prompt:
          'The label and one 50% publisher approve. Can the studio traffic?',
        choices: [
          {
            label: 'Yes. The other publisher can sign after launch.',
            score: 0,
            feedback:
              'Half the publishing side is still uncleared. A rushed deadline does not lower the permission threshold.',
            reply: 'Studio counsel: “Hold trafficking.”',
          },
          {
            label:
              'No. Obtain counsel-accepted written evidence for master and 100% publishing, plus required edit/context approvals.',
            score: 10,
            feedback:
              'Correct. Match the evidence standard to the production and the exact final use.',
            reply:
              'Publisher B: “Approved for the stated campaign, subject to long form.”',
          },
          {
            label: 'Yes, if the cue is under 30 seconds.',
            score: 0,
            feedback:
              'There is no general duration shortcut that erases the need for permission.',
            reply:
              'Counsel: “Duration may affect price, not whether rights exist.”',
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
            feedback:
              'Contracts are central, but the file still needs final-use facts, payment, assets, credits and reporting data.',
            reply:
              'Post: “We still need the approved version, timing and cue metadata.”',
          },
          {
            label:
              'Written evidence, approvals, invoices/tax, correct audio, final timing/context, credits, cue metadata, restrictions, option dates and audit trail.',
            score: 10,
            feedback:
              'That is a delivery-ready clearance file. It can survive distribution, royalties, renewals and audit.',
            reply: 'Business affairs: “Cleared for final delivery.”',
          },
          {
            label: 'The prior hero song’s cue sheet with the title replaced.',
            score: 0,
            feedback:
              'Wrong ownership and identifier data breaks reporting, royalties and auditability.',
            reply:
              'Music operations: “The recording and reported work do not match.”',
          },
        ],
      },
    ],
    takeaway: [
      'Match written evidence to the exact final use',
      'Finish payments, assets, credits and cue metadata',
      'Calendar restrictions, expiries and options',
    ],
  },
];

const tutorialNotes: TutorialNote[][] = [
  [
    {
      strengths: [
        'You respected the director’s emotional attachment and responded with urgency.',
        'You translated taste into a usable brief and protected your leverage with credible alternatives.',
        'You recognized that exact timing and legal coordination affect whether the cue can deliver.',
      ],
      stretch:
        'Make the brief deal-ready by adding ownership leads, asset needs, approval gates, a budget ceiling and a written response deadline.',
      principle:
        'Do not present attachment as certainty until creative fit, rights, price, assets and schedule all line up.',
    },
    {
      strengths: [
        'You protected the director’s strongest creative idea instead of diluting the brief too early.',
        'You balanced creative strength with one-stop control, clean assets and a firm quote window.',
        'You kept cost discipline in the decision instead of treating budget as an afterthought.',
      ],
      stretch:
        'Present every finalist with a creative case, a clearability status, a price signal, an answer date and a ready fallback.',
      principle:
        'A professional shortlist is a decision tool—not just a playlist.',
    },
  ],
  [
    {
      strengths: [
        'You identified both copyright assets and the need to cover the full composition.',
        'You correctly began with the owner of the specific recording being used.',
        'You remembered that broadcast exploitation can also involve performance licensing.',
      ],
      stretch:
        'Also verify samples, featured-artist approvals, restrictions, representation authority and the exact recording identifier.',
      principle:
        'Picture use of an existing recording normally requires both master-use and synchronization permission.',
    },
    {
      strengths: [
        'You tracked the approvals quantitatively and noticed that most of the composition was already cleared.',
        'You kept the missing share and a replacement cue active at the same time.',
        'You looked for contractual risk allocation instead of ignoring the unresolved share.',
      ],
      stretch:
        'Log the writer’s share, administrator, approval authority, terms and written evidence before marking publishing complete.',
      principle:
        'A partial approval does not grant rights controlled by the missing share.',
    },
  ],
  [
    {
      strengths: [
        'You anticipated that the brand may want broad future flexibility.',
        'You matched the initial rights package to the funded media plan and preserved expansion through options.',
        'You limited the term and left room for the agency to refine its platform plan.',
      ],
      stretch:
        'Attach the exact spots, cutdowns, paid placements, organic archive, exclusivity category and option prices to the request.',
      principle:
        'Rights holders can price accurately only when context, media, territory, term and versions are concrete.',
    },
    {
      strengths: [
        'You protected the funded launch while turning worldwide expansion into a separate business choice.',
        'You recognized the operational reality that online media can cross borders.',
        'You prioritized launch speed and tried to solve the budget gap after trafficking.',
      ],
      stretch:
        'Give the client two written paths: the funded launch scope and a time-limited, pre-priced territorial expansion.',
      principle:
        'When money and ambition diverge, reshape scope before taking legal or budget risk.',
    },
  ],
  [
    {
      strengths: [
        'You separated ownership from permission and challenged an ambiguous commercial shorthand.',
        'You recognized that the client wants price certainty and freedom from repeat negotiations.',
        'You tried to keep production moving instead of stalling over terminology.',
      ],
      stretch:
        'Translate the business goal into exact rights: license or assignment, permitted uses, term, territory, exclusivity, royalties and reversions.',
      principle:
        '“Buyout” has no reliable meaning until the contract defines ownership and exploitation rights.',
    },
    {
      strengths: [
        'You connected production funding with an expectation of control over the new recording.',
        'You mapped ownership, producer terms, performers, splits, samples and delivery as separate chain-of-title tasks.',
        'You recognized that both the new recording and the underlying song matter to the final exploitation.',
      ],
      stretch:
        'Close every contributor agreement before delivery and record who owns the master, who is paid royalties and who retains approvals.',
      principle:
        'Paying for a session does not replace signed ownership, performer, producer or composition paperwork.',
    },
  ],
  [
    {
      strengths: [
        'You kept master and aggregate publishing inside one authorized all-in ceiling.',
        'You surfaced the total budget so the parties could see the commercial constraint.',
        'You protected the priority recording and tested whether publishing had flexibility.',
      ],
      stretch:
        'State each offer’s side basis, aggregate publishing amount, pro-rata treatment, taxes, payment timing and precise MFN trigger.',
      principle:
        'A publishing quote must say whether it is aggregate, pro rata and calculated on a 100% basis.',
    },
    {
      strengths: [
        'You protected the creative priority and looked for a way to close the must-have song.',
        'You negotiated with scope, timing and a live alternative while respecting spending authority.',
        'You understood that credible comparative information can create negotiating leverage.',
      ],
      stretch:
        'Put the final counter, expiration time, offered concessions and walk-away alternative in writing for every side.',
      principle:
        'Negotiate with truthful leverage and tradeable scope—never with unauthorized money or invented quotes.',
    },
  ],
  [
    {
      strengths: [
        'You separated core game use from trailer, creator, OST, sequel, DLC and extension value.',
        'You recognized that the request belongs to one connected interactive ecosystem.',
        'You remembered that platform arrangements can affect music economics and administration.',
      ],
      stretch:
        'Define platforms, recurrence, capture, edits, marketing channels, asset delivery and separately priced options in the same rights grid.',
      principle:
        'Name every value bucket; do not assume “interactive” silently includes marketing, soundtracks or future titles.',
    },
    {
      strengths: [
        'You focused on giving creators predictable, claim-free campaign participation.',
        'You converted a platform restriction into an operational workflow with a fallback.',
        'You protected schedule and audience experience by keeping replacement available.',
      ],
      stretch:
        'Document eligible channels, asset IDs, submission lead time, response SLA, escalation contacts and streamer-mode behavior.',
      principle:
        'Digital rights work only when the contract is paired with a testable operating procedure.',
    },
  ],
  [
    {
      strengths: [
        'You acknowledged the real delivery pressure and tried to avoid losing the launch window.',
        'You required written master and full publishing evidence matched to the final edit and context.',
        'You checked whether cue duration might change the clearance analysis.',
      ],
      stretch:
        'Use a go/no-go checklist naming every approval, the accepted evidence, the final asset and the person authorized to release traffic.',
      principle:
        'Deadlines and short duration may affect leverage or price, but they do not replace permission.',
    },
    {
      strengths: [
        'You centered executed licenses as the foundation of the delivery file.',
        'You built an audit-ready package spanning rights, money, assets, metadata, restrictions and future dates.',
        'You remembered that the cue record must be updated when the final song changes.',
      ],
      stretch:
        'Reconcile the signed scope against the exact final cut, then calendar expiries, options, reporting and payment obligations.',
      principle:
        'A deal is closed only when permission, payment, assets, metadata and the final use all agree.',
    },
  ],
];

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
    return (
      sum + (day.questions[questionIndex]?.choices[choiceIndex]?.score ?? 0)
    );
  }, 0);
  return Math.round((earned / (day.questions.length * 10)) * 100);
}

function scoreLabel(score: number | null) {
  if (score === null) return 'Not started';
  if (score >= 90) return 'Supervisor call';
  if (score >= 70) return 'Sound judgment';
  return 'Replay recommended';
}

type SyncResponse = {
  found: boolean;
  progress: ProgressState | null;
  revision: number;
  generation: number;
  updatedAt: string | null;
};

function isResumeKey(value: string | null): value is string {
  return Boolean(value && /^[a-f0-9]{32}$/.test(value));
}

function createResumeKey() {
  return crypto.randomUUID().replaceAll('-', '');
}

function progressLink(key: string) {
  const url = new URL(window.location.href);
  url.hash = new URLSearchParams({ sync: key }).toString();
  return url.toString();
}

async function syncRequest(
  payload: Record<string, unknown>,
): Promise<SyncResponse> {
  const response = await fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
    keepalive: true,
  });
  if (!response.ok) throw new Error('Progress sync failed');
  return response.json() as Promise<SyncResponse>;
}

export default function Home() {
  const [view, setView] = useState<View>('today');
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [syncKey, setSyncKey] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const syncMetaRef = useRef({ revision: 0, generation: 0 });
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let disposed = false;

    async function restoreProgress() {
      let localProgress = emptyProgress;
      let localGeneration = 0;
      let localRevision = 0;
      let localHasPendingSave = false;
      let storedKey: string | null = null;

      try {
        storedKey = window.localStorage.getItem(SYNC_KEY_STORAGE);
        const hashKey = new URLSearchParams(window.location.hash.slice(1)).get(
          'sync',
        );
        const key = isResumeKey(hashKey)
          ? hashKey
          : isResumeKey(storedKey)
            ? storedKey
            : createResumeKey();

        if (!hashKey || hashKey === storedKey) {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          localProgress = saved
            ? (normalizeProgress(JSON.parse(saved)) ?? emptyProgress)
            : emptyProgress;
          localGeneration =
            Number(window.localStorage.getItem(SYNC_GENERATION_STORAGE) ?? 0) ||
            0;
          localRevision =
            Number(window.localStorage.getItem(SYNC_REVISION_STORAGE) ?? 0) ||
            0;
          localHasPendingSave =
            window.localStorage.getItem(SYNC_DIRTY_STORAGE) === '1';
        }

        window.localStorage.setItem(SYNC_KEY_STORAGE, key);
        window.history.replaceState(null, '', progressLink(key));
        if (disposed) return;
        setSyncKey(key);

        const cloud = await syncRequest({ action: 'load', key });
        const cloudProgress = normalizeProgress(cloud.progress);
        const combined =
          cloud.found && cloudProgress
            ? cloud.generation > localGeneration
              ? cloudProgress
              : mergeProgress(cloudProgress, localProgress)
            : localProgress;
        const remoteIsLatest =
          cloud.found &&
          cloudProgress &&
          (cloud.generation > localGeneration ||
            !localHasPendingSave ||
            cloud.revision > localRevision);
        const restored =
          remoteIsLatest && cloudProgress
            ? {
                ...combined,
                currentDay: cloudProgress.currentDay,
                lastView: cloudProgress.lastView,
              }
            : combined;

        if (disposed) return;
        syncMetaRef.current = {
          revision: cloud.revision,
          generation: cloud.generation,
        };
        window.localStorage.setItem(
          SYNC_GENERATION_STORAGE,
          String(cloud.generation),
        );
        window.localStorage.setItem(
          SYNC_REVISION_STORAGE,
          String(cloud.revision),
        );
        window.localStorage.removeItem(SYNC_DIRTY_STORAGE);
        setProgress(restored);
        setView(restored.lastView);
        setSyncStatus('saved');
      } catch {
        if (disposed) return;
        setProgress(localProgress);
        setView(localProgress.lastView);
        setSyncStatus('offline');
      } finally {
        if (!disposed) setHydrated(true);
      }
    }

    void restoreProgress();
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !syncKey) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.localStorage.setItem(SYNC_DIRTY_STORAGE, '1');
    queueMicrotask(() => setSyncStatus('saving'));

    const snapshot = progress;
    const requestedGeneration = syncMetaRef.current.generation;
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const saved = await syncRequest({
          action: 'save',
          key: syncKey,
          progress: snapshot,
          generation: requestedGeneration,
        });
        const savedProgress = normalizeProgress(saved.progress);
        if (!savedProgress) throw new Error('Invalid cloud progress');

        syncMetaRef.current = {
          revision: saved.revision,
          generation: saved.generation,
        };
        window.localStorage.setItem(
          SYNC_GENERATION_STORAGE,
          String(saved.generation),
        );
        window.localStorage.setItem(
          SYNC_REVISION_STORAGE,
          String(saved.revision),
        );
        window.localStorage.removeItem(SYNC_DIRTY_STORAGE);
        setProgress((current) => {
          const reconciled =
            saved.generation > requestedGeneration
              ? savedProgress
              : mergeProgress(savedProgress, current);
          return JSON.stringify(reconciled) === JSON.stringify(current)
            ? current
            : reconciled;
        });
        setSyncStatus('saved');
      })
      .catch(() => {
        setSyncStatus('offline');
      });
  }, [hydrated, progress, syncKey]);

  const day = days[progress.currentDay - 1] ?? days[0];
  const cursor = Math.min(
    progress.cursors[String(day.number)] ?? 0,
    day.questions.length - 1,
  );
  const answerIndexes = progress.answers[String(day.number)] ?? [];
  const selectedIndex = answerIndexes[cursor];
  const answered = selectedIndex !== undefined;
  const complete = progress.completed.includes(day.number);
  const question = day.questions[cursor];
  const selectedChoice = answered ? question.choices[selectedIndex] : null;
  const tutorial =
    selectedChoice && selectedIndex !== undefined
      ? tutorialNotes[day.number - 1]?.[cursor]
      : null;
  const strongestChoice = question.choices.reduce((best, choice) =>
    choice.score > best.score ? choice : best,
  );
  const coursePercent = Math.round(
    (progress.completed.length / days.length) * 100,
  );
  const syncMessage =
    syncStatus === 'loading'
      ? 'Checking your cloud save…'
      : syncStatus === 'saving'
        ? 'Saving your latest move…'
        : syncStatus === 'saved'
          ? 'Saved. Your resume link opens this exact spot on any device.'
          : 'Offline copy saved here. Refresh when connected.';

  const overallScore = useMemo(() => {
    const scores = days
      .map((item) => scoreForDay(item, progress))
      .filter((value): value is number => value !== null);
    if (!scores.length) return null;
    return Math.round(
      scores.reduce((sum, value) => sum + value, 0) / scores.length,
    );
  }, [progress]);

  function choose(choiceIndex: number) {
    if (answered || complete) return;
    setProgress((current) => {
      const key = String(day.number);
      const nextAnswers = [...(current.answers[key] ?? [])];
      nextAnswers[cursor] = choiceIndex;
      return {
        ...current,
        answers: { ...current.answers, [key]: nextAnswers },
      };
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
      completed: current.completed.includes(day.number)
        ? current.completed
        : [...current.completed, day.number],
    }));
  }

  function openDay(dayNumber: number) {
    setProgress((current) => ({
      ...current,
      currentDay: dayNumber,
      lastView: 'today',
    }));
    setView('today');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openView(nextView: View) {
    setView(nextView);
    setProgress((current) =>
      current.lastView === nextView
        ? current
        : { ...current, lastView: nextView },
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextDay() {
    if (day.number < days.length) openDay(day.number + 1);
    else openView('week');
  }

  async function copyRequest() {
    await navigator.clipboard.writeText(requestTemplate);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareApp() {
    if (!syncKey) return;
    try {
      const url = progressLink(syncKey);
      if (navigator.share) {
        await navigator.share({
          title: 'SYNC / 7',
          text: 'Resume my seven-day music supervision deal sprint.',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      setShared(false);
    }
  }

  async function copyProgressLink() {
    if (!syncKey) return;
    try {
      await navigator.clipboard.writeText(progressLink(syncKey));
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      setLinkCopied(false);
    }
  }

  async function refreshProgress() {
    if (!syncKey) return;
    setSyncStatus('loading');
    try {
      const cloud = await syncRequest({ action: 'load', key: syncKey });
      const cloudProgress = normalizeProgress(cloud.progress);
      if (cloud.found && cloudProgress) {
        const previousGeneration = syncMetaRef.current.generation;
        syncMetaRef.current = {
          revision: cloud.revision,
          generation: cloud.generation,
        };
        window.localStorage.setItem(
          SYNC_GENERATION_STORAGE,
          String(cloud.generation),
        );
        window.localStorage.setItem(
          SYNC_REVISION_STORAGE,
          String(cloud.revision),
        );
        window.localStorage.removeItem(SYNC_DIRTY_STORAGE);
        const refreshed =
          cloud.generation > previousGeneration
            ? cloudProgress
            : mergeProgress(cloudProgress, progress);
        setProgress(refreshed);
        setView(refreshed.lastView);
      }
      setSyncStatus('saved');
    } catch {
      setSyncStatus('offline');
    }
  }

  async function resetProgress() {
    if (!syncKey) return;
    setResetting(true);
    setSyncStatus('saving');
    try {
      const reset = await syncRequest({ action: 'reset', key: syncKey });
      const resetProgress = normalizeProgress(reset.progress);
      if (!resetProgress) throw new Error('Invalid reset response');

      syncMetaRef.current = {
        revision: reset.revision,
        generation: reset.generation,
      };
      window.localStorage.setItem(
        SYNC_GENERATION_STORAGE,
        String(reset.generation),
      );
      window.localStorage.setItem(
        SYNC_REVISION_STORAGE,
        String(reset.revision),
      );
      window.localStorage.removeItem(SYNC_DIRTY_STORAGE);
      setProgress(resetProgress);
      setView('today');
      setResetDialogOpen(false);
      setSyncStatus('saved');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSyncStatus('offline');
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="relative isolate min-h-dvh overflow-x-hidden pb-32 text-foreground sm:px-6 sm:pb-36">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-24 top-24 -z-10 size-72 rounded-full bg-primary/9 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-28 top-[34rem] -z-10 size-80 rounded-full bg-accent/40 blur-3xl"
      />
      <div className="mx-auto w-full max-w-2xl">
        <header className="soul-glass sticky top-3 z-20 mx-3 flex items-center justify-between rounded-full border border-white/55 px-2.5 py-2 ring-1 ring-foreground/6 sm:mx-0 sm:top-4">
          <button
            type="button"
            className="flex items-center gap-2.5 text-left"
            onClick={() => openView('today')}
            aria-label="Go to today's lesson"
          >
            <span className="grid size-9 place-items-center rounded-full bg-foreground text-background shadow-sm ring-1 ring-white/15">
              <Headphones aria-hidden="true" className="size-4" />
            </span>
            <span>
              <span className="block font-heading text-sm font-semibold tracking-[-0.02em]">
                SYNC / 7
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Make the call
              </span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            {overallScore !== null && (
              <Badge variant="secondary" className="h-7 px-2.5">
                {overallScore}% avg
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Share this app"
              onClick={shareApp}
            >
              {shared ? (
                <Check aria-hidden="true" />
              ) : (
                <Share2 aria-hidden="true" />
              )}
            </Button>
          </div>
        </header>

        {!hydrated && (
          <section
            className="soul-rise px-4 pt-10 sm:px-0 sm:pt-14"
            aria-live="polite"
          >
            <Card className="soul-card rounded-[2rem] border border-white/65 bg-card/88 ring-1 ring-foreground/7 backdrop-blur-xl">
              <CardContent className="flex min-h-52 flex-col items-center justify-center text-center">
                <span className="grid size-12 place-items-center rounded-full bg-foreground text-background shadow-lg">
                  <RefreshCw
                    aria-hidden="true"
                    className="size-5 animate-spin"
                  />
                </span>
                <h1 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.035em]">
                  Opening your last session…
                </h1>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Checking this device and your private cloud save before the
                  next decision.
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {hydrated && view === 'today' && (
          <section
            key={`${day.number}-${cursor}`}
            aria-labelledby="today-title"
            className="soul-rise space-y-5 px-4 pt-8 sm:px-0 sm:pt-11"
          >
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.19em] text-primary">
                    Day {day.number} of 7 · {day.field}
                  </p>
                  <h1
                    id="today-title"
                    className="mt-2 max-w-[12ch] font-heading text-[2.55rem] font-semibold leading-[0.94] tracking-[-0.055em] sm:text-6xl"
                  >
                    {day.title}
                  </h1>
                  <p className="mt-3 text-sm text-muted-foreground">
                    One sharp decision. Real-world consequences.
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="h-8 gap-1.5 rounded-full px-3 shadow-sm"
                >
                  <Clock3 aria-hidden="true" className="size-3" /> {day.minutes}{' '}
                  min
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Progress
                  value={coursePercent}
                  aria-label="Seven-day course progress"
                  className="flex-1 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-foreground/8 [&_[data-slot=progress-indicator]]:bg-foreground"
                />
                <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {coursePercent}%
                </span>
              </div>
              <div
                className="grid grid-cols-7 gap-1.5 rounded-full bg-foreground/[0.045] p-1.5 ring-1 ring-foreground/5"
                aria-label="Seven-day course map"
              >
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
                        'grid h-9 place-items-center rounded-full text-xs font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        isCurrent && 'bg-foreground text-background shadow-md',
                        !isCurrent &&
                          isDone &&
                          'bg-accent text-accent-foreground',
                        !isCurrent &&
                          !isDone &&
                          'text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm',
                      )}
                    >
                      {isDone ? (
                        <Check aria-hidden="true" className="size-3.5" />
                      ) : (
                        item.number
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="soul-glass rounded-[1.4rem] border border-white/55 p-3 ring-1 ring-foreground/6">
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full',
                      syncStatus === 'offline'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-accent text-accent-foreground',
                    )}
                  >
                    {syncStatus === 'offline' ? (
                      <CloudOff aria-hidden="true" className="size-3.5" />
                    ) : syncStatus === 'saving' || syncStatus === 'loading' ? (
                      <RefreshCw
                        aria-hidden="true"
                        className="size-3.5 animate-spin"
                      />
                    ) : (
                      <CloudCheck aria-hidden="true" className="size-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Your progress is protected
                    </p>
                    <output
                      className="mt-0.5 block text-xs leading-relaxed text-muted-foreground"
                      aria-live="polite"
                    >
                      {syncMessage}
                    </output>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-foreground/7 pt-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={copyProgressLink}
                    disabled={!syncKey}
                  >
                    {linkCopied ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Link2 aria-hidden="true" />
                    )}
                    {linkCopied ? 'Copied' : 'Resume link'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={refreshProgress}
                    disabled={!syncKey || syncStatus === 'loading'}
                  >
                    <RefreshCw
                      aria-hidden="true"
                      className={cn(syncStatus === 'loading' && 'animate-spin')}
                    />{' '}
                    Refresh
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-muted-foreground"
                    onClick={() => setResetDialogOpen(true)}
                    disabled={!syncKey}
                  >
                    <RotateCcw aria-hidden="true" /> Restart
                  </Button>
                </div>
                <p className="mt-1.5 text-center text-[10px] leading-relaxed text-muted-foreground">
                  Keep the resume link private—it is the key to this progress.
                </p>
              </div>
            </div>

            {!complete ? (
              <>
                <Card className="soul-card rounded-[2rem] border border-white/65 bg-card/88 ring-1 ring-foreground/7 backdrop-blur-xl [--card-spacing:--spacing(5)]">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-full border-foreground/10 bg-background/70"
                      >
                        {day.field}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full">
                        Challenge {cursor + 1} / {day.questions.length}
                      </Badge>
                    </div>
                    <CardTitle className="pt-1 text-2xl font-semibold tracking-[-0.035em]">
                      {question.gate}
                    </CardTitle>
                    <CardDescription className="max-w-[52ch] text-[15px] leading-relaxed">
                      {day.brief}
                    </CardDescription>
                    <CardAction>
                      <span className="grid size-10 place-items-center rounded-full bg-[linear-gradient(145deg,var(--accent),color-mix(in_oklch,var(--accent),white_55%))] text-accent-foreground shadow-[0_10px_24px_-14px_var(--accent-foreground)] ring-1 ring-white/70">
                        <LockKeyhole aria-hidden="true" className="size-4" />
                      </span>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="rounded-2xl bg-foreground px-4 py-4 text-background shadow-[0_18px_38px_-26px_var(--foreground)]">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-background/55">
                        The principle
                      </p>
                      <p className="mt-1.5 text-[15px] font-medium leading-relaxed tracking-[-0.01em]">
                        {day.concept}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {day.facts.map((fact) => (
                        <Badge
                          key={fact}
                          variant="outline"
                          className="h-6 rounded-full border-foreground/10 bg-background/60 px-2.5 text-[11px]"
                        >
                          {fact}
                        </Badge>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                        Your call
                      </p>
                      <p className="mt-1.5 text-lg font-semibold leading-snug tracking-[-0.025em]">
                        {question.prompt}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpenText
                          aria-hidden="true"
                          className="size-3.5 text-primary"
                        />
                        Every choice unlocks a bite-size tutorial note.
                      </p>
                    </div>
                    <fieldset className="space-y-2">
                      <legend className="sr-only">Choose your response</legend>
                      {question.choices.map((choice, index) => (
                        <Button
                          key={choice.label}
                          type="button"
                          variant={
                            answered && selectedIndex === index
                              ? 'secondary'
                              : 'outline'
                          }
                          className={cn(
                            'h-auto min-h-14 w-full justify-start whitespace-normal rounded-2xl border-foreground/10 bg-background/65 px-3.5 py-3.5 text-left leading-snug shadow-[0_8px_24px_-24px_var(--foreground)] transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-card hover:shadow-md',
                            answered &&
                              selectedIndex === index &&
                              choice.score >= 8 &&
                              'border-accent-foreground/16 bg-accent/55 shadow-none',
                            answered &&
                              selectedIndex === index &&
                              choice.score < 8 &&
                              'border-primary/20 bg-primary/8 shadow-none',
                            answered && selectedIndex !== index && 'opacity-55',
                          )}
                          onClick={() => choose(index)}
                          disabled={answered}
                          aria-pressed={selectedIndex === index}
                        >
                          <span className="mr-1 grid size-7 shrink-0 place-items-center rounded-full bg-foreground/6 text-[11px] font-semibold ring-1 ring-foreground/8">
                            {String.fromCharCode(65 + index)}
                          </span>
                          {choice.label}
                        </Button>
                      ))}
                    </fieldset>
                    {selectedChoice &&
                      tutorial &&
                      selectedIndex !== undefined && (
                        <output
                          className={cn(
                            'soul-rise rounded-[1.6rem] border p-4',
                            selectedChoice.score >= 8
                              ? 'border-accent-foreground/12 bg-accent/46'
                              : 'border-primary/18 bg-primary/[0.055]',
                          )}
                          aria-live="polite"
                        >
                          <div className="flex items-start gap-2.5">
                            {selectedChoice.score >= 8 ? (
                              <CheckCircle2
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-accent-foreground"
                              />
                            ) : (
                              <TriangleAlert
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-primary"
                              />
                            )}
                            <div>
                              <p className="text-sm font-semibold">
                                {selectedChoice.score}/10 •{' '}
                                {scoreLabel(selectedChoice.score * 10)}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed">
                                {selectedChoice.feedback}
                              </p>
                            </div>
                          </div>
                          <section
                            aria-label="Tutorial notes"
                            className="mt-4 space-y-4 rounded-[1.2rem] border border-white/65 bg-card/78 p-4 shadow-sm backdrop-blur-lg"
                          >
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-foreground">
                                What you did right
                              </p>
                              <p className="mt-1 text-sm leading-relaxed">
                                {tutorial.strengths[selectedIndex]}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                                {selectedChoice.score >= 8
                                  ? 'How to sharpen it'
                                  : 'Where to improve'}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed">
                                {selectedChoice.score >= 8 ? (
                                  tutorial.stretch
                                ) : (
                                  <>
                                    A stronger move is: “{strongestChoice.label}
                                    ” {tutorial.stretch}
                                  </>
                                )}
                              </p>
                            </div>
                            <div className="border-t border-foreground/8 pt-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Deal-room rule
                              </p>
                              <p className="mt-1 text-sm font-medium leading-relaxed">
                                {tutorial.principle}
                              </p>
                            </div>
                          </section>
                          <p className="mt-3 text-xs italic leading-relaxed text-muted-foreground">
                            Counterparty reaction: {selectedChoice.reply}
                          </p>
                        </output>
                      )}
                    <Button
                      type="button"
                      size="lg"
                      className="h-13 w-full rounded-full bg-foreground text-background shadow-[0_18px_34px_-20px_var(--foreground)] hover:bg-foreground/88"
                      disabled={!answered}
                      onClick={advance}
                    >
                      {cursor === day.questions.length - 1
                        ? 'Finish day'
                        : 'Next challenge'}
                      <ArrowRight data-icon="inline-end" aria-hidden="true" />
                    </Button>
                  </CardContent>
                </Card>
                {day.number > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 w-full rounded-full text-muted-foreground"
                    onClick={() => openDay(day.number - 1)}
                  >
                    <ArrowLeft data-icon="inline-start" aria-hidden="true" />{' '}
                    Previous day
                  </Button>
                )}
              </>
            ) : (
              <Card className="soul-card overflow-visible rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_80%_0%,color-mix(in_oklch,var(--primary),transparent_60%),transparent_45%),var(--foreground)] text-background ring-0 [--card-spacing:--spacing(5)]">
                <CardHeader>
                  <Badge className="h-6 rounded-full bg-accent text-accent-foreground">
                    Day cleared
                  </Badge>
                  <CardTitle className="pt-1 font-heading text-3xl font-semibold tracking-[-0.045em] text-background">
                    {scoreForDay(day, progress)}% •{' '}
                    {scoreLabel(scoreForDay(day, progress))}
                  </CardTitle>
                  <CardDescription className="text-background/62">
                    Three instincts to carry into the next room.
                  </CardDescription>
                  <CardAction>
                    <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-white/15">
                      <Check aria-hidden="true" className="size-5" />
                    </span>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {day.takeaway.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 rounded-2xl bg-white/[0.065] px-3.5 py-3 text-sm leading-relaxed ring-1 ring-white/[0.075]"
                      >
                        <CheckCircle2
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-accent"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="border-background/10 bg-background/[0.045]">
                  <Button
                    type="button"
                    size="lg"
                    className="h-13 w-full rounded-full bg-background text-foreground hover:bg-background/90"
                    onClick={nextDay}
                  >
                    {day.number === 7
                      ? 'See my week'
                      : 'Start day ' + (day.number + 1)}
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            <p className="px-2 text-center text-xs leading-relaxed text-muted-foreground">
              Training simulation—not legal advice. Confirm live deals with
              qualified counsel.
            </p>
          </section>
        )}

        {hydrated && view === 'week' && (
          <section
            aria-labelledby="week-title"
            className="soul-rise space-y-7 px-4 pt-9 sm:px-0 sm:pt-12"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.19em] text-primary">
                Your listening room
              </p>
              <h1
                id="week-title"
                className="mt-2 max-w-[12ch] font-heading text-[2.8rem] font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl"
              >
                Seven days.
                <br />
                One deal brain.
              </h1>
              <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
                Take the days in order or jump to the problem on your desk. Each
                session is under ten minutes.
              </p>
            </div>
            <Card
              size="sm"
              className="soul-card rounded-[1.6rem] border border-white/60 bg-card/82 py-4 ring-1 ring-foreground/7 backdrop-blur-xl"
            >
              <CardContent className="flex items-center gap-4 px-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-foreground text-lg font-semibold text-background shadow-lg">
                  {progress.completed.length}/7
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">Course progress</p>
                    <span className="text-xs font-semibold tabular-nums">
                      {coursePercent}%
                    </span>
                  </div>
                  <Progress
                    value={coursePercent}
                    aria-label="Course progress"
                    className="mt-2 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-foreground/8 [&_[data-slot=progress-indicator]]:bg-primary"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {overallScore === null
                      ? 'Start Day 1 to set your baseline.'
                      : overallScore + '% average across attempted days.'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-2.5">
              {days.map((item) => {
                const isDone = progress.completed.includes(item.number);
                const score = scoreForDay(item, progress);
                const attempted = score !== null;
                return (
                  <button
                    key={item.number}
                    type="button"
                    onClick={() => openDay(item.number)}
                    className="group flex w-full items-center gap-3.5 rounded-[1.4rem] border border-white/60 bg-card/76 p-3.5 text-left shadow-[0_12px_30px_-28px_var(--foreground)] ring-1 ring-foreground/6 backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-card hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span
                      className={cn(
                        'grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold transition-transform duration-300 group-hover:scale-105',
                        isDone
                          ? 'bg-accent text-accent-foreground'
                          : attempted
                            ? 'bg-primary/12 text-primary'
                            : 'bg-foreground/6 text-muted-foreground',
                      )}
                    >
                      {isDone ? (
                        <Check aria-hidden="true" className="size-4" />
                      ) : (
                        item.number
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {item.field} • {item.minutes} min
                      </span>
                      <span className="mt-0.5 block font-heading font-semibold tracking-[-0.02em]">
                        {item.shortTitle}
                      </span>
                    </span>
                    <span className="text-right">
                      {score !== null && (
                        <span className="block text-xs font-semibold tabular-nums">
                          {score}%
                        </span>
                      )}
                      <ChevronRight
                        aria-hidden="true"
                        className="ml-auto mt-1 size-4 text-muted-foreground"
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {hydrated && view === 'kit' && (
          <section
            aria-labelledby="kit-title"
            className="soul-rise space-y-7 px-4 pt-9 sm:px-0 sm:pt-12"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.19em] text-primary">
                Pocket reference
              </p>
              <h1
                id="kit-title"
                className="mt-2 font-heading text-[2.8rem] font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl"
              >
                Your field kit.
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                The minimum viable deal desk—quietly ready when the call comes.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card
                size="sm"
                className="soul-card rounded-[1.6rem] border border-white/60 bg-foreground text-background ring-0"
              >
                <CardHeader>
                  <span className="mb-2 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <Music2 aria-hidden="true" className="size-4" />
                  </span>
                  <CardTitle className="text-xl font-semibold text-background">
                    Master
                  </CardTitle>
                  <CardDescription className="leading-relaxed text-background/62">
                    The exact recorded performance. Usually cleared with the
                    recording owner.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card
                size="sm"
                className="soul-card rounded-[1.6rem] border border-white/60 bg-card/84 ring-1 ring-foreground/7 backdrop-blur-xl"
              >
                <CardHeader>
                  <span className="mb-2 grid size-10 place-items-center rounded-full bg-accent text-accent-foreground shadow-sm ring-1 ring-white/70">
                    <BookOpenText aria-hidden="true" className="size-4" />
                  </span>
                  <CardTitle className="text-xl font-semibold">
                    Composition
                  </CardTitle>
                  <CardDescription className="leading-relaxed">
                    The music and lyrics. Clear every required publisher/writer
                    share.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card className="soul-card rounded-[1.7rem] border border-white/60 bg-card/82 ring-1 ring-foreground/7 backdrop-blur-xl [--card-spacing:--spacing(5)]">
              <CardHeader>
                <Badge
                  variant="outline"
                  className="rounded-full border-foreground/10 bg-background/65"
                >
                  Copy + customize
                </Badge>
                <CardTitle className="pt-1 text-2xl font-semibold tracking-[-0.035em]">
                  Clearance request skeleton
                </CardTitle>
                <CardDescription className="leading-relaxed">
                  Send the same complete scope to master and publishing
                  contacts.
                </CardDescription>
                <CardAction>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="Copy request template"
                    onClick={copyRequest}
                  >
                    {copied ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Clipboard aria-hidden="true" />
                    )}
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-[1.2rem] bg-foreground p-4 font-mono text-xs leading-relaxed text-background/70 shadow-inner">
                  {requestTemplate}
                </pre>
              </CardContent>
              <CardFooter className="border-foreground/6 bg-foreground/[0.025]">
                <Button
                  type="button"
                  className="h-11 w-full rounded-full bg-foreground text-background hover:bg-foreground/88"
                  onClick={copyRequest}
                >
                  {copied ? 'Copied' : 'Copy request'}{' '}
                  {copied ? (
                    <Check data-icon="inline-end" aria-hidden="true" />
                  ) : (
                    <Clipboard data-icon="inline-end" aria-hidden="true" />
                  )}
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-2">
              <h2 className="pb-1 font-heading text-2xl font-semibold tracking-[-0.035em]">
                The order of operations.
              </h2>
              {[
                [
                  '1',
                  'Brief',
                  'Story, audience, timing, lyrics, deadline and ceiling',
                ],
                [
                  '2',
                  'Map',
                  'Master owner, 100% publishing, samples and approvals',
                ],
                [
                  '3',
                  'Scope',
                  'Context, media, territory, term, versions, promo and options',
                ],
                [
                  '4',
                  'Money',
                  'Master + aggregate publishing basis, MFN, cap and contingency',
                ],
                [
                  '5',
                  'Close',
                  'Written evidence, payment, assets, cue data and future dates',
                ],
              ].map(([number, title, text]) => (
                <div
                  key={number}
                  className="flex gap-3.5 rounded-[1.2rem] border border-white/60 bg-card/68 p-3.5 ring-1 ring-foreground/5 backdrop-blur-lg"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">
                    {number}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Card
              size="sm"
              className="rounded-[1.5rem] border border-primary/10 bg-primary/[0.055] ring-1 ring-primary/8"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale aria-hidden="true" className="size-4 text-primary" />{' '}
                  Legal reality check
                </CardTitle>
                <CardDescription>
                  Mechanical, performance, neighboring-rights, union,
                  moral-rights and tax rules vary by product and territory.
                  Treat this as training and use qualified counsel for live
                  exploitation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  className="text-sm font-semibold text-primary underline underline-offset-4"
                  href="https://www.copyright.gov/music-modernization/educational-materials/musicians-income.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  U.S. Copyright Office music-rights guide
                </a>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="rounded-[1.6rem] border-white/60 bg-card/95 p-5 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogMedia className="rounded-full bg-primary/10 text-primary">
              <RotateCcw aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Restart the seven days?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears every answer and score from this device and your
              private resume link. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-foreground/7 bg-foreground/[0.025]">
            <AlertDialogCancel className="rounded-full" disabled={resetting}>
              Keep my progress
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={resetProgress}
              disabled={resetting}
            >
              {resetting ? (
                <RefreshCw aria-hidden="true" className="animate-spin" />
              ) : (
                <RotateCcw aria-hidden="true" />
              )}
              {resetting ? 'Restarting…' : 'Restart course'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <nav
        className="soul-glass fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 rounded-full border border-white/60 p-1.5 ring-1 ring-foreground/7"
        aria-label="Main navigation"
      >
        <div className="grid grid-cols-3 gap-1">
          <NavButton
            active={view === 'today'}
            onClick={() => openView('today')}
            icon={HomeIcon}
            label="Today"
          />
          <NavButton
            active={view === 'week'}
            onClick={() => openView('week')}
            icon={Library}
            label="Week"
          />
          <NavButton
            active={view === 'kit'}
            onClick={() => openView('kit')}
            icon={BriefcaseBusiness}
            label="Field kit"
          />
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
        'flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        active
          ? 'bg-foreground text-background shadow-md'
          : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}
