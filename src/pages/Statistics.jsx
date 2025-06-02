import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import ApperIcon from '../components/ApperIcon'

const Statistics = ({ darkMode, setDarkMode }) => {
  const [stats, setStats] = useState({
    totalBlocksPlaced: 1247,
    totalBlocksMined: 892,
    uniqueBlockTypes: 6,
    totalPlayTime: 12750000, // milliseconds
    averageBuildTime: 0.68,
    worldComplexity: 85,
    efficiency: 92
  })

  const [timeRange, setTimeRange] = useState('today')
  const [selectedMetric, setSelectedMetric] = useState('blocks')

  // Mock data for charts
  const blockUsageData = [
    { name: 'Grass', value: 324, color: '#4ADE80' },
    { name: 'Stone', value: 289, color: '#6B7280' },
    { name: 'Wood', value: 198, color: '#A16207' },
    { name: 'Dirt', value: 156, color: '#92400E' },
    { name: 'Water', value: 134, color: '#3B82F6' },
    { name: 'Sand', value: 146, color: '#FCD34D' }
  ]

  const buildingActivityData = [
    { time: '00:00', placed: 12, mined: 8 },
    { time: '04:00', placed: 28, mined: 15 },
    { time: '08:00', placed: 45, mined: 32 },
    { time: '12:00', placed: 67, mined: 41 },
    { time: '16:00', placed: 89, mined: 58 },
    { time: '20:00', placed: 102, mined: 67 },
    { time: '24:00', placed: 124, mined: 89 }
  ]

  const efficiencyData = [
    { session: 1, efficiency: 78, duration: 45 },
    { session: 2, efficiency: 82, duration: 67 },
    { session: 3, efficiency: 85, duration: 89 },
    { session: 4, efficiency: 88, duration: 92 },
    { session: 5, efficiency: 92, duration: 124 }
  ]

  const formatPlayTime = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)
    return `${hours}h ${minutes}m ${seconds}s`
  }

  const calculateWorldStats = () => {
    const totalBlocks = stats.totalBlocksPlaced + stats.totalBlocksMined
    const buildingRatio = (stats.totalBlocksPlaced / totalBlocks * 100).toFixed(1)
    const miningRatio = (stats.totalBlocksMined / totalBlocks * 100).toFixed(1)
    
    return {
      totalBlocks,
      buildingRatio,
      miningRatio
    }
  }

  const worldStats = calculateWorldStats()

  const goBack = () => {
    window.history.back()
    toast.info('Returning to game...')
  }

  const exportStats = () => {
    const exportData = {
      ...stats,
      blockUsage: blockUsageData,
      buildingActivity: buildingActivityData,
      efficiency: efficiencyData,
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'craftverse-statistics.json'
    link.click()
    
    toast.success('Statistics exported successfully!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-primary-900 to-surface-900 text-white overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-surface-900/90 backdrop-blur-sm border-b border-surface-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goBack}
                className="p-2 bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors"
              >
                <ApperIcon name="ArrowLeft" size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold font-heading text-white">World Statistics</h1>
                <p className="text-surface-400">Track your building progress and performance</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
              
              <button
                onClick={exportStats}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <ApperIcon name="Download" size={16} />
                Export
              </button>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors"
              >
                <ApperIcon name={darkMode ? "Sun" : "Moon"} size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-800/50 backdrop-blur-sm border border-surface-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <ApperIcon name="Blocks" size={24} className="text-green-400" />
              </div>
              <span className="text-2xl font-bold text-green-400">+{stats.totalBlocksPlaced}</span>
            </div>
            <h3 className="text-white font-semibold">Total Blocks Placed</h3>
            <p className="text-surface-400 text-sm">Building activity</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-800/50 backdrop-blur-sm border border-surface-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <ApperIcon name="Pickaxe" size={24} className="text-orange-400" />
              </div>
              <span className="text-2xl font-bold text-orange-400">{stats.totalBlocksMined}</span>
            </div>
            <h3 className="text-white font-semibold">Total Blocks Mined</h3>
            <p className="text-surface-400 text-sm">Mining activity</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-800/50 backdrop-blur-sm border border-surface-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <ApperIcon name="Palette" size={24} className="text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-purple-400">{stats.uniqueBlockTypes}</span>
            </div>
            <h3 className="text-white font-semibold">Unique Block Types</h3>
            <p className="text-surface-400 text-sm">Variety used</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface-800/50 backdrop-blur-sm border border-surface-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <ApperIcon name="Clock" size={24} className="text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-blue-400">{stats.averageBuildTime}</span>
            </div>
            <h3 className="text-white font-semibold">Avg Build Rate</h3>
            <p className="text-surface-400 text-sm">blocks/minute</p>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Block Usage Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-surface-800/50 backdrop-blur-sm border border-surface-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <ApperIcon name="PieChart" size={20} />
              Block Usage Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={blockUsageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {blockUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Building Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-surface-800/50 backdrop-blur-sm border border-surface-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <ApperIcon name="TrendingUp" size={20} />
              Building Activity Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={buildingActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="placed"
                  stackId="1"
                  stroke="#4ADE80"
                  fill="#4ADE80"
                  fillOpacity={0.6}
                  name="Blocks Placed"
                />
                <Area
                  type="monotone"
                  dataKey="mined"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.6}
                  name="Blocks Mined"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Efficiency and Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Efficiency Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2 bg-surface-800/50 backdrop-blur-sm border border-surface-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <ApperIcon name="Target" size={20} />
              Building Efficiency Over Sessions
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="session" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  name="Efficiency %"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-surface-800/50 backdrop-blur-sm border border-surface-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Session Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-surface-400">Total Play Time</span>
                <span className="text-white font-semibold">{formatPlayTime(stats.totalPlayTime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-surface-400">Building Ratio</span>
                <span className="text-green-400 font-semibold">{worldStats.buildingRatio}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-surface-400">Mining Ratio</span>
                <span className="text-orange-400 font-semibold">{worldStats.miningRatio}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-surface-400">World Complexity</span>
                <span className="text-purple-400 font-semibold">{stats.worldComplexity}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-surface-400">Overall Efficiency</span>
                <span className="text-blue-400 font-semibold">{stats.efficiency}%</span>
              </div>
              
              <div className="mt-6 pt-4 border-t border-surface-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-400 mb-1">{worldStats.totalBlocks}</div>
                  <div className="text-surface-400 text-sm">Total Blocks Interacted</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Achievement Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 bg-surface-800/50 backdrop-blur-sm border border-surface-700 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <ApperIcon name="Award" size={20} />
            Achievement Milestones
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
              <ApperIcon name="Crown" size={32} className="text-yellow-400 mx-auto mb-2" />
              <div className="text-yellow-400 font-semibold">Master Builder</div>
              <div className="text-surface-400 text-sm">1000+ blocks placed</div>
            </div>
            <div className="text-center p-4 bg-orange-500/20 rounded-lg border border-orange-500/30">
              <ApperIcon name="Zap" size={32} className="text-orange-400 mx-auto mb-2" />
              <div className="text-orange-400 font-semibold">Speed Builder</div>
              <div className="text-surface-400 text-sm">High efficiency</div>
            </div>
            <div className="text-center p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <ApperIcon name="Sparkles" size={32} className="text-purple-400 mx-auto mb-2" />
              <div className="text-purple-400 font-semibold">Creative Mind</div>
              <div className="text-surface-400 text-sm">All block types used</div>
            </div>
            <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <ApperIcon name="Clock" size={32} className="text-blue-400 mx-auto mb-2" />
              <div className="text-blue-400 font-semibold">Dedicated</div>
              <div className="text-surface-400 text-sm">3+ hours played</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Statistics