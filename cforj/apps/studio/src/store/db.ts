import Dexie, { type Table } from 'dexie'
import type { CourseApp } from '@course-studio/player'

export interface StoredCourse {
  id: string
  title: string
  updatedAt: number
  createdAt: number
  data: CourseApp
}

class CforjDatabase extends Dexie {
  courses!: Table<StoredCourse>

  constructor() {
    super('cforj')
    this.version(1).stores({
      courses: 'id, title, updatedAt, createdAt',
    })
  }
}

export const db = new CforjDatabase()

export async function saveCourse(course: CourseApp): Promise<void> {
  const now = Date.now()
  const existing = await db.courses.get(course.id)
  await db.courses.put({
    id: course.id,
    title: course.title,
    updatedAt: now,
    createdAt: existing?.createdAt ?? now,
    data: course,
  })
}

export async function loadCourse(id: string): Promise<CourseApp | undefined> {
  const stored = await db.courses.get(id)
  return stored?.data
}

export async function listCourses(): Promise<Omit<StoredCourse, 'data'>[]> {
  return db.courses.orderBy('updatedAt').reverse().toArray(
    rows => rows.map(({ id, title, updatedAt, createdAt }) => ({ id, title, updatedAt, createdAt }))
  )
}

export async function deleteCourse(id: string): Promise<void> {
  await db.courses.delete(id)
}
