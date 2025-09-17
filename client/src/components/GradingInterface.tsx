import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Download, Save, ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const mockSubmission = {
  id: "1",
  student: "Emma Johnson",
  studentId: "2023001",
  labTitle: "Chemical Analysis Lab",
  submittedAt: "2024-09-18 14:30",
  files: [
    { name: "lab_report.pdf", size: "2.3 MB", type: "pdf" },
    { name: "data_analysis.xlsx", size: "1.1 MB", type: "excel" }
  ]
};

//todo: remove mock functionality
const mockRubric = [
  { 
    id: "1", 
    criterion: "Experimental Design", 
    description: "Quality of hypothesis, variables identification, and methodology", 
    maxPoints: 25,
    weight: 0.25
  },
  { 
    id: "2", 
    criterion: "Data Collection & Analysis", 
    description: "Accuracy of measurements, proper use of equipment, data interpretation", 
    maxPoints: 30,
    weight: 0.30
  },
  { 
    id: "3", 
    criterion: "Results & Discussion", 
    description: "Clear presentation of results, analysis of findings, conclusions", 
    maxPoints: 25,
    weight: 0.25
  },
  { 
    id: "4", 
    criterion: "Lab Report Quality", 
    description: "Writing clarity, proper citations, following format guidelines", 
    maxPoints: 20,
    weight: 0.20
  }
];

export function GradingInterface() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [generalFeedback, setGeneralFeedback] = useState("");
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(1);
  
  const totalSubmissions = 5; // todo: remove mock functionality

  const handleScoreChange = (criterionId: string, score: number) => {
    setScores(prev => ({ ...prev, [criterionId]: score }));
    console.log('Score updated:', criterionId, score);
  };

  const handleFeedbackChange = (criterionId: string, text: string) => {
    setFeedback(prev => ({ ...prev, [criterionId]: text }));
  };

  const calculateTotalScore = () => {
    return mockRubric.reduce((total, criterion) => {
      const score = scores[criterion.id] || 0;
      return total + score;
    }, 0);
  };

  const calculatePercentage = () => {
    const totalPossible = mockRubric.reduce((sum, criterion) => sum + criterion.maxPoints, 0);
    const totalScore = calculateTotalScore();
    return Math.round((totalScore / totalPossible) * 100);
  };

  const navigateSubmission = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentSubmissionIndex > 1) {
      setCurrentSubmissionIndex(prev => prev - 1);
    } else if (direction === 'next' && currentSubmissionIndex < totalSubmissions) {
      setCurrentSubmissionIndex(prev => prev + 1);
    }
    console.log('Navigate to submission:', direction);
  };

  const saveGrade = () => {
    console.log('Grade saved:', {
      scores,
      feedback,
      generalFeedback,
      totalScore: calculateTotalScore(),
      percentage: calculatePercentage()
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              EJ
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-semibold text-foreground" data-testid="text-student-name">
              {mockSubmission.student}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>ID: {mockSubmission.studentId}</span>
              <span data-testid="text-lab-title">{mockSubmission.labTitle}</span>
              <span>Submitted: {mockSubmission.submittedAt}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentSubmissionIndex} of {totalSubmissions}
          </span>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigateSubmission('prev')}
            disabled={currentSubmissionIndex === 1}
            data-testid="button-prev-submission"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigateSubmission('next')}
            disabled={currentSubmissionIndex === totalSubmissions}
            data-testid="button-next-submission"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission Files */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Submitted Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockSubmission.files.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                  data-testid={`file-${index}`}
                >
                  <div>
                    <div className="font-medium text-sm" data-testid={`text-filename-${index}`}>
                      {file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{file.size}</div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => console.log('Download file:', file.name)}
                    data-testid={`button-download-file-${index}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Grade Summary */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Grade Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary" data-testid="text-total-score">
                  {calculateTotalScore()}/100
                </div>
                <div className="text-lg font-medium" data-testid="text-percentage">
                  {calculatePercentage()}%
                </div>
                <Badge 
                  variant={calculatePercentage() >= 90 ? "secondary" : calculatePercentage() >= 70 ? "outline" : "destructive"}
                  data-testid="badge-grade"
                >
                  {calculatePercentage() >= 90 ? "A" : calculatePercentage() >= 80 ? "B" : calculatePercentage() >= 70 ? "C" : calculatePercentage() >= 60 ? "D" : "F"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rubric Grading */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Rubric-Based Grading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockRubric.map((criterion) => (
                <div key={criterion.id} className="border-b pb-6 last:border-b-0" data-testid={`criterion-${criterion.id}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-foreground" data-testid={`text-criterion-${criterion.id}`}>
                        {criterion.criterion}
                      </h3>
                      <p className="text-sm text-muted-foreground">{criterion.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold" data-testid={`text-score-${criterion.id}`}>
                        {scores[criterion.id] || 0}/{criterion.maxPoints}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Score</label>
                      <div className="mt-2">
                        <Slider
                          value={[scores[criterion.id] || 0]}
                          onValueChange={([value]) => handleScoreChange(criterion.id, value)}
                          max={criterion.maxPoints}
                          step={0.5}
                          className="w-full"
                          data-testid={`slider-${criterion.id}`}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0</span>
                          <span>{criterion.maxPoints}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Feedback</label>
                      <Textarea
                        placeholder={`Provide specific feedback for ${criterion.criterion.toLowerCase()}...`}
                        value={feedback[criterion.id] || ""}
                        onChange={(e) => handleFeedbackChange(criterion.id, e.target.value)}
                        className="mt-2"
                        rows={3}
                        data-testid={`textarea-feedback-${criterion.id}`}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* General Feedback */}
              <div className="pt-4">
                <label className="text-sm font-medium">General Comments</label>
                <Textarea
                  placeholder="Provide overall feedback about the lab performance..."
                  value={generalFeedback}
                  onChange={(e) => setGeneralFeedback(e.target.value)}
                  className="mt-2"
                  rows={4}
                  data-testid="textarea-general-feedback"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" data-testid="button-save-draft">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={saveGrade} data-testid="button-submit-grade">
                  Submit Grade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}