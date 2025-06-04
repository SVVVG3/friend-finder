'use client'
import { useAnalysis } from './AnalysisProvider'

export function BackgroundAnalysisIndicator() {
  // Disabled - each page now has its own appropriate loading states
  // This prevents redundant loading indicators from showing
  return null
}

export function useBackgroundAnalysis() {
  const { analysisState, getAnalysisData, startWarmRecsAnalysis } = useAnalysis()
  
  return {
    isAnalyzing: analysisState.isAnalyzing,
    isComplete: analysisState.isComplete,
    error: analysisState.error,
    progress: analysisState.progress,
    data: getAnalysisData(),
    startWarmRecsAnalysis
  }
} 