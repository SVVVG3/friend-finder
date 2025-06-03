'use client'
import React from 'react'
import { useAnalysis } from './AnalysisProvider'

export function BackgroundAnalysisIndicator() {
  const { analysisState } = useAnalysis()

  // Don't show during initial basic analysis (total: 3) - we show OnboardingAnalysisLoader instead
  // Only show for warm recommendations analysis (total: 100) to avoid overlap
  if (!analysisState.isAnalyzing || 
      !analysisState.progress || 
      analysisState.progress.total === 3) {
    return null
  }

  const { step, current, total } = analysisState.progress
  const progressPercent = (current / total) * 100

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/90 border border-green-400 rounded-lg p-3 shadow-lg backdrop-blur-sm crt-glow max-w-sm mx-2">
      <div className="text-center">
        <div className="text-green-400 text-sm font-mono mb-2 crt-text-glow">
          🔄 Warm Recommendations
        </div>
        
        <div className="text-green-300 text-xs mb-2 font-mono">
          {step}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-green-900/30 rounded-full h-2 mb-2 border border-green-600/50">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-300 crt-glow"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="text-green-300 text-xs font-mono">
          {current} / {total} steps
        </div>
      </div>
    </div>
  )
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