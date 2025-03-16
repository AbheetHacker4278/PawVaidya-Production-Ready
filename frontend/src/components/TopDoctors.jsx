import { useContext } from 'react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const TopDoctors = () => {
  const navigate = useNavigate()
  const { doctors } = useContext(AppContext)


  return (
    <div className='flex flex-col gap-4 my-16 text-gray-900 md:mx-10 '>
    <h1 className='text-3xl font-medium text-center'>This Our Top Doctors from India</h1>
    {/* <p className='sm:w-1/3 text-center text-sm'>Simply browse through our extensive list of trusted doctors.</p> */}
  
    {/* Centered Grid Container */}
    <div className='w-full flex justify-center '>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pt-7 px-3 sm:px-0'>
        {doctors.slice(0, 10).map((item, index) => (
          <div 
            onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} 
            className='bg-white border border-[#5A4035] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500 w-[270px] h-[400px] flex flex-col justify-between'
            key={index}
          >
            <img className='bg-green-50 w-full h-[180px] object-cover' src={item.image} />
            <div className='p-4 flex flex-col justify-between flex-grow'>
              <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : "text-gray-500"}`}>
                <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></p>
                <p>{item.available ? 'Available' : "Not Available"}</p>
              </div>
              <p className='text-gray-900 text-lg font-medium'>{item.name}</p>
              <div className='flex flex-row text-lg font-sm gap-3'>
                <p className='text-green-700 border-2 rounded-sm border-green-700 px-2 py-1 text-sm'>{item.address.Location}</p>
                <p className='text-green-700 border-2 rounded-sm border-green-700 px-2 py-1 text-sm'>{item.address.line}</p>
              </div>
              <p className='text-gray-600 text-sm'>{item.speciality}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className='flex justify-center  w-full border mt-7  '>
      <button onClick={() => { navigate('/doctors'); scrollTo(0, 0) }} className='bg-[#5A4035] text-white hover:bg-[#3e2c25] px-12 py-3 rounded-full mt-10 '>
      Explore</button>
    </div>
  </div>
  

  )
}

export default TopDoctors