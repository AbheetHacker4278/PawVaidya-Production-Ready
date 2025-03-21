import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import assets from '../assets/assets_frontend/assets';
import ReleatedDoctors from '../components/ReleatedDoctors';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Stethoscope, Calendar, CheckCircle, Clock, ArrowRight, X, Loader } from 'lucide-react';

const Appointments = () => {
  const { docId } = useParams();
  const { doctors, backendurl, token, getdoctorsdata, userdata } = useContext(AppContext);
  const daysofWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const navigate = useNavigate();

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [hasActiveAppointment, setHasActiveAppointment] = useState(false);
  const [activeAppointmentInfo, setActiveAppointmentInfo] = useState(null);
  const [loadingActiveAppointment, setLoadingActiveAppointment] = useState(false);

  const loadingMessages = [
    "Checking Available Slots...",
    "We are confirming Your Booking...",
    "Booking is Confirmed!",
    // New messages for cancellation
    "Processing Cancellation Request...",
    "Updating Appointment Records...",
    "Appointment Successfully Cancelled!"
  ];

  const LoadingState = ({ step }) => {
    const icons = [
      <Stethoscope className="w-12 h-12 text-primary animate-pulse" />,
      <Calendar className="w-12 h-12 text-primary animate-bounce" />,
      <CheckCircle className="w-12 h-12 text-green-500 animate-ping" />
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-yellow-100 p-8 rounded-lg max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="mb-4">
              {icons[step]}
            </div>
            <div className="relative w-64 h-2 bg-gray-200 rounded-full mb-4">
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(step + 1) * 33.33}%` }}
              />
            </div>
            <p className="text-lg font-medium text-gray-800 text-center">
              {loadingMessages[step]}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const CancellationLoadingState = ({ step }) => {
    const icons = [
      <X className="w-12 h-12 text-red-500 animate-pulse" />,
      <Calendar className="w-12 h-12 text-red-500 animate-bounce" />,
      <CheckCircle className="w-12 h-12 text-green-500 animate-ping" />
    ];
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="mb-4">
              {icons[step]}
            </div>
            <div className="relative w-64 h-2 bg-gray-200 rounded-full mb-4">
              <div
                className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-500"
                style={{ width: `${(step + 1) * 33.33}%` }}
              />
            </div>
            <p className="text-lg font-medium text-gray-800 text-center">
              {loadingMessages[step + 3]}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ActiveAppointmentLoadingState = () => {
    return (
      <div className="mt-4 p-6 bg-gray-100 border border-gray-200 rounded-lg animate-pulse">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 text-primary animate-spin" />
          <div className="h-4 bg-gray-300 rounded w-48"></div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-3 bg-gray-300 rounded w-full"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          <div className="h-3 bg-gray-300 rounded w-4/6"></div>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="h-10 bg-gray-300 rounded w-40"></div>
          <div className="h-10 bg-gray-300 rounded w-40"></div>
        </div>
      </div>
    );
  };

  // Check if user has any active appointments
  const checkActiveAppointments = async () => {
    if (!token) return;

    setLoadingActiveAppointment(true);
    try {
      const { data } = await axios.get(backendurl + '/api/user/appointments', { headers: { token } });

      if (data.success) {
        // Check if there are any active appointments (not cancelled and not completed)
        const activeAppointments = data.appointments.filter(
          appointment => !appointment.cancelled && !appointment.isCompleted
        );

        if (activeAppointments.length > 0) {
          setHasActiveAppointment(true);
          setActiveAppointmentInfo(activeAppointments[0]);
        } else {
          setHasActiveAppointment(false);
          setActiveAppointmentInfo(null);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingActiveAppointment(false);
    }
  };

  const fetchDocInfo = async () => {
    const docInfo = doctors.find(doc => doc._id === docId);
    setDocInfo(docInfo);
  };

  const getAvailableSlots = () => {
    // If user has an active appointment, don't show any slots
    if (hasActiveAppointment) {
      setDocSlots([]);
      return;
    }

    setDocSlots([]);
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      let endTime = new Date(currentDate);
      endTime.setHours(21, 0, 0, 0);

      if (i === 0) {
        const now = new Date();
        const startHour = now.getMinutes() > 30 ? now.getHours() + 1 : now.getHours();
        const startMinutes = now.getMinutes() > 30 ? 0 : 30;

        currentDate.setHours(startHour);
        currentDate.setMinutes(startMinutes);
      } else {
        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }

      let timeSlots = [];

      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let day = currentDate.getDate();
        let month = currentDate.getMonth() + 1;
        let year = currentDate.getFullYear();

        const slotDate = day + "_" + month + "_" + year;
        const slotTime = formattedTime;

        const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true;

        if (isSlotAvailable) {
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formattedTime
          });
        }

        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      setDocSlots(prev => ([...prev, timeSlots]));
    }
  };

  const validateBooking = () => {
    if (hasActiveAppointment) {
      setValidationError('You already have an active appointment. Please complete or cancel it before booking a new one.');
      toast.warn('You already have an active appointment. Please complete or cancel it before booking a new one.');
      return false;
    }

    if (!docSlots[slotIndex]?.[0]?.datetime) {
      setValidationError('Please select an appointment date');
      toast.warn('Please select an appointment date');
      return false;
    }
    if (!slotTime) {
      setValidationError('Please select an appointment time');
      toast.warn('Please select an appointment time');
      return false;
    }
    setValidationError('');
    return true;
  };

  const bookappointment = async () => {
    if (!token) {
      toast.warn('Login to Book Appointment');
      return navigate('/login');
    }
    if (!userdata.isAccountverified) {
      toast.warn('Please Verify Your Account');
      return navigate('/');
    }

    if (!validateBooking()) {
      return;
    }

    setIsLoading(true);
    try {
      const date = docSlots[slotIndex][0].datetime;

      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();

      const slotDate = day + '_' + month + '_' + year;

      setLoadingStep(0);
      await new Promise(resolve => setTimeout(resolve, 1500));

      setLoadingStep(1);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data } = await axios.post(
        backendurl + '/api/user/book-appointment',
        { docId, slotDate, slotTime },
        { headers: { token } }
      );

      setLoadingStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (data.success) {
        toast.success(data.message);
        getdoctorsdata();
        navigate('/my-appointments');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const cancelAppointment = async () => {
    if (!activeAppointmentInfo) return;

    setIsLoading(true);
    try {
      // Set first cancellation loading step
      setLoadingStep(0);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Set second cancellation loading step
      setLoadingStep(1);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data } = await axios.post(
        backendurl + '/api/user/cancel-appointment',
        { appointmentId: activeAppointmentInfo._id },
        { headers: { token } }
      );

      // Set final cancellation loading step
      setLoadingStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (data.success) {
        toast.success('Appointment cancelled successfully');
        setHasActiveAppointment(false);
        setActiveAppointmentInfo(null);
        getdoctorsdata();
        // Refresh available slots after cancellation
        getAvailableSlots();
      } else {
        toast.error(data.message || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Error cancelling appointment');
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  useEffect(() => {
    fetchDocInfo();
    checkActiveAppointments();
  }, [doctors, docId, token]);

  useEffect(() => {
    if (docInfo) {
      getAvailableSlots();
    }
  }, [docInfo, hasActiveAppointment]);

  useEffect(() => {
    setValidationError('');
  }, [slotIndex, slotTime]);

  if (isLoading) {
    if (activeAppointmentInfo) {
      return <CancellationLoadingState step={loadingStep} />;
    } else {
      return <LoadingState step={loadingStep} />;
    }
  }

  return docInfo && (
    <div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <img className="bg-green-300 w-full sm:max-w-72 rounded-lg" src={docInfo.image} alt="" />
        </div>
        <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-[#5A4035] mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
          <p className="flex items-center gap-2 text-2xl font-medium text-white">
            {docInfo.name} <img className="w-5" src={assets.verified_icon} alt="Verified" />
          </p>
          <div className="flex items-center gap-2 text-sm mt-1 text-slate-200">
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <button className="py-0 px-2  text-xs rounded-full bg-[#489065] hover:bg-[#326546]">{docInfo.experience}</button>
          </div>
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-slate-300 mt-3">
              About <img src={assets.info_icon} alt="Info" />
            </p>
            <p className="text-sm text-slate-300 max-w-[700px] mt-1">{docInfo.about}</p>
          </div>
          <p className="text-slate-200 font-medium mt-4">
            Approx Treatment Fee: ₹<span className="text-slate-200">{docInfo.fees ? docInfo.fees : 'N/A'}</span>
          </p>
          <div className="flex gap-4">
            {docInfo.address?.Location && (
              <p className="text-white font-medium mt-4  pr-3 pl-3 rounded-full bg-[#489065] hover:bg-[#326546] cursor-pointer">
                <span className="">{docInfo.address.Location}</span>
              </p>
            )}
            {docInfo.address?.line && (
              <p className="text-slate-100 font-medium mt-4  pr-3 pl-3 rounded-full bg-[#489065] hover:bg-[#326546] cursor-pointer">
                <span className="">{docInfo.address.line}</span>
              </p>
            )}
          </div>
          <div className="pr-4 sm:pr-6 md:pr-36 text-gray-600 text-sm sm:text-base">
            {docInfo.address?.line && (
              <p className="text-slate-100 font-medium mt-4  px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-[#489065] hover:bg-[#326546] cursor-pointer transition duration-300 hover:scale-10 w-full max-w-full overflow-hidden">
                <span className=" text-sm sm:text-base">{docInfo.full_address}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
        <p>Booking Slots</p>

        {loadingActiveAppointment ? (
          <ActiveAppointmentLoadingState />
        ) : hasActiveAppointment ? (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg transform transition-all duration-500 hover:shadow-lg animate-fadeIn">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 text-yellow-600 mr-2 animate-pulse" />
              <p className="text-yellow-800 font-medium">You already have an active appointment</p>
            </div>
            <p className="text-yellow-700 mt-2 transition-all duration-300 animate-slideIn">
              Please complete or cancel your current appointment before booking a new one.
            </p>
            {activeAppointmentInfo && (
              <div className="mt-3 bg-white p-3 rounded-md shadow-md transition-all duration-500 transform hover:scale-[1.02] animate-fadeInUp">
                <p className="font-medium flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Current Appointment Details:
                </p>
                <div className="mt-2 space-y-2 animate-slideInRight">
                  <p className="flex items-center transition-all duration-300 hover:translate-x-1">
                    <Stethoscope className="w-4 h-4 text-primary mr-2" />
                    Doctor: {activeAppointmentInfo.docData.name}
                  </p>
                  <p className="flex items-center transition-all duration-300 hover:translate-x-1">
                    <Calendar className="w-4 h-4 text-primary mr-2" />
                    Date: {activeAppointmentInfo.slotDate && activeAppointmentInfo.slotDate.split('_').join(' / ')}
                  </p>
                  <p className="flex items-center transition-all duration-300 hover:translate-x-1">
                    <Clock className="w-4 h-4 text-primary mr-2" />
                    Time: {activeAppointmentInfo.slotTime}
                  </p>
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/my-appointments')}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md flex items-center justify-center group"
              >
                <Calendar className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                Go to My Appointments
                <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <button
                onClick={cancelAppointment}
                className="mt-3 sm:mt-0 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md flex items-center justify-center group"
              >
                <X className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-90" />
                Cancel Appointment
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
              {docSlots.map((item, index) => (
                <div
                  key={index}
                  onClick={() => setSlotIndex(index)}
                  className={`text-center py-6 min-w-16 rounded-full cursor-pointer hover:border-red-400  ${slotIndex === index ? 'bg-red-400 text-white' : 'border border-gray-200'
                    }`}
                >
                  <p>{item[0]?.datetime ? daysofWeek[item[0].datetime.getDay()] : 'N/A'}</p>
                  <p>{item[0]?.datetime ? item[0].datetime.getDate() : 'N/A'}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
              {docSlots.length &&
                docSlots[slotIndex]
                  ?.filter((item) => item)
                  .map((item, index) => (
                    <p
                      key={index}
                      onClick={() => setSlotTime(item.time)}
                      className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer hover:bg-[#5A4035] hover:text-white ${item.time === slotTime
                        ? 'bg-[#5A4035] text-white'
                        : 'text-gray-400 border border-[#5A4035]'
                        }`}
                    >
                      {item.time.toLowerCase()}
                    </p>
                  ))}
            </div>

            <div className="flex flex-col items-start">
              <button
                onClick={bookappointment}
                className={`text-white font-medium text-sm  px-10 py-3 rounded-full my-6 ${!slotTime || !docSlots[slotIndex]?.[0]?.datetime
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-800 cursor-pointer'
                  }`}
                disabled={!slotTime || !docSlots[slotIndex]?.[0]?.datetime}
              >
                Book an Appointment
              </button>

              {validationError && (
                <p className="text-sm text-red-500 ml-2 -mt-4 mb-4">{validationError}</p>
              )}
            </div>
          </>
        )}
      </div>

      <ReleatedDoctors
        docId={docId}
        speciality={docInfo.speciality}
        location={docInfo.address.Location}
        State={docInfo.address.line}
      />
    </div>
  );
};

export default Appointments;