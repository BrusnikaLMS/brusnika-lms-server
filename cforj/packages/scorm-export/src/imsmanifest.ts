import type { CourseApp } from '@course-studio/player'

export function generateImsmanifest(app: CourseApp, scormVersion: '1.2' | '2004'): string {
  const isScorm12 = scormVersion === '1.2'

  const schema = isScorm12
    ? `<schema>ADL SCORM</schema><schemaversion>1.2</schemaversion>`
    : `<schema>ADL SCORM</schema><schemaversion>2004 4th Edition</schemaversion>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="app-${app.id}" version="1"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="${isScorm12 ? 'http://www.adlnet.org/xsd/adlcp_rootv1p2' : 'http://www.adlnet.org/xsd/adlcp_v1p3'}"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <metadata>
    ${schema}
  </metadata>

  <organizations default="org-${app.id}">
    <organization identifier="org-${app.id}">
      <title>${escapeXml(app.title)}</title>
      <item identifier="item-main" identifierref="res-main" isvisible="true">
        <title>${escapeXml(app.title)}</title>
      </item>
    </organization>
  </organizations>

  <resources>
    <resource identifier="res-main" type="webcontent" ${
      isScorm12 ? 'adlcp:scormtype="sco"' : 'adlcp:scormType="sco"'
    } href="index.html">
      <file href="index.html"/>
      <file href="course.json"/>
    </resource>
  </resources>

</manifest>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
