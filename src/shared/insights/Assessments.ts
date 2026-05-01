// assessmentInsights.ts
// Full insight content for all 4 assessments, keyed by:
// assessmentSlug -> zoneKey -> scoreBand -> { insight, meaning, direction }

export interface ZoneBandContent {
  label: string;
  insight: string;
  meaning: string;
  direction: string;
}

export interface ZoneInsightMap {
  [band: string]: ZoneBandContent; // band: "0-29" | "30-49" | "50-69" | "70-100"
}

export interface AssessmentInsightConfig {
  title: string;
  reportHeadline: string;
  reportSubheadline: string;
  scaleLegend: { range: string; label: string }[];
  zones: {
    [zoneKey: string]: {
      title: string;
      bands: ZoneInsightMap;
    };
  };
}

export const assessmentInsights: Record<string, AssessmentInsightConfig> = {

  // ─────────────────────────────────────────────
  // ASSESSMENT 1 — Why You're Stuck
  // ─────────────────────────────────────────────
  "stuck-pattern": {
    title: "Why You're Stuck — and Why Discipline Isn't the Problem",
    reportHeadline: 'Your "Stuck Pattern" Overview',
    reportSubheadline:
      "Feeling stuck doesn't come from one cause. This report shows how each mental blocker is affecting you right now.",
    scaleLegend: [
      { range: "0–29", label: "Not a significant blocker" },
      { range: "30–49", label: "Mild friction" },
      { range: "50–69", label: "Active blocker" },
      { range: "70–100", label: "Strong blocker" },
    ],
    zones: {
      fear: {
        title: "Fear Block",
        bands: {
          "0-29": {
            label: "Not a blocker",
            insight:
              "Fear does not appear to significantly interfere with your ability to take action. You may still feel occasional hesitation, but it is unlikely to stop you from starting or following through consistently.",
            meaning:
              "You are generally able to engage with tasks even when they are important or uncertain. Delays, if they occur, are more likely driven by factors like energy, clarity, or workload rather than emotional resistance.",
            direction:
              "Continue approaching tasks directly without waiting for perfect conditions. Your growth will come more from refining execution and consistency than managing fear.",
          },
          "30-49": {
            label: "Mild friction",
            insight:
              "You may feel some hesitation when tasks feel important, visible, or tied to expectations. This hesitation is not overwhelming, but it can slow your starting speed and create small delays.",
            meaning:
              "You likely care about doing things well, which can lead to waiting for clarity or confidence before beginning. This can quietly reduce momentum over time.",
            direction:
              "Focus on starting earlier, even with partial clarity. Taking action before you feel fully ready will help reduce the pressure that builds around important tasks.",
          },
          "50-69": {
            label: "Active blocker",
            insight:
              "Fear is actively influencing your behaviour, often showing up as overthinking, delay, or avoidance. You may spend considerable time preparing mentally without translating that into action.",
            meaning:
              "Tasks may feel heavier than they objectively are because they carry emotional weight — such as fear of mistakes, judgement, or not meeting expectations. This creates a gap between intention and execution.",
            direction:
              "Shift your focus from doing things well to simply starting. Breaking tasks into very small, low-pressure actions can help bypass resistance and rebuild momentum.",
          },
          "70-100": {
            label: "Strong blocker",
            insight:
              "Fear is creating strong emotional resistance, making it difficult to begin or engage with important tasks. The discomfort associated with starting may feel disproportionately high compared to the task itself.",
            meaning:
              "Avoidance may be functioning as a short-term relief mechanism. This is not a lack of discipline — it is your mind trying to protect you from perceived risk or pressure.",
            direction:
              "Lower the emotional stakes around tasks. Start with very small, time-bound efforts and treat all work as provisional rather than final. Reducing pressure will gradually reduce avoidance.",
          },
        },
      },
      overload: {
        title: "Overload Block",
        bands: {
          "0-29": {
            label: "Not a significant blocker",
            insight:
              "Your mental load appears manageable, and you are likely able to prioritise tasks without feeling significantly overwhelmed.",
            meaning:
              "You can hold your responsibilities with relative clarity and move into action without excessive mental strain.",
            direction:
              "Continue working with clear priorities and avoid introducing unnecessary complexity into your workflow.",
          },
          "30-49": {
            label: "Mild friction",
            insight:
              "There is some degree of mental clutter, where multiple tasks or responsibilities compete for attention. This may not stop you, but it can slow decision-making.",
            meaning:
              "You may feel slightly scattered at times, especially when deciding what to do next. Holding too many things in your head can create low-level friction.",
            direction:
              "Externalise your tasks and focus on one priority at a time. Reducing internal load will improve clarity and speed.",
          },
          "50-69": {
            label: "Active blocker",
            insight:
              "Overload is actively affecting your ability to take action. You may find yourself planning, organising, or revisiting tasks without making meaningful progress.",
            meaning:
              'When everything feels important, it becomes harder to start anything. This can lead to cycles of indecision or "busy but not productive" patterns.',
            direction:
              "Simplify aggressively. Choose one task, define the first step, and act on it. Progress will come from reducing choices, not optimising plans.",
          },
          "70-100": {
            label: "Strong blocker",
            insight:
              "High mental load is likely creating decision fatigue and blocking action. Your system may be overwhelmed by the number of open tasks or responsibilities.",
            meaning:
              "Even simple actions may feel difficult because your attention is divided across too many unresolved demands. This can create a sense of paralysis.",
            direction:
              "Focus on reducing load before increasing effort. Offload all tasks externally, eliminate or postpone non-essential items, and commit to one clear priority.",
          },
        },
      },
      energy: {
        title: "Energy Block",
        bands: {
          "0-29": {
            label: "Not a significant blocker",
            insight:
              "Your energy levels appear stable and sufficient to support consistent action.",
            meaning:
              "You are likely able to engage with tasks without significant resistance from fatigue or exhaustion.",
            direction:
              "Maintain your current balance and continue protecting recovery habits.",
          },
          "30-49": {
            label: "Mild friction",
            insight:
              "Mild fatigue may be present, making tasks feel slightly more effortful than usual but still manageable.",
            meaning:
              "You may notice dips in motivation or consistency, especially during longer or more demanding tasks.",
            direction:
              "Work in shorter, focused intervals and build in small recovery periods to prevent further depletion.",
          },
          "50-69": {
            label: "Active blocker",
            insight:
              "Energy is actively limiting your ability to act. You may feel mentally or emotionally drained even when you want to be productive.",
            meaning:
              "This can create a frustrating cycle where intention is present, but capacity is low. Pushing through may temporarily work but can worsen exhaustion.",
            direction:
              "Adjust expectations and prioritise recovery alongside output. Supporting your energy will improve your ability to act more than forcing productivity.",
          },
          "70-100": {
            label: "Strong blocker",
            insight:
              "Low energy is a primary blocker, making even simple tasks feel heavy or effortful. This may reflect sustained mental, emotional, or physical depletion.",
            meaning:
              "Your system may be conserving energy, which reduces your ability to initiate or sustain effort. This is often mistaken for lack of motivation.",
            direction:
              "Shift focus to restoration rather than performance. Reducing load, improving rest, and allowing recovery will be essential before expecting consistent action.",
          },
        },
      },
      attention: {
        title: "Attention Block",
        bands: {
          "0-29": {
            label: "Not a significant blocker",
            insight:
              "Your attention appears stable, allowing you to focus on tasks without significant disruption.",
            meaning:
              "You are generally able to sustain focus when needed, especially in structured environments.",
            direction: "Continue maintaining a distraction-controlled environment.",
          },
          "30-49": {
            label: "Mild friction",
            insight:
              "You may experience mild distraction, particularly when tasks are unclear, repetitive, or mentally demanding.",
            meaning:
              "Focus may fluctuate, but it is still recoverable with some structure.",
            direction:
              "Define clear, short tasks and reduce obvious distractions before starting.",
          },
          "50-69": {
            label: "Active blocker",
            insight:
              "Attention is fragmented, making it difficult to sustain focus on a single task. You may frequently switch between tasks or lose track of progress.",
            meaning:
              "This reduces efficiency and can make tasks feel longer or more effortful than they actually are.",
            direction:
              "Work in structured focus blocks with a single-task setup. Limiting inputs will help stabilise attention.",
          },
          "70-100": {
            label: "Strong blocker",
            insight:
              "Attention is a strong blocker, likely due to high levels of distraction or overstimulation. Your environment or habits may be constantly interrupting focus.",
            meaning:
              "Even when you intend to focus, your attention may be pulled in multiple directions, reducing your ability to engage deeply.",
            direction:
              "Simplify your environment aggressively — remove distractions, reduce multitasking, and create dedicated focus periods.",
          },
        },
      },
    },
  },

  // ─────────────────────────────────────────────
  // ASSESSMENT 2 — Relationship Emotional Zones
  // ─────────────────────────────────────────────
  "relationship-emotional-zones": {
    title: "Understand Your Relationship's Emotional Zones",
    reportHeadline: "Your Relationship Emotional Zone Map",
    reportSubheadline:
      "This report shows how different emotional patterns are showing up in your relationship right now.",
    scaleLegend: [
      { range: "0–29", label: "Not a significant issue" },
      { range: "30–49", label: "Mild friction" },
      { range: "50–69", label: "Active issue" },
      { range: "70–100", label: "Strong issue" },
    ],
    zones: {
      emotional_expression: {
        title: "Emotional Expression",
        bands: {
          "0-29": {
            label: "Not a significant issue",
            insight:
              "You are generally able to express your emotions in a way that feels clear and understood. Communication likely feels open enough to prevent emotional buildup.",
            meaning:
              "You may not always express everything perfectly, but emotional sharing is not a major source of tension in your relationship.",
            direction:
              "Continue maintaining openness and check in regularly to keep emotional clarity strong.",
          },
          "30-49": {
            label: "Mild friction",
            insight:
              "You may express emotions, but not always in a way that feels fully understood or complete. Some feelings may be held back to avoid conflict.",
            meaning:
              "Small misunderstandings or unspoken emotions may accumulate over time, even if things seem fine on the surface.",
            direction:
              "Practice expressing emotions earlier and more directly instead of waiting for them to build up.",
          },
          "50-69": {
            label: "Active issue",
            insight:
              "Emotional expression may feel difficult, inconsistent, or misunderstood. You may either hold back or struggle to communicate clearly during important moments.",
            meaning:
              "This can create frustration or emotional distance, where you feel unheard or unable to fully share what you're experiencing.",
            direction:
              'Focus on simple emotional language ("I feel…") rather than explaining or defending.',
          },
          "70-100": {
            label: "Strong issue",
            insight:
              "Emotional expression is likely a major source of friction. You may feel unable to express yourself safely or feel consistently misunderstood.",
            meaning:
              "This can lead to emotional suppression, miscommunication, or recurring tension in the relationship.",
            direction:
              "Prioritise emotional safety over correctness. Slowing conversations and creating space to express feelings can help rebuild connection.",
          },
        },
      },
      attachment_closeness: {
        title: "Attachment & Closeness",
        bands: {
          "0-29": {
            label: "Not a significant issue",
            insight:
              "Your need for closeness and independence appears balanced, allowing you to feel secure in the relationship.",
            meaning:
              "You are likely comfortable with both connection and space, without strong anxiety around either.",
            direction: "Maintain this balance through consistent communication.",
          },
          "30-49": {
            label: "Mild friction",
            insight:
              "There may be mild differences in how you and your partner experience closeness or reassurance.",
            meaning:
              "You may occasionally feel unsure or need more clarity around communication or availability.",
            direction:
              "Express your needs for reassurance or space clearly instead of assuming they are understood.",
          },
          "50-69": {
            label: "Active issue",
            insight:
              "Attachment needs are actively influencing your emotional experience. You may feel uneasy with distance or unsure about consistency in connection.",
            meaning:
              "This can lead to overthinking, seeking reassurance, or feeling unsettled when communication changes.",
            direction: "Create predictable communication patterns to reduce uncertainty.",
          },
          "70-100": {
            label: "Strong issue",
            insight:
              "Closeness and reassurance needs are a strong source of emotional tension. Small changes in connection may feel disproportionately impactful.",
            meaning:
              "You may experience insecurity, anxiety, or emotional discomfort when connection feels inconsistent.",
            direction:
              "Focus on building stability through clear expectations and consistent emotional signals.",
          },
        },
      },
      conflict_repair: {
        title: "Conflict & Repair",
        bands: {
          "0-29": {
            label: "Not a significant issue",
            insight:
              "You are generally able to handle disagreements without significant emotional strain.",
            meaning:
              "Conflicts may occur, but they do not tend to damage the relationship or create lasting disconnection.",
            direction: "Continue resolving issues with openness and calm discussion.",
          },
          "30-49": {
            label: "Mild friction",
            insight:
              "Some conflicts may leave minor emotional residue even after resolution.",
            meaning:
              "You may move on logically, but not always feel fully settled emotionally.",
            direction: "Add short follow-ups after disagreements to ensure closure.",
          },
          "50-69": {
            label: "Active issue",
            insight:
              "Conflicts may feel draining or partially unresolved. You may struggle to feel understood during disagreements.",
            meaning:
              "This can lead to repeated issues or emotional distance over time.",
            direction:
              'Shift focus from "solving" to understanding emotions during conflict.',
          },
          "70-100": {
            label: "Strong issue",
            insight:
              "Conflict is likely creating emotional disconnection or stress. Conversations may escalate, repeat, or feel unsafe.",
            meaning:
              "You may withdraw, become defensive, or feel stuck in recurring patterns.",
            direction:
              "Pause high-intensity conversations and return when calm to prioritise emotional safety.",
          },
        },
      },
      support_care: {
        title: "Support & Care",
        bands: {
          "0-29": {
            label: "Not a significant issue",
            insight: "Your support needs appear understood and reasonably met.",
            meaning: "You likely feel cared for in ways that matter to you.",
            direction: "Continue communicating needs openly.",
          },
          "30-49": {
            label: "Mild friction",
            insight:
              "There may be mild mismatch in how support is given and received.",
            meaning:
              "Your partner may care, but not always in the way you expect or need.",
            direction: "Be specific about what support looks like for you.",
          },
          "50-69": {
            label: "Active issue",
            insight: "Support may feel inconsistent or insufficient at times.",
            meaning:
              "You may feel disappointed or emotionally unsupported in certain situations.",
            direction: "Replace assumptions with clear, direct requests.",
          },
          "70-100": {
            label: "Strong issue",
            insight: "Support needs are likely not being met consistently.",
            meaning:
              "You may feel alone, unsupported, or misunderstood despite being in the relationship.",
            direction:
              "Have a direct conversation about expectations and emotional needs.",
          },
        },
      },
      stress_spillover: {
        title: "Stress Spillover",
        bands: {
          "0-29": {
            label: "Not a significant issue",
            insight: "External stress does not significantly impact your relationship.",
            meaning: "You are able to separate outside pressure from connection.",
            direction: "Maintain this separation through awareness.",
          },
          "30-49": {
            label: "Mild friction",
            insight: "Stress occasionally affects your behaviour in the relationship.",
            meaning: "You may become distant or reactive during stressful periods.",
            direction: "Communicate stress early before it affects interactions.",
          },
          "50-69": {
            label: "Active issue",
            insight:
              "External stress is actively influencing your relationship dynamics.",
            meaning:
              "Pressure from work or life may lead to irritability, withdrawal, or miscommunication.",
            direction:
              "Create space to process stress separately from relationship conversations.",
          },
          "70-100": {
            label: "Strong issue",
            insight: "Stress spillover is a strong pattern affecting connection.",
            meaning:
              "Your relationship may be absorbing emotional pressure from outside, leading to tension or disconnection.",
            direction:
              "Actively separate stress processing from relationship interactions.",
          },
        },
      },
    },
  },

  // ─────────────────────────────────────────────
  // ASSESSMENT 3 — How Are You Really Doing Emotionally
  // ─────────────────────────────────────────────
  "emotional-wellbeing-snapshot": {
    title: "How Are You Really Doing — Emotionally?",
    reportHeadline: "Your Emotional Wellbeing Snapshot",
    reportSubheadline:
      "This snapshot shows how different emotional patterns are showing up for you right now.",
    scaleLegend: [
      { range: "0–29", label: "Not a significant concern" },
      { range: "30–49", label: "Mild emotional strain" },
      { range: "50–69", label: "Active emotional strain" },
      { range: "70–100", label: "Strong emotional strain" },
    ],
    zones: {
      emotional_energy: {
        title: "Emotional Energy",
        bands: {
          "0-29": {
            label: "Not a significant concern",
            insight:
              "Your emotional energy appears stable and available for daily life. You are likely able to engage with responsibilities and interactions without feeling consistently drained.",
            meaning:
              "You can recover after emotional effort and maintain a baseline sense of capacity through the day.",
            direction:
              "Continue supporting this through rest, routine, and balanced workload.",
          },
          "30-49": {
            label: "Mild emotional strain",
            insight:
              "There may be a low level of emotional fatigue building. You are still functioning, but things may feel slightly heavier than usual.",
            meaning:
              "You may need more effort to stay present, patient, or engaged, especially across long days.",
            direction:
              "Add small recovery breaks and reduce unnecessary emotional demands early.",
          },
          "50-69": {
            label: "Active emotional strain",
            insight:
              "Your emotional energy is actively strained, making routine tasks feel more effortful. You may feel tired even before fully engaging with your day.",
            meaning:
              "This can reduce motivation, increase irritability, and make it harder to stay consistent.",
            direction:
              "Lower expectations temporarily and prioritise recovery alongside output.",
          },
          "70-100": {
            label: "Strong emotional strain",
            insight:
              "Your emotional energy appears significantly depleted. You may feel drained, low, or unable to sustain effort for even simple tasks.",
            meaning:
              "Your system may be operating in conservation mode, which can look like low motivation but is actually low capacity.",
            direction:
              "Focus on rest, reduce demands, and seek support if this state has been persistent.",
          },
        },
      },
      mood_stability: {
        title: "Mood Stability",
        bands: {
          "0-29": {
            label: "Not a significant concern",
            insight:
              "Your mood appears relatively stable and predictable. Emotional shifts may occur but are unlikely to disrupt your day significantly.",
            meaning: "You are able to return to balance after stress or emotional events.",
            direction: "Maintain routines that support emotional steadiness.",
          },
          "30-49": {
            label: "Mild emotional strain",
            insight:
              "You may notice occasional mood fluctuations, such as irritability or low mood, but they are not constant.",
            meaning:
              "Your emotional state may be influenced by stress, fatigue, or environment more than usual.",
            direction:
              "Track patterns over a few days to understand what affects your mood.",
          },
          "50-69": {
            label: "Active emotional strain",
            insight:
              "Mood changes are actively affecting your emotional experience. You may feel more reactive or less stable than you would like.",
            meaning:
              "This can impact relationships, focus, and decision-making, as your emotional state may shift quickly.",
            direction:
              "Introduce grounding routines and pause before reacting in emotionally intense situations.",
          },
          "70-100": {
            label: "Strong emotional strain",
            insight:
              "Mood instability appears significant, with emotional shifts that may feel intense or difficult to manage.",
            meaning:
              "You may feel like your emotions are unpredictable or overwhelming at times.",
            direction:
              "Prioritise stability over productivity and consider professional support if this persists.",
          },
        },
      },
      emotional_numbness: {
        title: "Emotional Numbness",
        bands: {
          "0-29": {
            label: "Not a significant concern",
            insight:
              "You are generally emotionally connected and able to feel engaged with people and activities.",
            meaning:
              "Your emotional system is responsive and present in your day-to-day life.",
            direction: "Continue engaging in meaningful and connecting experiences.",
          },
          "30-49": {
            label: "Mild emotional strain",
            insight:
              "There may be slight emotional disconnection at times. Some experiences may feel less engaging or meaningful than usual.",
            meaning:
              "You may notice reduced excitement or involvement, even in things you typically enjoy.",
            direction:
              "Reintroduce small, low-pressure activities that create connection.",
          },
          "50-69": {
            label: "Active emotional strain",
            insight:
              "Emotional numbness is actively present. You may feel flat, disconnected, or less emotionally responsive.",
            meaning:
              "This can make life feel routine or mechanical, with reduced emotional depth.",
            direction:
              "Focus on gentle reconnection rather than forcing strong emotions.",
          },
          "70-100": {
            label: "Strong emotional strain",
            insight:
              "Strong emotional disconnection may be present. You may feel detached from emotions, people, or experiences.",
            meaning:
              "This may be your system's way of protecting itself from overload or prolonged stress.",
            direction:
              "Prioritise safe reconnection and consider support if this continues.",
          },
        },
      },
      overwhelm_stress: {
        title: "Overwhelm & Stress",
        bands: {
          "0-29": {
            label: "Not a significant concern",
            insight:
              "Your stress levels appear manageable, and your emotional capacity is sufficient to handle current demands.",
            meaning: "You are able to process stress without feeling overloaded.",
            direction: "Maintain routines that support balance and recovery.",
          },
          "30-49": {
            label: "Mild emotional strain",
            insight:
              "There may be mild stress pressure present. You are coping, but your buffer may be slightly reduced.",
            meaning:
              "You may feel more sensitive to small stressors during busy or demanding periods.",
            direction: "Reduce avoidable stress and create short recovery pauses.",
          },
          "50-69": {
            label: "Active emotional strain",
            insight:
              "Overwhelm is actively affecting your emotional capacity. Managing daily demands may feel effortful.",
            meaning:
              "Small stressors may feel bigger because your system has less room to absorb them.",
            direction:
              "Remove or delay one demand and reduce incoming pressure where possible.",
          },
          "70-100": {
            label: "Strong emotional strain",
            insight:
              "Your stress load appears high, and your emotional system may be near capacity.",
            meaning: "You may feel tense, overloaded, or like you are barely keeping up.",
            direction:
              "Reduce demands immediately and prioritise recovery and support.",
          },
        },
      },
      positive_engagement: {
        title: "Positive Engagement",
        bands: {
          "0-29": {
            label: "Not a significant concern",
            insight:
              "You are able to experience enjoyment, interest, and emotional connection in your daily life.",
            meaning:
              "Positive emotional experiences are present and accessible to you.",
            direction:
              "Continue engaging in activities and relationships that support this.",
          },
          "30-49": {
            label: "Mild emotional strain",
            insight:
              "Positive engagement may be slightly reduced. Enjoyment or connection may feel less frequent or less intense.",
            meaning:
              "You may still have positive moments, but they may not feel as consistent or fulfilling.",
            direction:
              "Intentionally include small moments of enjoyment without pressure.",
          },
          "50-69": {
            label: "Active emotional strain",
            insight:
              "Positive engagement is actively reduced. You may feel less interested, motivated, or connected to things around you.",
            meaning:
              "Activities that once felt meaningful may now feel neutral or effortful.",
            direction:
              "Reintroduce simple, previously enjoyable activities at a low intensity.",
          },
          "70-100": {
            label: "Strong emotional strain",
            insight:
              "Positive engagement appears significantly reduced. Joy, interest, or connection may feel difficult to access.",
            meaning:
              "You may feel disconnected from meaning, motivation, or emotional reward.",
            direction:
              "Focus on small, manageable sources of connection and consider support if this persists.",
          },
        },
      },
    },
  },

  // ─────────────────────────────────────────────
  // ASSESSMENT 4 — How Much Are You Carrying
  // ─────────────────────────────────────────────
  "life-load-role-strain": {
    title: "How Much Are You Carrying — Emotionally & Mentally?",
    reportHeadline: "Your Life Load Overview",
    reportSubheadline:
      "This report shows how different responsibilities are affecting your emotional and mental capacity.",
    scaleLegend: [
      { range: "0–29", label: "Not a significant issue" },
      { range: "30–49", label: "Mild strain" },
      { range: "50–69", label: "Active strain" },
      { range: "70–100", label: "Strong strain" },
    ],
    zones: {
      role_overload: {
        title: "Role Overload",
        bands: {
          "0-29": {
            label: "Not a significant issue",
            insight:
              "Your responsibilities appear balanced, and you are able to manage different roles without feeling constantly stretched. You likely have some space between tasks and recovery.",
            meaning:
              'You are not operating in a continuous "on-duty" state, which helps maintain stability and prevents burnout.',
            direction:
              "Maintain this balance by keeping boundaries around your time and avoiding unnecessary commitments.",
          },
          "30-49": {
            label: "Mild strain",
            insight:
              "You may be handling multiple responsibilities that occasionally feel heavy, but still manageable. There may be moments where you feel stretched, especially during busy periods.",
            meaning:
              "You are still in control, but your capacity may be getting tested more often than before.",
            direction:
              "Reduce smaller, non-essential commitments before they accumulate into overload.",
          },
          "50-69": {
            label: "Active strain",
            insight:
              "You are likely juggling several roles at once, which is actively stretching your mental and emotional capacity. Switching between responsibilities may feel tiring.",
            meaning:
              "This can reduce your ability to rest mentally, even when you are not actively working.",
            direction:
              "Simplify your roles where possible and prioritise what truly needs your attention.",
          },
          "70-100": {
            label: "Strong strain",
            insight:
              'You may feel constantly responsible and mentally occupied, with little sense of being "off duty." Your system may be under continuous pressure.',
            meaning:
              "This level of load can lead to exhaustion, reduced clarity, and difficulty recovering between responsibilities.",
            direction:
              "Actively reduce or delegate responsibilities and create non-negotiable recovery time.",
          },
        },
      },
      emotional_labour: {
        title: "Emotional Labour",
        bands: {
          "0-29": {
            label: "Not a significant issue",
            insight:
              "You are not significantly overburdened by managing others' emotions or expectations. You likely feel able to express your own needs when required.",
            meaning:
              "Emotional responsibility is relatively balanced in your environment.",
            direction:
              "Continue maintaining this balance by staying aware of your own emotional needs.",
          },
          "30-49": {
            label: "Mild strain",
            insight:
              "You may sometimes take on emotional responsibility for others, such as keeping situations calm or managing expectations.",
            meaning:
              "This may not feel overwhelming yet, but it can slowly create fatigue if it becomes a pattern.",
            direction:
              "Pause before stepping in emotionally and check whether it is necessary.",
          },
          "50-69": {
            label: "Active strain",
            insight:
              "You are likely carrying a noticeable amount of emotional responsibility, often prioritising others' needs over your own.",
            meaning:
              "This can lead to emotional fatigue and a sense of being unacknowledged or unsupported.",
            direction:
              "Start expressing your needs clearly and reduce taking responsibility for emotions that are not yours.",
          },
          "70-100": {
            label: "Strong strain",
            insight:
              "You may be carrying a heavy and often invisible emotional load, managing others' feelings while suppressing your own.",
            meaning:
              "This can lead to deep exhaustion, resentment, or feeling emotionally unsupported.",
            direction:
              "Step back from over-managing situations and begin redistributing emotional responsibility.",
          },
        },
      },
      time_boundary_strain: {
        title: "Time & Boundary Strain",
        bands: {
          "0-29": {
            label: "Not a significant issue",
            insight:
              "You are generally able to protect your time and set boundaries when needed. Your limits are respected or maintained.",
            meaning:
              "You likely have space for rest and personal time without excessive guilt.",
            direction:
              "Continue maintaining clear boundaries to support this balance.",
          },
          "30-49": {
            label: "Mild strain",
            insight:
              "There may be occasional difficulty saying no or protecting your time, especially in certain situations or relationships.",
            meaning:
              "You may sometimes overextend yourself, even when you recognise the need for rest.",
            direction:
              "Start with small boundaries and practice saying no in low-pressure situations.",
          },
          "50-69": {
            label: "Active strain",
            insight:
              "Your time and boundaries are actively being stretched. You may feel like your schedule is influenced more by others' needs than your own.",
            meaning:
              "This can create frustration, fatigue, and a reduced sense of control over your day.",
            direction:
              "Protect specific time blocks and begin setting clearer limits on your availability.",
          },
          "70-100": {
            label: "Strong strain",
            insight:
              "Boundaries appear significantly strained, and your time may feel consistently controlled by external demands.",
            meaning:
              "You may feel unable to say no, guilty when resting, or repeatedly pulled beyond your capacity.",
            direction:
              "Rebuild boundaries actively — reduce commitments and prioritise your own time without justification.",
          },
        },
      },
      identity_self_loss: {
        title: "Identity & Self-Loss",
        bands: {
          "0-29": {
            label: "Not a significant issue",
            insight:
              "You appear connected to yourself beyond your roles and responsibilities. You likely maintain a sense of personal identity.",
            meaning: "Your life includes elements that are chosen, not just required.",
            direction:
              "Continue investing time in activities that reflect who you are outside responsibilities.",
          },
          "30-49": {
            label: "Mild strain",
            insight:
              "There may be some early signs of disconnection from your personal identity, as responsibilities take up more space.",
            meaning:
              "You may have less time or energy for yourself, even if you still recognise what you enjoy.",
            direction: "Reintroduce small personal activities regularly.",
          },
          "50-69": {
            label: "Active strain",
            insight:
              "Your identity may be increasingly shaped by roles and responsibilities, with less space for personal expression.",
            meaning:
              "You may feel like you are functioning more than truly living or choosing.",
            direction:
              "Reconnect with interests, preferences, and choices that are not tied to obligations.",
          },
          "70-100": {
            label: "Strong strain",
            insight:
              "A strong sense of self-loss may be present. You may feel disconnected from who you are outside your responsibilities.",
            meaning:
              "Your life may feel dominated by what needs to be done rather than what matters to you.",
            direction:
              "Actively create space for self-focused time and begin rebuilding identity beyond roles.",
          },
        },
      },
      support_shared_load: {
        title: "Support & Shared Load",
        bands: {
          "0-29": {
            label: "Not a significant issue",
            insight:
              "You appear to have access to support and shared responsibility. You likely do not feel alone in managing your roles.",
            meaning:
              "You are able to rely on others when needed, which helps maintain balance.",
            direction: "Continue asking for and accepting support when required.",
          },
          "30-49": {
            label: "Mild strain",
            insight:
              "Support may be present but not always consistent or evenly distributed.",
            meaning:
              "You may sometimes feel like you are carrying slightly more than your fair share.",
            direction:
              "Be more specific when asking for help instead of assuming others will step in.",
          },
          "50-69": {
            label: "Active strain",
            insight:
              "Support and responsibility sharing may be actively imbalanced. You may feel like you are handling most things on your own.",
            meaning: "This can lead to fatigue, frustration, and a sense of isolation.",
            direction:
              "Identify areas that can be delegated or shared and communicate this clearly.",
          },
          "70-100": {
            label: "Strong strain",
            insight:
              "You may feel largely unsupported, with most responsibilities falling on you. This can create a strong sense of burden.",
            meaning:
              "Carrying everything alone can become emotionally and mentally exhausting over time.",
            direction:
              "Actively seek support, redistribute responsibilities, and avoid continuing in isolation.",
          },
        },
      },
    },
  },
    "burnout-self-check": {
    title: "How Burned Out Are You — Really?",
    reportHeadline: "Your Burnout Check Results",
    reportSubheadline:
      "This snapshot shows how burnout is currently affecting your energy, mental load, and engagement.",
    scaleLegend: [
      { range: "0–29", label: "Not a significant concern" },
      { range: "30–49", label: "Mild strain" },
      { range: "50–69", label: "Active strain" },
      { range: "70–100", label: "Strong strain" },
    ],
    zones: {
      energy_depletion: {
        title: "Energy Depletion",
        bands: {
          "0-29": {
            label: "Not a significant concern",
            insight:
              "Your physical and emotional energy appears stable. You are likely able to recover from daily demands without feeling persistently drained.",
            meaning:
              "Fatigue is not currently a dominant signal. You have reasonable capacity to engage with responsibilities without running on empty.",
            direction:
              "Maintain recovery habits and continue protecting sleep and rest. This is worth sustaining.",
          },
          "30-49": {
            label: "Mild strain",
            insight:
              "You may notice some physical or emotional fatigue building, especially after demanding days or weeks. Rest helps, but your reserves may be slightly lower than usual.",
            meaning:
              "Early depletion signals are present. You are still functioning, but the margin between coping and struggling may be smaller than it looks.",
            direction:
              "Add deliberate rest before you feel fully depleted. Small recovery habits now will prevent larger energy crashes later.",
          },
          "50-69": {
            label: "Active strain",
            insight:
              "Energy depletion is actively affecting your daily experience. You may feel tired even after rest, emotionally drained by the end of the day, or notice your energy is lower than it used to be.",
            meaning:
              "Your system is drawing on reserves that are not being fully replenished. This can affect mood, focus, and motivation in ways that feel disconnected from effort.",
            direction:
              "Prioritise recovery over performance temporarily. Reducing output slightly to restore energy will help more than pushing through.",
          },
          "70-100": {
            label: "Strong strain",
            insight:
              "Energy depletion is a primary signal right now. Fatigue may feel constant, rest may not restore you, and even small demands may feel disproportionately heavy.",
            meaning:
              "Your system is operating beyond its sustainable capacity. This is not a willpower issue — it is a resource issue that requires attention.",
            direction:
              "Rest is not optional at this stage. Reduce commitments where possible and seek support if this level of depletion has been sustained for weeks.",
          },
        },
      },
      mental_load: {
        title: "Mental Load",
        bands: {
          "0-29": {
            label: "Not a significant concern",
            insight:
              "Your cognitive load appears manageable. Tasks are not feeling unusually heavy and your mental clarity is likely relatively intact.",
            meaning:
              "Mental fog and cognitive strain are not significantly active for you right now.",
            direction:
              "Continue managing workload with clear priorities. Avoid unnecessary complexity.",
          },
          "30-49": {
            label: "Mild strain",
            insight:
              "There may be some mental heaviness present, where tasks occasionally feel harder than they should or focus takes more effort than usual.",
            meaning:
              "Your cognitive buffer may be slightly reduced. Small tasks may feel mildly effortful and decision-making may take more energy.",
            direction:
              "Reduce cognitive switching where possible and allow time between demanding tasks to recover mentally.",
          },
          "50-69": {
            label: "Active strain",
            insight:
              "Mental load is actively affecting your capacity. You may struggle to focus, feel mentally foggy, or find that tasks that used to feel easy now require significant effort.",
            meaning:
              "Cognitive fatigue is present. This can make it harder to start tasks, sustain attention, or think clearly under pressure.",
            direction:
              "Simplify your task list, reduce decisions, and create structured focus time. Mental rest is as important as physical rest right now.",
          },
          "70-100": {
            label: "Strong strain",
            insight:
              "Mental load is a strong burnout signal. Fog, difficulty concentrating, and feeling mentally overwhelmed may be present most of the time.",
            meaning:
              "Your cognitive resources are significantly depleted. This can look like laziness or distraction but is actually a symptom of overload.",
            direction:
              "Reduce cognitive demands urgently. Delegate, postpone, or drop non-essential tasks and allow recovery before expecting sustained mental output.",
          },
        },
      },
      disengagement: {
        title: "Disengagement",
        bands: {
          "0-29": {
            label: "Not a significant concern",
            insight:
              "You appear emotionally present and engaged with your day. Autopilot and emotional distance are not strong signals right now.",
            meaning:
              "Disengagement is not currently a significant burnout driver for you.",
            direction:
              "Continue engaging in work and activities that feel meaningful. Protect that connection.",
          },
          "30-49": {
            label: "Mild strain",
            insight:
              "You may occasionally feel like you are going through the motions or pushing through without full presence. This tends to come and go rather than being constant.",
            meaning:
              "Mild emotional distancing can be an early sign that your system is starting to protect itself from overload.",
            direction:
              "Notice when you are on autopilot and introduce small moments of intentional engagement to stay connected.",
          },
          "50-69": {
            label: "Active strain",
            insight:
              "Disengagement is actively present. You may feel like you are running on autopilot, emotionally disconnected from your work or daily life, or pushing through exhaustion without really resting.",
            meaning:
              "This is a meaningful burnout signal. Emotional distance often develops as a coping mechanism when demands consistently exceed capacity.",
            direction:
              "Address the underlying load rather than just the disengagement. Rest, recovery, and reconnecting with meaning will help more than forcing engagement.",
          },
          "70-100": {
            label: "Strong strain",
            insight:
              "Disengagement is a dominant pattern. Autopilot, emotional flatness, or a sense of disconnection from what you do may feel persistent and hard to shift.",
            meaning:
              "Strong disengagement is a late-stage burnout signal. Your system has likely been under sustained pressure for an extended period.",
            direction:
              "This level of disengagement warrants real recovery time and possibly professional support. Pushing harder will deepen it, not resolve it.",
          },
        },
      },
    },
  },
};

// ─────────────────────────────────────────────
// Helper: get band content for a given score
// ─────────────────────────────────────────────
  // ASSESSMENT 5 — How Burned Out Are You — Really?
  // ─────────────────────────────────────────────
  // Zone keys match what's stored in DB: energy_depletion, mental_load, disengagement


export function getScoreBand(score: number): "0-29" | "30-49" | "50-69" | "70-100" {
  if (score < 30) return "0-29";
  if (score < 50) return "30-49";
  if (score < 70) return "50-69";
  return "70-100";
}

export function getZoneContent(
  assessmentSlug: string,
  zoneKey: string,
  scaledScore: number
): ZoneBandContent | null {
  const assessment = assessmentInsights[assessmentSlug];
  if (!assessment) return null;

  const zone = assessment.zones[zoneKey];
  if (!zone) return null;

  const band = getScoreBand(scaledScore);
  return zone.bands[band] ?? null;
}

export function getAssessmentConfig(
  assessmentSlug: string
): AssessmentInsightConfig | null {
  return assessmentInsights[assessmentSlug] ?? null;
}