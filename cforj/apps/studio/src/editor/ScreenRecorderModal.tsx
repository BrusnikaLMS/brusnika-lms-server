import { useState, useRef, useEffect } from 'react'
import type { SimulationStep } from '@course-studio/player'

interface Props {
  onImportSimulation: (steps: SimulationStep[]) => void
  onAddVideo: (src: string) => void
  onClose: () => void
}

type RecordState = 'idle' | 'recording' | 'stopped' | 'processing'

export function ScreenRecorderModal({ onImportSimulation, onAddVideo, onClose }: Props) {
  const [state, setState] = useState<RecordState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [frameInterval, setFrameInterval] = useState(3)
  const [frameCount, setFrameCount] = useState(0)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const videoBlobRef = useRef<Blob | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 } as MediaTrackConstraints,
        audio: false,
      })
      streamRef.current = stream

      // Auto-stop if user closes native screen share dialog
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state === 'recording') stopRecording()
      }

      chunksRef.current = []
      const mimeType = getSupportedMimeType()
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        videoBlobRef.current = new Blob(chunksRef.current, {
          type: mimeType || 'video/webm',
        })
        streamRef.current?.getTracks().forEach((t) => t.stop())
      }

      mr.start(500)
      mediaRecorderRef.current = mr

      setState('recording')
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } catch (e) {
      const err = e as Error
      if (err.name !== 'NotAllowedError') {
        setError(err.message || 'Screen capture failed')
      }
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    mediaRecorderRef.current?.stop()
    setState('stopped')
  }

  async function handleImportSimulation() {
    if (!videoBlobRef.current) return
    setState('processing')
    setFrameCount(0)

    try {
      const frames = await extractFrames(
        videoBlobRef.current,
        frameInterval,
        (n) => setFrameCount(n),
      )

      if (frames.length === 0) throw new Error('No frames extracted. Try a shorter interval.')

      const steps: SimulationStep[] = frames.map((src, i) => ({
        id: `step-${Date.now()}-${i}`,
        image: src,
        instruction: `Step ${i + 1}`,
      }))

      onImportSimulation(steps)
    } catch (e) {
      setError((e as Error).message)
      setState('stopped')
    }
  }

  function handleAddVideo() {
    if (!videoBlobRef.current) return
    const url = URL.createObjectURL(videoBlobRef.current)
    onAddVideo(url)
  }

  const estimatedFrames = frameInterval > 0 ? Math.ceil(elapsed / frameInterval) : 0
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              🎬 Screen Recorder
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Record your screen → import as simulation
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* IDLE */}
          {state === 'idle' && (
            <>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 text-center space-y-2">
                <div className="text-4xl">🖥</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click <strong>Start Recording</strong>, choose the window/tab to capture,
                  perform your workflow, then stop.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Frames will be extracted as Screen Simulation steps, or saved as a video clip.
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={startRecording}
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <span className="w-2.5 h-2.5 bg-white rounded-full" />
                Start Recording
              </button>
            </>
          )}

          {/* RECORDING */}
          {state === 'recording' && (
            <div className="text-center space-y-5 py-2">
              <div className="flex items-center justify-center gap-3">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shrink-0" />
                <span className="text-3xl font-mono font-bold text-gray-800 dark:text-gray-100 tabular-nums">
                  {fmt(elapsed)}
                </span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Recording in progress…
              </p>

              <button
                onClick={stopRecording}
                className="w-full py-2.5 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <span className="w-3 h-3 bg-white rounded-sm" />
                Stop Recording
              </button>
            </div>
          )}

          {/* STOPPED */}
          {state === 'stopped' && (
            <>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-center">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  ✓ Recording complete — {fmt(elapsed)}
                </p>
              </div>

              {/* Frame interval slider */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                  <span>Extract frame every</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">{frameInterval}s</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={frameInterval}
                  onChange={(e) => setFrameInterval(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  ≈ {estimatedFrames} frames from {fmt(elapsed)} recording
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="space-y-2">
                <button
                  onClick={handleImportSimulation}
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  🖥 Import as Screen Simulation
                  <span className="text-xs font-normal opacity-80">({estimatedFrames} steps)</span>
                </button>

                <button
                  onClick={handleAddVideo}
                  className="w-full py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm rounded-xl transition-colors"
                >
                  ▶ Add as Video Component
                </button>

                <button
                  onClick={() => { setState('idle'); setElapsed(0) }}
                  className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  Record again
                </button>
              </div>
            </>
          )}

          {/* PROCESSING */}
          {state === 'processing' && (
            <div className="text-center space-y-4 py-6">
              <div className="text-4xl animate-spin">⟳</div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Extracting frames…
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {frameCount} frame{frameCount !== 1 ? 's' : ''} processed
                </p>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${estimatedFrames > 0 ? Math.min(100, (frameCount / estimatedFrames) * 100) : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ]
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

async function extractFrames(
  blob: Blob,
  intervalSec: number,
  onProgress: (n: number) => void,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.src = url

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not decode the recorded video.'))
    }

    video.onloadedmetadata = () => {
      const { videoWidth, videoHeight, duration } = video

      // Scale down to max 1280px wide to keep data URLs manageable
      const scale = Math.min(1, 1280 / videoWidth)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(videoWidth * scale)
      canvas.height = Math.round(videoHeight * scale)
      const ctx = canvas.getContext('2d')!

      const frames: string[] = []
      const timestamps: number[] = []
      for (let t = 0; t < duration; t += intervalSec) timestamps.push(t)
      // Always include last frame
      if (timestamps[timestamps.length - 1] < duration - 0.1) timestamps.push(duration - 0.1)

      let idx = 0

      function seekNext() {
        if (idx >= timestamps.length) {
          URL.revokeObjectURL(url)
          resolve(frames)
          return
        }
        video.currentTime = timestamps[idx]
      }

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        frames.push(canvas.toDataURL('image/jpeg', 0.8))
        onProgress(frames.length)
        idx++
        seekNext()
      }

      // kick off
      seekNext()
    }

    video.load()
  })
}
