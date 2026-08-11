import { useT } from '../i18n'

interface Props {
  activeSection: string
  onSectionChange: (id: string) => void
}

type TFn = (k: string) => string

const DOC_NAV = [
  {
    category: 'doc_nav_getting_started',
    items: [
      { id: 'getting-started', labelKey: 'doc_nav_intro' },
      { id: 'quick-start', labelKey: 'doc_nav_quick_start' },
      { id: 'course-structure', labelKey: 'doc_nav_course_structure' },
    ],
  },
  {
    category: 'doc_nav_building',
    items: [
      { id: 'screens', labelKey: 'doc_nav_screens' },
      { id: 'components', labelKey: 'doc_nav_components' },
      { id: 'events', labelKey: 'doc_nav_events' },
      { id: 'modules', labelKey: 'doc_nav_modules' },
    ],
  },
  {
    category: 'doc_nav_components_ref',
    items: [
      { id: 'comp-text', labelKey: 'doc_nav_comp_text' },
      { id: 'comp-media', labelKey: 'doc_nav_comp_media' },
      { id: 'comp-quiz', labelKey: 'doc_nav_comp_quiz' },
      { id: 'comp-interactive', labelKey: 'doc_nav_comp_interactive' },
    ],
  },
  {
    category: 'doc_nav_export',
    items: [
      { id: 'export-scorm', labelKey: 'doc_nav_export_scorm' },
      { id: 'export-html', labelKey: 'doc_nav_export_html' },
      { id: 'export-embed', labelKey: 'doc_nav_export_embed' },
      { id: 'export-xapi', labelKey: 'doc_nav_export_xapi' },
    ],
  },
  {
    category: 'doc_nav_advanced',
    items: [
      { id: 'course-json', labelKey: 'doc_nav_course_json' },
      { id: 'ai-generation', labelKey: 'doc_nav_ai' },
      { id: 'keyboard-shortcuts', labelKey: 'doc_nav_shortcuts' },
      { id: 'api-reference', labelKey: 'doc_nav_api' },
    ],
  },
]

export function DocsPage({ activeSection, onSectionChange }: Props) {
  const t = useT()

  return (
    <div className="flex gap-0 max-w-6xl mx-auto h-full">
      {/* Sidebar */}
      <nav className="w-56 shrink-0 overflow-y-auto pr-4 py-1 border-r border-gray-200 dark:border-gray-800">
        {DOC_NAV.map((group) => (
          <div key={group.category} className="mb-5">
            <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-1.5">
              {t(group.category)}
            </h4>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeSection === item.id
                    ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border-l-2 border-transparent'
                }`}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pl-8 pr-4 py-1">
        <article className="max-w-3xl prose-docs">
          {activeSection === 'getting-started' && <GettingStarted t={t} />}
          {activeSection === 'quick-start' && <QuickStart t={t} />}
          {activeSection === 'course-structure' && <CourseStructure t={t} />}
          {activeSection === 'screens' && <Screens t={t} />}
          {activeSection === 'components' && <Components t={t} />}
          {activeSection === 'events' && <Events t={t} />}
          {activeSection === 'modules' && <Modules t={t} />}
          {activeSection === 'comp-text' && <CompText t={t} />}
          {activeSection === 'comp-media' && <CompMedia t={t} />}
          {activeSection === 'comp-quiz' && <CompQuiz t={t} />}
          {activeSection === 'comp-interactive' && <CompInteractive t={t} />}
          {activeSection === 'export-scorm' && <ExportScorm t={t} />}
          {activeSection === 'export-html' && <ExportHtml t={t} />}
          {activeSection === 'export-embed' && <ExportEmbed t={t} />}
          {activeSection === 'export-xapi' && <ExportXapi t={t} />}
          {activeSection === 'course-json' && <CourseJson t={t} />}
          {activeSection === 'ai-generation' && <AiGeneration t={t} />}
          {activeSection === 'keyboard-shortcuts' && <KeyboardShortcuts t={t} />}
          {activeSection === 'api-reference' && <ApiReference t={t} />}
        </article>
      </div>
    </div>
  )
}

/* ── Reusable doc components ── */

function DocH1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{children}</h1>
}
function DocH2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{children}</h2>
}
function DocH3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mt-5 mb-2">{children}</h3>
}
function DocP({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{children}</p>
}
function DocCode({ children }: { children: string }) {
  return (
    <pre className="bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto mb-4 leading-relaxed">
      {children}
    </pre>
  )
}
function DocTip({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg px-4 py-3 mb-4">
      <div className="text-xs font-semibold text-primary mb-1">{label || 'TIP'}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{children}</div>
    </div>
  )
}
function DocWarning({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 rounded-r-lg px-4 py-3 mb-4">
      <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">{label || 'WARNING'}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{children}</div>
    </div>
  )
}
function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function InlineCode({ children }: { children: string }) {
  return <code className="bg-gray-100 dark:bg-gray-800 text-primary text-xs px-1.5 py-0.5 rounded font-mono">{children}</code>
}

/* ── Getting Started ── */

function GettingStarted({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_gs_title')}</DocH1>
      <DocP>{t('docs_gs_desc')}</DocP>
      <DocTip label={t('docs_tip_label')}>{t('docs_gs_tip')}</DocTip>

      <DocH2>{t('docs_gs_features_title')}</DocH2>
      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4 ml-4 list-disc">
        <li><strong>{t('docs_gs_feat_editor')}</strong> — {t('docs_gs_feat_editor_desc')}</li>
        <li><strong>{t('docs_gs_feat_components')}</strong> — {t('docs_gs_feat_components_desc')}</li>
        <li><strong>{t('docs_gs_feat_scorm')}</strong> — {t('docs_gs_feat_scorm_desc')}</li>
        <li><strong>{t('docs_gs_feat_embed')}</strong> — {t('docs_gs_feat_embed_desc')}</li>
        <li><strong>{t('docs_gs_feat_ai')}</strong> — {t('docs_gs_feat_ai_desc')}</li>
        <li><strong>{t('docs_gs_feat_versions')}</strong> — {t('docs_gs_feat_versions_desc')}</li>
        <li><strong>{t('docs_gs_feat_collab')}</strong> — {t('docs_gs_feat_collab_desc')}</li>
      </ul>

      <DocH2>{t('docs_gs_arch_title')}</DocH2>
      <DocP>{t('docs_gs_arch_desc')}</DocP>
      <DocCode>{`App
 ├ Screens
 │   ├ Screen 1
 │   │   ├ Components (Text, Image, Quiz, ...)
 │   │   └ Events (trigger → action)
 │   └ Screen 2
 │       └ ...
 ├ Settings
 ├ State
 └ Assets`}</DocCode>
   </>
  )
}

/* ── Quick Start ── */

function QuickStart({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_qs_title')}</DocH1>
      <DocP>{t('docs_qs_desc')}</DocP>

      <DocH2>{t('docs_qs_step1_title')}</DocH2>
      <DocP>{t('docs_qs_step1_desc')}</DocP>

      <DocH2>{t('docs_qs_step2_title')}</DocH2>
      <DocP>{t('docs_qs_step2_desc')}</DocP>

      <DocH2>{t('docs_qs_step3_title')}</DocH2>
      <DocP>{t('docs_qs_step3_desc')}</DocP>

      <DocH2>{t('docs_qs_step4_title')}</DocH2>
      <DocP>{t('docs_qs_step4_desc')}</DocP>

      <DocH2>{t('docs_qs_step5_title')}</DocH2>
      <DocP>{t('docs_qs_step5_desc')}</DocP>

      <DocTip label={t('docs_tip_label')}>
        {t('docs_qs_tip')}
      </DocTip>
    </>
  )
}

/* ── Course Structure ── */

function CourseStructure({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_cs_title')}</DocH1>
      <DocP>{t('docs_cs_desc')}</DocP>

      <DocH2>App</DocH2>
      <DocP>{t('docs_cs_app_desc')}</DocP>

      <DocH2>{t('docs_cs_screens_title')}</DocH2>
      <DocP>{t('docs_cs_screens_desc')}</DocP>

      <DocH2>{t('docs_cs_components_title')}</DocH2>
      <DocP>{t('docs_cs_components_desc')}</DocP>

      <DocH2>{t('docs_cs_settings_title')}</DocH2>
      <DocTable
        headers={[t('docs_cs_th_setting'), t('docs_cs_th_values'), t('docs_cs_th_description')]}
        rows={[
          ['showResults', 'true / false', t('docs_cs_setting_results')],
          ['allowNavigation', 'linear / free', t('docs_cs_setting_nav')],
          ['completionCriteria', 'allScreens / score / manual', t('docs_cs_setting_completion')],
        ]}
      />

      <DocH2>{t('docs_cs_state_title')}</DocH2>
      <DocP>{t('docs_cs_state_desc')}</DocP>
    </>
  )
}

/* ── Screens ── */

function Screens({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_scr_title')}</DocH1>
      <DocP>{t('docs_scr_desc')}</DocP>

      <DocH2>{t('docs_scr_adding_title')}</DocH2>
      <DocP>{t('docs_scr_adding_desc')}</DocP>

      <DocH2>{t('docs_scr_reorder_title')}</DocH2>
      <DocP>{t('docs_scr_reorder_desc')}</DocP>

      <DocH2>{t('docs_scr_props_title')}</DocH2>
      <DocTable
        headers={[t('docs_scr_th_property'), t('docs_cs_th_description')]}
        rows={[
          ['title', t('docs_scr_prop_title')],
          ['components', t('docs_scr_prop_components')],
          ['events', t('docs_scr_prop_events')],
          ['navigation', t('docs_scr_prop_navigation')],
        ]}
      />

      <DocTip label={t('docs_tip_label')}>{t('docs_scr_tip')}</DocTip>
    </>
  )
}

/* ── Components ── */

function Components({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_comp_title')}</DocH1>
      <DocP>{t('docs_comp_desc')}</DocP>

      <DocH2>{t('docs_comp_types_title')}</DocH2>
      <DocTable
        headers={[t('docs_comp_th_type'), t('docs_comp_th_category'), t('docs_cs_th_description')]}
        rows={[
          ['text', t('docs_comp_cat_content'), t('docs_comp_type_text')],
          ['image', t('docs_comp_cat_content'), t('docs_comp_type_image')],
          ['video', t('docs_comp_cat_content'), t('docs_comp_type_video')],
          ['button', t('docs_comp_cat_content'), t('docs_comp_type_button')],
          ['quiz-single', t('docs_comp_cat_assessment'), t('docs_comp_type_quiz_single')],
          ['quiz-multi', t('docs_comp_cat_assessment'), t('docs_comp_type_quiz_multi')],
          ['true-false', t('docs_comp_cat_assessment'), t('docs_comp_type_truefalse')],
          ['flashcards', t('docs_comp_cat_interactive'), t('docs_comp_type_flashcards')],
          ['branching', t('docs_comp_cat_interactive'), t('docs_comp_type_branching')],
          ['drag-drop', t('docs_comp_cat_interactive'), t('docs_comp_type_dragdrop')],
          ['hotspots', t('docs_comp_cat_interactive'), t('docs_comp_type_hotspots')],
          ['dialog-trainer', t('docs_comp_cat_interactive'), t('docs_comp_type_dialog')],
          ['screen-simulation', t('docs_comp_cat_interactive'), t('docs_comp_type_simulation')],
        ]}
      />

      <DocH2>{t('docs_comp_adding_title')}</DocH2>
      <DocP>{t('docs_comp_adding_desc')}</DocP>

      <DocH2>{t('docs_comp_managing_title')}</DocH2>
      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 mb-4 ml-4 list-disc">
        <li><strong>{t('docs_comp_manage_move')}</strong> — {t('docs_comp_manage_move_desc')}</li>
        <li><strong>{t('docs_comp_manage_dup')}</strong> — {t('docs_comp_manage_dup_desc')}</li>
        <li><strong>{t('docs_comp_manage_del')}</strong> — {t('docs_comp_manage_del_desc')}</li>
        <li><strong>{t('docs_comp_manage_edit')}</strong> — {t('docs_comp_manage_edit_desc')}</li>
      </ul>
    </>
  )
}

/* ── Events ── */

function Events({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_ev_title')}</DocH1>
      <DocP>{t('docs_ev_desc')}</DocP>

      <DocH2>{t('docs_ev_structure_title')}</DocH2>
      <DocCode>{`{
  "trigger": "quiz.correct",
  "action": "goToScreen",
  "target": "s2"
}`}</DocCode>

      <DocH2>{t('docs_ev_triggers_title')}</DocH2>
      <DocTable
        headers={[t('docs_ev_th_trigger'), t('docs_ev_th_when')]}
        rows={[
          ['quiz.correct', t('docs_ev_trig_correct')],
          ['quiz.wrong', t('docs_ev_trig_wrong')],
          ['button.click', t('docs_ev_trig_button')],
          ['video.end', t('docs_ev_trig_video')],
          ['screen.enter', t('docs_ev_trig_enter')],
          ['screen.exit', t('docs_ev_trig_exit')],
        ]}
      />

      <DocH2>{t('docs_ev_actions_title')}</DocH2>
      <DocTable
        headers={[t('docs_ev_th_action'), t('docs_ev_th_what'), t('docs_ev_th_target')]}
        rows={[
          ['goToScreen', t('docs_ev_act_goto'), t('docs_ev_act_goto_target')],
          ['showMessage', t('docs_ev_act_msg'), t('docs_ev_act_msg_target')],
          ['setVariable', t('docs_ev_act_setvar'), t('docs_ev_act_setvar_target')],
          ['continue', t('docs_ev_act_continue'), '—'],
          ['enableButton', t('docs_ev_act_enable'), t('docs_ev_act_enable_target')],
        ]}
      />

      <DocTip label={t('docs_tip_label')}>{t('docs_ev_tip')}</DocTip>
    </>
  )
}

/* ── Modules ── */

function Modules({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_mod_title')}</DocH1>
      <DocP>{t('docs_mod_desc')}</DocP>

      <DocH2>{t('docs_mod_creating_title')}</DocH2>
      <DocP>{t('docs_mod_creating_desc')}</DocP>

      <DocH2>{t('docs_mod_managing_title')}</DocH2>
      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 mb-4 ml-4 list-disc">
        <li><strong>{t('docs_mod_manage_rename')}</strong> — {t('docs_mod_manage_rename_desc')}</li>
        <li><strong>{t('docs_mod_manage_collapse')}</strong> — {t('docs_mod_manage_collapse_desc')}</li>
        <li><strong>{t('docs_mod_manage_delete')}</strong> — {t('docs_mod_manage_delete_desc')}</li>
        <li><strong>{t('docs_mod_manage_reorder')}</strong> — {t('docs_mod_manage_reorder_desc')}</li>
      </ul>

      <DocWarning label={t('docs_warning_label')}>{t('docs_mod_warning')}</DocWarning>
    </>
  )
}

/* ── Component Reference: Text ── */

function CompText({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_ct_title')}</DocH1>

      <DocH2>{t('docs_ct_text_title')}</DocH2>
      <DocP>{t('docs_ct_text_desc')}</DocP>
      <DocH3>{t('docs_ct_formatting_title')}</DocH3>
      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4 ml-4 list-disc">
        <li>{t('docs_ct_fmt_headings')}</li>
        <li>{t('docs_ct_fmt_bold')}</li>
        <li>{t('docs_ct_fmt_lists')}</li>
        <li>{t('docs_ct_fmt_links')}</li>
        <li>{t('docs_ct_fmt_callout')}</li>
        <li>{t('docs_ct_fmt_code')}</li>
      </ul>
      <DocCode>{`{
  "id": "c1",
  "type": "text",
  "content": "<h2>Welcome</h2><p>This is a <strong>rich text</strong> block.</p>"
}`}</DocCode>

      <DocH2>{t('docs_ct_button_title')}</DocH2>
      <DocP>{t('docs_ct_button_desc')}</DocP>
      <DocCode>{`{
  "id": "c2",
  "type": "button",
  "label": "Continue",
  "action": "goToScreen",
  "target": "s2",
  "style": "primary"
}`}</DocCode>
    </>
  )
}

/* ── Component Reference: Media ── */

function CompMedia({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_cm_title')}</DocH1>

      <DocH2>{t('docs_cm_image_title')}</DocH2>
      <DocP>{t('docs_cm_image_desc')}</DocP>
      <DocCode>{`{
  "id": "c1",
  "type": "image",
  "src": "https://example.com/photo.jpg",
  "alt": "Description of the image",
  "caption": "Figure 1: Example diagram"
}`}</DocCode>

      <DocH2>{t('docs_cm_video_title')}</DocH2>
      <DocP>{t('docs_cm_video_desc')}</DocP>
      <DocCode>{`{
  "id": "c2",
  "type": "video",
  "url": "https://youtube.com/watch?v=...",
  "poster": "https://example.com/thumbnail.jpg"
}`}</DocCode>
      <DocTip label={t('docs_tip_label')}>{t('docs_cm_video_tip')}</DocTip>
    </>
  )
}

/* ── Component Reference: Quiz ── */

function CompQuiz({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_cq_title')}</DocH1>

      <DocH2>{t('docs_cq_single_title')}</DocH2>
      <DocP>{t('docs_cq_single_desc')}</DocP>
      <DocCode>{`{
  "type": "quiz-single",
  "question": "What is the capital of France?",
  "options": [
    { "text": "London", "correct": false },
    { "text": "Paris", "correct": true },
    { "text": "Berlin", "correct": false }
  ],
  "feedback": {
    "correct": "Correct! Paris is the capital.",
    "incorrect": "That's not right. The answer is Paris."
  }
}`}</DocCode>

      <DocH2>{t('docs_cq_multi_title')}</DocH2>
      <DocP>{t('docs_cq_multi_desc')}</DocP>
      <DocCode>{`{
  "type": "quiz-multi",
  "question": "Select all prime numbers:",
  "options": [
    { "text": "2", "correct": true },
    { "text": "4", "correct": false },
    { "text": "7", "correct": true }
  ]
}`}</DocCode>

      <DocH2>{t('docs_cq_tf_title')}</DocH2>
      <DocP>{t('docs_cq_tf_desc')}</DocP>
      <DocCode>{`{
  "type": "true-false",
  "statement": "The Earth is flat.",
  "answer": false,
  "feedback": {
    "correct": "Right, the Earth is roughly spherical.",
    "incorrect": "Actually, the Earth is roughly spherical."
  }
}`}</DocCode>

      <DocTip label={t('docs_tip_label')}>{t('docs_cq_tip')}</DocTip>
    </>
  )
}

/* ── Component Reference: Interactive ── */

function CompInteractive({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_ci_title')}</DocH1>

      <DocH2>{t('docs_ci_flash_title')}</DocH2>
      <DocP>{t('docs_ci_flash_desc')}</DocP>
      <DocCode>{`{
  "type": "flashcards",
  "cards": [
    { "front": "HTTP", "back": "HyperText Transfer Protocol" },
    { "front": "API", "back": "Application Programming Interface" }
  ]
}`}</DocCode>

      <DocH2>{t('docs_ci_branch_title')}</DocH2>
      <DocP>{t('docs_ci_branch_desc')}</DocP>
      <DocCode>{`{
  "type": "branching",
  "scenario": "A customer is angry about a delayed order...",
  "choices": [
    { "text": "Apologize and offer discount", "feedback": "Good approach!", "isCorrect": true },
    { "text": "Blame the shipping company", "feedback": "This may escalate...", "isCorrect": false }
  ]
}`}</DocCode>

      <DocH2>{t('docs_ci_drag_title')}</DocH2>
      <DocP>{t('docs_ci_drag_desc')}</DocP>

      <DocH2>{t('docs_ci_hotspots_title')}</DocH2>
      <DocP>{t('docs_ci_hotspots_desc')}</DocP>

      <DocH2>{t('docs_ci_dialog_title')}</DocH2>
      <DocP>{t('docs_ci_dialog_desc')}</DocP>

      <DocH2>{t('docs_ci_sim_title')}</DocH2>
      <DocP>{t('docs_ci_sim_desc')}</DocP>
    </>
  )
}

/* ── Export: SCORM ── */

function ExportScorm({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_es_title')}</DocH1>
      <DocP>{t('docs_es_desc')}</DocP>

      <DocH2>{t('docs_es_how_title')}</DocH2>
      <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 mb-4 ml-4 list-decimal">
        <li>{t('docs_es_step1')}</li>
        <li>{t('docs_es_step2')}</li>
        <li>{t('docs_es_step3')}</li>
        <li>{t('docs_es_step4')}</li>
      </ol>

      <DocH2>{t('docs_es_contents_title')}</DocH2>
      <DocCode>{`course.zip/
  ├ index.html        # Self-contained course player
  ├ imsmanifest.xml   # SCORM manifest
  └ adlcp_rootv1p2.xsd  # Schema (SCORM 1.2)`}</DocCode>

      <DocH2>{t('docs_es_tracked_title')}</DocH2>
      <DocTable
        headers={[t('docs_es_th_data'), t('docs_es_th_element')]}
        rows={[
          [t('docs_es_track_completion'), 'cmi.core.lesson_status'],
          [t('docs_es_track_score'), 'cmi.core.score.raw'],
          [t('docs_es_track_time'), 'cmi.core.session_time'],
          [t('docs_es_track_screen'), 'cmi.core.lesson_location'],
          [t('docs_es_track_quiz'), 'cmi.interactions'],
        ]}
      />

      <DocH2>{t('docs_es_lms_title')}</DocH2>
      <DocP>{t('docs_es_lms_desc')}</DocP>

      <DocWarning label={t('docs_warning_label')}>{t('docs_es_warning')}</DocWarning>
    </>
  )
}

/* ── Export: HTML ── */

function ExportHtml({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_eh_title')}</DocH1>
      <DocP>{t('docs_eh_desc')}</DocP>

      <DocH2>{t('docs_eh_usage_title')}</DocH2>
      <DocP>{t('docs_eh_usage_desc')}</DocP>

      <DocTip label={t('docs_tip_label')}>{t('docs_eh_tip')}</DocTip>
    </>
  )
}

/* ── Export: Embed ── */

function ExportEmbed({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_ee_title')}</DocH1>
      <DocP>{t('docs_ee_desc')}</DocP>

      <DocH2>{t('docs_ee_how_title')}</DocH2>
      <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 mb-4 ml-4 list-decimal">
        <li>{t('docs_ee_step1')}</li>
        <li>{t('docs_ee_step2')}</li>
        <li>{t('docs_ee_step3')}</li>
      </ol>

      <DocH2>{t('docs_ee_code_title')}</DocH2>
      <DocCode>{`<iframe
  src="https://cforj.studio/embed/YOUR_COURSE_ID"
  width="100%"
  height="600"
  frameborder="0"
  allowfullscreen
></iframe>`}</DocCode>

      <DocH2>{t('docs_ee_platform_title')}</DocH2>
      <DocP>{t('docs_ee_platform_desc')}</DocP>
    </>
  )
}

/* ── Export: xAPI ── */

function ExportXapi({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_ex_title')}</DocH1>
      <DocP>{t('docs_ex_desc')}</DocP>

      <DocH2>{t('docs_ex_what_title')}</DocH2>
      <DocP>{t('docs_ex_what_desc')}</DocP>

      <DocH2>{t('docs_ex_format_title')}</DocH2>
      <DocCode>{`{
  "actor": { "name": "Learner" },
  "verb": { "id": "completed" },
  "object": { "id": "course/screen-1" }
}`}</DocCode>

      <DocWarning label={t('docs_warning_label')}>{t('docs_ex_warning')}</DocWarning>
    </>
  )
}

/* ── Course JSON ── */

function CourseJson({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_cj_title')}</DocH1>
      <DocP>{t('docs_cj_desc')}</DocP>

      <DocH2>{t('docs_cj_schema_title')}</DocH2>
      <DocCode>{`{
  "id": "app-1234567890",
  "version": "1.0.0",
  "title": "My Course",
  "description": "Course description",
  "language": "en",
  "thumbnail": "data:image/...",
  "settings": {
    "showResults": true,
    "allowNavigation": "linear",
    "completionCriteria": "allScreens"
  },
  "state": {
    "score": 0,
    "passed": false
  },
  "screens": [
    {
      "id": "s-1",
      "title": "Screen 1",
      "components": [...],
      "events": [...],
      "navigation": {
        "next": "s-2",
        "prev": null
      }
    }
  ]
}`}</DocCode>

      <DocH2>{t('docs_cj_import_title')}</DocH2>
      <DocP>{t('docs_cj_import_desc')}</DocP>

      <DocTip label={t('docs_tip_label')}>{t('docs_cj_tip')}</DocTip>
    </>
  )
}

/* ── AI Generation ── */

function AiGeneration({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_ai_title')}</DocH1>
      <DocP>{t('docs_ai_desc')}</DocP>

      <DocH2>{t('docs_ai_full_title')}</DocH2>
      <DocP>{t('docs_ai_full_desc')}</DocP>

      <DocH2>{t('docs_ai_individual_title')}</DocH2>
      <DocP>{t('docs_ai_individual_desc')}</DocP>
      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4 ml-4 list-disc">
        <li>{t('docs_ai_gen_text')}</li>
        <li>{t('docs_ai_gen_quiz')}</li>
        <li>{t('docs_ai_gen_flash')}</li>
        <li>{t('docs_ai_gen_branch')}</li>
      </ul>

      <DocH2>{t('docs_ai_source_title')}</DocH2>
      <DocTable
        headers={[t('docs_ai_th_source'), t('docs_cs_th_description')]}
        rows={[
          [t('docs_ai_src_prompt'), t('docs_ai_src_prompt_desc')],
          [t('docs_ai_src_screen'), t('docs_ai_src_screen_desc')],
          [t('docs_ai_src_url'), t('docs_ai_src_url_desc')],
        ]}
      />

      <DocH2>{t('docs_ai_reports_title')}</DocH2>
      <DocP>{t('docs_ai_reports_desc')}</DocP>
    </>
  )
}

/* ── Keyboard Shortcuts ── */

function KeyboardShortcuts({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_kb_title')}</DocH1>
      <DocTable
        headers={[t('docs_kb_th_shortcut'), t('docs_kb_th_action')]}
        rows={[
          ['Ctrl + Z', t('docs_kb_undo')],
          ['Ctrl + Y', t('docs_kb_redo')],
          ['Ctrl + D', t('docs_kb_duplicate')],
          ['Ctrl + S', t('docs_kb_save')],
          ['?', t('docs_kb_show_shortcuts')],
          ['Esc', t('docs_kb_close')],
          ['Delete', t('docs_kb_delete')],
        ]}
      />
    </>
  )
}

/* ── API Reference ── */

function ApiReference({ t }: { t: TFn }) {
  return (
    <>
      <DocH1>{t('docs_api_title')}</DocH1>
      <DocP>{t('docs_api_desc')}</DocP>

      <DocH2>{t('docs_api_auth_title')}</DocH2>
      <DocP>{t('docs_api_auth_desc')}</DocP>
      <DocCode>{`Authorization: Bearer YOUR_API_TOKEN`}</DocCode>

      <DocH2>{t('docs_api_endpoints_title')}</DocH2>
      <DocTable
        headers={[t('docs_api_th_method'), t('docs_api_th_endpoint'), t('docs_cs_th_description')]}
        rows={[
          ['GET', '/api/courses', t('docs_api_ep_list')],
          ['GET', '/api/courses/:id', t('docs_api_ep_get')],
          ['POST', '/api/courses', t('docs_api_ep_create')],
          ['PUT', '/api/courses/:id', t('docs_api_ep_update')],
          ['DELETE', '/api/courses/:id', t('docs_api_ep_delete')],
          ['POST', '/api/courses/:id/publish', t('docs_api_ep_publish')],
          ['GET', '/api/courses/:id/versions', t('docs_api_ep_versions')],
          ['POST', '/api/ai/generate-course', t('docs_api_ep_ai_course')],
          ['POST', '/api/ai/generate-quiz', t('docs_api_ep_ai_quiz')],
        ]}
      />

      <DocH2>{t('docs_api_example_title')}</DocH2>
      <DocCode>{`curl -X GET https://cforj.studio/api/courses \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"`}</DocCode>

      <DocWarning label={t('docs_warning_label')}>{t('docs_api_warning')}</DocWarning>
    </>
  )
}
