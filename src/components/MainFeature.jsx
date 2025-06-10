import React, { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause,
  RotateCcw, 
  Save, 
  Upload, 
  Download,
  Zap,
  Map,
  Palette,
  Brush,
  Square,
  Pipette,
  RotateCw,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Monitor,
  Sun,
  Sparkles,
  Image,
  Wind,
Eye as ViewIcon,
  Box,
  RotateCw as Rotate3D,
} from 'lucide-react'

// Import Three.js for 3D functionality
import * as THREE from 'three'
// Import 3D services
import SceneManager from '../services/3d/scene'
import CameraController from '../services/3d/camera'
import ModelManager from '../services/3d/models'
import PerformanceMonitor from '../services/3d/performance'

// Block types with enhanced properties
const BLOCK_TYPES = {
  grass: { 
    color: '#4ADE80', 
    name: 'Grass',
    texture: null,
    pattern: 'solid'
  },
dirt: {
    color: '#92400E', 
    name: 'Dirt',
    texture: null,
    pattern: 'solid'
  },
  stone: { 
    color: '#6B7280', 
    name: 'Stone',
    texture: null,
    pattern: 'solid'
  },
  wood: {
    color: '#A16207', 
    name: 'Wood',
    texture: null,
    pattern: 'solid'
  },
  water: { 
    color: '#3B82F6',
    name: 'Water',
    texture: null,
    pattern: 'solid'
  },
  sand: { 
    color: '#F59E0B', 
    name: 'Sand',
    texture: null,
    pattern: 'solid'
  }
}

// World constants
const WORLD_SIZE = { width: 20, height: 10, depth: 20 }

// State declarations
const MainFeature = () => {
  // Refs
  const gameRef = useRef(null)
  const canvas3DRef = useRef(null)
  const loadWorldRef = useRef(null)
  
  // 3D Engine refs
  const sceneManagerRef = useRef(null)
  const cameraControllerRef = useRef(null)
  const modelManagerRef = useRef(null)
  const performanceMonitorRef = useRef(null)
  const animationFrameRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuilding, setIsBuilding] = useState(true)
  const [hoveredBlock, setHoveredBlock] = useState(null)
  const [selectedBlock, setSelectedBlock] = useState('grass')
  const [performance, setPerformance] = useState({ fps: 60, chunks: 4 })
  const [statistics, setStatistics] = useState({
    totalBlocksPlaced: 0,
    totalBlocksMined: 0,
    uniqueBlockTypes: new Set()
  })
  
  // World state with initial terrain
  const [world, setWorld] = useState(() => {
    const initialWorld = {}
    for (let x = 0; x < WORLD_SIZE.width; x++) {
      for (let z = 0; z < WORLD_SIZE.depth; z++) {
        for (let y = 0; y < 3; y++) {
          const key = `${x},${y},${z}`
          if (y === 0) initialWorld[key] = 'stone'
          else if (y === 1) initialWorld[key] = 'dirt'
          else if (y === 2) initialWorld[key] = 'grass'
        }
      }
    }
return initialWorld
  })
  
  const [player, setPlayer] = useState({
    position: { x: 10, y: 4, z: 10 },
    inventory: {
      grass: 50,
      dirt: 30,
      stone: 25,
      wood: 20,
      water: 15,
      sand: 40
    },
    selectedSlot: 'grass',
    gameMode: 'creative'
})
  
// Texture system state
  const [textureMode, setTextureMode] = useState(false)
  const [showTextureDesigner, setShowTextureDesigner] = useState(false)
  const [showTextureLibrary, setShowTextureLibrary] = useState(false)
  const [selectedTexture, setSelectedTexture] = useState(null)
  const [customTextures, setCustomTextures] = useState({})
  const [currentTexture, setCurrentTexture] = useState({
    name: '',
    pixels: Array(16).fill().map(() => Array(16).fill('#4ADE80'))
  })
  const [selectedTool, setSelectedTool] = useState('brush')
  const [textureLibrary, setTextureLibrary] = useState([])
  const [textureScale, setTextureScale] = useState(1)
  const [textureRotation, setTextureRotation] = useState(0)
const [textureBlendMode, setTextureBlendMode] = useState('overlay')
  const [showMiniMap, setShowMiniMap] = useState(true)
  
// 3D Mode state
  const [is3DMode, setIs3DMode] = useState(false)
  const [show3DControls, setShow3DControls] = useState(false)
  const [threeJSLoaded, setThreeJSLoaded] = useState(false)
  const [render3DStats, setRender3DStats] = useState({
    fps: 0,
    drawCalls: 0,
    triangles: 0
  })
  
// Scene Editor state
  const [sceneEditorMode, setSceneEditorMode] = useState(false)
  const [sceneEditorTool, setSceneEditorTool] = useState('select')
  const [showPropertyPanel, setShowPropertyPanel] = useState(true)
  const [showObjectHierarchy, setShowObjectHierarchy] = useState(true)
  const [sceneObjects, setSceneObjects] = useState([])
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])
  
  // 3D Object Selection and Interaction
  const [selectedObject, setSelectedObject] = useState(null)
  const [hoveredObject, setHoveredObject] = useState(null)
  const [showDataOverlay, setShowDataOverlay] = useState(false)
  const [dataOverlayPosition, setDataOverlayPosition] = useState({ x: 0, y: 0 })
  const [dataOverlayContent, setDataOverlayContent] = useState(null)
  
  // Object manipulation state
  const [manipulationMode, setManipulationMode] = useState('translate') // translate, rotate, scale
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(1)
  const [transformGizmo, setTransformGizmo] = useState(null)
  
  // Responsive UI state
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [uiScale, setUIScale] = useState(1)
  
  // Graphics settings state
  const [showGraphicsSettings, setShowGraphicsSettings] = useState(false)
  const [graphicsSettings, setGraphicsSettings] = useState(() => {
    const saved = localStorage.getItem('craftverse-graphics-settings')
    return saved ? JSON.parse(saved) : {
      resolution: '1920x1080',
      lightingQuality: 'high',
      antiAliasing: 'fxaa',
      textureQuality: 'high',
      particleEffects: 'high',
      viewDistance: 'far',
      shadows: true,
      reflections: true,
      motionBlur: false,
      vSync: true,
      renderMode: '2d' // New: 2d or 3d
    }
  })
  // FPS monitoring
  const [fps, setFps] = useState(60)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now ? performance.now() : Date.now())

  // Camera state
  const [camera, setCamera] = useState({
    x: 0,
    y: 0,
    zoom: 1,
    rotation: 0
  })

  // Mouse drag state
  const [isDragging, setIsDragging] = useState(false)
const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Player position for mini-map
  const [playerPosition, setPlayerPosition] = useState({ x: 10, y: 10 })

  // Keyboard movement controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      const moveSpeed = 20
      switch (e.key.toLowerCase()) {
        case 'w':
          setCamera(prev => ({ ...prev, y: prev.y - moveSpeed }))
          break
        case 's':
          setCamera(prev => ({ ...prev, y: prev.y + moveSpeed }))
          break
        case 'a':
          setCamera(prev => ({ ...prev, x: prev.x - moveSpeed }))
          break
        case 'd':
          setCamera(prev => ({ ...prev, x: prev.x + moveSpeed }))
          break
        case 'q':
          setCamera(prev => ({ ...prev, zoom: Math.max(0.5, prev.zoom - 0.1) }))
          break
        case 'e':
          setCamera(prev => ({ ...prev, zoom: Math.min(2, prev.zoom + 0.1) }))
          break
        case 'r':
          setCamera({ x: 0, y: 0, zoom: 1, rotation: 0 })
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
}, [])

  // Responsive design handler
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      setScreenSize({ width: newWidth, height: newHeight })
      setIsMobile(newWidth < 768)
      
      // Calculate UI scale based on screen size
      const baseWidth = 1920
      const scale = Math.max(0.8, Math.min(1.2, newWidth / baseWidth))
      setUIScale(scale)
      
      // Resize 3D canvas if active
      if (is3DMode && sceneManagerRef.current) {
        sceneManagerRef.current.resize(newWidth, newHeight)
      }
    }
    
    window.addEventListener('resize', handleResize)
    handleResize() // Initial call
    
    return () => window.removeEventListener('resize', handleResize)
  }, [is3DMode])

// Initialize 3D engine
  useEffect(() => {
    const init3DEngine = async () => {
      if (!is3DMode || !canvas3DRef.current) return
      
      try {
        // Initialize Scene Manager with responsive size
        sceneManagerRef.current = new SceneManager()
        const initSuccess = sceneManagerRef.current.init(
          canvas3DRef.current,
          screenSize.width,
          screenSize.height
        )
        
        if (!initSuccess) {
          toast.error('Failed to initialize 3D rendering engine')
          setIs3DMode(false)
          return
        }
        
        // Initialize Model Manager
        modelManagerRef.current = new ModelManager()
        modelManagerRef.current.init()
        
        // Initialize Camera Controller with responsive controls
        cameraControllerRef.current = new CameraController(
          sceneManagerRef.current.camera,
          canvas3DRef.current
        )
        
        // Setup 3D object selection
        setup3DObjectSelection()
        
        // Initialize Performance Monitor
        performanceMonitorRef.current = new PerformanceMonitor()
        performanceMonitorRef.current.start()
        performanceMonitorRef.current.addCallback((metrics) => {
          setRender3DStats(prev => ({
            ...prev,
            fps: metrics.fps,
            drawCalls: metrics.drawCalls,
            triangles: metrics.triangles
          }))
        })
        
        // Load initial 3D world from 2D world data
        loadWorldTo3D()
        
        // Start render loop
        startRenderLoop()
        
        setThreeJSLoaded(true)
        toast.success('3D rendering engine initialized successfully!')
        
      } catch (error) {
        console.error('3D Engine initialization error:', error)
        toast.error('Failed to initialize 3D engine')
        setIs3DMode(false)
      }
    }
    
    if (is3DMode) {
      init3DEngine()
    } else {
      cleanup3DEngine()
    }
    
    return () => cleanup3DEngine()
  }, [is3DMode, screenSize])

  // Save graphics settings to localStorage
  useEffect(() => {
    localStorage.setItem('craftverse-graphics-settings', JSON.stringify(graphicsSettings))
    applyGraphicsSettings(graphicsSettings)
  }, [graphicsSettings])
  // Initialize default textures
  useEffect(() => {
    const defaultTextures = [
      {
        id: 'cobblestone',
        name: 'Cobblestone',
        pattern: 'repeating-linear-gradient(45deg, #666 0px, #666 4px, #888 4px, #888 8px)',
        size: 16
      },
      {
        id: 'brick',
        name: 'Brick',
        pattern: 'repeating-linear-gradient(0deg, #B91C1C 0px, #B91C1C 8px, #7F1D1D 8px, #7F1D1D 16px)',
        size: 16
      },
      {
        id: 'marble',
        name: 'Marble',
        pattern: 'radial-gradient(circle, #F3F4F6 30%, #E5E7EB 70%)',
        size: 16
      }
    ]
    setTextureLibrary(defaultTextures)
  }, [])

  // Block interaction handler
  const handleBlockInteraction = useCallback((x, y, z, isMining) => {
    const blockKey = `${x},${y},${z}`
    
    if (isMining) {
      // Mine block
      if (world[blockKey]) {
        const blockType = world[blockKey]
        setWorld(prev => {
          const newWorld = { ...prev }
          delete newWorld[blockKey]
          return newWorld
        })
        
        setPlayer(prev => ({
          ...prev,
          inventory: {
            ...prev.inventory,
            [blockType]: (prev.inventory[blockType] || 0) + 1
          }
        }))
        
        // Update statistics
        setStatistics(prev => ({
          ...prev,
          totalBlocksMined: prev.totalBlocksMined + 1,
          uniqueBlockTypes: new Set([...prev.uniqueBlockTypes, blockType])
        }))
        
        toast.success(`Mined ${BLOCK_TYPES[blockType]?.name || blockType}!`)
      }
} else {
      // Place block
      if (!world[blockKey] && player.inventory[player.selectedSlot] > 0) {
        setWorld(prev => ({
          ...prev,
          [blockKey]: player.selectedSlot
        }))
        
        setPlayer(prev => ({
          ...prev,
          inventory: {
            ...prev.inventory,
            [prev.selectedSlot]: prev.inventory[prev.selectedSlot] - 1
          }
        }))
        
        // Update statistics
        setStatistics(prev => ({
          ...prev,
          totalBlocksPlaced: prev.totalBlocksPlaced + 1,
          uniqueBlockTypes: new Set([...prev.uniqueBlockTypes, player.selectedSlot])
        }))
        
toast.success(`Placed ${BLOCK_TYPES[player.selectedSlot]?.name}!`)
      } else if (player.inventory[player.selectedSlot] <= 0) {
        toast.warning(`No ${BLOCK_TYPES[player.selectedSlot]?.name} blocks left!`)
      }
    }
  }, [world, player.selectedSlot, player.inventory])
  
  // Utility functions
  const createPatternFromPixels = (pixels) => {
    return `url("data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>${
        pixels.map((row, y) => 
          row.map((color, x) => 
            `<rect x='${x}' y='${y}' width='1' height='1' fill='${color}'/>`
          ).join('')
        ).join('')
      }</svg>`
    )}")`
  }

  // Texture management functions
  const saveCustomTexture = useCallback(() => {
    if (!currentTexture.name.trim()) {
      toast.warning('Please enter a texture name!')
      return
    }
    
    const texturePattern = createPatternFromPixels(currentTexture.pixels)
    setCustomTextures(prev => ({
      ...prev,
      [currentTexture.name]: {
        name: currentTexture.name,
        pattern: texturePattern,
        pixels: currentTexture.pixels,
        category: 'custom'
      }
    }))
    
    toast.success(`Texture "${currentTexture.name}" saved!`)
    setShowTextureDesigner(false)
  }, [currentTexture])
  
  const loadTexture = useCallback((textureName) => {
    const texture = customTextures[textureName]
    if (texture) {
      setSelectedTexture(texture)
    }
  }, [customTextures])

  const deleteCustomTexture = useCallback((textureName) => {
    setCustomTextures(prev => {
      const newTextures = { ...prev }
      delete newTextures[textureName]
      return newTextures
    })
    toast.info(`Texture "${textureName}" deleted`)
  }, [])

  const applyTextureToBlock = useCallback((blockType, texture) => {
    // Apply texture to specific block type
    toast.success(`Applied ${texture.name} to ${BLOCK_TYPES[blockType]?.name}`)
  }, [])

// 3D Engine functions
  const startRenderLoop = () => {
    const animate = () => {
      if (sceneManagerRef.current && performanceMonitorRef.current) {
        // Update performance monitor
        performanceMonitorRef.current.update(sceneManagerRef.current.renderer)
        
        // Render the scene
        sceneManagerRef.current.render()
        
        // Continue animation loop
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }
    animationFrameRef.current = requestAnimationFrame(animate)
  }

  const cleanup3DEngine = () => {
    // Stop animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // Cleanup 3D resources
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.dispose()
      performanceMonitorRef.current = null
    }
    
    if (cameraControllerRef.current) {
      cameraControllerRef.current.dispose()
      cameraControllerRef.current = null
    }
    
    if (modelManagerRef.current) {
      modelManagerRef.current.dispose()
      modelManagerRef.current = null
    }
    
    if (sceneManagerRef.current) {
      sceneManagerRef.current.dispose()
      sceneManagerRef.current = null
    }
    
    setThreeJSLoaded(false)
  }

  const loadWorldTo3D = () => {
    if (!sceneManagerRef.current || !modelManagerRef.current) return
    
    // Convert 2D world data to 3D blocks
    Object.entries(world).forEach(([key, blockType]) => {
      const [x, y, z] = key.split(',').map(Number)
      const block = modelManagerRef.current.createBlock(blockType, { x, y, z })
      if (block) {
        sceneManagerRef.current.scene.add(block)
      }
    })
    
    // Add some placeholder models for demonstration
    const tree = modelManagerRef.current.createPlaceholderModel('tree', { x: 5, y: 0, z: 5 })
    const house = modelManagerRef.current.createPlaceholderModel('house', { x: -5, y: 0, z: -5 })
    const tower = modelManagerRef.current.createPlaceholderModel('tower', { x: 10, y: 0, z: -10 })
    
    if (tree) sceneManagerRef.current.scene.add(tree)
    if (house) sceneManagerRef.current.scene.add(house)
    if (tower) sceneManagerRef.current.scene.add(tower)
}

  // 3D Object Selection System
  const setup3DObjectSelection = () => {
    if (!canvas3DRef.current || !sceneManagerRef.current) return
    
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    
    const handleObjectClick = (event) => {
      const rect = canvas3DRef.current.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      raycaster.setFromCamera(mouse, sceneManagerRef.current.camera)
      const intersects = raycaster.intersectObjects(sceneManagerRef.current.scene.children, true)
      
      if (intersects.length > 0) {
        const selectedObj = intersects[0].object
        setSelectedObject(selectedObj)
        
        // Show data overlay
        setDataOverlayContent({
          type: selectedObj.userData.type || 'object',
          position: selectedObj.position,
          scale: selectedObj.scale,
          material: selectedObj.material?.type || 'unknown'
        })
        setDataOverlayPosition({ x: event.clientX, y: event.clientY })
        setShowDataOverlay(true)
        
        // Add selection visual feedback
        if (selectedObj.material) {
          selectedObj.material.emissive = new THREE.Color(0x4F46E5)
          selectedObj.material.emissiveIntensity = 0.3
        }
        
        toast.success(`Selected: ${selectedObj.userData.type || 'Object'}`)
      } else {
        clearSelection()
      }
    }
    
    const handleObjectHover = (event) => {
      const rect = canvas3DRef.current.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      raycaster.setFromCamera(mouse, sceneManagerRef.current.camera)
      const intersects = raycaster.intersectObjects(sceneManagerRef.current.scene.children, true)
      
      // Clear previous hover effects
      if (hoveredObject && hoveredObject.material) {
        hoveredObject.material.emissive = new THREE.Color(0x000000)
        hoveredObject.material.emissiveIntensity = 0
      }
      
      if (intersects.length > 0) {
        const hoveredObj = intersects[0].object
        setHoveredObject(hoveredObj)
        
        // Add hover visual feedback
        if (hoveredObj.material && hoveredObj !== selectedObject) {
          hoveredObj.material.emissive = new THREE.Color(0x10B981)
          hoveredObj.material.emissiveIntensity = 0.1
        }
        
        canvas3DRef.current.style.cursor = 'pointer'
      } else {
        setHoveredObject(null)
        canvas3DRef.current.style.cursor = 'grab'
      }
    }
    
    canvas3DRef.current.addEventListener('click', handleObjectClick)
    canvas3DRef.current.addEventListener('mousemove', handleObjectHover)
  }
  
  const clearSelection = () => {
    if (selectedObject && selectedObject.material) {
      selectedObject.material.emissive = new THREE.Color(0x000000)
      selectedObject.material.emissiveIntensity = 0
    }
    setSelectedObject(null)
    setShowDataOverlay(false)
    setDataOverlayContent(null)
  }

  const toggle3DMode = () => {
    setIs3DMode(!is3DMode)
    setGraphicsSettings(prev => ({
      ...prev,
      renderMode: !is3DMode ? '3d' : '2d'
    }))
    
    // Clear selection when switching modes
    clearSelection()
  }
// Scene Editor Functions
  const toggleSceneEditor = () => {
setSceneEditorMode(!sceneEditorMode)
    if (!sceneEditorMode) {
      setIs3DMode(true) // Force 3D mode for scene editor
      setSceneEditorTool('select')
      clearSelection()
    }
  }
  
  const createObject = (type, position = { x: 0, y: 0, z: 0 }) => {
    if (!modelManagerRef.current || !sceneManagerRef.current) return
    
    const object = modelManagerRef.current.createPlaceholderModel(type, position)
    if (object) {
      const objectData = {
        id: `${type}_${Date.now()}`,
        type,
        mesh: object,
        position: { ...position },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        properties: {
          name: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
          material: 'default',
          visible: true
        }
      }
      
      sceneManagerRef.current.scene.add(object)
      setSceneObjects(prev => [...prev, objectData])
      setSelectedObject(object)
      
      // Add to undo stack
      addToUndoStack('create', objectData)
      
      toast.success(`Created ${type}`)
    }
  }
  
  const deleteSelectedObject = () => {
    if (!selectedObject || !sceneManagerRef.current) return
    
    const objectData = sceneObjects.find(obj => obj.mesh === selectedObject)
    if (objectData) {
      sceneManagerRef.current.scene.remove(selectedObject)
      setSceneObjects(prev => prev.filter(obj => obj.id !== objectData.id))
      addToUndoStack('delete', objectData)
      setSelectedObject(null)
      toast.success('Object deleted')
    }
  }
  
  const updateObjectProperties = (objectId, properties) => {
    setSceneObjects(prev => prev.map(obj => 
      obj.id === objectId ? { ...obj, ...properties } : obj
    ))
    
    // Update the actual 3D object
    const objectData = sceneObjects.find(obj => obj.id === objectId)
    if (objectData && objectData.mesh) {
      if (properties.position) {
        objectData.mesh.position.set(properties.position.x, properties.position.y, properties.position.z)
      }
      if (properties.rotation) {
        objectData.mesh.rotation.set(properties.rotation.x, properties.rotation.y, properties.rotation.z)
      }
      if (properties.scale) {
        objectData.mesh.scale.set(properties.scale.x, properties.scale.y, properties.scale.z)
      }
    }
  }
  
  const addToUndoStack = (action, data) => {
    setUndoStack(prev => [...prev.slice(-19), { action, data, timestamp: Date.now() }])
    setRedoStack([]) // Clear redo stack on new action
  }
  
  const undo = () => {
    if (undoStack.length === 0) return
    
    const lastAction = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    setRedoStack(prev => [lastAction, ...prev])
    
    // Implement undo logic based on action type
    switch (lastAction.action) {
      case 'create':
        if (lastAction.data.mesh && sceneManagerRef.current) {
          sceneManagerRef.current.scene.remove(lastAction.data.mesh)
          setSceneObjects(prev => prev.filter(obj => obj.id !== lastAction.data.id))
        }
        break
      case 'delete':
        // Re-add deleted object
        if (lastAction.data.mesh && sceneManagerRef.current) {
          sceneManagerRef.current.scene.add(lastAction.data.mesh)
          setSceneObjects(prev => [...prev, lastAction.data])
        }
        break
    }
  }
  
  const redo = () => {
    if (redoStack.length === 0) return
    
    const actionToRedo = redoStack[0]
    setRedoStack(prev => prev.slice(1))
    setUndoStack(prev => [...prev, actionToRedo])
    
    // Implement redo logic
    switch (actionToRedo.action) {
      case 'create':
        if (actionToRedo.data.mesh && sceneManagerRef.current) {
          sceneManagerRef.current.scene.add(actionToRedo.data.mesh)
          setSceneObjects(prev => [...prev, actionToRedo.data])
        }
        break
      case 'delete':
        if (actionToRedo.data.mesh && sceneManagerRef.current) {
          sceneManagerRef.current.scene.remove(actionToRedo.data.mesh)
          setSceneObjects(prev => prev.filter(obj => obj.id !== actionToRedo.data.id))
        }
        break
    }
  }
  
  const saveScene = () => {
    const sceneData = {
      objects: sceneObjects.map(obj => ({
        id: obj.id,
        type: obj.type,
        position: obj.position,
        rotation: obj.rotation,
        scale: obj.scale,
        properties: obj.properties
      })),
      camera: {
        position: cameraControllerRef.current ? {
          x: cameraControllerRef.current.camera.position.x,
          y: cameraControllerRef.current.camera.position.y,
          z: cameraControllerRef.current.camera.position.z
        } : { x: 0, y: 0, z: 0 },
        target: cameraControllerRef.current ? {
          x: cameraControllerRef.current.target.x,
          y: cameraControllerRef.current.target.y,
          z: cameraControllerRef.current.target.z
        } : { x: 0, y: 0, z: 0 }
      },
      metadata: {
        name: 'CraftVerse Scene',
        created: new Date().toISOString(),
        version: '1.0'
      }
    }
    
    const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'craftverse-scene.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Scene saved!')
  }
  
const loadScene = useCallback((event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const sceneData = JSON.parse(e.target.result)
        
        // Clear current scene
        sceneObjects.forEach(obj => {
          if (obj.mesh && sceneManagerRef.current) {
            sceneManagerRef.current.scene.remove(obj.mesh)
          }
        })
        setSceneObjects([])
        
        // Load objects
        if (sceneData.objects && modelManagerRef.current && sceneManagerRef.current) {
          const newObjects = sceneData.objects.map(objData => {
            const mesh = modelManagerRef.current.createPlaceholderModel(objData.type, objData.position)
            if (mesh) {
              mesh.position.set(objData.position.x, objData.position.y, objData.position.z)
              mesh.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z)
              mesh.scale.set(objData.scale.x, objData.scale.y, objData.scale.z)
              sceneManagerRef.current.scene.add(mesh)
            }
            return {
              ...objData,
              mesh
            }
          })
          setSceneObjects(newObjects)
        }
        
        // Load camera
        if (sceneData.camera && cameraControllerRef.current) {
          cameraControllerRef.current.camera.position.set(
            sceneData.camera.position.x,
            sceneData.camera.position.y,
            sceneData.camera.position.z
          )
          cameraControllerRef.current.setTarget(
            sceneData.camera.target.x,
            sceneData.camera.target.y,
            sceneData.camera.target.z
          )
        }
        
        toast.success('Scene loaded successfully!')
      } catch (error) {
        console.error('Scene load error:', error)
        toast.error('Failed to load scene file!')
      }
    }
    
    reader.onerror = () => {
      toast.error('Failed to read scene file!')
    }
    
    reader.readAsText(file)
  }, [sceneObjects])

  // Apply graphics settings to the game
  const applyGraphicsSettings = (settings) => {
    const canvas = document.querySelector('.game-canvas')
    if (canvas) {
      // Apply resolution
      const [width, height] = settings.resolution.split('x').map(Number)
      canvas.style.maxWidth = `${width}px`
      canvas.style.maxHeight = `${height}px`
      
      // Apply anti-aliasing
      canvas.style.imageRendering = settings.antiAliasing === 'none' ? 'pixelated' : 'auto'
      
      // Apply other visual effects through CSS classes
      canvas.className = `game-canvas ${settings.lightingQuality}-lighting ${settings.textureQuality}-textures`
    }
    
    // Apply 3D-specific settings if in 3D mode
    if (is3DMode && sceneManagerRef.current) {
      // Apply 3D quality settings to renderer
      const renderer = sceneManagerRef.current.renderer
      if (renderer) {
        renderer.shadowMap.enabled = settings.shadows
        renderer.antialias = settings.antiAliasing !== 'none'
      }
    }
  }

  // Update FPS counter
  const updateFPS = useCallback(() => {
    frameCountRef.current++
    const now = performance.now ? performance.now() : Date.now()
    
    if (now - lastTimeRef.current >= 1000) {
      setFps(frameCountRef.current)
      frameCountRef.current = 0
      lastTimeRef.current = now
    }
  }, [])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      updateFPS()
      requestAnimationFrame(animate)
    }
    animate()
  }, [updateFPS])
// World interaction handlers
  const placeBlock = useCallback((x, y) => {
    if (selectedBlock && x >= 0 && x < WORLD_SIZE.width && y >= 0 && y < WORLD_SIZE.depth) {
      const blockToPlace = { 
        ...BLOCK_TYPES[selectedBlock],
        texture: currentTexture,
        scale: textureScale,
        rotation: textureRotation,
        blendMode: textureBlendMode
}
      
      setWorld(prev => {
        const newWorld = { ...prev }
        newWorld[`${x},${y}`] = blockToPlace
        return newWorld
      })
      setStatistics(prev => ({
        ...prev,
        totalBlocksPlaced: prev.totalBlocksPlaced + 1,
        uniqueBlockTypes: new Set([...prev.uniqueBlockTypes, selectedBlock])
      }))

      toast.success(`Placed ${BLOCK_TYPES[selectedBlock].name} block!`)
    }
}, [selectedBlock, currentTexture, textureScale, textureRotation, textureBlendMode])

  // World rendering function
  // World rendering function
  const renderWorld = () => {
    const blocks = []
    
    Object.entries(world).forEach(([key, blockType]) => {
      const [x, y, z] = key.split(',').map(Number)
      const block = BLOCK_TYPES[blockType] || BLOCK_TYPES.grass
      
      const isoX = (x - z) * 30
      const isoY = (x + z) * 15 - y * 35
      
      const isHovered = hoveredBlock === key
      
      blocks.push(
        <motion.div
          key={key}
          initial={{ scale: 0, rotateY: 0 }}
          animate={{ 
            scale: 1, 
            rotateY: 360,
            y: isHovered ? -5 : 0
          }}
          exit={{ scale: 0, rotateY: 180 }}
          transition={{ duration: 0.3, type: "spring" }}
          className={`absolute cursor-pointer transform-gpu ${isHovered ? 'z-30' : 'z-10'}`}
          style={{
            left: `${isoX + camera.x + 400}px`,
            top: `${isoY + camera.y + 300}px`,
            transform: `scale(${camera.zoom})`,
          }}
          onMouseEnter={() => setHoveredBlock(key)}
          onMouseLeave={() => setHoveredBlock(null)}
          onClick={() => handleBlockInteraction(x, y, z, false)}
          onContextMenu={(e) => {
            e.preventDefault()
            handleBlockInteraction(x, y, z, true)
          }}
        >
          {/* Block shadow */}
          <div 
            className="absolute w-8 h-8 rounded transform rotate-45 opacity-20"
            style={{ 
              backgroundColor: '#000',
left: '2px',
              top: '8px',
              zIndex: -1
            }}
          />
          
          {/* Main block */}
          <div 
            className="w-8 h-8 rounded border-2 flex items-center justify-center text-white font-bold text-xs transition-all duration-200"
            style={{ 
              backgroundColor: block.texture ? 'transparent' : block.color,
              background: block.texture ? block.texture.pattern : block.color,
              boxShadow: isHovered ? '0 0 15px rgba(255,255,255,0.5)' : `inset 0 0 0 1px rgba(255,255,255,0.2)`
            }}
          >
            {blockType.charAt(0).toUpperCase()}
          </div>
          {isHovered && (
            <div className="absolute inset-0 rounded border-2 border-white animate-pulse opacity-50" />
          )}
        </motion.div>
      )
    })
    
    return blocks
  }
  
  // Texture Designer Component
  const renderTextureDesigner = () => {
    const [selectedColor, setSelectedColor] = useState('#4ADE80')
    const [activeTool, setActiveTool] = useState('brush')
    
    const drawPixel = (rowIndex, colIndex) => {
      if (activeTool === 'brush') {
        setCurrentTexture(prev => {
          const newPixels = [...prev.pixels]
          newPixels[rowIndex] = [...newPixels[rowIndex]]
          newPixels[rowIndex][colIndex] = selectedColor
          return { ...prev, pixels: newPixels }
        })
      } else if (activeTool === 'fill') {
        floodFill(rowIndex, colIndex, selectedColor)
      } else if (activeTool === 'eyedropper') {
        setSelectedColor(currentTexture.pixels[rowIndex][colIndex])
        setActiveTool('brush')
      }
    }
    
    const floodFill = (startRow, startCol, newColor) => {
      const originalColor = currentTexture.pixels[startRow][startCol]
      if (originalColor === newColor) return
      
      const pixels = currentTexture.pixels.map(row => [...row])
      const stack = [[startRow, startCol]]
      
      while (stack.length > 0) {
        const [row, col] = stack.pop()
        if (row < 0 || row >= 16 || col < 0 || col >= 16) continue
        if (pixels[row][col] !== originalColor) continue
        
        pixels[row][col] = newColor
        stack.push([row + 1, col], [row - 1, col], [row, col + 1], [row, col - 1])
      }
      
      setCurrentTexture(prev => ({ ...prev, pixels }))
    }
    
    const clearCanvas = () => {
      setCurrentTexture(prev => ({
        ...prev,
        pixels: Array(16).fill().map(() => Array(16).fill('#4ADE80'))
      }))
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute inset-4 bg-surface-900 rounded-xl border border-surface-700 z-50 overflow-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Palette size={24} className="text-primary-400" />
              Texture Designer
            </h2>
            <button
              onClick={() => setShowTextureDesigner(false)}
              className="control-button hover:bg-red-600"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Canvas */}
            <div className="lg:col-span-2">
              <div className="bg-surface-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-white">Canvas (16x16)</h3>
                <div className="inline-block border-2 border-surface-600 rounded bg-white p-2">
                  <div className="grid grid-cols-16 gap-0" style={{ width: '320px', height: '320px' }}>
                    {currentTexture.pixels.map((row, rowIndex) =>
                      row.map((color, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className="w-5 h-5 border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => drawPixel(rowIndex, colIndex)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tools */}
            <div className="space-y-4">
              {/* Tool Selection */}
              <div className="bg-surface-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-white">Tools</h3>
<div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTool('brush')}
                    className={`control-button ${activeTool === 'brush' ? 'bg-primary-600' : ''}`}
                  >
                    <Brush size={16} />
                  </button>
                  <button
                    onClick={() => setActiveTool('fill')}
                    className={`control-button ${activeTool === 'fill' ? 'bg-primary-600' : ''}`}
                  >
                    <Square size={16} />
                  </button>
                  <button
                    onClick={() => setActiveTool('eyedropper')}
                    className={`control-button ${activeTool === 'eyedropper' ? 'bg-primary-600' : ''}`}
                  >
                    <Pipette size={16} />
                  </button>
                  <button
                    onClick={clearCanvas}
                    className="control-button hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {/* Color Picker */}
              <div className="bg-surface-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-white">Color</h3>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full h-12 rounded border border-surface-600"
                />
                <div className="mt-2 text-sm text-surface-300">
                  Selected: {selectedColor}
                </div>
              </div>
              
              {/* Preview */}
              <div className="bg-surface-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-white">Preview</h3>
                <div className="w-16 h-16 rounded border border-surface-600 mx-auto"
                     style={{ background: createPatternFromPixels(currentTexture.pixels) }}>
                </div>
              </div>
              
              {/* Save */}
              <div className="bg-surface-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-white">Save Texture</h3>
                <input
                  type="text"
                  placeholder="Texture name..."
                  value={currentTexture.name}
                  onChange={(e) => setCurrentTexture(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface-700 border border-surface-600 rounded text-white mb-3"
                />
<button
                  onClick={saveCustomTexture}
                  className="w-full px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded font-medium"
                >
                  <Save size={16} className="inline mr-2" />
                  Save Texture
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }
  
  // Texture Library Component
  const renderTextureLibrary = () => {
    const PRESET_TEXTURES = {
      cobblestone: { name: 'Cobblestone', pattern: 'repeating-linear-gradient(45deg, #666 0px, #666 4px, #888 4px, #888 8px)', category: 'preset' },
      brick: { name: 'Brick', pattern: 'repeating-linear-gradient(0deg, #B91C1C 0px, #B91C1C 8px, #7F1D1D 8px, #7F1D1D 16px)', category: 'preset' },
      marble: { name: 'Marble', pattern: 'radial-gradient(circle, #F3F4F6 30%, #E5E7EB 70%)', category: 'preset' }
    }
    const allTextures = { ...PRESET_TEXTURES, ...customTextures }
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
className="absolute top-4 right-4 bottom-4 w-80 bg-surface-900 rounded-xl border border-surface-700 z-50 overflow-auto"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Image size={20} className="text-primary-400" />
              Texture Library
            </h2>
            <button
              onClick={() => setShowTextureLibrary(false)}
              className="control-button hover:bg-red-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Preset Textures */}
            <div>
              <h3 className="text-sm font-semibold text-surface-300 mb-2">Preset Textures</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRESET_TEXTURES).map(([key, texture]) => (
                  <div
                    key={key}
                    className="bg-surface-800 rounded-lg p-2 cursor-pointer hover:bg-surface-700 transition-colors"
                    onClick={() => loadTexture(key)}
                  >
                    <div
                      className="w-full h-12 rounded mb-2 border border-surface-600"
                      style={{ background: texture.pattern }}
                    />
                    <div className="text-xs text-white font-medium">{texture.name}</div>
                    <div className="text-xs text-surface-400">{texture.category}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Custom Textures */}
            <div>
              <h3 className="text-sm font-semibold text-surface-300 mb-2">Custom Textures</h3>
              {Object.keys(customTextures).length === 0 ? (
                <div className="text-sm text-surface-500 italic">No custom textures yet</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(customTextures).map(([key, texture]) => (
                    <div
                      key={key}
                      className="bg-surface-800 rounded-lg p-2 group relative"
                    >
                      <div
                        className="w-full h-12 rounded mb-2 border border-surface-600 cursor-pointer"
                        style={{ background: texture.pattern }}
                        onClick={() => loadTexture(key)}
                      />
                      <div className="text-xs text-white font-medium">{texture.name}</div>
                      <button
                        onClick={() => deleteCustomTexture(key)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected Texture */}
            {selectedTexture && (
              <div className="bg-surface-800 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-surface-300 mb-2">Selected Texture</h3>
                <div
                  className="w-full h-12 rounded mb-2 border border-surface-600"
                  style={{ background: selectedTexture.pattern }}
                />
                <div className="text-sm text-white font-medium">{selectedTexture.name}</div>
                <div className="text-xs text-surface-400 mb-3">{selectedTexture.category}</div>
                
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-surface-300">Apply to:</h4>
                  <div className="grid grid-cols-3 gap-1">
                    {Object.entries(BLOCK_TYPES).map(([type, block]) => (
                      <button
                        key={type}
                        onClick={() => applyTextureToBlock(type, selectedTexture)}
                        className="px-2 py-1 bg-surface-700 hover:bg-primary-600 text-xs rounded transition-colors"
                        title={`Apply to ${block.name}`}
                      >
                        {block.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }
  
  // Render mini-map
  const renderMiniMap = () => {
    const mapCells = []
    for (let x = 0; x < WORLD_SIZE.width; x++) {
      for (let z = 0; z < WORLD_SIZE.depth; z++) {
        let topBlock = null
        // Find the topmost block at this x,z position
        for (let y = WORLD_SIZE.height - 1; y >= 0; y--) {
          const key = `${x},${y},${z}`
          if (world[key]) {
            topBlock = world[key]
            break
          }
        }
        
        mapCells.push(
          <div
            key={`${x}-${z}`}
            className="w-2 h-2"
            style={{
              backgroundColor: topBlock ? BLOCK_TYPES[topBlock]?.color : 'transparent',
              opacity: topBlock ? 0.8 : 0.1
            }}
          />
        )
      }
    }
    return mapCells
  }
  
  // Start game
// Game control functions
  const startGame = () => {
    setIsPlaying(true)
    toast.success('Welcome to CraftVerse! Start building your world!')
  }
  
  const resetWorld = () => {
    setWorld({})
    setPlayer(prev => ({
      ...prev,
      inventory: {
        grass: 50,
        dirt: 30,
        stone: 25,
        wood: 20,
        water: 15,
        sand: 40
      }
    }))
    setStatistics({
      totalBlocksPlaced: 0,
      totalBlocksMined: 0,
      uniqueBlockTypes: new Set()
    })
    toast.info('World reset!')
  }
  
  const saveWorld = () => {
    const worldData = JSON.stringify({ world, player, statistics })
    const blob = new Blob([worldData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'craftverse-world.json'
    a.click()
    URL.revokeObjectURL(url)
toast.success('World saved!')
  }

  // Load world function
  const loadWorld = useCallback((event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const worldData = JSON.parse(e.target.result)
        if (worldData.world) setWorld(worldData.world)
        if (worldData.player) setPlayer(worldData.player)
        if (worldData.statistics) setStatistics(worldData.statistics)
        toast.success('World loaded successfully!')
      } catch (error) {
        toast.error('Failed to load world file!')
      }
    }
    reader.readAsText(file)
  }, [])

  if (!isPlaying) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-surface-900 via-primary-900 to-surface-900 relative overflow-hidden">
        {/* Animated background blocks */}
<div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-16 h-16 opacity-10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: Object.values(BLOCK_TYPES)[Math.floor(Math.random() * Object.values(BLOCK_TYPES).length)].color
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 180, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10"
        >
          <motion.h1 
            className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary-400 via-secondary-400 to-accent bg-clip-text text-transparent font-heading"
            animate={{ textShadow: ['0 0 20px rgba(79,70,229,0.5)', '0 0 40px rgba(79,70,229,0.8)', '0 0 20px rgba(79,70,229,0.5)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            CraftVerse
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-surface-300 mb-12 max-w-2xl mx-auto px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Build, create, and explore in your own voxel sandbox world
          </motion.p>
          
          <motion.button
onClick={startGame}
            className="px-12 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white text-xl font-semibold rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-game hover:scale-105 flex items-center gap-3 mx-auto"
            whileTap={{ scale: 0.95 }}
          >
            <Play size={24} />
            Start Building
          </motion.button>
        </motion.div>
      </div>
    )
}
return (
    <div className={`w-full h-screen relative bg-gradient-to-b from-sky-300 to-green-300 overflow-hidden game-ui ${is3DMode ? 'mode-3d' : 'mode-2d'}`}>
      {/* Data Overlay for 3D Objects */}
      {showDataOverlay && dataOverlayContent && (
        <div 
          className="data-overlay"
          style={{
            left: `${dataOverlayPosition.x + 10}px`,
            top: `${dataOverlayPosition.y - 10}px`,
            transform: `scale(${uiScale})`
          }}
        >
          <div className="space-y-1">
            <div className="font-semibold text-primary-300">
              {dataOverlayContent.type.charAt(0).toUpperCase() + dataOverlayContent.type.slice(1)}
            </div>
            <div className="text-surface-300">
              Position: ({dataOverlayContent.position.x.toFixed(1)}, {dataOverlayContent.position.y.toFixed(1)}, {dataOverlayContent.position.z.toFixed(1)})
            </div>
            <div className="text-surface-300">
              Material: {dataOverlayContent.material}
            </div>
            <div className="text-xs text-surface-400 mt-1">
              Click to select • Right-click for options
            </div>
          </div>
        </div>
      )}
      
      {/* Game Canvas Container */}
      <div className="absolute inset-0 responsive-3d-container">
        {/* 2D Canvas */}
        {!is3DMode && (
          <div 
            ref={gameRef}
            className="game-canvas relative cursor-grab active:cursor-grabbing w-full h-full"
            onWheel={(e) => {
              const newZoom = Math.max(0.5, Math.min(2, camera.zoom + (e.deltaY > 0 ? -0.1 : 0.1)))
              setCamera(prev => ({ ...prev, zoom: newZoom }))
            }}
            onMouseDown={(e) => {
              setIsDragging(true)
              setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y })
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                setCamera(prev => ({
                  ...prev,
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y
                }))
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            {/* World Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-20 gap-1 h-full w-full">
            {[...Array(400)].map((_, i) => (
              <div key={i} className="border border-surface-500" />
            ))}
          </div>
        </div>
        
        {/* 3D World Blocks */}
        <AnimatePresence>
          {renderWorld()}
        </AnimatePresence>
        
        {/* Player indicator */}
        <motion.div
          className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white z-40"
          style={{
            left: `${(player.position.x - player.position.z) * 30 + camera.x + 396}px`,
            top: `${(player.position.x + player.position.z) * 15 - player.position.y * 35 + camera.y + 296}px`,
            transform: `scale(${camera.zoom})`,
          }}
animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
          </div>
        )}
        
        {/* 3D Canvas */}
        {is3DMode && (
          <div className="w-full h-full relative">
            <canvas
              ref={canvas3DRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              style={{ display: 'block' }}
            />
            
            {/* 3D Loading Overlay */}
            {!threeJSLoaded && (
              <div className="absolute inset-0 bg-surface-900 bg-opacity-75 flex items-center justify-center z-30">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <p className="text-white text-lg">Initializing 3D Engine...</p>
                </div>
              </div>
            )}
            
            {/* 3D Performance Overlay */}
            {threeJSLoaded && show3DControls && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-4 hud-panel z-40"
              >
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Box size={16} className="text-primary-400" />
                  3D Performance
                </h3>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-surface-300">FPS:</span>
                    <span className={render3DStats.fps >= 30 ? 'text-green-400' : 'text-red-400'}>
                      {render3DStats.fps}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-300">Draw Calls:</span>
                    <span className="text-blue-400">{render3DStats.drawCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-300">Triangles:</span>
                    <span className="text-purple-400">{render3DStats.triangles.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
{/* Mode Toggle Button - Responsive */}
{/* Mode Toggle Buttons - Responsive */}
      <div className={`absolute z-50 ${isMobile ? 'top-2 left-2' : 'top-4 left-1/2 transform -translate-x-1/2'}`}>
        <div className="flex gap-2">
          <motion.button
            onClick={toggle3DMode}
            className={`px-4 py-2 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 flex items-center gap-2 ${
              is3DMode 
                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700' 
                : 'bg-gradient-to-r from-surface-700 to-surface-800 hover:from-surface-600 hover:to-surface-700'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {is3DMode ? <Box size={16} /> : <Square size={16} />}
            <span>{is3DMode ? '3D' : '2D'}</span>
          </motion.button>
          
          {is3DMode && (
            <motion.button
              onClick={toggleSceneEditor}
              className={`px-4 py-2 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 flex items-center gap-2 ${
                sceneEditorMode 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-surface-700 to-surface-800 hover:from-surface-600 hover:to-surface-700'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={16} />
              <span>Editor</span>
              {sceneEditorMode && <div className="text-xs bg-green-500 px-2 py-1 rounded-full">ON</div>}
            </motion.button>
          )}
        </div>
      </div>

{/* Scene Editor Panel */}
      {sceneEditorMode && is3DMode && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          className="absolute top-4 left-4 bottom-4 w-80 scene-editor-panel z-50 overflow-y-auto"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Box size={20} className="text-primary-400" />
                Scene Editor
              </h2>
              <button
                onClick={toggleSceneEditor}
                className="control-button hover:bg-red-600"
              >
                ✕
              </button>
            </div>
            
            {/* Tool Palette */}
            <div className="tool-palette mb-4">
              <h3 className="text-sm font-semibold text-surface-300 mb-2">Tools</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'select', icon: '🎯', title: 'Select' },
                  { id: 'translate', icon: '🔄', title: 'Move' },
                  { id: 'rotate', icon: '🔃', title: 'Rotate' },
                  { id: 'scale', icon: '📏', title: 'Scale' }
                ].map(tool => (
<button
                    key={tool.id}
                    onClick={() => setSceneEditorTool(tool.id)}
                    className={`tool-button ${sceneEditorTool === tool.id ? 'active' : ''}`}
                    title={tool.title}
                  >
                    <span className="text-lg">{tool.icon}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Object Creation */}
            <div className="tool-palette mb-4">
              <h3 className="text-sm font-semibold text-surface-300 mb-2">Create Objects</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: 'cube', icon: '📦', name: 'Cube' },
                  { type: 'sphere', icon: '⚽', name: 'Sphere' },
                  { type: 'cylinder', icon: '🥫', name: 'Cylinder' },
                  { type: 'tree', icon: '🌳', name: 'Tree' },
                  { type: 'house', icon: '🏠', name: 'House' },
                  { type: 'tower', icon: '🗼', name: 'Tower' }
                ].map(obj => (
                  <button
                    key={obj.type}
                    onClick={() => createObject(obj.type)}
                    className="tool-button flex flex-col items-center justify-center text-xs"
                    title={`Create ${obj.name}`}
                  >
                    <span className="text-lg mb-1">{obj.icon}</span>
                    <span className="text-xs text-surface-300">{obj.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Scene Actions */}
            <div className="tool-palette mb-4">
              <h3 className="text-sm font-semibold text-surface-300 mb-2">Scene</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={saveScene}
                  className="control-button text-xs flex items-center gap-1"
                >
                  <Save size={14} />
                  Save
                </button>
                <button
                  onClick={() => document.getElementById('load-scene-input')?.click()}
                  className="control-button text-xs flex items-center gap-1"
                >
                  <Upload size={14} />
                  Load
                </button>
                <button
                  onClick={undo}
                  disabled={undoStack.length === 0}
                  className="control-button text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  Undo
                </button>
                <button
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  className="control-button text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <RotateCw size={14} />
                  Redo
                </button>
              </div>
            </div>
            
            {/* Object Hierarchy */}
            {showObjectHierarchy && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-surface-300">Objects ({sceneObjects.length})</h3>
                  <button
                    onClick={() => setShowObjectHierarchy(false)}
                    className="text-surface-400 hover:text-surface-200"
                  >
                    ✕
                  </button>
                </div>
                <div className="object-hierarchy">
                  {sceneObjects.length === 0 ? (
                    <div className="text-xs text-surface-500 italic p-2">No objects in scene</div>
                  ) : (
                    sceneObjects.map(obj => (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedObject(obj.mesh)}
                        className={`hierarchy-item ${selectedObject === obj.mesh ? 'selected' : ''}`}
                      >
                        <span className="text-lg">{obj.type === 'cube' ? '📦' : obj.type === 'sphere' ? '⚽' : obj.type === 'tree' ? '🌳' : '🏠'}</span>
                        <span className="text-sm flex-1">{obj.properties.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedObject(obj.mesh)
                            deleteSelectedObject()
                          }}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* Property Panel */}
            {selectedObject && showPropertyPanel && (
              <div className="property-panel">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-surface-300">Properties</h3>
                  <button
                    onClick={() => setShowPropertyPanel(false)}
                    className="text-surface-400 hover:text-surface-200"
                  >
                    ✕
                  </button>
                </div>
                
                {(() => {
                  const objData = sceneObjects.find(obj => obj.mesh === selectedObject)
                  if (!objData) return null
                  
                  return (
                    <div className="space-y-3">
                      <div className="property-row">
                        <span className="property-label">Name:</span>
                        <input
                          type="text"
                          value={objData.properties.name}
                          onChange={(e) => updateObjectProperties(objData.id, {
                            properties: { ...objData.properties, name: e.target.value }
                          })}
                          className="property-input"
                        />
                      </div>
                      
                      <div>
                        <span className="property-label block mb-2">Position:</span>
                        <div className="grid grid-cols-3 gap-2">
                          {['x', 'y', 'z'].map(axis => (
                            <div key={axis}>
                              <label className="text-xs text-surface-400">{axis.toUpperCase()}</label>
                              <input
                                type="number"
                                step="0.1"
                                value={objData.position[axis]}
                                onChange={(e) => updateObjectProperties(objData.id, {
                                  position: { ...objData.position, [axis]: parseFloat(e.target.value) || 0 }
                                })}
                                className="property-input"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="property-label block mb-2">Rotation:</span>
                        <div className="grid grid-cols-3 gap-2">
                          {['x', 'y', 'z'].map(axis => (
                            <div key={axis}>
                              <label className="text-xs text-surface-400">{axis.toUpperCase()}</label>
                              <input
                                type="number"
                                step="0.1"
                                value={objData.rotation[axis]}
                                onChange={(e) => updateObjectProperties(objData.id, {
                                  rotation: { ...objData.rotation, [axis]: parseFloat(e.target.value) || 0 }
                                })}
                                className="property-input"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="property-label block mb-2">Scale:</span>
                        <div className="grid grid-cols-3 gap-2">
                          {['x', 'y', 'z'].map(axis => (
                            <div key={axis}>
                              <label className="text-xs text-surface-400">{axis.toUpperCase()}</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={objData.scale[axis]}
                                onChange={(e) => updateObjectProperties(objData.id, {
                                  scale: { ...objData.scale, [axis]: parseFloat(e.target.value) || 0.1 }
                                })}
                                className="property-input"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
          
          {/* Hidden file input for scene loading */}
          <input
            id="load-scene-input"
            type="file"
            onChange={loadScene}
            accept=".json"
            style={{ display: 'none' }}
          />
        </motion.div>
      )}

{/* HUD - Top Bar - Responsive */}
      <div className={`absolute z-50 ${isMobile ? 'top-16 left-2 right-2 space-y-2' : 'top-4 left-4 right-4 flex justify-between items-start'}`}>
        {/* Game Title & Mode */}
        <div className={`responsive-hud-panel ${isMobile ? 'mobile-hud-compact' : ''}`}>
          <div className={`flex items-center gap-3 ${isMobile ? 'justify-center' : ''}`}>
            <Square size={isMobile ? 16 : 20} className="text-primary-400" />
            <h1 className={`font-bold font-heading text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>CraftVerse</h1>
            <span className={`px-2 py-1 bg-secondary-600 rounded text-white font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
              {player.gameMode.toUpperCase()}
            </span>
            {selectedObject && (
              <span className="px-2 py-1 bg-primary-600 text-xs rounded text-white font-medium animate-pulse">
                SELECTED
              </span>
            )}
          </div>
        </div>

        {/* Performance Monitor */}
        <div className={`responsive-hud-panel ${isMobile ? 'mobile-hud-compact' : ''}`}>
          <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <div className="flex items-center gap-2">
              <Monitor size={isMobile ? 12 : 16} className="text-green-400" />
              <span>FPS: {is3DMode ? render3DStats.fps : fps}</span>
            </div>
            <div className="flex items-center gap-2">
              <Square size={isMobile ? 12 : 16} className="text-blue-400" />
              <span>{is3DMode ? 'Triangles' : 'Chunks'}: {is3DMode ? render3DStats.triangles : performance.chunks}</span>
            </div>
            {is3DMode && (
              <div className="flex items-center gap-2">
                <Box size={isMobile ? 12 : 16} className="text-purple-400" />
                <span>Calls: {render3DStats.drawCalls}</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls - Responsive Layout */}
        <div className={`responsive-hud-panel ${isMobile ? 'mobile-hud-compact' : ''}`}>
<div className={`flex gap-2 ${isMobile ? 'flex-wrap justify-center' : ''}`}>
            <button
              onClick={() => setShowMiniMap(!showMiniMap)}
              className={`control-button hover:bg-primary-600 ${isMobile ? 'px-2 py-1' : ''}`}
              title="Toggle Mini-Map"
            >
              <Map size={isMobile ? 12 : 16} />
              {!isMobile && " Map"}
            </button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`control-button flex items-center gap-2 ${isMobile ? 'px-2 py-1' : ''}`}
            >
              {isPlaying ? <Pause size={isMobile ? 12 : 16} /> : <Play size={isMobile ? 12 : 16} />}
              {!isMobile && (isPlaying ? 'Pause' : 'Play')}
            </button>
            
            <button
              onClick={resetWorld}
              className={`control-button flex items-center gap-2 ${isMobile ? 'px-2 py-1' : ''}`}
            >
              <RotateCcw size={isMobile ? 12 : 16} />
              {!isMobile && "Reset"}
            </button>
          
            <button
              onClick={saveWorld}
              className={`control-button flex items-center gap-2 ${isMobile ? 'px-2 py-1' : ''}`}
            >
              <Save size={isMobile ? 12 : 16} />
              {!isMobile && "Save"}
            </button>
          
            <button
              onClick={() => loadWorldRef.current?.click()}
              className={`control-button flex items-center gap-2 ${isMobile ? 'px-2 py-1' : ''}`}
            >
              <Upload size={isMobile ? 12 : 16} />
              {!isMobile && "Load"}
            </button>
          
            {/* 3D Object Selection Controls */}
            {is3DMode && (
              <>
                <button
                  onClick={() => setShow3DControls(!show3DControls)}
                  className={`control-button flex items-center gap-2 ${isMobile ? 'px-2 py-1' : ''}`}
                  title="Toggle 3D Controls"
                >
                  <Rotate3D size={isMobile ? 12 : 16} />
                  {!isMobile && "3D Stats"}
                </button>
                
                {selectedObject && (
                  <button
                    onClick={clearSelection}
                    className={`control-button flex items-center gap-2 bg-red-600 hover:bg-red-700 ${isMobile ? 'px-2 py-1' : ''}`}
                    title="Clear Selection"
                  >
                    <Eye size={isMobile ? 12 : 16} />
                    {!isMobile && "Clear"}
                  </button>
                )}
              </>
            )}
          
            <button
              onClick={() => setShowTextureDesigner(!showTextureDesigner)}
              className={`control-button flex items-center gap-2 ${isMobile ? 'px-2 py-1' : ''}`}
            >
              <Palette size={isMobile ? 12 : 16} />
              {!isMobile && "Textures"}
            </button>
          
            <button
              onClick={() => setShowGraphicsSettings(!showGraphicsSettings)}
              className={`control-button flex items-center gap-2 ${isMobile ? 'px-2 py-1' : ''}`}
            >
              <Settings size={isMobile ? 12 : 16} />
              {!isMobile && "Graphics"}
            </button>
          </div>
        </div>
{/* Statistics - Responsive */}
        <div className={`responsive-hud-panel ${isMobile ? 'mobile-hud-compact' : ''}`}>
          <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <div className="flex items-center gap-2">
              <Square size={isMobile ? 12 : 16} className="text-green-400" />
              <span>Placed: {statistics.totalBlocksPlaced}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trash2 size={isMobile ? 12 : 16} className="text-red-400" />
              <span>Mined: {statistics.totalBlocksMined}</span>
            </div>
            <div className="flex items-center gap-2">
              <Palette size={isMobile ? 12 : 16} className="text-purple-400" />
              <span>Types: {statistics.uniqueBlockTypes.size}</span>
            </div>
            {selectedObject && (
              <div className="flex items-center gap-2 text-primary-400">
                <Box size={isMobile ? 12 : 16} />
                <span>Selected: {selectedObject.userData.type || 'Object'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hidden file input for loading worlds */}
      <input
        type="file"
        ref={loadWorldRef}
        onChange={loadWorld}
        accept=".json"
        style={{ display: 'none' }}
      />
      
      {/* Mini-Map Overlay */}
{/* Mini-Map Overlay - Only show in 2D mode */}
      <AnimatePresence>
        {showMiniMap && !is3DMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 50 }}
            transition={{ duration: 0.3 }}
            className="absolute top-80 right-4 z-50"
          >
            <div className="hud-panel p-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-surface-300 flex items-center gap-1">
                  <Map size={14} />
                  Mini-Map (2D)
                </h3>
                <button
                  onClick={() => setShowMiniMap(false)}
                  className="text-surface-400 hover:text-surface-200 transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="relative">
                {/* Map Grid */}
                <div 
                  className="grid grid-cols-20 gap-0 border-2 border-surface-600 rounded"
                  style={{ width: '160px', height: '160px' }}
                >
                  {renderMiniMap()}
                </div>
                
                {/* Viewport indicator */}
                <div 
                  className="absolute border-2 border-white rounded pointer-events-none"
                  style={{
                    width: '40px',
                    height: '40px',
                    left: '60px',
                    top: '60px',
                    opacity: 0.5
                  }}
                />
                
                {/* Compass */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-surface-800 rounded-full border border-surface-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-400">N</span>
                </div>
              </div>
              
              {/* Map Legend */}
              <div className="mt-2 text-xs text-surface-400">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>You</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Graphics Settings Modal */}
      <AnimatePresence>
        {showGraphicsSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-4 bg-surface-900 rounded-xl border border-surface-700 z-50 overflow-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Settings size={24} className="text-primary-400" />
                  Graphics Settings
                </h2>
                <button
                  onClick={() => setShowGraphicsSettings(false)}
                  className="control-button hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Render Mode */}
                <div className="bg-surface-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-white">Render Mode</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setIs3DMode(false)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        !is3DMode 
                          ? 'border-primary-500 bg-primary-900 text-white' 
                          : 'border-surface-600 bg-surface-700 text-surface-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Square size={20} />
                        <div>
                          <div className="font-medium">2D Isometric</div>
                          <div className="text-sm opacity-75">Classic block-building view</div>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setIs3DMode(true)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        is3DMode 
                          ? 'border-primary-500 bg-primary-900 text-white' 
                          : 'border-surface-600 bg-surface-700 text-surface-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Box size={20} />
                        <div>
                          <div className="font-medium">3D Perspective</div>
                          <div className="text-sm opacity-75">Full 3D rendering with camera controls</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* Quality Settings */}
                <div className="bg-surface-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-white">Quality Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-2">
                        Lighting Quality
                      </label>
                      <select
                        value={graphicsSettings.lightingQuality}
                        onChange={(e) => setGraphicsSettings(prev => ({ ...prev, lightingQuality: e.target.value }))}
                        className="w-full px-3 py-2 bg-surface-700 border border-surface-600 rounded text-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="ultra">Ultra</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-2">
                        Anti-Aliasing
                      </label>
                      <select
                        value={graphicsSettings.antiAliasing}
                        onChange={(e) => setGraphicsSettings(prev => ({ ...prev, antiAliasing: e.target.value }))}
                        className="w-full px-3 py-2 bg-surface-700 border border-surface-600 rounded text-white"
                      >
                        <option value="none">None</option>
                        <option value="fxaa">FXAA</option>
                        <option value="msaa">MSAA</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-surface-300">
                        Shadows
                      </label>
                      <button
                        onClick={() => setGraphicsSettings(prev => ({ ...prev, shadows: !prev.shadows }))}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          graphicsSettings.shadows ? 'bg-primary-600' : 'bg-surface-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          graphicsSettings.shadows ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-surface-300">
                        V-Sync
                      </label>
                      <button
                        onClick={() => setGraphicsSettings(prev => ({ ...prev, vSync: !prev.vSync }))}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          graphicsSettings.vSync ? 'bg-primary-600' : 'bg-surface-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          graphicsSettings.vSync ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Apply Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    applyGraphicsSettings(graphicsSettings)
                    toast.success('Graphics settings applied!')
                  }}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Texture Designer Modal */}
      <AnimatePresence>
        {showTextureDesigner && renderTextureDesigner()}
      </AnimatePresence>
      
      {/* Texture Library Panel */}
      <AnimatePresence>
        {showTextureLibrary && renderTextureLibrary()}
      </AnimatePresence>
      
{/* Inventory Bar - Bottom - Responsive */}
      <div className={`absolute z-50 ${isMobile ? 'bottom-2 left-2 right-2' : 'bottom-4 left-1/2 transform -translate-x-1/2'}`}>
        <div className={`responsive-hud-panel ${isMobile ? 'mobile-hud-compact' : ''}`}>
          <div className="flex gap-2 mb-3">
            {Object.entries(BLOCK_TYPES).map(([type, block]) => (
              <motion.div
                key={type}
                className={`inventory-slot ${player.selectedSlot === type ? 'active' : ''}`}
onClick={() => setPlayer(prev => ({ ...prev, selectedSlot: type }))}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div 
                  className="block-preview"
                  style={{ 
                    backgroundColor: block.texture ? 'transparent' : block.color,
                    background: block.texture ? block.texture.pattern : block.color
                  }}
                >
                  {type.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {player.inventory[type] || 0}
                </div>
              </motion.div>
            ))}
          </div>
{/* Current tool info */}
          <div className="text-center text-sm text-surface-300">
            <div className="flex items-center justify-center gap-2">
              <span>{isBuilding ? 'Building' : 'Mining'} Mode</span>
              <span className="text-surface-500">|</span>
              <Palette size={16} />
              <span>{textureMode ? 'Texture' : 'Color'} Mode</span>
              <span className="text-surface-500">|</span>
              <span>{BLOCK_TYPES[player.selectedSlot]?.name}</span>
            </div>
          </div>
</div>
      </div>
      
{/* Camera Controls - Right Side (2D Mode Only) - Responsive */}
      {!is3DMode && !isMobile && (
        <div className="absolute right-4 bottom-32 z-40">
          <div className="responsive-hud-panel space-y-2">
            <div className="text-xs text-surface-300 text-center mb-2 font-semibold">2D Camera</div>
            <button
              onClick={() => setCamera(prev => ({ ...prev, y: prev.y - 30 }))}
              className="control-button w-12 h-8 text-lg"
              title="Move Up (W)"
            >
              ↑
            </button>
            <div className="flex gap-1">
              <button
                onClick={() => setCamera(prev => ({ ...prev, x: prev.x - 30 }))}
                className="control-button w-8 h-8"
                title="Move Left (A)"
              >
                ←
              </button>
              <button
                onClick={() => setCamera({ x: 0, y: 0, zoom: 1, rotation: 0 })}
                className="control-button w-8 h-8 text-xs"
                title="Reset (R)"
              >
                🏠
              </button>
              <button
                onClick={() => setCamera(prev => ({ ...prev, x: prev.x + 30 }))}
                className="control-button w-8 h-8"
                title="Move Right (D)"
              >
                →
              </button>
            </div>
            <button
              onClick={() => setCamera(prev => ({ ...prev, y: prev.y + 30 }))}
              className="control-button w-12 h-8 text-lg"
              title="Move Down (S)"
            >
              ↓
            </button>
            <div className="flex gap-1 mt-2">
              <button
                onClick={() => setCamera(prev => ({ ...prev, zoom: Math.max(0.5, prev.zoom - 0.1) }))}
                className="control-button w-8 h-6 text-xs"
                title="Zoom Out (Q)"
              >
                -
              </button>
              <button
                onClick={() => setCamera(prev => ({ ...prev, zoom: Math.min(2, prev.zoom + 0.1) }))}
                className="control-button w-8 h-6 text-xs"
                title="Zoom In (E)"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
      
{/* 3D Camera Instructions - Responsive */}
      {is3DMode && !isMobile && (
        <div className="absolute right-4 bottom-32 z-40">
          <div className="responsive-hud-panel space-y-2 max-w-xs">
            <div className="text-xs text-surface-300 text-center mb-2 font-semibold">3D Controls</div>
            <div className="text-xs text-surface-400 space-y-1">
              <div>• Drag: Orbit camera</div>
              <div>• Scroll: Zoom</div>
              <div>• Right-click + Drag: Pan</div>
              <div>• WASD: Move target</div>
              <div>• Q/E: Move up/down</div>
              <div>• R: Reset camera</div>
            </div>
          </div>
        </div>
      )}
      
{/* Instructions - Bottom Left - Responsive */}
      {!isMobile && (
        <div className="absolute bottom-4 left-4 z-40">
          <div className="responsive-hud-panel text-xs space-y-1 max-w-xs">
            <div className="text-surface-300 font-semibold mb-2 flex items-center gap-2">
            {is3DMode ? <Box size={14} /> : <Square size={14} />}
            {is3DMode ? '3D' : '2D'} Controls:
          </div>
          {!is3DMode ? (
            <>
              <div className="text-surface-400">• Left Click: Place block</div>
              <div className="text-surface-400">• Right Click: Mine block</div>
              <div className="text-surface-400">• Mouse Wheel: Zoom in/out</div>
              <div className="text-surface-400">• Mouse Drag: Pan camera</div>
              <div className="text-surface-400">• WASD: Move camera</div>
              <div className="text-surface-400">• Q/E: Zoom out/in</div>
              <div className="text-surface-400">• R: Reset camera</div>
            </>
          ) : (
            <>
              <div className="text-surface-400">• Left Drag: Orbit camera</div>
              <div className="text-surface-400">• Right/Middle Drag: Pan</div>
              <div className="text-surface-400">• Mouse Wheel: Zoom</div>
              <div className="text-surface-400">• WASD: Move target</div>
              <div className="text-surface-400">• Q/E: Up/Down movement</div>
<div className="text-surface-400">• R: Reset camera</div>
              <div className="text-purple-400 mt-2">• Click mode toggle for controls</div>
            </>
          )}
          </div>
        </div>
      )}
      {/* Mobile-specific UI for 3D object selection */}
      {isMobile && is3DMode && (
        <div className="mobile-3d-ui">
          <div className="responsive-hud-panel mobile-hud-compact">
            <div className="text-center space-y-1">
              <div className="text-surface-300 font-semibold text-xs flex items-center justify-center gap-2">
                <Box size={12} />
                3D Touch Controls
              </div>
              <div className="text-surface-400 text-xs space-y-1">
                <div>• Touch & drag: Orbit camera</div>
                <div>• Pinch: Zoom in/out</div>
                <div>• Tap object: Select</div>
                {selectedObject && (
                  <div className="text-primary-400 mt-2">
                    Selected: {selectedObject.userData.type || 'Object'}
                  </div>
                )}
</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MainFeature