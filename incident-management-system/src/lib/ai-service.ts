import { GoogleGenerativeAI } from "@google/generative-ai";
import { IssueSeverity, IssueSource, EnvironmentType, IssuePriority } from "@prisma/client";
import { aiAnalysisSchema } from "@/lib/validations";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
  rawData: unknown,
  source: IssueSource,
  techStack: string[] = ["React", "Next.js", "TypeScript"]
): Promise<AIAnalysisResult> {
  const prompt = `
    You are an expert site reliability engineer and software architect.
    Analyze the following incident data from source: ${source}.
    The project tech stack is: ${techStack.join(", ")}.

    Incident Data:
    ${JSON.stringify(rawData, null, 2)}

    Your task is to:
    1. Provide a concise, professional title for the issue.
    2. Provide a detailed description of what happened.
    3. Categorize the severity as one of: ${Object.values(IssueSeverity).join(", ")}.
    4. Suggest a priority level (one of: LOW, MEDIUM, HIGH, URGENT).
    5. Identify the Environment (one of: ${Object.values(EnvironmentType).join(", ")}).
       Use branch names, hostnames, or tags in the data to decide.
    6. Identify the likely root cause.
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



    Respond ONLY with the JSON object.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON if needed (sometimes Gemini wraps in ```json)
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedText);
    
    const validated = aiAnalysisSchema.safeParse(parsed);
    if (!validated.success) {
      throw new Error("AI schema validation failed: " + JSON.stringify(validated.error.flatten().fieldErrors));
    }
    
    return validated.data as AIAnalysisResult;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    // Fallback if AI fails
    return {
      title: `Incident from ${source}`,
      description: "AI analysis failed. Raw data: " + JSON.stringify(rawData).substring(0, 500),
      severity: IssueSeverity.MEDIUM,
      priority: "MEDIUM",
      environment: EnvironmentType.PRODUCTION,
      rootCause: "Unknown - AI Analysis Failed",
      suggestedFixes: "Review manual logs and stack trace.",
      _failed: true,
    };


  }
}
