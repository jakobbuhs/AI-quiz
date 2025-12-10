import { useState, useEffect } from 'react'
import { Cookie, Shield, X } from 'lucide-react'

const CookieConsent = ({ onAccept, onDecline }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent')
    if (consent === null) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setIsVisible(false)
    onAccept()
  }

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined')
    setIsVisible(false)
    onDecline()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card p-6 max-w-md w-full animate-slide-up relative">
        <button
          onClick={handleDecline}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Cookie className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Cookie & Cache Consent</h3>
        </div>

        <div className="mb-6 space-y-3">
          <p className="text-gray-600">
            We use cookies and browser storage to save your quiz progress so you don't lose your work if you refresh the page.
          </p>
          
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">What we store:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Your quiz progress and answers</li>
                <li>Your score and time taken</li>
                <li>Your cookie preference</li>
              </ul>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            You can change this preference at any time by clearing your browser's local storage.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="btn-secondary flex-1"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="btn-primary flex-1"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent

