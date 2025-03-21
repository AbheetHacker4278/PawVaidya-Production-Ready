import React from 'react';
import specialityimage from '../assets/New/Speciality_Doctors.png';
import { Link } from 'react-router-dom';

const SpecialityMenu = () => {
  return (
    <div id='speciality' className='flex flex-col items-center gap-6 py-16 text-gray-800 px-4'>
      <h1 className='text-2xl sm:text-3xl font-medium text-center'>
        Find By Speciality
      </h1>
      <p className='w-full sm:w-2/3 lg:w-1/3 text-center text-sm'>
        Simply browse through our extensive list of trusted doctors, schedule your appointment hassle-free.
      </p>
      <div className='flex justify-center sm:justify-center gap-4 pt-5 w-full overflow-x-auto no-scrollbar'>
        {/* Uncomment this if you have specialityData */}
        {/* {specialityData.map((item, index) => (
          <Link 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className='flex flex-col items-center text-xs cursor-pointer flex-shrink-0 hover:-translate-y-2 transition-all duration-200' 
            key={index} 
            to={`/doctors/${item.speciality}`}
          >
            <img className='w-16 sm:w-24 mb-2' src={item.image} alt={item.speciality} />
            <p>{item.speciality}</p>
          </Link>
        ))} */}
        <img src={specialityimage} alt="Speciality" className='w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl' />
      </div>
    </div>
  );
};

export default SpecialityMenu;
