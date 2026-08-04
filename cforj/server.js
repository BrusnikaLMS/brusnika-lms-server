const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const app = express()
const PORT = process.env.PORT || 3050
const COURSES_DIR = path.join(__dirname, 'courses')
const DIST_DIR = path.join(__dirname, 'dist')
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'cforj-embed-secret'

// Ensure courses directory exists
if (!fs.existsSync(COURSES_DIR)) fs.mkdirSync(COURSES_DIR, { recursive: true })

app.use(express.json())

// Serve static player files
app.use('/assets', express.static(path.join(DIST_DIR, 'assets')))

// ── Admin auth middleware ──────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// ── Upload course ─────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
})

app.post('/api/courses/upload', requireAdmin, upload.single('file'), (req, res) => {
  try {
    const raw = req.file ? req.file.buffer.toString('utf-8') : req.body.course
    if (!raw) return res.status(400).json({ error: 'No course data provided' })

    const course = JSON.parse(raw)
    if (!course.id || !course.title || !course.screens) {
      return res.status(400).json({ error: 'Invalid course.json — must have id, title, screens' })
    }

    const courseId = course.id
    const coursePath = path.join(COURSES_DIR, `${courseId}.json`)
    fs.writeFileSync(coursePath, JSON.stringify(course, null, 2))

    const meta = {
      id: courseId,
      title: course.title,
      screens: course.screens.length,
      uploadedAt: new Date().toISOString(),
    }
    const metaPath = path.join(COURSES_DIR, `${courseId}.meta.json`)
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))

    res.json({
      id: courseId,
      title: course.title,
      embedUrl: `${req.protocol}://${req.get('host')}/play/${courseId}`,
      iframeCode: `<iframe src="${req.protocol}://${req.get('host')}/play/${courseId}" width="100%" height="600" frameborder="0" allow="fullscreen"></iframe>`,
    })
  } catch (e) {
    res.status(400).json({ error: 'Invalid JSON: ' + e.message })
  }
})

// ── List courses ──────────────────────────────────────────────────────────

app.get('/api/courses', requireAdmin, (req, res) => {
  const files = fs.readdirSync(COURSES_DIR).filter(f => f.endsWith('.meta.json'))
  const courses = files.map(f => {
    const meta = JSON.parse(fs.readFileSync(path.join(COURSES_DIR, f), 'utf-8'))
    return meta
  })
  courses.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
  res.json(courses)
})

// ── Get course JSON ───────────────────────────────────────────────────────

app.get('/api/courses/:id', (req, res) => {
  const coursePath = path.join(COURSES_DIR, `${req.params.id}.json`)
  if (!fs.existsSync(coursePath)) return res.status(404).json({ error: 'Course not found' })
  res.sendFile(coursePath)
})

// ── Delete course ─────────────────────────────────────────────────────────

app.delete('/api/courses/:id', requireAdmin, (req, res) => {
  const courseId = req.params.id
  const coursePath = path.join(COURSES_DIR, `${courseId}.json`)
  const metaPath = path.join(COURSES_DIR, `${courseId}.meta.json`)
  if (fs.existsSync(coursePath)) fs.unlinkSync(coursePath)
  if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath)
  res.json({ status: 'deleted' })
})

// ── Player page ───────────────────────────────────────────────────────────

app.get('/play/:id', (req, res) => {
  const courseId = req.params.id
  const coursePath = path.join(COURSES_DIR, `${courseId}.json`)
  if (!fs.existsSync(coursePath)) return res.status(404).send('Course not found')

  // Serve the built React player with course ID injected
  const indexPath = path.join(DIST_DIR, 'index.html')
  if (!fs.existsSync(indexPath)) {
    return res.status(500).send('Player not built. Run: npm run build')
  }
  let html = fs.readFileSync(indexPath, 'utf-8')
  html = html.replace(
    '</head>',
    `<script>window.__CFORJ_COURSE_ID__="${courseId}";window.__CFORJ_API__="";</script></head>`
  )
  res.send(html)
})

// ── Admin UI ──────────────────────────────────────────────────────────────

app.get('/admin', requireAdmin, (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>cforj embed — Admin</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; }
    .container { max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 24px; margin-bottom: 24px; }
    .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .upload-area { border: 2px dashed #ddd; border-radius: 8px; padding: 40px; text-align: center; cursor: pointer; }
    .upload-area:hover { border-color: #6C63FF; background: #f8f7ff; }
    .upload-area.dragover { border-color: #6C63FF; background: #f0eeff; }
    .btn { background: #6C63FF; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; }
    .btn:hover { background: #5a52e0; }
    .btn-red { background: #ef4444; }
    .btn-red:hover { background: #dc2626; }
    .course-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee; }
    .course-item:last-child { border-bottom: none; }
    .embed-code { background: #f5f5f5; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; margin-top: 8px; }
    input[type="file"] { display: none; }
    .status { padding: 8px 16px; border-radius: 8px; margin-top: 12px; }
    .status.ok { background: #ecfdf5; color: #065f46; }
    .status.err { background: #fef2f2; color: #991b1b; }
    a { color: #6C63FF; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>cforj embed — Admin</h1>

    <div class="card">
      <h3 style="margin-bottom:12px">Upload Course</h3>
      <div class="upload-area" id="dropzone" onclick="document.getElementById('fileInput').click()">
        <p>Drop <strong>course.json</strong> here or click to upload</p>
        <input type="file" id="fileInput" accept=".json" />
      </div>
      <div id="uploadStatus"></div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:12px">Courses</h3>
      <div id="courseList">Loading...</div>
    </div>
  </div>

  <script>
    const TOKEN = new URLSearchParams(location.search).get('token') || '${ADMIN_TOKEN}';
    const headers = { 'Authorization': 'Bearer ' + TOKEN };

    // Upload
    const dz = document.getElementById('dropzone');
    const fi = document.getElementById('fileInput');
    const st = document.getElementById('uploadStatus');

    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); upload(e.dataTransfer.files[0]); });
    fi.addEventListener('change', () => { if (fi.files[0]) upload(fi.files[0]); });

    async function upload(file) {
      st.innerHTML = '<div class="status">Uploading...</div>';
      const fd = new FormData();
      fd.append('file', file);
      try {
        const r = await fetch('/api/courses/upload', { method: 'POST', headers, body: fd });
        const d = await r.json();
        if (r.ok) {
          st.innerHTML = '<div class="status ok">Uploaded: ' + d.title + '<div class="embed-code">' + d.iframeCode + '</div></div>';
          loadCourses();
        } else {
          st.innerHTML = '<div class="status err">Error: ' + d.error + '</div>';
        }
      } catch(e) { st.innerHTML = '<div class="status err">Error: ' + e.message + '</div>'; }
    }

    // List
    async function loadCourses() {
      const cl = document.getElementById('courseList');
      try {
        const r = await fetch('/api/courses', { headers });
        const courses = await r.json();
        if (!courses.length) { cl.innerHTML = '<p style="color:#999">No courses yet</p>'; return; }
        cl.innerHTML = courses.map(c => \`
          <div class="course-item">
            <div>
              <strong>\${c.title}</strong>
              <span style="color:#999;font-size:12px;margin-left:8px">\${c.screens} screens</span>
              <div class="embed-code">&lt;iframe src="\${location.origin}/play/\${c.id}" width="100%" height="600" frameborder="0"&gt;&lt;/iframe&gt;</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
              <a href="/play/\${c.id}" target="_blank">Preview</a>
              <button class="btn btn-red" onclick="deleteCourse('\${c.id}')" style="padding:6px 12px;font-size:12px">Delete</button>
            </div>
          </div>
        \`).join('');
      } catch(e) { cl.innerHTML = '<p style="color:red">Failed to load</p>'; }
    }

    async function deleteCourse(id) {
      if (!confirm('Delete this course?')) return;
      await fetch('/api/courses/' + id, { method: 'DELETE', headers });
      loadCourses();
    }

    loadCourses();
  </script>
</body>
</html>`)
})

// ── Health ─────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'cforj-embed', version: '1.0.0' })
})

app.listen(PORT, () => {
  console.log(`cforj-embed running on http://localhost:${PORT}`)
  console.log(`Admin: http://localhost:${PORT}/admin?token=${ADMIN_TOKEN}`)
})
