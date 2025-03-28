import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios'
import { toast } from 'react-toastify'
import AnimalHealthChatbot from '../components/AnimalHealthChatbot';

const MyAppointments = () => {
  const { backendurl, token } = useContext(AppContext)
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
  }

  // Parse appointment date and time
  const parseAppointmentDateTime = (slotDate, slotTime) => {
    const [day, month, year] = slotDate.split('_');
    const [time, period] = slotTime.split(' ');
    let [hours, minutes] = time.split(':');

    // Convert to 24-hour format
    if (period === 'PM' && hours !== '12') {
      hours = String(Number(hours) + 12);
    }
    if (period === 'AM' && hours === '12') {
      hours = '00';
    }

    return new Date(year, month - 1, day, hours, minutes);
  }

  // Getting User Appointments Data Using API
  const getUserAppointments = async () => {
    try {
      setIsLoading(true)
      const { data } = await axios.get(backendurl + '/api/user/appointments', { headers: { token } })
      if (data.success) {
        // Check and auto-cancel expired appointments
        const processedAppointments = data.appointments.map(appointment => {
          const appointmentDateTime = parseAppointmentDateTime(appointment.slotDate, appointment.slotTime);
          if (appointmentDateTime < currentTime && !appointment.cancelled && !appointment.isCompleted) {
            // Automatically cancel the appointment
            cancelAppointment(appointment._id);
            return { ...appointment, cancelled: true };
          }
          return appointment;
        });

        setAppointments(processedAppointments.reverse())
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Timer to check appointment status
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, []);

  // Trigger appointment check when token or current time changes
  useEffect(() => {
    if (token) {
      getUserAppointments()
    }
  }, [token, currentTime])

  // Function to cancel appointment Using API
  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendurl + '/api/user/cancel-appointment',
        { appointmentId },
        { headers: { token } }
      )
      if (data.success) {
        toast.error(`Appointment automatically cancelled due to time expiration.`)
        getUserAppointments()
      } else {
        toast.error(data.message)
        console.log(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // Calculate time remaining or time passed
  const getAppointmentStatus = (slotDate, slotTime) => {
    const appointmentDateTime = parseAppointmentDateTime(slotDate, slotTime);
    const timeDiff = appointmentDateTime.getTime() - currentTime.getTime();

    if (timeDiff > 0) {
      // Appointment is in the future
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return `Starts in ${hours}h ${minutes}m`;
    } else {
      // Appointment is in the past
      const hours = Math.abs(Math.floor(timeDiff / (1000 * 60 * 60)));
      const minutes = Math.abs(Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)));
      return `Expired ${hours}h ${minutes}m ago`;
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className=''>
      <p className='pb-13 mt-12 font-medium text-zinc-700 border-b'>My Appointments</p>
      <div>
        {appointments.map((item, index) => (
          <div
            className='m-2 rounded-xl border border-[#5A4035] grid grid-col-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b '
            key={index}
          >
            <div className='ml-2'>
              <img className='w-32 bg-indigo-50' src={item.docData.image} alt="" />
            </div>
            <div className='flex-1 text-sm text-zinc-600'>
              <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
              <p>{item.docData.speciality}</p>
              <div className='flex flex-row'>
                <p className='text-zinc-700 font-medium mt-1'>Full Address:  <span className='text-zinc-500 text-sm'>{item.docData.full_address}</span></p>
              </div>
              <p className='text-sm mt-1'>
                <span className='text-sm text-neutral-700 font-medium'>Date & Time:</span>
                {slotDateFormat(item.slotDate)} | {item.slotTime}
              </p>
              <p className='text-sm mt-1 text-red-500'>
                <span className='text-sm text-neutral-700 font-medium'>Status: </span>
                {getAppointmentStatus(item.slotDate, item.slotTime)}
              </p>
              <p className='text-sm mt-1'><span className='text-sm text-neutral-700 font-medium'>Phone Number:</span> +91 {item.docData.docphone}</p>
              <div className='flex gap-4 pt-3'>
                <p className='text-sm text-white text-center sm:min-w-48 py-2 border px-3 rounded-full bg-[#5A4035] hover:bg-[#422f27] hover:text-white cursor-pointer transition-all duration-300'>
                  {item.docData.address.Location}
                </p>
                <p className='text-sm text-white text-center sm:min-w-48 py-2 border px-3 rounded-full bg-[#5A4035] hover:bg-[#422f27] hover:text-white cursor-pointer transition-all duration-300'>
                  {item.docData.address.line}
                </p>
              </div>
            </div>
            <div></div>
            <div className="flex flex-col gap-2 justify-end">
              {item.cancelled ? (
                <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500">
                  Appointment Cancelled
                </button>
              ) : item.isCompleted ? (
                <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500">
                  Appointment Completed
                </button>
              ) : (
                <>
                  <button className="text-sm mb-2 mt-2 mr-4 text-stone-500 text-center sm:min-w-48 py-2 border border-[#5A4035] rounded hover:bg-[#422f27] hover:text-white transition-all duration-300">
                    Pay Online
                  </button>
                  <button
                    onClick={() => cancelAppointment(item._id)}
                    className="mb-2 mt-2 mr-4 text-sm text-stone-500 text-center sm:min-w-48 py-2 border border-red-500 rounded hover:bg-red-400 hover:text-white transition-all duration-300"
                  >
                    Cancel Appointment
                  </button>
                  <button
                    onClick={() => {
                      let whatsappNumber = item.docData.docphone.replace(/\s+/g, '');
                      if (!whatsappNumber.startsWith('+91')) {
                        whatsappNumber = `+91${whatsappNumber}`;
                      }

                      const whatsappURL = `https://wa.me/${whatsappNumber}?text=Hi%20Doctor%20${item.docData.name},%20I%20would%20like%20to%20confirm%20my%20appointment.%0A%0AHere%20are%20the%20details:%0A-%20Appointment%20ID:%20${item._id}%0A-%20Date:%20${slotDateFormat(item.slotDate)}%0A-%20Time:%20${item.slotTime}%0A-%20Pet%20Name:%20${item.userData.breed}%0A-%20Email:%20${item.userData.email}%0A-%20Phone:%20+91%20${item.docData.docphone}%0A-%20Amount:%20${item.amount}`;

                      window.open(whatsappURL, '_blank');
                    }}
                    className="flex items-center mb-2 mt-2 mr-4 gap-2 text-sm text-stone-500 text-center sm:min-w-48 py-2 border border-emerald-400 rounded hover:bg-green-600 hover:text-white transition-all duration-300"
                  >
                    <div className="flex justify-center items-center text-center gap-2 pl-36 md:flex md:justify-center md:items-center md:text-center md:gap-2 md:pl-14">
                      <span>Quick Chat</span>
                      <img
                        className="w-5 h-5"
                        src="https://img.icons8.com/?size=100&id=uZWiLUyryScN&format=png&color=000000"
                        alt="WhatsApp icon"
                      />
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="relative">
        <AnimalHealthChatbot />
      </div>
    </div>
  )
}

export default MyAppointments