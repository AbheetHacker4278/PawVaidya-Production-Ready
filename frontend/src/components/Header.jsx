import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import assets from '../assets/assets_frontend/assets';
import docimage from '../assets/New/Doctorfront.png';

const Header = () => {
    const navigate = useNavigate();

    return (
        <div className='flex flex-col md:flex-row flex-wrap bg-primary rounded-lg px-6 md:px-10 lg:px-20'>
            {/* Left Side of Page */}
            <div className='md:w-1/2 flex flex-col items-start justify-center gap-4 py-10 m-auto md:py-[10vw] md:mb-[-30px]'>
                <p className='text-3xl md:text-4xl lg:text-5xl text-[#1B3726] font-semibold leading-tight md:leading-tight lg:leading-tight'>
                    Book Appointment <br /> With Trusted Doctors
                </p>
                <div className='flex flex-col md:flex-row items-center gap-3 text-[#1B3726] text-sm font-light'>
                    <img className='w-28' src={assets.group_profiles} alt="" />
                    <p>Simply browse through our extensive list of trusted doctors,<br className='hidden sm:block' />
                        from <strong className='text-zinc-500 font-semibold'>Gujarat, New Delhi, Haryana, Mumbai</strong> <br />
                        schedule your appointment hassle-free.</p>
                </div>
                <button
                    onClick={() => navigate('/Doctors')}
                    className='flex items-center gap-2 bg-[#1B3726] px-8 py-3 rounded-full text-white text-sm m-auto md:m-0 hover:scale-105 transition-all duration-300 '
                >
                    Book Appointment <img className='w-3' src={assets.arrow_icon} alt="" />
                </button>
            </div>
            {/* Right Side of Page */}
            <div className='md:w-1/2 relative'>
                <motion.img
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    whileHover={{ scale: 1.05 }}
                    className='w-full md:absolute bottom-0 h-auto rounded-lg'
                    src={docimage}
                    alt="Doctor"
                />
            </div>
        </div>
    );
};

export default Header;
