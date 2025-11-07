"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Plus, Clock, CheckCircle, Edit3, Trash2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import type { Patient } from '@/lib/supabase'

interface TreatmentNote {
  id: string
  patientId: string
  patientName: string
  sessionNumber: number
  date: string
  notes: string
  diagnosis: string
  treatmentProvided: string
  nextSteps: string
  createdBy: string
  createdAt: string
}

interface TreatmentNotesProps {
  patient: Patient
  onNotesUpdated?: () => void
  isDarkMode?: boolean
}

export function TreatmentNotes({ patient, onNotesUpdated, isDarkMode = false }: TreatmentNotesProps) {
  const [notes, setNotes] = useState<TreatmentNote[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<TreatmentNote | null>(null)
  const [newNote, setNewNote] = useState({
    notes: '',
    diagnosis: '',
    treatmentProvided: '',
    nextSteps: ''
  })
  const { toast } = useToast()

  // Load notes from localStorage on mount
  useEffect(() => {
    loadNotes()
  }, [patient.id])

  const loadNotes = () => {
    try {
      const storedNotes = localStorage.getItem('treatment_notes')
      if (storedNotes) {
        const allNotes: TreatmentNote[] = JSON.parse(storedNotes)
        const patientNotes = allNotes.filter(n => n.patientId === patient.id)
        setNotes(patientNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      }
    } catch (error) {
      console.error('Error loading treatment notes:', error)
    }
  }

  const saveNote = () => {
    try {
      const sessionNumber = (patient.sessions_completed || 0) + 1
      const note: TreatmentNote = {
        id: `TN${Date.now()}`,
        patientId: patient.id,
        patientName: patient.name,
        sessionNumber,
        date: new Date().toISOString(),
        notes: newNote.notes,
        diagnosis: newNote.diagnosis,
        treatmentProvided: newNote.treatmentProvided,
        nextSteps: newNote.nextSteps,
        createdBy: localStorage.getItem('admin_email') || 'Admin',
        createdAt: new Date().toISOString()
      }

      // Save to localStorage
      const storedNotes = localStorage.getItem('treatment_notes')
      const allNotes: TreatmentNote[] = storedNotes ? JSON.parse(storedNotes) : []
      allNotes.push(note)
      localStorage.setItem('treatment_notes', JSON.stringify(allNotes))

      // Reset form
      setNewNote({ notes: '', diagnosis: '', treatmentProvided: '', nextSteps: '' })
      setIsAddDialogOpen(false)
      loadNotes()
      onNotesUpdated?.()

      toast({
        title: "✅ Treatment Note Saved",
        description: `Session ${sessionNumber} note added successfully`
      })
    } catch (error) {
      console.error('Error saving treatment note:', error)
      toast({
        title: "Error",
        description: "Failed to save treatment note",
        variant: "destructive"
      })
    }
  }

  const deleteNote = (noteId: string) => {
    try {
      const storedNotes = localStorage.getItem('treatment_notes')
      if (storedNotes) {
        const allNotes: TreatmentNote[] = JSON.parse(storedNotes)
        const filteredNotes = allNotes.filter(n => n.id !== noteId)
        localStorage.setItem('treatment_notes', JSON.stringify(filteredNotes))
        loadNotes()
        toast({
          title: "🗑️ Note Deleted",
          description: "Treatment note removed successfully"
        })
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-[#0d5c75]'}`}>
            Treatment Notes
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Session-by-session treatment documentation
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#2a9d8f] hover:bg-[#238a7a]">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#0d5c75]">
                Add Treatment Note - Session {(patient.sessions_completed || 0) + 1}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Clinical Notes</Label>
                <Textarea
                  value={newNote.notes}
                  onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
                  placeholder="Document observations, patient feedback, etc."
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label>Diagnosis / Assessment</Label>
                <Textarea
                  value={newNote.diagnosis}
                  onChange={(e) => setNewNote({ ...newNote, diagnosis: e.target.value })}
                  placeholder="Current diagnosis and assessment findings"
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label>Treatment Provided</Label>
                <Textarea
                  value={newNote.treatmentProvided}
                  onChange={(e) => setNewNote({ ...newNote, treatmentProvided: e.target.value })}
                  placeholder="Adjustments, techniques used, etc."
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label>Next Steps / Recommendations</Label>
                <Textarea
                  value={newNote.nextSteps}
                  onChange={(e) => setNewNote({ ...newNote, nextSteps: e.target.value })}
                  placeholder="Follow-up plan, home care instructions, etc."
                  className="min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveNote} className="bg-[#0d5c75] hover:bg-[#0a4a5c]">
                  Save Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <Card className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
            <CardContent className="py-8 text-center">
              <FileText className={`h-12 w-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No treatment notes yet. Add your first note to start documenting this patient's progress.
              </p>
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className={`border-l-4 border-l-[#2a9d8f] ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-[#2a9d8f]">
                      Session {note.sessionNumber}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {new Date(note.date).toLocaleDateString()} at {new Date(note.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteNote(note.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {note.notes && (
                  <div>
                    <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#0d5c75]'} mb-1`}>
                      Clinical Notes
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {note.notes}
                    </p>
                  </div>
                )}
                {note.diagnosis && (
                  <div>
                    <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#0d5c75]'} mb-1`}>
                      Diagnosis / Assessment
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {note.diagnosis}
                    </p>
                  </div>
                )}
                {note.treatmentProvided && (
                  <div>
                    <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#0d5c75]'} mb-1`}>
                      Treatment Provided
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {note.treatmentProvided}
                    </p>
                  </div>
                )}
                {note.nextSteps && (
                  <div>
                    <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#0d5c75]'} mb-1`}>
                      Next Steps
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {note.nextSteps}
                    </p>
                  </div>
                )}
                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} pt-2 border-t`}>
                  Created by {note.createdBy} on {new Date(note.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

