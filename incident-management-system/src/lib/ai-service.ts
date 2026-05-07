import { GoogleGenerativeAI } from "@google/generative-ai";
import { IssueSeverity, IssueSource, EnvironmentType, IssuePriority } from "@prisma/client";
import { aiAnalysisSchema } from "@/lib/validations";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  generationConfig: {
    responseMimeType: "application/json",
  }
});

export interface AIAnalysisResult {
  title: string;
  description: string;
  severity: IssueSeverity;
  priority: IssuePriority;
  environment: EnvironmentType;
  rootCause: string;
  suggestedFixes: string;
  _failed?: boolean;
}


export async function analyzeIncident(
  rawData: Record<string, unknown>,
  source: IssueSource,
  techStack: string[] = ["React", "Next.js", "TypeScript"]
): Promise<AIAnalysisResult> {
  const history = rawData.history as { last24hCount: number; isFirstOccurrence: boolean } | undefined;
  const breadcrumbs = rawData.breadcrumbs as unknown[] | undefined;

  const incident = { ...rawData };
  delete incident.history;
  delete incident.breadcrumbs;

  const historyContext = history
    ? `
    HISTORICAL CONTEXT:
    - This error has occurred ${history.last24hCount} times in the last 24 hours.
    - Is first occurrence: ${history.isFirstOccurrence}
    ` : "";

  const breadcrumbsContext = breadcrumbs && breadcrumbs.length > 0
    ? `
    BREADCRUMBS (User Actions/Logs before error):
    ${JSON.stringify(breadcrumbs, null, 2)}
    ` : "";

  const prompt = `
    You are an expert site reliability engineer and software architect.
    Analyze the following incident data from source: ${source}.
    The project tech stack is: ${techStack.join(", ")}.

    Incident Data:
    ${JSON.stringify(incident, null, 2)}

    ${historyContext}
    ${breadcrumbsContext}

    Your task is to:
    1. Provide a concise, professional title for the issue. If it's recurring, mention it might be a regression or a spike.
    2. Provide a detailed description of what happened, incorporating breadcrumb context if available.
    3. Categorize the severity as one of: ${Object.values(IssueSeverity).join(", ")}.
    4. Suggest a priority level (one of: LOW, MEDIUM, HIGH, URGENT). If occurrences are high, escalate priority.
    5. Identify the Environment (one of: ${Object.values(EnvironmentType).join(", ")}).
    6. Identify the likely root cause using both the stack trace and breadcrumbs.
    7. Suggest potential fixes or investigation steps.

    Return the result in JSON format with these exact keys:
    {
      "title": "string",
      "description": "string",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      "environment": "PRODUCTION" | "STAGING" | "DEVELOPMENT",
      "rootCause": "string",
      "suggestedFixes": "string"
    }

    Respond ONLY with a JSON object that matches the schema.
  `;

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const parsed = JSON.parse(text);

      const validated = aiAnalysisSchema.safeParse(parsed);
      if (!validated.success) {
        throw new Error("AI schema validation failed: " + JSON.stringify(validated.error.flatten().fieldErrors));
      }

      return validated.data as AIAnalysisResult;
    } catch (error) {
      console.error(`AI Analysis Attempt ${attempt} failed:`, error);
      lastError = error;
      // Small delay before retry
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Fallback if all retries fail
  return {
    title: `Incident from ${source}`,
    description: "AI analysis failed. Raw error: " + (lastError instanceof Error ? lastError.message : String(lastError)),
    severity: IssueSeverity.MEDIUM,
    priority: "MEDIUM",
    environment: EnvironmentType.PRODUCTION,
    rootCause: "Unknown - AI Analysis Failed",
    suggestedFixes: "Review manual logs and stack trace.",
    _failed: true,
  };
}
