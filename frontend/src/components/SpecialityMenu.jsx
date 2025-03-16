import React from 'react'
import specialityimage from '../assets/New/Speciality_Doctors.png'
import { Link } from 'react-router-dom'

const SpecialityMenu = () => {
  return (
    <div id='speciality' className='flex flex-col items-center gap-4 py-16 text-gray-800'>
        <h1 className='text-3xl font-medium'>
            Find By Speciality
        </h1>
        <p className='sm:w-1/3 text-center text-sm '>
        Simply browse through our extensive list of trusted doctors, schedule your appointment hassle-free.
        </p>
        <div className='flex sm:justify-center gap-4 pt-5 w-full overflow-scroll'>
            {/* {specialityData.map((item , index)=>(
                <Link onClick={()=>scrollTo(0 , 0)} className='flex flex-col items-center text-xs cursor-pointer flex-shrink-0 hover:translate-y-[-10px] transition-all duration-100' key={index} to={`/doctors/${item.speciality}`}>
                    <img className='w-16 sm:w-24 mb-2' src={item.image} />
                    <p>{item.speciality}</p>
                </Link>
            ))} */}
            <img src={specialityimage} alt="" className='w-3/4'/>
        </div>
    </div>
  )
}

export default SpecialityMenu