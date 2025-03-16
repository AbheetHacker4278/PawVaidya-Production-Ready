import React from 'react'
import { Route, Routes, useLocation } from "react-router-dom"
import Home  from "./pages/Home"
import Doctors from './pages/Doctors'
import Signup from './pages/Signup'
import About from './pages/About'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import Appointments from './pages/Appointments'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import QuickChat from './pages/QuickChat'
// import FAQs from './pages/FAQs.jsx'
import LoginForm from './pages/LoginForm'
import PrivacyPolicy from './pages/PrivacyPolicy' 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Emailverify from './pages/Emailverify'
import ResetPassword from './pages/ResetPassword'
import Diss from './pages/Diss'

const App = () => {
  const location = useLocation();

  return (
   <div className='mx-4 sm:mx-[10%] '>
    {location.pathname != "/login-form" && location.pathname != "/login" && <Navbar />}
    <ToastContainer />
    {/* <Navbar /> */}
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/doctors' element={<Doctors />} />
      <Route path='/doctors/:speciality' element={<Doctors />} />
      <Route path='/login' element={<Signup />} />
      <Route path='/email-verify' element={<Emailverify />} />
      <Route path='/login-form' element={<LoginForm />} />
      <Route path='/about' element={<About />} />
      <Route path='/contact' element={<Contact />} />
      <Route path='/my-profile' element={<MyProfile />} />
      <Route path='/my-appointments' element={<MyAppointments />} />
      <Route path='/appointment/:docId' element={<Appointments />} />
      <Route path='/quick-chats' element={<QuickChat />} />
      {/* <Route path='/faqs' element={<FAQs />} /> */}
      <Route path='/privacy-policy' element={<PrivacyPolicy />} />
      <Route path='/reset-password' element={<ResetPassword />} />
      <Route path='/discussion' element={<Diss />} />
    </Routes>

    {location.pathname != "/login-form" && location.pathname != "/login" && <Footer />}
    {/* <Footer /> */}
   </div>
  )
}

export default App