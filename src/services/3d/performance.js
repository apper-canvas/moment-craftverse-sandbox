class PerformanceMonitor {
  constructor() {
    this.fps = 0
    this.frameCount = 0
    this.lastTime = performance.now()
    this.isMonitoring = false
    
    // Performance metrics
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      programs: 0
    }
    
    // Callbacks for metric updates
    this.callbacks = []
    
    // Performance thresholds
    this.thresholds = {
      goodFPS: 50,
      averageFPS: 30,
      poorFPS: 15
    }
  }

  start() {
    this.isMonitoring = true
    this.lastTime = performance.now()
    this.frameCount = 0
    console.log('Performance monitoring started')
  }

  stop() {
    this.isMonitoring = false
    console.log('Performance monitoring stopped')
  }

  update(renderer) {
    if (!this.isMonitoring) return

    const currentTime = performance.now()
    this.frameCount++

    // Update FPS every second
if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount
      this.metrics.fps = this.fps
      this.metrics.frameTime = 1000 / this.fps

      // Reset for next measurement
      this.frameCount = 0
      this.lastTime = currentTime

      // Update renderer metrics if available
      if (renderer && renderer.info) {
        this.updateRendererMetrics(renderer)
      }

      // Update memory usage
      this.updateMemoryMetrics()

      // Notify callbacks
      this.notifyCallbacks()
    }
  }

  addCallback(callback) {
    this.callbacks.push(callback)
  }
  
  // Enhanced performance monitoring for 3D object selection
  updateSelectionMetrics(selectedObjects = []) {
    this.metrics.selectedObjects = selectedObjects.length
    this.metrics.memoryUsage = this.getMemoryUsage()
  }
  
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      }
    }
    return { used: 0, total: 0 }
  }
  
  // Responsive performance adaptation
  adaptToScreenSize(width, height) {
    const pixelCount = width * height
    const isLowEnd = pixelCount > 1920 * 1080 || this.metrics.fps < 30
    
    return {
      recommendLowQuality: isLowEnd,
      maxShadowMapSize: isLowEnd ? 1024 : 2048,
      antialiasingEnabled: !isLowEnd,
      particleCount: isLowEnd ? 50 : 200
    }
  }

  updateRendererMetrics(renderer) {
    const info = renderer.info
    
    this.metrics.drawCalls = info.render.calls
    this.metrics.triangles = info.render.triangles
    this.metrics.geometries = info.memory.geometries
    this.metrics.textures = info.memory.textures
    this.metrics.programs = info.programs?.length || 0
  }

  updateMemoryMetrics() {
    if (performance.memory) {
      this.metrics.memoryUsage = {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
      }
    }
  }

  getPerformanceGrade() {
    if (this.metrics.fps >= this.thresholds.goodFPS) {
      return { grade: 'excellent', color: '#10B981', message: 'Performance is excellent' }
    } else if (this.metrics.fps >= this.thresholds.averageFPS) {
      return { grade: 'good', color: '#F59E0B', message: 'Performance is good' }
    } else if (this.metrics.fps >= this.thresholds.poorFPS) {
      return { grade: 'poor', color: '#EF4444', message: 'Performance is poor' }
    } else {
      return { grade: 'critical', color: '#DC2626', message: 'Performance is critical' }
    }
  }

  getOptimizationSuggestions() {
    const suggestions = []
    
    if (this.metrics.fps < this.thresholds.goodFPS) {
      suggestions.push('Consider reducing graphics quality settings')
    }
    
    if (this.metrics.drawCalls > 1000) {
      suggestions.push('Too many draw calls - consider using instanced rendering')
    }
    
    if (this.metrics.triangles > 100000) {
      suggestions.push('High triangle count - consider using simpler models')
    }
    
    if (this.metrics.memoryUsage?.used > 512) {
      suggestions.push('High memory usage - consider disposing unused resources')
    }
    
    if (this.metrics.textures > 50) {
      suggestions.push('Many textures loaded - consider texture atlasing')
    }
    
    return suggestions
  }

  addCallback(callback) {
    this.callbacks.push(callback)
  }

  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }

  notifyCallbacks() {
    this.callbacks.forEach(callback => {
      try {
        callback(this.metrics)
      } catch (error) {
        console.error('Performance callback error:', error)
      }
    })
  }

  getMetrics() {
    return { ...this.metrics }
  }

  getFPS() {
    return this.metrics.fps
  }

  getFrameTime() {
    return this.metrics.frameTime
  }

  exportMetrics() {
    return {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      grade: this.getPerformanceGrade(),
      suggestions: this.getOptimizationSuggestions()
    }
  }

  // Auto-adjust quality based on performance
  autoAdjustQuality(currentSettings) {
    const grade = this.getPerformanceGrade()
    const suggestions = {}
    
    if (grade.grade === 'poor' || grade.grade === 'critical') {
      suggestions.lightingQuality = 'low'
      suggestions.shadows = false
      suggestions.antiAliasing = 'none'
      suggestions.particleEffects = 'low'
    } else if (grade.grade === 'good') {
      suggestions.lightingQuality = 'medium'
      suggestions.shadows = true
      suggestions.antiAliasing = 'fxaa'
      suggestions.particleEffects = 'medium'
    } else if (grade.grade === 'excellent') {
      suggestions.lightingQuality = 'high'
      suggestions.shadows = true
      suggestions.antiAliasing = 'msaa'
      suggestions.particleEffects = 'high'
    }
    
    return suggestions
  }

  // Monitor for performance spikes
  detectPerformanceSpikes(threshold = 5) {
    const recentFrameTimes = this.recentFrameTimes || []
    recentFrameTimes.push(this.metrics.frameTime)
    
    // Keep only last 10 frame times
    if (recentFrameTimes.length > 10) {
      recentFrameTimes.shift()
    }
    
    this.recentFrameTimes = recentFrameTimes
    
    if (recentFrameTimes.length >= 5) {
      const average = recentFrameTimes.reduce((a, b) => a + b, 0) / recentFrameTimes.length
      const current = this.metrics.frameTime
      
      if (current > average * threshold) {
        return {
          detected: true,
          current: current,
          average: average,
          severity: current / average
        }
      }
    }
    
    return { detected: false }
  }

  dispose() {
    this.stop()
    this.callbacks = []
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      programs: 0
    }
  }
}

export default PerformanceMonitor