import { db } from "@/lib/prisma";
import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights" },
  { cron: "0 0 * * 0" }, // Run every Sunday at midnight
  async ({ event, step }) => {
    // Get all user insights that need updating
    const outdatedInsights = await step.run("Fetch outdated insights", async () => {
      const now = new Date();
      return await db.industryInsight.findMany({
        where: {
          nextUpdate: {
            lte: now,
          },
        },
        select: {
          id: true,
          userId: true,
          industry: true,
        },
      });
    });

    console.log(`Found ${outdatedInsights.length} outdated insights to refresh`);

    let updatedCount = 0;
    
    for (const insight of outdatedInsights) {
      const prompt = `
          Analyze the current state of the ${insight.industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

      try {
        const res = await step.run(`Generate ${insight.industry} insights`, async () => {
          return await model.generateContent(prompt);
        });

        const text = res.response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
        const insightData = JSON.parse(cleanedText);

        await step.run(`Update insight for user ${insight.userId}`, async () => {
          await db.industryInsight.update({
            where: { id: insight.id },
            data: {
              ...insightData,
              lastUpdated: new Date(),
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        });
        
        updatedCount++;
      } catch (error) {
        console.error(`Error updating insight for ${insight.industry}:`, error);
        // Continue with other insights even if one fails
      }
    }

    return { 
      status: "completed", 
      updated: updatedCount,
      total: outdatedInsights.length
    };
  }
);
