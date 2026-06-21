"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

export class MobileCanvasErrorBoundary extends Component<{
  children: ReactNode
  onError: () => void
}, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Mobile can canvas failed:", error, info.componentStack)
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
