"use client";

import { useState, useContext } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import QuizResult from "./quiz-result";
import { deleteAssessment } from "@/actions/interview";
import useFetch from "@/hooks/use-fetch";
import { AssessmentContext } from "../page";

export default function QuizList({ assessments }) {
  const router = useRouter();
  const { onDelete } = useContext(AssessmentContext);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizToDelete, setQuizToDelete] = useState(null);
  
  const { loading: isDeleting, fn: deleteQuizFn } = useFetch(deleteAssessment);

  const handleDeleteQuiz = async () => {
    try {
      await deleteQuizFn(quizToDelete.id);
      
      // Call the context's onDelete handler to update all components
      onDelete(quizToDelete.id);
      
      // Show success message
      toast.success("Quiz deleted successfully");
      
      // Close the dialog
      setQuizToDelete(null);
    } catch (error) {
      toast.error("Failed to delete quiz");
      console.error(error);
    }
  };

  const handleViewQuiz = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleCardClick = (e, quiz) => {
    // Check if the click was on the delete button or its parent
    if (e.target.closest('[data-delete-button]')) {
      e.stopPropagation();
      return;
    }
    
    // Otherwise, view the quiz
    handleViewQuiz(quiz);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="gradient-title text-3xl md:text-4xl">
                Recent Quizzes
              </CardTitle>
              <CardDescription>
                Review your past quiz performance
              </CardDescription>
            </div>
            <Button onClick={() => router.push("/interview/mock")}>
              Start New Quiz
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No quizzes taken yet. Start your first quiz to track your progress!
              </div>
            ) : (
              assessments?.map((assessment, i) => (
                <Card
                  key={assessment.id}
                  className="hover:bg-muted/50 transition-colors"
                  onClick={(e) => handleCardClick(e, assessment)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="gradient-title text-lg sm:text-2xl flex flex-col sm:flex-row sm:justify-between">
                      <span>Quiz {i + 1}</span>
                      <span className="text-base sm:text-lg mt-1 sm:mt-0">
                        Score: {assessment.quizScore.toFixed(1)}%
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {format(
                        new Date(assessment.createdAt),
                        "MMMM dd, yyyy HH:mm"
                      )}
                    </CardDescription>
                  </CardHeader>
                  {assessment.improvementTip && (
                    <CardContent className="py-2">
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {assessment.improvementTip}
                      </p>
                    </CardContent>
                  )}
                  <CardFooter className="flex justify-between pt-0 pb-2 px-3 sm:px-6">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="gap-1 px-2 sm:px-3"
                      onClick={() => handleViewQuiz(assessment)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">View Details</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="gap-1 px-2 sm:px-3"
                      data-delete-button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuizToDelete(assessment);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Quiz Dialog */}
      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz Results</DialogTitle>
          </DialogHeader>
          <QuizResult
            result={selectedQuiz}
            hideStartNew
            onStartNew={() => router.push("/interview/mock")}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
        <AlertDialogContent className="max-w-md mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete this quiz? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="mt-2 sm:mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuiz}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
