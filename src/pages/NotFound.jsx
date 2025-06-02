import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ApperIcon from '../components/ApperIcon'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-900 to-surface-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center p-8"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 mx-auto mb-8 bg-primary-600 rounded-xl flex items-center justify-center"
        >
          <ApperIcon name="Blocks" size={48} className="text-white" />
        </motion.div>
        
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold mb-4 text-surface-200">
          Chunk Not Found
        </h2>
        
        <p className="text-surface-400 mb-8 max-w-md mx-auto">
          Looks like you've wandered into ungenerated terrain. Let's get you back to the world.
        </p>
        
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg"
        >
          <ApperIcon name="Home" size={20} />
          Return to Game
        </Link>
      </motion.div>
    </div>
  )
}

export default NotFound