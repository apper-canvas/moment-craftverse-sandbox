import React from 'react'
import MainFeature from '../components/MainFeature'

const Home = ({ darkMode, setDarkMode }) => {
  return (
    <div className="w-full h-screen overflow-hidden">
      <MainFeature darkMode={darkMode} setDarkMode={setDarkMode} />
    </div>
  )
}

export default Home