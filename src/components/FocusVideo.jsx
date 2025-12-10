import { useRef, useEffect, useState } from 'react'

const FocusVideo = () => {
  const videoRef = useRef(null)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      // Set video to loop and play automatically
      video.loop = true
      video.muted = true
      
      // Handle video load errors
      const handleError = () => {
        console.error('Video failed to load:', video.error)
        setVideoError(true)
      }
      
      const handleCanPlay = () => {
        video.play().catch(err => {
          console.log('Video autoplay prevented:', err)
        })
      }
      
      video.addEventListener('error', handleError)
      video.addEventListener('canplay', handleCanPlay)
      
      return () => {
        video.removeEventListener('error', handleError)
        video.removeEventListener('canplay', handleCanPlay)
      }
    }
  }, [])

  // Show fallback if video fails to load
  if (videoError) {
    return (
      <div className="fixed left-0 top-0 h-screen w-1/2 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 z-0 hidden lg:block overflow-hidden flex items-center justify-center">
        <div className="text-white/50 text-sm text-center p-4">
          Video unavailable
        </div>
      </div>
    )
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-1/2 bg-gradient-to-b from-black via-gray-900 to-black z-0 hidden lg:block overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        className="w-full h-full object-contain object-bottom"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setVideoError(true)}
      >
        <source src="/subwat_video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Subtle overlay for better visual separation */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />
      {/* Shaded side bars for letterboxing */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-l from-black via-transparent to-transparent pointer-events-none" />
    </div>
  )
}

export default FocusVideo

