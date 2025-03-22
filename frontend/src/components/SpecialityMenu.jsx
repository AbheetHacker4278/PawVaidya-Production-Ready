import React from 'react';
import { motion } from 'framer-motion';
import specialityimage from '../assets/New/Speciality_Doctors.png';
import { Link } from 'react-router-dom';

const SpecialityMenu = () => {
  return (
    <motion.div 
      id='speciality' 
      className='flex flex-col items-center gap-6 py-16 text-gray-800 px-4'
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <motion.h1 
        className='text-2xl sm:text-3xl font-medium text-center'
        initial={{ opacity: 0, scale: 0.8 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Find By Speciality
      </motion.h1>
      
      <motion.p 
        className='w-full sm:w-2/3 lg:w-1/3 text-center text-sm'
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        Simply browse through our extensive list of trusted doctors, schedule your appointment hassle-free.
      </motion.p>

      <motion.div 
        className='flex justify-center gap-4 pt-5 w-full overflow-x-auto no-scrollbar'
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4, duration: 0.7 }}
      >
        {/* Uncomment this if you have specialityData */}
        {/* {specialityData.map((item, index) => (
          <motion.div 
            whileHover={{ scale: 1.1, y: -5 }} 
            transition={{ duration: 0.3 }}
            key={index}
          >
            <Link 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className='flex flex-col items-center text-xs cursor-pointer flex-shrink-0'
              to={`/doctors/${item.speciality}`}
            >
              <img className='w-16 sm:w-24 mb-2' src={item.image} alt={item.speciality} />
              <p>{item.speciality}</p>
            </Link>
          </motion.div>
        ))} */}

        <motion.img 
          src={specialityimage} 
          alt="Speciality" 
          className='w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl'
          initial={{ y: 50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
        />
      </motion.div>
    </motion.div>
  );
};

export default SpecialityMenu;
