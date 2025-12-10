import { useRef, useEffect } from 'react'

const FocusVideo = () => {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      // Set video to loop and play automatically
      video.loop = true
      video.muted = true
      video.play().catch(err => {
        console.log('Video autoplay prevented:', err)
      })
    }
  }, [])

  return (
    <div className="fixed left-0 top-0 h-screen w-80 bg-black z-0 hidden lg:block overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/focus-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Subtle overlay for better visual separation */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}

export default FocusVideo

