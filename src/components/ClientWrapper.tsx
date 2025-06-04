'use client'
import React, { ReactNode } from 'react'
import Nav from "../../components/Nav";
import { CacheProvider } from "./CacheProvider";
import { FrameProvider } from "./FrameProvider";
import { AnalysisProvider } from "./AnalysisProvider";
import { BackgroundAnalysisIndicator } from "./BackgroundAnalysisIndicator";
import { ErrorBoundary } from "./ErrorBoundary";

interface ClientWrapperProps {
  children: ReactNode
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <FrameProvider>
      <CacheProvider>
        <AnalysisProvider>
          <BackgroundAnalysisIndicator />
          <ErrorBoundary>
            <main className="min-h-screen w-full overflow-x-hidden">
              {children}
            </main>
          </ErrorBoundary>
          <Nav />
        </AnalysisProvider>
      </CacheProvider>
    </FrameProvider>
  )
} 