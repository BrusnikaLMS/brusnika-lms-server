import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { EditorLayout } from './editor/EditorLayout'
import { useEditorStore } from './store/editorStore'
import { embedApi } from './api/client'
import type { CourseApp } from '@course-studio/player'

export function App() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (id) {
      // Load existing course by ID
      embedApi.get(id)
        .then((c) => {
          useEditorStore.getState().setApp(c.content as unknown as CourseApp)
          setReady(true)
        })
        .catch((err) => {
          console.error('[cforj] Failed to load course:', err)
          setReady(true) // show editor with demo as fallback
        })
    } else {
      // No ID — wait briefly for CS_SET_CONFIG (with userId) before creating course
      // LMS flow: iframe loads → CS_READY → LMS sends CS_SET_CONFIG + CS_CREATE_COURSE
      // If CS_CREATE_COURSE comes, main.tsx handler takes over. Otherwise we auto-create.
      const timer = setTimeout(() => {
        embedApi.create('Untitled Course')
          .then((c) => {
            useEditorStore.getState().setApp(c.content as unknown as CourseApp)
            navigate(`/editor/${c.id}`, { replace: true })
            window.parent?.postMessage({ type: 'CS_COURSE_CREATED', courseId: c.id }, '*')
            setReady(true)
          })
          .catch((err) => {
            console.error('[cforj] Failed to create course:', err)
            setReady(true)
          })
      }, 500) // 500ms grace period for LMS to send CS_SET_CONFIG/CS_CREATE_COURSE
      return () => clearTimeout(timer)
    }
  }, [id])

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <EditorLayout />
}
