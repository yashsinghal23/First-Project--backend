import { GoogleGenAI } from "@google/genai";


export const analyzeResume = async ({
    resumeText,
    selfDescription,
    jobDescription
}) => {

    const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

    const prompt = `
You are an expert ATS Resume Analyzer and Interview Coach.

Analyze the following information carefully.

Resume:
${resumeText}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

Return ONLY valid JSON.

Format:

{
  "atsScore": Number,

  "skillsGap": [
    {
      "skill": "",
      "reason": ""
    }
  ],

  "technicalQuestions": [
    {
      "question": "",
      "difficulty": "Easy | Medium | Hard",
      "intention": "",
      "answer": ""
    }
  ],

  "behavioralQuestions": [
    {
      "question": "",
      "intention": "",
      "answer": ""
    }
  ],

  "preparationPlan": [
    {
      "day": 1,
      "topic": "",
      "description": "",
      "resources": [
        ""
      ]
    }
  ]
}

Do not return markdown.
Do not use \`\`\`json.
Return only valid JSON.
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });

    let text = response.text.trim();

    // Remove markdown if Gemini adds it
    text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error("Gemini returned invalid JSON");
    }

    
};