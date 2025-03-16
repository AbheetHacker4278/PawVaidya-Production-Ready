import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import footerLogo from '../assets/New/footerlogo.png'


const Footer = () => {
    const navigate = useNavigate();
  return (
    <div className=' bg-[#5A4035] rounded-2xl mb-5 '>
        <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
            {/* Left Div */}
            <div className='pl-3 pt-2'>
                <img className='mb-5 w-40 ' src={footerLogo} alt="" />
                <p className='w-full md:w-2/3 text-white leading-6'>Monitor your pet's food portions to avoid obesity. Ask your vet for a diet plan if unsure.</p>
            </div>
            {/* Center Div */}
            <div>
                <p className='text-xl font-medium mb-5 text-[#F2E4C6] pt-2'>Company</p>
                <ul className='flex flex-col gap-2 text-white cursor-pointer'>
                    <li onClick={()=>navigate('/')}>Home</li>
                    <li onClick={()=>navigate('/about')}>About us</li>
                    <li onClick={()=>navigate('/contact')}>Contact Us</li>
                    <li onClick={()=>navigate('/privacy-policy')}>Privacy Policy</li>
                    <li onClick={()=>navigate('/faqs')}>FaQs</li>
                </ul>
            </div>
            {/* Right Div */}
            <div>
                <p className='text-xl font-medium mb-5 text-[#F2E4C6] pt-2'>Get in Touch</p>
                <ul className='flex flex-col gap-2 text-white'>
                    <li>+919999999999</li>
                    <li>aseth9588@gmail.com</li>
                </ul>
            </div>
        </div>
        {/* Coyright */}
        <div>
            <hr />
            <p className='py-5 text-sm text-center text-[#F2E4C6]'>Copyright 2024@ Pawvaidya - All Right Reserved.</p>
        </div>
    </div>
  )
}

export default Footer