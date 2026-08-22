import { ToolName, VentTextRequestDto, VentVoiceRequestDto } from "./ai.dto";
import { aiConfig, llmConfig } from "../../../shared/config/ai.config";
import { prisma } from "../../../infrastructure/prisma/client";
import { callLLM } from "../../../infrastructure/llm";

const THERAPIST_BRIEFING_SYSTEM_PROMPT = `You are an expert clinical psychologist assistant synthesizing client information into a structured pre-session briefing for a licensed therapist.
Format the summary concisely in clear markdown with bullet points under these sections:
1. **Client Overview & Context**: Seeking support for, demographics, relationship status.
2. **Assessment Highlights**: Emotional state, anxiety/depression indicators, coping style, and triggers from assessment.
3. **Session Notes & Themes**: Key messages and themes the client shared across their bookings.
4. **Recent Communication Themes**: Key points from recent messages (if any).
5. **Clinical Considerations & Risk Flags**: Any safety/risk flags (suicide ideation, sleep disruption, grief, self-harm) or suggested focal points.

Rules:
- Be concise, clinical, objective, and professional.
- Do not invent details not present in the input.
- Keep the entire summary within 150-250 words.`;

function buildDeterministicClientSummary(
  clientProfile: any,
  assessment: any,
  sessionNotesList: string[],
  recentMessages: string[]
): string {
  const parts: string[] = [];

  parts.push("### Client Overview & Context");
  parts.push(
    `- **Seeking Support For**: ${clientProfile.seekingSupportFor || "General Mental Wellness"}\n- **Age Group**: ${clientProfile.ageGroup || "Not specified"}\n- **Gender Identity**: ${clientProfile.genderIdentity || "Not specified"}\n- **Occupation**: ${clientProfile.occupation || "Not specified"}\n- **Relationship Status**: ${clientProfile.relationShipStatus || "Not specified"}`
  );

  if (assessment) {
    parts.push("### Assessment Highlights");
    const assessmentItems: string[] = [];
    if (assessment.recentFeeling)
      assessmentItems.push(`- **Recent Feelings**: ${assessment.recentFeeling}`);
    if (assessment.crowdedWithWorries)
      assessmentItems.push(`- **Worries**: ${assessment.crowdedWithWorries}`);
    if (assessment.roomFullWithPeople)
      assessmentItems.push(`- **Social Anxiety**: ${assessment.roomFullWithPeople}`);
    if (assessment.nightSleep)
      assessmentItems.push(`- **Sleep Quality**: ${assessment.nightSleep}`);
    if (assessment.eatingPattern)
      assessmentItems.push(`- **Eating Habits**: ${assessment.eatingPattern}`);
    if (assessment.heavyLifeCope)
      assessmentItems.push(`- **Coping Mechanisms**: ${assessment.heavyLifeCope}`);
    if (assessment.futurePerspective)
      assessmentItems.push(`- **Future Perspective**: ${assessment.futurePerspective}`);
    if (assessment.lossOrSeperation)
      assessmentItems.push(`- **Loss/Separation**: ${assessment.lossOrSeperation}`);
    if (assessment.oldMemories)
      assessmentItems.push(`- **Trauma / Old Memories**: ${assessment.oldMemories}`);
    parts.push(
      assessmentItems.length > 0
        ? assessmentItems.join("\n")
        : "- Assessment submitted with standard baseline indicators."
    );
  }

  if (sessionNotesList.length > 0) {
    parts.push("### Session Notes Across Bookings");
    parts.push(sessionNotesList.map((note) => `- ${note}`).join("\n"));
  }

  if (recentMessages.length > 0) {
    parts.push("### Recent Messages");
    parts.push(recentMessages.map((msg) => `- ${msg}`).join("\n"));
  }

  if (
    assessment &&
    (assessment.sucidalThoughts || assessment.selfHarm || assessment.halucinations)
  ) {
    parts.push("### Clinical Considerations & Risk Flags");
    const flags: string[] = [];
    if (assessment.sucidalThoughts)
      flags.push(`- Suicidal Ideation flag: ${assessment.sucidalThoughts}`);
    if (assessment.selfHarm) flags.push(`- Self-Harm flag: ${assessment.selfHarm}`);
    if (assessment.halucinations) flags.push(`- Hallucinations flag: ${assessment.halucinations}`);
    parts.push(flags.join("\n"));
  }

  return parts.join("\n\n");
}

const DEFAULT_BREATHING_SCRIPT =
  "Sit comfortably, relax your shoulders, and inhale for 4 counts. Hold for 4, then exhale for 6. Repeat this cycle for 2 minutes while gently noticing your breath.";

const DEFAULT_POMODORO_TIPS = [
  "25 minutes deep work",
  "5 minutes short break",
  "After 4 cycles, take a 15-20 minute long break",
];

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const SUPPORT_SYSTEM_PROMPT = `You are a warm, emotionally safe mental wellness companion.
Goals:
- Help the user vent and feel heard.
- Reflect feelings without judgment.
- Ask one gentle follow-up question when appropriate.
- Keep responses concise (2-5 short lines).
- Never diagnose or claim to be a therapist.
- If user expresses self-harm intent or immediate danger, respond with empathy and encourage contacting local emergency services or a trusted person immediately.`;

const TOOL_SYSTEM_PROMPT = `You are an assistant for wellbeing micro-tools.
Rules:
- Be direct and practical.
- Keep output concise and usable.
- For meditation: provide a short guided script.
- For joke: provide one clean, light joke.
- For pomodoro: provide actionable cycle guidance.`;

async function generateWithLLM(messages: ChatMessage[], maxTokens = 220) {
  return await callLLM({
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  });
}

export const aiService = {
  async processVentText(payload: VentTextRequestDto) {
    const cleanedMessage = payload.message.trim();
    let llmResponse = "";

    try {
      llmResponse = await generateWithLLM(
        [
          { role: "system", content: SUPPORT_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Channel: ${payload.channel || "web"}\nUser message: ${cleanedMessage}`,
          },
        ],
        260
      );
    } catch {
      llmResponse =
        "I hear you. It sounds like this has been heavy for you. I'm here with you - what part of this feels the hardest right now?";
    }

    return {
      type: "vent_response",
      tone: "empathetic",
      response: llmResponse,
      metadata: {
        originalLength: cleanedMessage.length,
        channel: payload.channel || "web",
        model: llmConfig.textModel,
      },
    };
  },

  async processVentVoice(payload: VentVoiceRequestDto) {
    const transcript = payload.transcript?.trim();

    // Keep the endpoint stable while speech-to-text provider integration is pending.
    const normalizedTranscript = transcript || "Voice note received. (Transcript unavailable)";
    let llmResponse = "";

    try {
      llmResponse = await generateWithLLM(
        [
          { role: "system", content: SUPPORT_SYSTEM_PROMPT },
          {
            role: "user",
            content: `User shared a voice note transcript:\n${normalizedTranscript}`,
          },
        ],
        260
      );
    } catch {
      llmResponse =
        "Thanks for sharing that voice note. I know saying this out loud can be hard. I'm here - what happened just before you started feeling this way?";
    }

    return {
      type: "voice_vent_response",
      transcript: normalizedTranscript,
      response: llmResponse,
      metadata: {
        hasAudioUrl: Boolean(payload.audioUrl),
        hasTranscript: Boolean(transcript),
        channel: payload.channel || "web",
        model: llmConfig.textModel,
      },
    };
  },

  async executeTool(tool: ToolName, input?: string) {
    if (tool === "meditate" || tool === "joke" || tool === "pomodoro" || tool === "vent") {
      try {
        const promptByTool: Record<ToolName, string> = {
          meditate: `Create a 2-minute grounding meditation script. Context: ${input || "general stress relief"}`,
          joke: `Tell one short, clean joke. Optional theme: ${input || "general"}`,
          pomodoro: `Give a concise pomodoro plan for this task: ${input || "focus work"}. Include cycle and break tips.`,
          vent: `User wants to vent. Reply with empathy and one gentle follow-up question. Context: ${input || "no extra context"}`,
        };

        const llmText = await generateWithLLM(
          [
            { role: "system", content: TOOL_SYSTEM_PROMPT },
            { role: "user", content: promptByTool[tool] },
          ],
          200
        );

        if (tool === "pomodoro") {
          return {
            type: "tool_response",
            tool,
            response: llmText,
            config: {
              focusMinutes: 25,
              shortBreakMinutes: 5,
              longBreakMinutes: 20,
              tips: DEFAULT_POMODORO_TIPS,
            },
          };
        }

        return {
          type: "tool_response",
          tool,
          response: llmText,
        };
      } catch {
        // Fall back to deterministic responses below.
      }
    }

    switch (tool) {
      case "meditate":
        return {
          type: "tool_response",
          tool,
          title: "2-Minute Grounding Practice",
          response: input
            ? `${DEFAULT_BREATHING_SCRIPT} If your mind wanders to "${input}", gently bring attention back to your breath.`
            : DEFAULT_BREATHING_SCRIPT,
        };
      case "joke":
        return {
          type: "tool_response",
          tool,
          response: "Why don't programmers like nature? It has too many bugs.",
        };
      case "pomodoro":
        return {
          type: "tool_response",
          tool,
          response: "Pomodoro routine started.",
          config: {
            focusMinutes: 25,
            shortBreakMinutes: 5,
            longBreakMinutes: 20,
            tips: DEFAULT_POMODORO_TIPS,
          },
        };
      case "vent":
        return {
          type: "tool_response",
          tool,
          response: "I'm here to listen. Share whatever is on your mind, no pressure.",
        };
      default:
        return {
          type: "tool_response",
          tool,
          response: "Tool not supported yet.",
        };
    }
  },

  async refreshClientAiSummary(clientId: string): Promise<string> {
    try {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { id: clientId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!clientProfile) {
        throw new Error(`Client profile not found for ID ${clientId}`);
      }

      // 1. Fetch latest client assessment
      const latestAssessment = await prisma.clientAssesment.findFirst({
        where: { userId: clientProfile.userId },
        orderBy: { createdAt: "desc" },
      });

      // 2. Fetch all bookings with sessionNotes
      const bookings = await prisma.booking.findMany({
        where: {
          clientId,
          paymentStatus: "CAPTURED",
        },
        orderBy: { startDateTime: "desc" },
        select: {
          id: true,
          startDateTime: true,
          sessionNotes: true,
          status: true,
        },
      });

      const sessionNotesList: string[] = bookings
        .filter((b) => Boolean(b.sessionNotes && b.sessionNotes.trim()))
        .map(
          (b) =>
            `[${new Date(b.startDateTime).toLocaleDateString("en-IN")}]: ${b.sessionNotes?.trim()}`
        );

      // 3. Fetch recent conversation messages
      const conversations = await prisma.conversation.findMany({
        where: { clientId },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              content: true,
              senderId: true,
              createdAt: true,
            },
          },
        },
      });

      const recentMessages: string[] = [];
      for (const conv of conversations) {
        for (const msg of conv.messages) {
          if (msg.content && msg.content.trim()) {
            const roleLabel = msg.senderId === clientProfile.userId ? "Client" : "Therapist";
            recentMessages.push(
              `[${new Date(msg.createdAt).toLocaleDateString("en-IN")} - ${roleLabel}]: ${msg.content.trim()}`
            );
          }
        }
      }

      const deterministicSummary = buildDeterministicClientSummary(
        clientProfile,
        latestAssessment,
        sessionNotesList,
        recentMessages
      );

      let summary = deterministicSummary;

      try {
        const promptContent = `Client Context:
- Seeking Support For: ${clientProfile.seekingSupportFor || "General"}
- Demographics: Age Group: ${clientProfile.ageGroup || "N/A"}, Gender: ${clientProfile.genderIdentity || "N/A"}, Occupation: ${clientProfile.occupation || "N/A"}, Relationship: ${clientProfile.relationShipStatus || "N/A"}

Latest Assessment Responses:
${
  latestAssessment
    ? JSON.stringify({
        recentFeeling: latestAssessment.recentFeeling,
        crowdedWithWorries: latestAssessment.crowdedWithWorries,
        roomFullWithPeople: latestAssessment.roomFullWithPeople,
        dailyTaskFeeling: latestAssessment.dailyTaskFeeling,
        thoughtEcho: latestAssessment.thoughtEcho,
        decision: latestAssessment.decision,
        oldMemories: latestAssessment.oldMemories,
        lossOrSeperation: latestAssessment.lossOrSeperation,
        closestRelationShip: latestAssessment.closestRelationShip,
        sayingNo: latestAssessment.sayingNo,
        nightSleep: latestAssessment.nightSleep,
        eatingPattern: latestAssessment.eatingPattern,
        heavyLifeCope: latestAssessment.heavyLifeCope,
        technologyView: latestAssessment.technologyView,
        selfImage: latestAssessment.selfImage,
        futurePerspective: latestAssessment.futurePerspective,
        sucidalThoughts: latestAssessment.sucidalThoughts,
        halucinations: latestAssessment.halucinations,
        selfHarm: latestAssessment.selfHarm,
      })
    : "No formal assessment submitted yet."
}

Session Notes Across All Bookings:
${sessionNotesList.length > 0 ? sessionNotesList.join("\n") : "No session notes provided yet."}

Recent Messages:
${recentMessages.length > 0 ? recentMessages.join("\n") : "No prior messages."}

Please produce a concise, structured pre-session clinical summary for the therapist.`;

        const llmGenerated = await generateWithLLM(
          [
            { role: "system", content: THERAPIST_BRIEFING_SYSTEM_PROMPT },
            { role: "user", content: promptContent },
          ],
          450
        );

        if (llmGenerated && llmGenerated.trim()) {
          summary = llmGenerated.trim();
        }
      } catch (llmError) {
        console.warn(
          "LLM summary generation failed, falling back to deterministic summary:",
          llmError
        );
      }

      // Persist the summary on ClientProfile
      await prisma.clientProfile.update({
        where: { id: clientId },
        data: {
          aiSummary: summary,
          aiSummaryUpdatedAt: new Date(),
        },
      });

      return summary;
    } catch (error) {
      console.error("Error refreshing client AI summary:", error);
      throw error;
    }
  },
};
