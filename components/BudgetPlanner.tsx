import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { parseHumanBudgetPlan } from '../services/geminiService';
import { BudgetPlanParsed } from '../types';

interface BudgetPlannerProps {
  onApplyBudget: (plan: BudgetPlanParsed) => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ onApplyBudget }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedPlan, setParsedPlan] = useState<BudgetPlanParsed | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setError(null);
    setIsProcessing(true);

    try {
      const text = await file.text();
      const result = await parseHumanBudgetPlan(text);
      
      if (result) {
        setParsedPlan(result);
      } else {
        setError("Could not extract a valid budget plan. Please ensure the text is clear.");
      }
    } catch (e) {
      setError("Failed to read file. Please try a .txt or .csv file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Card title="Human Budget Import" className="h-full">
      <div className="space-y-6">
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Upload your handwritten budget plan (text file) to automatically configure your monthly goals using AI.
        </p>

        {!parsedPlan ? (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="budget-file"
              className="hidden"
              accept=".txt,.csv,.md"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <label htmlFor="budget-file" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                {isProcessing ? (
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                ) : (
                  <Upload className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <div>
                <span className="text-zinc-900 dark:text-zinc-200 font-medium">Click to upload</span>
                <span className="text-zinc-500"> or drag and drop</span>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-600">TXT, MD or CSV (Max 1MB)</span>
            </label>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-700 dark:text-green-400">Plan Parsed Successfully</h4>
                <p className="text-sm text-green-600/80 dark:text-green-300/70 mt-1">{parsedPlan.advice}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-black/20 rounded-lg p-3 text-sm space-y-2 shadow-sm dark:shadow-none border border-zinc-100 dark:border-transparent">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Est. Income</span>
                <span className="text-zinc-900 dark:text-zinc-200 font-mono">${parsedPlan.incomeEstimate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Savings Goal</span>
                <span className="text-zinc-900 dark:text-zinc-200 font-mono">${parsedPlan.savingsGoal}</span>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-white/10">
                 <span className="text-zinc-500 text-xs">Found {parsedPlan.budgets.length} category limits</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => setParsedPlan(null)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                onClick={() => {
                  onApplyBudget(parsedPlan);
                  setParsedPlan(null);
                }}
              >
                Apply Plan
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-zinc-500">
            <FileText className="h-3 w-3" />
            <span>Sample: "I earn 5000. Rent is 1200. Groceries 300. Save 1000."</span>
        </div>
      </div>
    </Card>
  );
};