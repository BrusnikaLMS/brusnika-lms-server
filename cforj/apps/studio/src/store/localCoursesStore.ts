import { create } from 'zustand'
import type { CourseApp } from '@course-studio/player'
import { saveCourse, loadCourse, listCourses, deleteCourse } from './db'

export interface LocalCourseMeta {
  id: string
  title: string
  updatedAt: number
  createdAt: number
}

interface LocalCoursesState {
  courses: LocalCourseMeta[]
  initialized: boolean

  init: () => Promise<void>
  save: (app: CourseApp) => Promise<void>
  remove: (id: string) => Promise<void>
  load: (id: string) => Promise<CourseApp | undefined>
}

export const useLocalCoursesStore = create<LocalCoursesState>()((set) => ({
  courses: [],
  initialized: false,

  init: async () => {
    const courses = await listCourses()
    set({ courses, initialized: true })
  },

  save: async (app) => {
    await saveCourse(app)
    const courses = await listCourses()
    set({ courses })
  },

  remove: async (id) => {
    await deleteCourse(id)
    set((s) => ({ courses: s.courses.filter((c) => c.id !== id) }))
  },

  load: async (id) => {
    return loadCourse(id)
  },
}))
