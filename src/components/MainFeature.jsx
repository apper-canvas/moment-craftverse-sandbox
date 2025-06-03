import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import ApperIcon from './ApperIcon'

const BLOCK_TYPES = {
  grass: { name: 'Grass', color: '#4ADE80', icon: 'Square' },
  dirt: { name: 'Dirt', color: '#92400E', icon: 'Square' },
  stone: { name: 'Stone', color: '#6B7280', icon: 'Square' },
  wood: { name: 'Wood', color: '#A16207', icon: 'Square' },
  water: { name: 'Water', color: '#3B82F6', icon: 'Waves' },
  sand: { name: 'Sand', color: '#FCD34D', icon: 'Square' }
}

const WORLD_SIZE = { width: 20, height: 15, depth: 20 }

const MainFeature = ({ darkMode, setDarkMode }) => {
  // Game State
  const [world, setWorld] = useState(() => {
    const initialWorld = {}
    // Generate initial terrain
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
const [camera, setCamera] = useState({ x: 0, y: -20, zoom: 1 })
  const [isBuilding, setIsBuilding] = useState(true)
  const [hoveredBlock, setHoveredBlock] = useState(null)
  const [performance, setPerformance] = useState({ fps: 60, chunks: 1 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [statistics, setStatistics] = useState({
    totalBlocksPlaced: 0,
    totalBlocksMined: 0,
    uniqueBlockTypes: new Set()
  })
  // Refs
  const gameRef = useRef(null)
  const animationRef = useRef(null)
  const lastFrameTime = useRef(0)
  
// Performance monitoring
  useEffect(() => {
    const updateFPS = () => {
      const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
      const fps = Math.round(1000 / (now - lastFrameTime.current))
      lastFrameTime.current = now
      setPerformance(prev => ({ ...prev, fps: fps > 0 ? fps : 60 }))
    }
    
    const interval = setInterval(updateFPS, 1000)
    return () => clearInterval(interval)
  }, [])
  
  // Block placement/destruction
  const handleBlockInteraction = useCallback((x, y, z, isRightClick = false) => {
    const blockKey = `${x},${y},${z}`
    
    if (isRightClick || !isBuilding) {
      // Destroy block
      if (world[blockKey]) {
        setWorld(prev => {
          const newWorld = { ...prev }
          const blockType = newWorld[blockKey]
          delete newWorld[blockKey]
// Add to inventory
          setPlayer(prevPlayer => ({
            ...prevPlayer,
            inventory: {
              ...prevPlayer.inventory,
              [blockType]: (prevPlayer.inventory[blockType] || 0) + 1
            }
          }))
          
          // Update statistics
          setStatistics(prev => ({
            ...prev,
            totalBlocksMined: prev.totalBlocksMined + 1,
            uniqueBlockTypes: new Set([...prev.uniqueBlockTypes, blockType])
          }))
          
          toast.success(`Mined ${BLOCK_TYPES[blockType]?.name || blockType}!`)
          return newWorld
        })
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
  }, [world, player.selectedSlot, player.inventory, isBuilding])
  
  // Render 3D world in isometric view
  const renderWorld = () => {
    const blocks = []
    const sortedKeys = Object.keys(world).sort((a, b) => {
      const [ax, ay, az] = a.split(',').map(Number)
      const [bx, by, bz] = b.split(',').map(Number)
      return (bx + by + bz) - (ax + ay + az) // Back to front sorting
    })
    
    sortedKeys.forEach(key => {
      const [x, y, z] = key.split(',').map(Number)
      const blockType = world[key]
      const block = BLOCK_TYPES[blockType]
      
      if (!block) return
      
      // Isometric projection
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
            className={`w-8 h-8 rounded border-2 flex items-center justify-center text-white font-bold text-xs transition-all duration-200 ${
              isHovered ? 'border-white shadow-lg scale-110' : 'border-gray-600'
            }`}
            style={{ 
              backgroundColor: block.color,
              boxShadow: isHovered ? '0 0 15px rgba(255,255,255,0.5)' : `inset 0 0 0 1px rgba(255,255,255,0.2)`
            }}
          >
            <ApperIcon name={block.icon} size={12} />
          </div>
          
          {/* Block highlight effect */}
          {isHovered && (
            <div className="absolute inset-0 rounded border-2 border-white animate-pulse opacity-50" />
          )}
        </motion.div>
      )
    })
    
    return blocks
  }
  
  // Start game
  const startGame = () => {
    setIsPlaying(true)
    toast.success('Welcome to CraftVerse! Start building your world!')
  }
  
  // Reset world
  const resetWorld = () => {
    setWorld({})
    setPlayer(prev => ({
      ...prev,
      inventory: {
        grass: 50,
        dirt: 30,
        stone: 25,
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ApperIcon name="Play" size={24} />
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
            <ApperIcon name="Blocks" size={20} className="text-primary-400" />
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
              <ApperIcon name="Gauge" size={16} className="text-green-400" />
              <span>FPS: {performance.fps}</span>
            </div>
            <div className="flex items-center gap-2">
              <ApperIcon name="Grid3x3" size={16} className="text-blue-400" />
              <span>Chunks: {performance.chunks}</span>
            </div>
          </div>
        </div>
        
{/* Controls */}
        <div className="hud-panel">
          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = '/statistics'}
              className="control-button hover:bg-primary-600"
              title="View Statistics"
            >
              <ApperIcon name="BarChart3" size={16} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="control-button"
            >
              <ApperIcon name={darkMode ? "Sun" : "Moon"} size={16} />
            </button>
            <button
              onClick={() => setIsBuilding(!isBuilding)}
              className={`control-button ${isBuilding ? 'bg-secondary-600' : 'bg-red-600'}`}
            >
              <ApperIcon name={isBuilding ? "Plus" : "Minus"} size={16} />
            </button>
            <button
              onClick={resetWorld}
              className="control-button hover:bg-red-600"
            >
              <ApperIcon name="RotateCcw" size={16} />
            </button>
          </div>
        </div>
        
        {/* Live Statistics */}
        <div className="hud-panel">
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <ApperIcon name="Blocks" size={16} className="text-yellow-400" />
              <span>Placed: {statistics.totalBlocksPlaced}</span>
            </div>
            <div className="flex items-center gap-2">
              <ApperIcon name="Pickaxe" size={16} className="text-orange-400" />
              <span>Mined: {statistics.totalBlocksMined}</span>
            </div>
            <div className="flex items-center gap-2">
              <ApperIcon name="Palette" size={16} className="text-purple-400" />
              <span>Types: {statistics.uniqueBlockTypes.size}</span>
            </div>
          </div>
        </div>
      </div>
      
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
                  style={{ backgroundColor: block.color }}
                >
                  <ApperIcon name={block.icon} size={12} className="text-white" />
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
              <ApperIcon name={isBuilding ? "Plus" : "Minus"} size={16} />
              <span>{isBuilding ? 'Building' : 'Mining'} Mode</span>
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
            <ApperIcon name="ChevronUp" size={16} />
          </button>
          <button
            onClick={() => setCamera(prev => ({ ...prev, x: prev.x - 20 }))}
            className="control-button w-full"
          >
            <ApperIcon name="ChevronLeft" size={16} />
          </button>
          <button
            onClick={() => setCamera(prev => ({ ...prev, x: 0, y: -20, zoom: 1 }))}
            className="control-button w-full text-xs"
          >
            <ApperIcon name="Home" size={16} />
          </button>
          <button
            onClick={() => setCamera(prev => ({ ...prev, x: prev.x + 20 }))}
            className="control-button w-full"
          >
            <ApperIcon name="ChevronRight" size={16} />
          </button>
          <button
            onClick={() => setCamera(prev => ({ ...prev, y: prev.y + 20 }))}
            className="control-button w-full"
          >
            <ApperIcon name="ChevronDown" size={16} />
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