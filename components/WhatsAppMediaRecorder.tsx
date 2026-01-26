"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Play, Pause, Volume2, VolumeX, File, Image, Video, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface MediaRecorderProps {
  onMediaReady: (media: MediaData) => void
  currentUserId: string
  adminMode?: boolean
}

interface MediaData {
  type: 'voice' | 'video' | 'image' | 'file'
  url: string
  duration?: number
  size?: number
  name?: string
  mimeType?: string
  thumbnail?: string
}

interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  amplitude: number[]
  isCancelled: boolean
}

export default function WhatsAppMediaRecorder({ 
  onMediaReady, 
  currentUserId, 
  adminMode = false 
}: MediaRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    amplitude: [],
    isCancelled: false
  })
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { toast } = useToast()

  // Initialize audio context for visualization
  const initializeAudioContext = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      
      analyser.connect(audioContext.destination)
      source.connect(analyser)
      
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      const visualize = () => {
        if (!recordingState.isRecording || recordingState.isCancelled) return
        
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength
        const normalizedAmplitude = average / 255
        
        setRecordingState(prev => ({
          ...prev,
          amplitude: [...prev.amplitude.slice(-50), normalizedAmplitude]
        }))
        
        animationFrameRef.current = requestAnimationFrame(visualize)
      }
      
      visualize()
      
      return { stream, audioContext, analyser }
    } catch (error) {
      console.error('Error initializing audio context:', error)
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice messages",
        variant: "destructive"
      })
      return null
    }
  }, [recordingState.isRecording, recordingState.isCancelled])

  // Start voice recording
  const startRecording = useCallback(async () => {
    try {
      const audioSetup = await initializeAudioContext()
      if (!audioSetup) return
      
      const { stream } = audioSetup
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Calculate duration
        const audio = new Audio(audioUrl)
        audio.addEventListener('loadedmetadata', () => {
          onMediaReady({
            type: 'voice',
            url: audioUrl,
            duration: audio.duration,
            size: audioBlob.size,
            name: `Voice message ${new Date().toLocaleTimeString()}`,
            mimeType: 'audio/webm'
          })
        })
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop())
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
      
      mediaRecorder.start()
      
      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        amplitude: [],
        isCancelled: false
      })
      
      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: prev.duration + 0.1
        }))
      }, 100)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Recording failed",
        description: "Could not start voice recording",
        variant: "destructive"
      })
    }
  }, [initializeAudioContext, onMediaReady])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop()
      setRecordingState(prev => ({ ...prev, isRecording: false }))
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [recordingState.isRecording])

  // Cancel recording
  const cancelRecording = useCallback(() => {
    setRecordingState(prev => ({ ...prev, isCancelled: true }))
    stopRecording()
    
    toast({
      title: "Recording cancelled",
      description: "Voice message was not sent"
    })
  }, [stopRecording])

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 100MB",
        variant: "destructive"
      })
      return
    }
    
    setSelectedFile(file)
    
    // Generate preview for images/videos
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const preview = e.target?.result as string
        // Handle preview generation
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // Upload file
  const uploadFile = useCallback(async () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)
      
      // Create file URL (in production, upload to Supabase Storage)
      const fileUrl = URL.createObjectURL(selectedFile)
      
      // Wait for "upload" to complete
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      const mediaType = selectedFile.type.startsWith('image/') ? 'image' :
                       selectedFile.type.startsWith('video/') ? 'video' : 'file'
      
      onMediaReady({
        type: mediaType,
        url: fileUrl,
        size: selectedFile.size,
        name: selectedFile.name,
        mimeType: selectedFile.type
      })
      
      setSelectedFile(null)
      setUploadProgress(0)
      
      toast({
        title: "File uploaded successfully",
        description: `${selectedFile.name} is ready to send`
      })
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload file",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, onMediaReady])

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="flex items-center gap-2 p-2 border-t">
      {/* Voice Recording */}
      {!selectedFile && !recordingState.isRecording && (
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`p-3 rounded-full ${
            adminMode 
              ? 'bg-[#0d5c75] hover:bg-[#0d5c75]/90 text-white' 
              : 'bg-[#2a9d8f] hover:bg-[#2a9d8f]/90 text-white'
          }`}
        >
          <Mic className="h-5 w-5" />
        </Button>
      )}
      
      {/* Recording Interface */}
      {recordingState.isRecording && (
        <Card className="flex-1 p-3">
          <div className="flex items-center gap-3">
            {/* Waveform Visualization */}
            <div className="flex items-center gap-1 flex-1">
              {recordingState.amplitude.map((amp, index) => (
                <div
                  key={index}
                  className="w-1 bg-red-500 rounded-full transition-all duration-100"
                  style={{ height: `${Math.max(2, amp * 20)}px` }}
                />
              ))}
            </div>
            
            {/* Duration */}
            <span className="text-sm font-medium text-red-600">
              {formatDuration(recordingState.duration)}
            </span>
            
            {/* Cancel Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelRecording}
              className="text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Stop Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
      
      {/* File Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {!selectedFile && !recordingState.isRecording && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-full text-gray-600 hover:bg-gray-100"
          >
            <File className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-full text-gray-600 hover:bg-gray-100"
          >
            <Image className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-full text-gray-600 hover:bg-gray-100"
          >
            <Video className="h-5 w-5" />
          </Button>
        </>
      )}
      
      {/* File Preview */}
      {selectedFile && (
        <Card className="flex-1 p-3">
          <div className="flex items-center gap-3">
            {/* File Icon */}
            <div className="p-2 rounded-full bg-gray-100">
              {selectedFile.type.startsWith('image/') && <Image className="h-4 w-4" />}
              {selectedFile.type.startsWith('video/') && <Video className="h-4 w-4" />}
              {!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/') && <File className="h-4 w-4" />}
            </div>
            
            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="w-24">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {!isUploading && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={uploadFile}
                    className={`${
                      adminMode 
                        ? 'bg-[#0d5c75] hover:bg-[#0d5c75]/90 text-white' 
                        : 'bg-[#2a9d8f] hover:bg-[#2a9d8f]/90 text-white'
                    }`}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
