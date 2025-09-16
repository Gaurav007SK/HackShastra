import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, authUtils } from '../services/auth';

const RegisterFarmer = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic info
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    language: 'en',
    
    // Farm details
    farmName: '',
    livestockTypes: [],
    herdSize: '',
    address: '',
    farmLocation: {
      coordinates: [0, 0]
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const livestockOptions = [
    'Cattle', 'Buffalo', 'Goat', 'Sheep', 'Pig', 'Poultry', 'Duck', 'Horse', 'Donkey', 'Camel'
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिन्दी (Hindi)' },
    { value: 'bn', label: 'বাংলা (Bengali)' },
    { value: 'te', label: 'తెలుగు (Telugu)' },
    { value: 'mr', label: 'मराठी (Marathi)' },
    { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { value: 'ml', label: 'മലയാളം (Malayalam)' },
    { value: 'ta', label: 'தமிழ் (Tamil)' },
    { value: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'livestockTypes') {
      const updatedTypes = checked
        ? [...formData.livestockTypes, value]
        : formData.livestockTypes.filter(type => type !== value);
      setFormData({ ...formData, livestockTypes: updatedTypes });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    const [lng, lat] = value.split(',').map(coord => parseFloat(coord.trim()));
    
    if (!isNaN(lng) && !isNaN(lat)) {
      setFormData({
        ...formData,
        farmLocation: {
          ...formData.farmLocation,
          coordinates: [lng, lat]
        }
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setFormData({
            ...formData,
            farmLocation: {
              ...formData.farmLocation,
              coordinates: [longitude, latitude]
            }
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please enter manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const validateStep1 = () => {
    const { email, password, confirmPassword, fullName, phone } = formData;
    
    if (!email || !password || !confirmPassword || !fullName || !phone) {
      setError('All fields are required');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    setError('');
    return true;
  };

  const validateStep2 = () => {
    const { farmName, livestockTypes, herdSize, address } = formData;
    
    if (!farmName || livestockTypes.length === 0 || !herdSize || !address) {
      setError('All farm details are required');
      return false;
    }
    
    if (parseInt(herdSize) < 1) {
      setError('Herd size must be at least 1');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registrationData } = formData;
      
      const response = await authAPI.register({
        ...registrationData,
        role: 'farmer',
        farmerProfile: {
          farmName: formData.farmName,
          livestockTypes: formData.livestockTypes,
          herdSize: parseInt(formData.herdSize),
          address: formData.address,
          farmLocation: formData.farmLocation
        }
      });

      const { accessToken, user } = response;
      authUtils.setAuthData(accessToken, user);
      navigate('/farmer-dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
      
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Full Name *
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          value={formData.fullName}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number *
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          value={formData.phone}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter your phone number"
        />
      </div>

      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-700">
          Preferred Language
        </label>
        <select
          id="language"
          name="language"
          value={formData.language}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
        >
          {languageOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password *
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Create a password (min 6 characters)"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password *
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Confirm your password"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Farm Details</h3>
      
      <div>
        <label htmlFor="farmName" className="block text-sm font-medium text-gray-700">
          Farm Name *
        </label>
        <input
          id="farmName"
          name="farmName"
          type="text"
          required
          value={formData.farmName}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter your farm name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Livestock Types * (Select all that apply)
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {livestockOptions.map(option => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                name="livestockTypes"
                value={option}
                checked={formData.livestockTypes.includes(option)}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="herdSize" className="block text-sm font-medium text-gray-700">
          Total Herd Size *
        </label>
        <input
          id="herdSize"
          name="herdSize"
          type="number"
          min="1"
          required
          value={formData.herdSize}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter total number of animals"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Farm Address *
        </label>
        <textarea
          id="address"
          name="address"
          rows="3"
          required
          value={formData.address}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter your farm address"
        />
      </div>

      <div>
        <label htmlFor="coordinates" className="block text-sm font-medium text-gray-700">
          Farm Location Coordinates
        </label>
        <div className="mt-1 flex space-x-2">
          <input
            type="text"
            placeholder="Longitude, Latitude (e.g., 77.2090, 28.6139)"
            onChange={(e) => {
              const [lng, lat] = e.target.value.split(',').map(coord => coord.trim());
              if (!isNaN(parseFloat(lng)) && !isNaN(parseFloat(lat))) {
                setFormData({
                  ...formData,
                  farmLocation: {
                    ...formData.farmLocation,
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                  }
                });
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <button
            type="button"
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            📍 Auto
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Current: {formData.farmLocation.coordinates[0]}, {formData.farmLocation.coordinates[1]}
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Review & Submit</h3>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium text-gray-900">Registration Summary</h4>
        <div className="mt-2 space-y-1 text-sm text-gray-600">
          <p><strong>Name:</strong> {formData.fullName}</p>
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Phone:</strong> {formData.phone}</p>
          <p><strong>Language:</strong> {languageOptions.find(l => l.value === formData.language)?.label}</p>
          <p><strong>Farm:</strong> {formData.farmName}</p>
          <p><strong>Livestock:</strong> {formData.livestockTypes.join(', ')}</p>
          <p><strong>Herd Size:</strong> {formData.herdSize}</p>
          <p><strong>Location:</strong> {formData.farmLocation.coordinates[0]}, {formData.farmLocation.coordinates[1]}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join FarmGuard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Register as a farmer to protect your livestock
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className="flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Back
              </button>
            )}
            
            <div className="flex-1" />
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-green-600 hover:text-green-500"
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterFarmer;
