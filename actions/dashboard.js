"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateAIInsights = async (industry) => {
  if (!industry) {
    console.error("Industry is required for generating insights");
    return {
      salaryRanges: [{ role: "Example Role", min: 50000, max: 100000, median: 75000, location: "General" }],
      growthRate: 0,
      demandLevel: "Medium",
      topSkills: ["No industry specified"],
      marketOutlook: "Neutral",
      keyTrends: ["No industry specified"],
      recommendedSkills: ["No industry specified"],
    };
  }

  try {
    const prompt = `
            Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
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

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return {
      salaryRanges: [{ role: "Error occurred", min: 0, max: 0, median: 0, location: "N/A" }],
      growthRate: 0,
      demandLevel: "Medium",
      topSkills: ["Error occurred"],
      marketOutlook: "Neutral",
      keyTrends: ["Error occurred"],
      recommendedSkills: ["Error occurred"],
    };
  }
};

export async function getIndustryInsights() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        industry: true,
        industryInsight: true
      },
    });

    if (!user) throw new Error("User not found");
    
    // If user has no industry, return default insights
    if (!user.industry) {
      return getMockInsights("default");
    }

    // Check if user already has insights for their industry
    if (user.industryInsight) {
      // If industry has changed, update the insight
      if (user.industryInsight.industry !== user.industry) {
        // Generate new insights for the updated industry
        const insightData = await generateAIInsights(user.industry);
        
        // Update the existing insight with new industry data
        const updatedInsight = await db.industryInsight.update({
          where: { id: user.industryInsight.id },
          data: {
            industry: user.industry,
            ...insightData,
            lastUpdated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
        
        return updatedInsight;
      }
      
      // If the insight is older than 7 days, update it
      const now = new Date();
      const lastUpdated = new Date(user.industryInsight.lastUpdated);
      const daysSinceUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate >= 7) {
        const insightData = await generateAIInsights(user.industry);
        
        const updatedInsight = await db.industryInsight.update({
          where: { id: user.industryInsight.id },
          data: {
            ...insightData,
            lastUpdated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
        
        return updatedInsight;
      }
      
      // Return existing insight if it's recent and for the current industry
      return user.industryInsight;
    }
    
    // Create new insights if none exist
    const insightData = await generateAIInsights(user.industry);
    
    const newInsight = await db.industryInsight.create({
      data: {
        user: {
          connect: {
            id: user.id
          }
        },
        industry: user.industry,
        ...insightData,
        lastUpdated: new Date(),
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    
    return newInsight;
  } catch (error) {
    console.error("Error in getIndustryInsights:", error);
    return getMockInsights("error");
  }
}

// Helper function to get mock insights
function getMockInsights(type) {
  if (type === "default") {
    return {
      id: "default",
      industry: "default",
      salaryRanges: [{ role: "Please set your industry", min: 0, max: 0, median: 0, location: "N/A" }],
      growthRate: 0,
      demandLevel: "Medium",
      topSkills: ["Please set your industry"],
      marketOutlook: "Neutral",
      keyTrends: ["Please set your industry"],
      recommendedSkills: ["Please set your industry"],
      lastUpdated: new Date(),
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }
  
  return {
    id: "error",
    industry: "error",
    salaryRanges: [{ role: "Error loading data", min: 0, max: 0, median: 0, location: "N/A" }],
    growthRate: 0,
    demandLevel: "Medium",
    topSkills: ["Error loading data"],
    marketOutlook: "Neutral",
    keyTrends: ["Error loading data"],
    recommendedSkills: ["Error loading data"],
    lastUpdated: new Date(),
    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}
