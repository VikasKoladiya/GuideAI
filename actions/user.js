"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";

export async function updateUser(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get the returnTo value if provided in the data
    const returnTo = data.returnTo || "/dashboard";
    
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        industry: true, 
        experience: true,
        bio: true,
        skills: true,
        industryInsight: true
      }
    });

    if (!user) throw new Error("User not found");

    // Get original industry before update
    const originalIndustry = user.industry;
    const newIndustry = data.industry || originalIndustry;
    const isIndustryChanged = originalIndustry !== newIndustry;
    
    // Start a transaction to handle both user update and industry insight
    const result = await db.$transaction(async (tx) => {
      // Update the user record
      const updatedUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          industry: newIndustry,
          experience: data.experience !== undefined ? data.experience : user.experience,
          bio: data.bio !== undefined ? data.bio : user.bio,
          skills: data.skills || user.skills || [],
        },
      });
      
      // If industry has changed or no insights exist, update the industry insights
      if (isIndustryChanged || !user.industryInsight) {
        let industryInsight;
        
        // Generate AI insights for the new industry
        const insightData = await generateAIInsights(newIndustry);
        
        // Update or create industry insight
        if (user.industryInsight) {
          // Update existing insight
          industryInsight = await tx.industryInsight.update({
            where: { id: user.industryInsight.id },
            data: {
              industry: newIndustry,
              ...insightData,
              lastUpdated: new Date(),
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        } else {
          // Create new insight
          industryInsight = await tx.industryInsight.create({
            data: {
              user: {
                connect: {
                  id: user.id
                }
              },
              industry: newIndustry,
              ...insightData,
              lastUpdated: new Date(),
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        }
        
        return { 
          updatedUser,
          industryInsight,
          success: true 
        };
      }
      
      return { 
        updatedUser,
        industryInsight: user.industryInsight,
        success: true 
      };
    }, {
      timeout: 15000, // Increase timeout for AI generation
    });

    // Revalidate all paths that might show user data
    revalidatePath("/dashboard");
    revalidatePath("/onboarding");
    revalidatePath("/"); // Also revalidate homepage if it shows user data
    
    return { 
      ...result, 
      success: true,
      redirectTo: returnTo // Use the provided returnTo path
    };
  } catch (error) {
    console.error("Error updating user:", error.message);
    throw new Error("Failed to update profile: " + error.message);
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        industry: true,
      },
    });

    return {
      isOnboarded: !!user?.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    throw new Error("Failed to check onboarding status");
  }
}


export async function getUserProfile() {
  const { userId } = auth();
  
  if (!userId) {
    return null;
  }
  
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  
  return user;
}

export async function getUserDetailsForEdit() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        industry: true,
        experience: true,
        bio: true,
        skills: true
      },
    });

    if (!user) throw new Error("User not found");

    // Parse the industry field to extract sub-industry
    let mainIndustry = user.industry;
    let subIndustry = "";

    if (user.industry && user.industry.includes("-")) {
      const parts = user.industry.split("-");
      mainIndustry = parts[0];
      // Reconstruct the sub-industry by converting hyphens back to spaces and proper casing
      if (parts.length > 1) {
        subIndustry = parts.slice(1).join("-")
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }

    return {
      ...user,
      mainIndustry,
      subIndustry
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw new Error("Failed to fetch user details");
  }
}
