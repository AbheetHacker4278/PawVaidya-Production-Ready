import React, { useContext, useState } from 'react'
import FormInput from '../components/FormInput'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { toast } from "react-toastify"
import axios from "axios"
import { div } from 'framer-motion/client'
import image from '../assets/New/image.png'

const LoginForm = () => {
    const { backendurl , token , settoken , setisLoggedin} = useContext(AppContext)
    const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
  
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(`${backendurl}/api/user/login`, { email, password });
      if (data.success) {
        setisLoggedin(true)
        localStorage.setItem('token', data.token);
        settoken(data.token);
        toast.success("Login successful!");
        setisLoggedin(true)
        navigate('/');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("An error occurred during login.");
      console.error(error);
    }
  };
  

  return (
    

    <div className="flex min-h-screen  bg-[#F2E4C6]">
      <div className='absolute top-0 left-0  w-1/6 p-4'>
        <img 
        src={image}
        alt="Logo" 
        className="relative max-w-full h-auto rounded-3xl z-50"  />
      </div>

      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br">
        <div className="relative w-full max-w-xl  ">
          {/* <div className="absolute -top-10 -left-10 w-24 h-24 bg-green-300 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-200 rounded-full animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-green-500 rounded-full animate-pulse delay-500"></div> */}
          <img 
            src="https://i.ibb.co/N2dwZpC/1fc8fd8a-8ea8-4383-9bb0-3cf75b23cdc4-removebg-preview-1.png" 
            alt="Veterinary Care"
            className="relative z-10 max-w-full h-auto rounded-3xl"
          />
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center bg-[#F2E4C6]">
        <div className="max-w-md mx-auto w-full p-8 bg-[#A8D5BA] rounded-xl">
          <div className="space-y-2 mb-8 bg-transparent">
            <h1 className="text-4xl font-bold bg-[#489065] bg-clip-text text-transparent">
              Welcome Back to PawVaidya!
            </h1>
            <p className="text-gray-600 bg-transparent">Access expert advice for your furry friends</p>
          </div>

          <form onSubmit={onSubmitHandler} className="space-y-5 bg-transparent">
            <FormInput
              type="email"
              name="email"
              placeholder="Your email"
              value={formData.email}
              onChange={handleInputChange}
              
            />
            <FormInput
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              
            />

            <div className="flex items-center justify-between bg-transparent">
              <div className="flex items-center gap-2 bg-transparent">
                <input
                  type="checkbox"
                  name="remember"
                  id="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-[#2A9D8F] focus:ring-[#2A9D8F]"
                />
                <label htmlFor="remember" className="text-sm text-gray-600 bg-transparent ">
                  Remember me
                </label>
              </div>
              <p onClick={() => navigate('/reset-password')} className="text-sm bg-transparent text-[#747baa] hover:text-[#4a507a] cursor-pointer">
                Forgot password?
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-[#489065] text-white py-4 rounded-xl font-semibold 
                       hover:bg-[#2e5b40] transition-all duration-300 
                       transform hover:scale-[1.01] active:scale-[0.99] shadow-lg"
            >
              Login<span className='text-xl bg-transparent'>🦥</span>
            </button>

            {/* <hr className="my-4 bg-slate-800" /> */}
            <div className="flex items-center bg-transparent">
              <hr className="flex-grow border-t border-gray-400"/>
              <span className="mx-2 text-gray-500 text-sm bg-transparent">or</span>
              <hr className="flex-grow border-t border-gray-400"/>
            </div>
            
            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-[#656ca3] text-white py-4 rounded-xl font-semibold 
                       hover:bg-[#393d60] transition-all duration-300 
                       transform hover:scale-[1.01] active:scale-[0.99] shadow-lg"
            >
              Sign Up<span className='text-xl bg-transparent'>🦥</span>
            </button>

            {/* <p className="text-center text-sm text-gray-600 bg-transparent">
              New here?{' '}
              <a onClick={() => navigate('/login')} className=" bg-transparent text-[#747baa] font-medium hover:text-[#4a507a] cursor-pointer">
                Sign Up
              </a>
              {' '}to connect with trusted vets.
            </p> */}
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginForm