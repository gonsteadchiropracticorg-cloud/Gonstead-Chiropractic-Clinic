"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  X, 
  Send, 
  Check, 
  CheckCheck, 
  Users, 
  Circle, 
  MessageSquare,
  Phone,
  Video,
  Search,
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Reply,
  Forward,
  Star,
  Clock,
  Download,
  Upload,
  Wifi,
  WifiOff,
  Settings,
  Shield,
  Crown,
  RefreshCw,
  AlertTriangle,
  File,
  Paperclip,
  Mic,
  MicOff,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface PerfectWhatsAppChatProps {
  currentUserId: string
  currentUserRole: 'admin' | 'staff'
  currentUserName: string
}

interface ChatMessage {
  id: string
  sender_id: string
  sender_name: string
  sender_role: 'admin' | 'staff'
  message: string
  message_type: 'text' | 'system' | 'notification' | 'file' | 'call'
  read: boolean
  read_at?: string
  delivered: boolean
  delivered_at?: string
  created_at: string
  updated_at?: string
  edited: boolean
  edited_at?: string
  original_message?: string
  is_deleted?: boolean
  deleted_by?: string
  deleted_at?: string
  file_url?: string
  file_name?: string
  file_size?: number
  file_type?: string
  call_type?: 'voice' | 'video'
  call_duration?: number
  call_status?: 'missed' | 'incoming' | 'outgoing' | 'completed'
}

interface GroupSettings {
  group_name: string
  allow_staff_messages: boolean
  message_retention_days: number
  auto_clear_enabled: boolean
  last_cleared_by?: string
  last_cleared_at?: string
}

export default function PerfectWhatsAppChat({ 
  currentUserId, 
  currentUserRole, 
  currentUserName 
}: PerfectWhatsAppChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<GroupSettings>({
    group_name: 'Medical Team Communication',
    allow_staff_messages: true,
    message_retention_days: 30,
    auto_clear_enabled: false
  })
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isInCall, setIsInCall] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle')
  const [callDuration, setCallDuration] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowEmojiPicker(false)
      }
    }

    const handleGlobalMouseUp = () => {
      if (isRecording) {
        stopRecording()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      
      // Cleanup recording interval
      if ((window as any).recordingInterval) {
        clearInterval((window as any).recordingInterval)
        delete (window as any).recordingInterval
      }
    }
  }, [chatRef, isRecording, isOpen])

  // Local storage key
  const STORAGE_KEY = 'perfect_whatsapp_chat_messages'

  // Refined antique-style colors with better coordination
  const colors = {
    primary: '#0d5c75', // Your system primary color
    primaryDark: '#0a4658',
    secondary: '#faf8f5', // Soft cream
    messageSent: '#f0e6d2', // Soft antique gold
    messageReceived: '#ffffff', // Clean white
    adminMessage: '#e8f4fd', // Soft blue
    headerBg: '#1a365d', // Deep professional blue
    sidebarBg: '#f8f6f3', // Very light cream
    textPrimary: '#1a1a1a', // Dark professional text
    textSecondary: '#6b7280', // Medium gray
    onlineIndicator: '#10b981', // Modern green
    adminBadge: '#d97706', // Warm amber
    border: '#e5e7eb', // Light gray border
    shadow: 'rgba(0, 0, 0, 0.08)', // Professional shadow
    inputBg: '#ffffff', // Clean input background
    buttonPrimary: '#0d5c75', // System color for buttons
    buttonHover: '#0a4658' // Darker hover state
  }

  // Responsive dimensions - better proportions
  const getChatDimensions = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      const height = window.innerHeight
      
      if (width < 640) {
        // Mobile - full screen but well-proportioned
        return {
          width: '100vw',
          height: '100vh',
          position: 'fixed' as const,
          bottom: 0,
          right: 0,
          left: 0,
          top: 0
        }
      } else if (width < 1024) {
        // Tablet - balanced proportions
        return {
          width: '80vw',
          height: '75vh',
          maxWidth: '420px'
        }
      } else {
        // Desktop - perfect compact size
        return {
          width: '360px',
          height: '560px'
        }
      }
    }
    
    // Default desktop dimensions - perfect proportions
    return {
      width: '360px',
      height: '560px'
    }
  }

  const chatDimensions = getChatDimensions()

  // Load messages from local storage first (for instant display)
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedMessages = JSON.parse(stored)
        const activeMessages = parsedMessages.filter((msg: ChatMessage) => !msg.is_deleted)
        setMessages(activeMessages)
      }
    } catch (error) {
      console.error('Error loading from local storage:', error)
    }
  }, [])

  // Save messages to local storage
  const saveToLocalStorage = useCallback((messages: ChatMessage[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch (error) {
      console.error('Error saving to local storage:', error)
    }
  }, [])

  // Load messages from database
  const loadMessagesFromDB = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data) {
        setMessages(data)
        saveToLocalStorage(data)
      }
    } catch (error) {
      console.error('Error loading messages from DB:', error)
      loadFromLocalStorage()
    }
  }, [loadFromLocalStorage, saveToLocalStorage])

  // Load group settings
  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('group_chat_settings')
        .select('*')

      if (error) throw error

      if (data) {
        const settingsObj: any = {}
        data.forEach(setting => {
          if (setting.setting_key === 'allow_staff_messages' || setting.setting_key === 'auto_clear_enabled') {
            settingsObj[setting.setting_key] = setting.setting_value === 'true'
          } else if (setting.setting_key === 'message_retention_days') {
            settingsObj[setting.setting_key] = parseInt(setting.setting_value) || 30
          } else {
            settingsObj[setting.setting_key] = setting.setting_value
          }
        })
        setSettings(settingsObj)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setSettings({
        group_name: 'Medical Team Communication',
        allow_staff_messages: true,
        message_retention_days: 30,
        auto_clear_enabled: false,
        last_cleared_by: 'none',
        last_cleared_at: 'never'
      })
    }
  }, [])

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || isLoading) return

    if (currentUserRole === 'staff' && !settings.allow_staff_messages) {
      toast({
        title: "Message Not Sent",
        description: "Staff messages are currently disabled",
        variant: "destructive"
      })
      return
    }

    const messageText = newMessage.trim()
    setNewMessage('')
    setIsLoading(true)

    const messageObj: Partial<ChatMessage> = {
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_role: currentUserRole,
      message: messageText,
      message_type: 'text',
      read: false,
      delivered: true,
      delivered_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageObj)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setMessages(prev => [...prev, data])
        saveToLocalStorage([...messages, data])
        
        // Update message status (WhatsApp-style)
        updateMessageStatus(data.id)
        
        // Auto-scroll to new message
        setTimeout(() => scrollToBottom(true), 100)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      const localMessage: ChatMessage = {
        ...messageObj as ChatMessage,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      setMessages(prev => [...prev, localMessage])
      saveToLocalStorage([...messages, localMessage])
      
      toast({
        title: "Message Saved Locally",
        description: "Will sync when connection is restored",
        variant: "default"
      })
    } finally {
      setIsLoading(false)
    }
  }, [newMessage, isLoading, currentUserRole, settings.allow_staff_messages, currentUserId, currentUserName, messages, saveToLocalStorage, toast])

  // Delete message (admin only)
  const deleteMessage = useCallback(async (messageId: string) => {
    if (currentUserRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete messages",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase.rpc('delete_message', {
        message_id: messageId,
        admin_id: currentUserId
      })

      if (error) throw error

      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, is_deleted: true, deleted_by: currentUserId, deleted_at: new Date().toISOString() }
          : msg
      ))
      
      const updatedMessages = messages.filter(msg => msg.id !== messageId)
      saveToLocalStorage(updatedMessages)

      toast({
        title: "Message Deleted",
        description: "The message has been removed for all users"
      })
    } catch (error) {
      console.error('Error deleting message:', error)
      toast({
        title: "Delete Failed",
        description: "Could not delete message",
        variant: "destructive"
      })
    }
  }, [currentUserRole, currentUserId, messages, saveToLocalStorage, toast])

  // Clear all messages (admin only)
  const clearAllMessages = useCallback(async () => {
    if (currentUserRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can clear messages",
        variant: "destructive"
      })
      return
    }

    if (!confirm('Are you sure you want to clear all messages? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase.rpc('clear_all_messages', {
        admin_id: currentUserId
      })

      if (error) throw error

      setMessages([])
      saveToLocalStorage([])

      toast({
        title: "Chat Cleared",
        description: "All messages have been removed"
      })
    } catch (error) {
      console.error('Error clearing messages:', error)
      toast({
        title: "Clear Failed",
        description: "Could not clear messages",
        variant: "destructive"
      })
    }
  }, [currentUserRole, currentUserId, saveToLocalStorage, toast])

  // Real-time subscription
  useEffect(() => {
    if (!isOpen) return

    const channel = supabase
      .channel('perfect_whatsapp_chat')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `is_deleted=eq.false`
        }, 
        (payload) => {
          const newMessage = payload.new as ChatMessage
          setMessages(prev => {
            const updated = [...prev, newMessage]
            saveToLocalStorage(updated)
            return updated
          })
          
          // Auto-scroll to new message
          setTimeout(() => scrollToBottom(false), 100)
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage
          
          if (updatedMessage.is_deleted) {
            setMessages(prev => {
              const filtered = prev.filter(msg => msg.id !== updatedMessage.id)
              saveToLocalStorage(filtered)
              return filtered
            })
          } else {
            setMessages(prev => {
              const updated = prev.map(msg => 
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
              saveToLocalStorage(updated)
              return updated
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen, saveToLocalStorage])

  // Initialize
  useEffect(() => {
    if (isOpen) {
      loadFromLocalStorage()
      loadMessagesFromDB()
      loadSettings()
    }
  }, [isOpen, loadFromLocalStorage, loadMessagesFromDB, loadSettings])

  // Enhanced auto-scroll to bottom with WhatsApp-like behavior
  const scrollToBottom = useCallback((force = false) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100
      
      // Always scroll for own messages or when forced
      // For others' messages, only scroll if user is already at bottom
      if (force || isAtBottom) {
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          })
        }, 100)
      }
    }
  }, [])

  // WhatsApp-style message status simulation with proper read tracking
  const updateMessageStatus = useCallback(async (messageId: string) => {
    // Simulate delivery after 1 second
    setTimeout(async () => {
      try {
        await supabase
          .from('chat_messages')
          .update({ 
            delivered: true, 
            delivered_at: new Date().toISOString() 
          })
          .eq('id', messageId)
      } catch (error) {
        console.log('Failed to update delivery status')
      }
    }, 1000)

    // Mark other users' messages as read when viewed
    setTimeout(async () => {
      try {
        await supabase
          .from('chat_messages')
          .update({ 
            read: true, 
            read_at: new Date().toISOString() 
          })
          .eq('id', messageId)
          .neq('sender_id', currentUserId)
      } catch (error) {
        console.log('Failed to update read status')
      }
    }, 3000)
  }, [currentUserId])

  // Mark messages as read when chat is open
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const unreadMessages = messages.filter(
        msg => !msg.read && msg.sender_id !== currentUserId
      )
      
      unreadMessages.forEach(async (message) => {
        try {
          await supabase
            .from('chat_messages')
            .update({ 
              read: true, 
              read_at: new Date().toISOString() 
            })
            .eq('id', message.id)
        } catch (error) {
          console.log('Failed to mark message as read')
        }
      })
    }
  }, [isOpen, messages, currentUserId])

  // Enhanced auto-scroll for new messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const isFromCurrentUser = lastMessage.sender_id === currentUserId
      
      // Always scroll for own messages, scroll for others if at bottom
      scrollToBottom(isFromCurrentUser)
    }
  }, [messages, currentUserId, scrollToBottom])

  // Scroll on initial load
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(() => scrollToBottom(true), 100)
    }
  }, [isOpen, messages.length, scrollToBottom])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    let hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes
    return `${hours}:${minutesStr} ${ampm}`
  }

  const activeMessages = messages.filter(msg => !msg.is_deleted)

  // Common emojis list
  const commonEmojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤏', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '🤝', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦', '🤷', '👨‍⚕️', '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚖️', '👩‍⚖️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤', '👨‍🎨', '👩‍🎨', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', '👨‍🚒', '👩‍🚒', '👮', '🕵️', '💂', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧝', '🧛', '🧟', '🧞', '🧜', '🧚', '🧞‍♂️', '🧞‍♀️', '🧟‍♂️', '🧟‍♀️', '🧛‍♂️', '🧛‍♀️', '🧜‍♂️', '🧜‍♀️', '🧚‍♂️', '🧚‍♀️', '🧙‍♂️', '🧙‍♀️', '💂‍♂️', '💂‍♀️', '👮‍♂️', '👮‍♀️', '🕵️‍♂️', '🕵️‍♀️', '👷‍♂️', '👷‍♀️', '🤴‍♂️', '👸‍♀️', '👳‍♂️', '🧕‍♀️', '🧔‍♂️', '👱‍♀️', '👱‍♂️', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱', '👨‍🦳', '👩‍🦳', '👨‍🦲', '👩‍🦲', '🙋‍♂️', '🙋‍♀️', '🙇‍♂️', '🙇‍♀️', '🙏', '🤝', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄']

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  // Handle file upload with better error handling
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    setUploadedFile(file)

    try {
      // Create a simple file message without uploading to storage for now
      const fileMessage: Partial<ChatMessage> = {
        sender_id: currentUserId,
        sender_name: currentUserName,
        sender_role: currentUserRole,
        message: `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        message_type: 'text', // Use text type for now
        read: false,
        delivered: true,
        delivered_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(fileMessage)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setMessages(prev => [...prev, data])
        saveToLocalStorage([...messages, data])
        setTimeout(() => scrollToBottom(true), 100)
      }

      toast({
        title: "File Message Sent",
        description: `${file.name} message sent successfully`,
      })

    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to send file message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setUploadedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle voice recording with MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Here you would normally upload the audio file
        // For now, we'll just show a message
        const voiceMessage: Partial<ChatMessage> = {
          sender_id: currentUserId,
          sender_name: currentUserName,
          sender_role: currentUserRole,
          message: '🎤 Voice message',
          message_type: 'text', // Change to 'voice' when you implement voice storage
          read: false,
          delivered: true,
          delivered_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('chat_messages')
          .insert(voiceMessage)
          .select()
          .single()

        if (!error && data) {
          setMessages(prev => [...prev, data])
          saveToLocalStorage([...messages, data])
          setTimeout(() => scrollToBottom(true), 100)
        }

        // Clean up
        stream.getTracks().forEach(track => track.stop())
        URL.revokeObjectURL(audioUrl)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)
      
      const interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 59) {
            stopRecording()
            return 0
          }
          return prev + 1
        })
      }, 1000)
      
      ;(window as any).recordingInterval = interval

    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    setIsRecording(false)
    setRecordingTime(0)
    
    if ((window as any).recordingInterval) {
      clearInterval((window as any).recordingInterval)
      delete (window as any).recordingInterval
    }
  }

  // Handle call functionality
  const startCall = async (type: 'voice' | 'video') => {
    setCallStatus('calling')
    setIsInCall(true)
    
    const callMessage: Partial<ChatMessage> = {
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_role: currentUserRole,
      message: type === 'voice' ? '📞 Voice call started' : '📹 Video call started',
      message_type: 'call',
      call_type: type,
      call_status: 'outgoing',
      read: false,
      delivered: true,
      delivered_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(callMessage)
        .select()
        .single()

      if (!error && data) {
        setMessages(prev => [...prev, data])
        saveToLocalStorage([...messages, data])
        setTimeout(() => scrollToBottom(true), 100)
      }

      toast({
        title: "Call Started",
        description: `${type === 'voice' ? 'Voice' : 'Video'} call initiated`,
      })

      // Simulate call connection
      setTimeout(() => {
        setCallStatus('connected')
        startCallTimer()
      }, 2000)

    } catch (error) {
      console.error('Error starting call:', error)
      setCallStatus('idle')
      setIsInCall(false)
    }
  }

  const endCall = () => {
    setCallStatus('ended')
    setIsInCall(false)
    
    if ((window as any).callTimer) {
      clearInterval((window as any).callTimer)
      delete (window as any).callTimer
    }

    const endCallMessage: Partial<ChatMessage> = {
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_role: currentUserRole,
      message: `📞 Call ended (${formatCallDuration(callDuration)})`,
      message_type: 'call',
      call_type: 'voice',
      call_status: 'completed',
      call_duration: callDuration,
      read: false,
      delivered: true,
      delivered_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    supabase
      .from('chat_messages')
      .insert(endCallMessage)
      .select()
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setMessages(prev => [...prev, data])
          saveToLocalStorage([...messages, data])
        }
      })

    setCallDuration(0)
  }

  const startCallTimer = () => {
    ;(window as any).callTimer = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Professional luxury floating chat button with premium animations
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          {/* Main luxury button - minimal animations */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-12 h-12 rounded-full shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/20"
            style={{
              background: 'linear-gradient(145deg, #1e293b 0%, #334155 50%, #475569 100%)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              cursor: 'pointer'
            }}
          >
            {/* Inner metallic gradient */}
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-gray-700/50 to-gray-900/50 backdrop-blur-sm"></div>
            
            {/* Premium message icon */}
            <div className="relative z-10 flex items-center justify-center">
              {/* Icon background circle */}
              <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm"></div>
              
              {/* Message icon */}
              <svg 
                className="relative w-5 h-5 text-white drop-shadow-lg" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
              
              {/* Status indicator - static */}
              <div className="absolute bottom-0.5 right-0.5 w-2 h-2">
                <div className="w-full h-full bg-green-400 rounded-full"></div>
              </div>
            </div>
            
            {/* Notification badge */}
            {activeMessages.length > 0 && (
              <div className="absolute -top-0.5 -right-0.5 z-20">
                {/* Badge shadow */}
                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-sm"></div>
                
                {/* Main badge */}
                <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center border border-white/20 shadow-md">
                  {activeMessages.length > 9 ? '9+' : activeMessages.length}
                </div>
                
                {/* Badge highlight */}
                <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white/50 rounded-full"></div>
              </div>
            )}
          </button>
          
          {/* Simple tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
            <div className="relative">
              {/* Tooltip content */}
              <div className="bg-gray-900/95 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg shadow-lg border border-white/10">
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span className="font-medium">
                    {activeMessages.length > 0 ? `${activeMessages.length} new message${activeMessages.length > 1 ? 's' : ''}` : 'Start conversation'}
                  </span>
                </div>
              </div>
              
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-gray-900/95"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={chatRef}
      className="z-50 flex flex-col"
      style={{
        position: chatDimensions.position || 'fixed',
        bottom: chatDimensions.bottom !== undefined ? chatDimensions.bottom : '1.5rem',
        right: chatDimensions.right !== undefined ? chatDimensions.right : '1.5rem',
        left: chatDimensions.left || 'auto',
        top: chatDimensions.top || 'auto'
      }}
    >
      {/* Chat Window */}
      <Card 
        className="shadow-2xl border overflow-hidden flex flex-col"
        style={{
          width: chatDimensions.width,
          height: chatDimensions.height,
          maxWidth: chatDimensions.maxWidth || 'none',
          backgroundColor: colors.messageReceived,
          borderColor: colors.border,
          boxShadow: `0 10px 40px ${colors.shadow}, 0 0 0 1px ${colors.border}`
        }}
      >
        {/* Enhanced Header with WhatsApp-style features */}
        <CardHeader 
          className="p-3.5 flex flex-row items-center justify-between flex-shrink-0 border-b"
          style={{ backgroundColor: colors.headerBg, borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5">
              <div className="relative">
                <Users className="h-4.5 w-4.5 text-white" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white"></div>
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-white leading-tight">
                  {settings.group_name}
                </CardTitle>
                <div className="flex items-center space-x-3 text-xs text-blue-100 mt-0.5">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{onlineUsers.length + 1} online</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {currentUserRole === 'admin' && (
                    <div className="flex items-center space-x-1 bg-amber-500/20 px-1.5 py-0.5 rounded-full">
                      <Crown className="h-3 w-3 text-amber-300" />
                      <span className="text-amber-200">Admin</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Connection Status Indicator */}
            <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full">
              <Wifi className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">Connected</span>
            </div>
            
            {/* Call Buttons - Moved to header */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startCall('voice')}
                disabled={isInCall}
                className="text-white hover:bg-white/20 p-1.5 transition-all duration-200 hover:scale-105"
                title="Voice Call"
              >
                <Phone className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startCall('video')}
                disabled={isInCall}
                className="text-white hover:bg-white/20 p-1.5 transition-all duration-200 hover:scale-105"
                title="Video Call"
              >
                <Video className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            {/* Admin Settings */}
            {currentUserRole === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-white/20 p-2 transition-all duration-200 hover:scale-105"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            )}
            
            {/* Close Button - Moved up */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-2 transition-all duration-200 hover:scale-105"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Fixed Admin Settings Panel */}
        {currentUserRole === 'admin' && showSettings && (
          <div className="p-3 border-b flex-shrink-0" style={{ backgroundColor: colors.secondary, borderColor: colors.border }}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Staff Messages</span>
                <Button
                  variant={settings.allow_staff_messages ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      allow_staff_messages: !prev.allow_staff_messages
                    }))
                  }}
                  className={`text-xs px-3 py-1.5 h-7 transition-colors ${
                    settings.allow_staff_messages 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {settings.allow_staff_messages ? "Enabled" : "Disabled"}
                </Button>
              </div>
              
              <Separator style={{ backgroundColor: colors.border }} />
              
              <div className="flex space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearAllMessages}
                  className="flex items-center space-x-1.5 text-xs px-3 py-1.5 h-7 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear All</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadMessagesFromDB()
                    toast({
                      title: "Refreshed",
                      description: "Messages have been synchronized"
                    })
                  }}
                  className="flex items-center space-x-1.5 text-xs px-3 py-1.5 h-7 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Sync</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Messages Area - Completely hidden scrollbars */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ 
            backgroundColor: colors.sidebarBg,
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none' /* IE and Edge */
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none; /* Chrome, Safari and Opera */
            }
            div::-webkit-scrollbar-track {
              display: none;
            }
            div::-webkit-scrollbar-thumb {
              display: none;
            }
            div::-webkit-scrollbar-button {
              display: none;
            }
          `}</style>
          <div className="p-3 space-y-2">
            {activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  No messages yet
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {currentUserRole === 'admin' 
                    ? "Start the conversation with your team" 
                    : settings.allow_staff_messages 
                    ? "Send a message to start chatting" 
                    : "Waiting for admin to enable messages..."
                  }
                </p>
              </div>
            ) : (
              activeMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                  } mb-2`}
                >
                  <div className="max-w-[75%]">
                    {/* Sender info for other users' messages */}
                    {message.sender_id !== currentUserId && (
                      <div className="flex items-center space-x-1.5 mb-1 px-1">
                        <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                          {message.sender_name}
                        </span>
                        {message.sender_role === 'admin' && (
                          <Crown className="h-3 w-3" style={{ color: colors.adminBadge }} />
                        )}
                      </div>
                    )}
                    
                    <div
                      className="rounded-2xl px-3 py-2 shadow-sm border"
                      style={{
                        backgroundColor: message.sender_id === currentUserId 
                          ? colors.messageSent 
                          : message.sender_role === 'admin' 
                          ? colors.adminMessage 
                          : colors.messageReceived,
                        borderColor: colors.border,
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      {/* File Message */}
                      {message.message_type === 'file' && (
                        <div className="flex items-center space-x-2">
                          <File className="w-5 h-5 text-blue-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                              {message.file_name}
                            </p>
                            <p className="text-xs" style={{ color: colors.textSecondary }}>
                              {message.file_size && `${(message.file_size / 1024).toFixed(1)} KB`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (message.file_url) {
                                window.open(message.file_url, '_blank')
                              }
                            }}
                            className="text-blue-500 hover:text-blue-700 p-1"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Call Message */}
                      {message.message_type === 'call' && (
                        <div className="flex items-center space-x-2">
                          {message.call_type === 'voice' ? (
                            <PhoneCall className="w-5 h-5 text-green-500" />
                          ) : (
                            <Video className="w-5 h-5 text-blue-500" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm" style={{ color: colors.textPrimary }}>
                              {message.message}
                            </p>
                            {message.call_duration && (
                              <p className="text-xs" style={{ color: colors.textSecondary }}>
                                Duration: {formatCallDuration(message.call_duration)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Text Message */}
                      {message.message_type === 'text' && (
                        <p className="text-sm break-words leading-relaxed" style={{ color: colors.textPrimary }}>
                          {message.message}
                        </p>
                      )}
                      
                      {/* WhatsApp-style Message Status - Fixed positioning inside textbox */}
                      <div className="flex items-center justify-end mt-1 text-xs">
                        <span style={{ color: colors.textSecondary }}>{formatTime(message.created_at)}</span>
                        {message.edited && <span style={{ color: colors.textSecondary }}>edited</span>}
                        {message.sender_id === currentUserId && (
                          <div className="flex items-center ml-1">
                            {message.read ? (
                              <div className="flex items-center h-3">
                                {/* Bottom check - blue when read */}
                                <svg 
                                  className="w-3 h-3" 
                                  style={{ color: '#53bdeb' }}
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {/* Top check - overlapping, blue when read */}
                                <svg 
                                  className="w-3 h-3 -ml-1.5" 
                                  style={{ color: '#53bdeb' }}
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) : message.delivered ? (
                              <div className="flex items-center h-3">
                                {/* Bottom check - gray when delivered but not read */}
                                <svg 
                                  className="w-3 h-3" 
                                  style={{ color: colors.textSecondary }}
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {/* Top check - overlapping, gray when delivered but not read */}
                                <svg 
                                  className="w-3 h-3 -ml-1.5" 
                                  style={{ color: colors.textSecondary }}
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) : (
                              /* Single check - gray when sent but not delivered */
                              <svg 
                                className="w-3 h-3" 
                                style={{ color: colors.textSecondary }}
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Admin delete button for other users' messages */}
                    {currentUserRole === 'admin' && message.sender_id !== currentUserId && (
                      <div className="flex justify-end mt-1 px-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMessage(message.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>

        {/* Enhanced Message Input with WhatsApp features */}
        <div className="p-3 border-t flex-shrink-0" style={{ backgroundColor: colors.messageReceived, borderColor: colors.border }}>
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="px-3 py-1 mb-2 text-xs text-gray-500 italic">
              {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people are typing...`}
            </div>
          )}
          
          {currentUserRole === 'staff' && !settings.allow_staff_messages && (
            <div className="mb-2 p-2 rounded-lg" style={{ backgroundColor: '#fef3c7', border: `1px solid #f59e0b` }}>
              <p className="text-xs" style={{ color: '#92400e' }}>
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Staff messages are currently disabled by administrator
              </p>
            </div>
          )}
          
          <div className="flex items-end space-x-2">
            {/* Emoji Button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-500 hover:text-gray-700 p-2 transition-colors"
              >
                😊
              </Button>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50">
                  <div className="grid grid-cols-8 gap-1 max-h-60 overflow-y-auto">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-lg hover:bg-gray-100 rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* File Upload Button */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept="*/*"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-gray-500 hover:text-gray-700 p-2 transition-colors"
              >
                {isUploading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Voice Recording Button */}
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`p-2 transition-colors ${isRecording ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {isRecording ? (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-xs text-red-500 font-medium">{recordingTime}s</span>
                </div>
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            
            {/* Multi-line Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                placeholder={
                  currentUserRole === 'staff' && !settings.allow_staff_messages
                    ? "Messages disabled"
                    : "Type a message..."
                }
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  // Auto-resize textarea
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                  
                  // Simulate typing indicator
                  if (e.target.value.length > 0 && !isTyping) {
                    setIsTyping(true)
                    setTimeout(() => setIsTyping(false), 1000)
                  }
                }}
                onFocus={() => {
                  // Simulate typing when focused
                  if (newMessage.length > 0) {
                    setIsTyping(true)
                  }
                }}
                onBlur={() => setIsTyping(false)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                disabled={
                  (currentUserRole === 'staff' && !settings.allow_staff_messages) ||
                  isLoading
                }
                className="w-full text-sm resize-none rounded-lg border px-3 py-2 max-h-32"
                style={{ 
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  fontSize: '0.875rem',
                  borderWidth: '1px',
                  minHeight: '40px',
                  lineHeight: '1.4'
                }}
                rows={1}
              />
            </div>
            
            {/* Send Button */}
            <Button
              onClick={sendMessage}
              disabled={
                !newMessage.trim() ||
                isLoading ||
                (currentUserRole === 'staff' && !settings.allow_staff_messages)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 min-w-[36px] h-9 transition-colors"
              style={{ backgroundColor: colors.buttonPrimary }}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : newMessage.trim() ? (
                <Send className="h-4 w-4" />
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5-1.428a1 1 0 00.576-1.409l-7-14z" />
                </svg>
              )}
            </Button>
          </div>
          
          {/* Call Overlay */}
          {isInCall && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
              <div className="bg-white rounded-lg p-6 text-center">
                <div className="mb-4">
                  {callStatus === 'calling' && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-6 h-6 text-green-500 animate-pulse" />
                      <span className="text-lg font-medium">Calling...</span>
                    </div>
                  )}
                  {callStatus === 'connected' && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-6 h-6 text-green-500" />
                      <span className="text-lg font-medium">{formatCallDuration(callDuration)}</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={endCall}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
