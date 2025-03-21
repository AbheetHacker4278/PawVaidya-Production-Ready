import { useContext } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';

const TopDoctors = () => {
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);

  return (
    <div className='flex flex-col gap-6 my-16 text-gray-900 md:mx-10 px-4'>
      <h1 className='text-3xl font-semibold text-center animate-fade-in'>This is Our Top Doctors from India</h1>
      <div className='w-full flex justify-center'>
        <motion.div 
          initial={{ opacity: 0, y: 50 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-7 px-3 sm:px-0'
        >
          {doctors.slice(0, 10).map((item, index) => (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0); }} 
              className='bg-white shadow-lg rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 w-[280px] h-[420px] flex flex-col justify-between hover:shadow-2xl'
              key={index}
            >
              <img className='bg-green-50 w-full h-[200px] object-cover rounded-t-2xl' src={item.image} alt={item.name} />
              <div className='p-5 flex flex-col justify-between flex-grow'>
                <div className={`flex items-center gap-2 text-sm ${item.available ? 'text-green-500' : 'text-gray-500'}`}>
                  <p className={`w-3 h-3 rounded-full ${item.available ? 'bg-green-500' : 'bg-gray-500'}`}></p>
                  <p>{item.available ? 'Available' : 'Not Available'}</p>
                </div>
                <p className='text-gray-900 text-lg font-semibold'>{item.name}</p>
                <div className='flex flex-wrap gap-2 mt-2'>
                  <p className='text-green-700 border-2 rounded-md border-green-700 px-3 py-1 text-sm'>{item.address.Location}</p>
                  <p className='text-green-700 border-2 rounded-md border-green-700 px-3 py-1 text-sm'>{item.address.line}</p>
                </div>
                <p className='text-gray-600 text-sm mt-2'>{item.speciality}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
      <div className='flex justify-center w-full mt-10'>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { navigate('/doctors'); scrollTo(0, 0); }} 
          className='bg-[#5A4035] text-white hover:bg-[#3e2c25] px-14 py-4 rounded-full text-lg font-medium shadow-md hover:shadow-lg transition-all duration-300'
        >
          Explore
        </motion.button>
      </div>
    </div>
  );
};

export default TopDoctors;
