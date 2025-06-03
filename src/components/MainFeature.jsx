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
  Eye as ViewIcon
} from 'lucide-react'

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
  const loadWorldRef = useRef(null)
  
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
      vSync: true
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

  // Player position for mini-map
  const [playerPosition, setPlayerPosition] = useState({ x: 10, y: 10 })
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
    <div className="w-full h-screen relative bg-gradient-to-b from-sky-300 to-green-300 overflow-hidden game-ui">
      {/* Game Canvas */}
      <div 
        ref={gameRef}
        className="game-canvas relative"
        onWheel={(e) => {
          const newZoom = Math.max(0.5, Math.min(2, camera.zoom + (e.deltaY > 0 ? -0.1 : 0.1)))
          setCamera(prev => ({ ...prev, zoom: newZoom }))
        }}
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
      
      {/* HUD - Top Bar */}
<div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50">
        {/* Game Title & Mode */}
        <div className="hud-panel">
          <div className="flex items-center gap-3">
            <Square size={20} className="text-primary-400" />
            <h1 className="text-xl font-bold font-heading text-white">CraftVerse</h1>
            <span className="px-2 py-1 bg-secondary-600 text-xs rounded text-white font-medium">
              {player.gameMode.toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Performance Monitor */}
<div className="hud-panel">
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Monitor size={16} className="text-green-400" />
              <span>FPS: {fps}</span>
            </div>
            <div className="flex items-center gap-2">
              <Square size={16} className="text-blue-400" />
              <span>Chunks: {performance.chunks}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="hud-panel">
          <div className="flex gap-2">
            <button
              onClick={() => setShowMiniMap(!showMiniMap)}
              className="control-button hover:bg-primary-600"
              title="Toggle Mini-Map"
            >
              <Map size={16} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="control-button flex items-center gap-2"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={resetWorld}
            className="control-button flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          
          <button
            onClick={saveWorld}
            className="control-button flex items-center gap-2"
          >
            <Save size={16} />
            Save
          </button>
          
          <button
            onClick={() => loadWorldRef.current?.click()}
            className="control-button flex items-center gap-2"
          >
            <Upload size={16} />
            Load
          </button>
          
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            className="control-button flex items-center gap-2"
          >
            <Map size={16} />
            {showMiniMap ? 'Hide Map' : 'Show Map'}
          </button>
          
          <button
            onClick={() => setShowTextureDesigner(!showTextureDesigner)}
            className="control-button flex items-center gap-2"
          >
            <Palette size={16} />
            Textures
          </button>
          
          <button
            onClick={() => setShowGraphicsSettings(!showGraphicsSettings)}
            className="control-button flex items-center gap-2"
          >
<Settings size={16} />
            Graphics
          </button>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="hud-panel">
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Square size={16} className="text-green-400" />
              <span>Placed: {statistics.totalBlocksPlaced}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trash2 size={16} className="text-red-400" />
              <span>Mined: {statistics.totalBlocksMined}</span>
            </div>
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-purple-400" />
              <span>Types: {statistics.uniqueBlockTypes.size}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mini-Map Overlay */}
      <AnimatePresence>
        {showMiniMap && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 50 }}
            transition={{ duration: 0.3 }}
className="absolute top-24 right-4 z-50"
          >
            <div className="hud-panel p-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-surface-300 flex items-center gap-1">
                  <Map size={14} />
                  Mini-Map
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
      {/* Texture Designer Modal */}
      <AnimatePresence>
        {showTextureDesigner && renderTextureDesigner()}
      </AnimatePresence>
      
      {/* Texture Library Panel */}
      <AnimatePresence>
        {showTextureLibrary && renderTextureLibrary()}
      </AnimatePresence>
      
      {/* Inventory Bar - Bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="hud-panel">
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
      
      {/* Camera Controls - Right Side */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50">
        <div className="hud-panel space-y-2">
          <button
            onClick={() => setCamera(prev => ({ ...prev, y: prev.y - 20 }))}
            className="control-button w-full"
          >
            ↑
          </button>
<button
            onClick={() => setCamera(prev => ({ ...prev, x: prev.x - 20 }))}
            className="control-button w-full"
          >
            ←
          </button>
          <button
            onClick={() => setCamera(prev => ({ ...prev, x: 0, y: -20, zoom: 1 }))}
            className="control-button w-full text-xs"
          >
            🏠
          </button>
          <button
            onClick={() => setCamera(prev => ({ ...prev, x: prev.x + 20 }))}
            className="control-button w-full"
          >
            →
          </button>
          <button
            onClick={() => setCamera(prev => ({ ...prev, y: prev.y + 20 }))}
            className="control-button w-full"
          >
            ↓
          </button>
        </div>
      </div>
      
      {/* Instructions - Bottom Left */}
      <div className="absolute bottom-4 left-4 z-50">
        <div className="hud-panel text-xs space-y-1 max-w-xs">
          <div className="text-surface-300 font-semibold mb-2">Controls:</div>
          <div className="text-surface-400">• Left Click: Place block</div>
          <div className="text-surface-400">• Right Click: Mine block</div>
          <div className="text-surface-400">• Mouse Wheel: Zoom</div>
          <div className="text-surface-400">• Arrow Panel: Move camera</div>
</div>
      </div>
    </div>
  )
}

export default MainFeature