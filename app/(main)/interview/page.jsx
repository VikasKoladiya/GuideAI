"use client";

import { useState, useEffect, createContext } from "react";
import { getAssessments } from "@/actions/interview";
import StatsCards from "./_components/stats-cards";
import PerformanceChart from "./_components/performace-chart";
import QuizList from "./_components/quiz-list";

// Create context to share assessment data between components
export const AssessmentContext = createContext();

export default function InterviewPrepPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const data = await getAssessments();
      setAssessments(data);
    } catch (error) {
      console.error("Error fetching assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAssessments();
  }, []);

  // Update assessments whenever one is deleted
  const handleAssessmentDeleted = (deletedId) => {
    setAssessments(prev => prev.filter(assessment => assessment.id !== deletedId));
  };

  return (
    <AssessmentContext.Provider value={{ assessments, setAssessments, onDelete: handleAssessmentDeleted }}>
      <div>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-6xl font-bold gradient-title">
            Interview Preparation
          </h1>
        </div>
        <div className="space-y-6">
          {loading ? (
            <div className="py-6 text-center text-muted-foreground">
              Loading assessment data...
            </div>
          ) : (
            <>
              <StatsCards assessments={assessments} />
              <PerformanceChart assessments={assessments} />
              <QuizList assessments={assessments} />
            </>
          )}
        </div>
      </div>
    </AssessmentContext.Provider>
  );
}
