import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import AnimalHealthChatbot from '../components/AnimalHealthChatbot'

export const Home = () => {
  return (
    <div className="relative">
      <Header />
      <SpecialityMenu />
      <TopDoctors />
      <Banner />
      <AnimalHealthChatbot />
    </div>
  )
}

export default Home